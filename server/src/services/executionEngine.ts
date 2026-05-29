import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/database';
import { getNodeExecutor, NodeExecutionContext, NodeExecuteResult } from '../nodes/registry';

interface WorkflowWithNodes {
  id: string;
  nodes: Array<{
    id: string;
    type: string;
    config: any;
    positionX: number;
    positionY: number;
  }>;
  edges: Array<{
    id: string;
    sourceNode: string;
    targetNode: string;
    conditionLabel?: string | null;
  }>;
}

interface GraphNode {
  id: string;
  type: string;
  config: any;
  positionX: number;
  positionY: number;
  outgoing: string[];
  incoming: string[];
}

interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
}

function buildGraph(workflow: WorkflowWithNodes): {
  graph: Map<string, GraphNode>;
  entryNodes: string[];
  hasCycle: boolean;
} {
  const graph = new Map<string, GraphNode>();
  const adjacency: Map<string, string[]> = new Map();

  for (const node of workflow.nodes) {
    graph.set(node.id, {
      ...node,
      outgoing: [],
      incoming: [],
    });
    adjacency.set(node.id, []);
  }

  for (const edge of workflow.edges) {
    const sourceNode = graph.get(edge.sourceNode);
    const targetNode = graph.get(edge.targetNode);

    if (sourceNode && targetNode) {
      sourceNode.outgoing.push(edge.targetNode);
      targetNode.incoming.push(edge.sourceNode);
      adjacency.get(edge.sourceNode)?.push(edge.targetNode);
    }
  }

  const entryNodes = workflow.nodes
    .filter((n) => (graph.get(n.id)?.incoming.length || 0) === 0)
    .map((n) => n.id);

  const hasCycle = detectCycle(adjacency);

  return { graph, entryNodes, hasCycle };
}

function detectCycle(adjacency: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of adjacency.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}

function topologicalSort(
  graph: Map<string, GraphNode>,
  entryNodes: string[]
): string[] {
  const visited = new Set<string>();
  const order: string[] = [];

  function dfs(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = graph.get(nodeId);
    if (!node) return;

    for (const neighbor of node.outgoing) {
      dfs(neighbor);
    }

    order.unshift(nodeId);
  }

  for (const entryId of entryNodes) {
    dfs(entryId);
  }

  // Also add any unvisited nodes
  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }

  return order;
}

function getTargetNodesForCondition(
  graph: Map<string, GraphNode>,
  currentNodeId: string,
  conditionResult: boolean,
  edges: WorkflowWithNodes['edges']
): string[] {
  const relevantEdges = edges.filter((e) => e.sourceNode === currentNodeId);

  if (relevantEdges.length === 0) {
    return graph.get(currentNodeId)?.outgoing || [];
  }

  const conditionEdges = relevantEdges.filter((e) => e.conditionLabel);
  const defaultEdges = relevantEdges.filter((e) => !e.conditionLabel);

  if (conditionEdges.length === 0) {
    return relevantEdges.map((e) => e.targetNode);
  }

  const matched = conditionEdges.find((e) => {
    if (conditionResult && e.conditionLabel === 'true') return true;
    if (!conditionResult && e.conditionLabel === 'false') return true;
    return false;
  });

  if (matched) return [matched.targetNode];
  if (defaultEdges.length > 0) return defaultEdges.map((e) => e.targetNode);

  return [];
}

export async function executeWorkflow(
  workflow: WorkflowWithNodes,
  triggerData: any,
  executionId: string,
  io: SocketIOServer
): Promise<ExecutionResult> {
  const { graph, entryNodes, hasCycle } = buildGraph(workflow);

  if (hasCycle) {
    return { success: false, output: null, error: 'Workflow contains a cycle' };
  }

  if (entryNodes.length === 0) {
    return { success: false, output: null, error: 'No entry node found' };
  }

  const executionOrder = topologicalSort(graph, entryNodes);

  const executionContext: NodeExecutionContext = {
    executionId,
    workflowId: workflow.id,
    triggerData,
    variables: {
      ...triggerData,
      payload: triggerData,
    },
    logs: [],
    currentNode: null,
  };

  const executed = new Set<string>();
  const nodeOutputs = new Map<string, any>();

  async function processNode(nodeId: string): Promise<void> {
    if (executed.has(nodeId)) return;
    executed.add(nodeId);

    const node = graph.get(nodeId);
    if (!node) return;

    executionContext.currentNode = nodeId;

    io.to(`execution:${executionId}`).emit('node_started', {
      nodeId,
      nodeType: node.type,
      timestamp: new Date().toISOString(),
    });

    await prisma.executionLog.create({
      data: {
        executionId,
        nodeId,
        level: 'info',
        message: `Executing: ${node.type}`,
      },
    });

    const executor = getNodeExecutor(node.type);

    if (!executor) {
      const errorMsg = `Unknown node type: ${node.type}`;
      io.to(`execution:${executionId}`).emit('node_failed', {
        nodeId,
        nodeType: node.type,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });

      await prisma.executionLog.create({
        data: { executionId, nodeId, level: 'error', message: errorMsg },
      });

      throw new Error(errorMsg);
    }

    // Merge all previous outputs into variables
    executionContext.variables = {
      ...triggerData,
      payload: triggerData,
    };

    for (const [nId, output] of nodeOutputs) {
      if (output) {
        executionContext.variables[`node_${nId}`] = output;
        if (output.aiOutput !== undefined) {
          executionContext.variables.aiOutput = output.aiOutput;
        }
        if (output.summary !== undefined) {
          executionContext.variables.summary = output.summary;
        }
        if (output.data !== undefined) {
          executionContext.variables.response = output.data;
        }
      }
    }

    const result: NodeExecuteResult = await executor(node.config, executionContext);

    nodeOutputs.set(nodeId, result.output);

    if (result.success) {
      io.to(`execution:${executionId}`).emit('node_completed', {
        nodeId,
        nodeType: node.type,
        output: result.output,
        timestamp: new Date().toISOString(),
      });

      await prisma.executionLog.create({
        data: {
          executionId,
          nodeId,
          level: 'info',
          message: `Completed: ${node.type}`,
        },
      });

      // Handle conditional routing
      let nextNodes: string[];

      if (node.type === 'condition') {
        const conditionResult = result.output?.conditionResult === true;
        nextNodes = getTargetNodesForCondition(graph, nodeId, conditionResult, workflow.edges);

        io.to(`execution:${executionId}`).emit('condition_result', {
          nodeId,
          result: conditionResult,
          nextNodes,
          timestamp: new Date().toISOString(),
        });
      } else {
        nextNodes = node.outgoing;
      }

      for (const nextId of nextNodes) {
        if (!executed.has(nextId)) {
          await processNode(nextId);
        }
      }
    } else {
      io.to(`execution:${executionId}`).emit('node_failed', {
        nodeId,
        nodeType: node.type,
        error: result.error,
        timestamp: new Date().toISOString(),
      });

      await prisma.executionLog.create({
        data: {
          executionId,
          nodeId,
          level: 'error',
          message: `Failed: ${node.type} - ${result.error}`,
        },
      });

      throw new Error(result.error || `Node ${node.type} failed`);
    }
  }

  try {
    for (const entryId of entryNodes) {
      if (!executed.has(entryId)) {
        await processNode(entryId);
      }
    }

    // Handle remaining nodes not in tree
    for (const nodeId of executionOrder) {
      if (!executed.has(nodeId)) {
        await processNode(nodeId);
      }
    }

    const output: Record<string, any> = {};
    for (const [nId, nodeOutput] of nodeOutputs) {
      output[nId] = nodeOutput;
    }

    return { success: true, output };
  } catch (error: any) {
    return { success: false, output: null, error: error.message };
  }
}
