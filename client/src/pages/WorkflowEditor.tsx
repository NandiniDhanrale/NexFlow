import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflow, useSaveWorkflowNodes, useExecuteWorkflow, useUpdateWorkflow } from '../hooks/useWorkflows';
import NodePalette from '../components/NodePalette';
import NodeConfigPanel from '../components/NodeConfigPanel';
import TriggerNode from '../nodes/TriggerNode';
import ActionNode from '../nodes/ActionNode';
import LogicNode from '../nodes/LogicNode';
import AINode from '../nodes/AINode';

const NODE_TYPES: Record<string, any> = {
  webhook: TriggerNode,
  schedule: TriggerNode,
  http: ActionNode,
  email: ActionNode,
  database: ActionNode,
  condition: LogicNode,
  transform: LogicNode,
  delay: LogicNode,
  aiGenerate: AINode,
  aiSummarize: AINode,
};

let nodeCounter = 0;

function EditorCanvas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workflow, isLoading } = useWorkflow(id!);
  const saveNodes = useSaveWorkflowNodes(id!);
  const executeWorkflow = useExecuteWorkflow(id!);
  const updateWorkflow = useUpdateWorkflow(id!);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Loading...');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      const flowNodes: Node[] = workflow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.positionX, y: n.positionY },
        data: { label: n.type, config: n.config, nodeType: n.type },
      }));
      const flowEdges: Edge[] = workflow.edges.map((e) => ({
        id: e.id,
        source: e.sourceNode,
        target: e.targetNode,
        data: e.conditionLabel ? { label: e.conditionLabel } : undefined,
        label: e.conditionLabel || undefined,
      }));
      setNodes(flowNodes);
      setEdges(flowEdges);

      const maxId = flowNodes.reduce((max, n) => {
        const num = parseInt(n.id.replace('node-', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      nodeCounter = maxId + 1;
    }
  }, [workflow]);

  const persistNodes = useCallback(async (nds: Node[], eds: Edge[]) => {
    setSaving(true);
    try {
      const payload = {
        nodes: nds.map((n) => ({
          id: n.id,
          type: n.type,
          position: { x: n.position.x, y: n.position.y },
          data: { config: n.data?.config || {} },
        })),
        edges: eds.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          data: e.data || {},
        })),
      };
      await saveNodes.mutateAsync(payload);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [saveNodes]);

  const debouncedPersist = useCallback((nds: Node[], eds: Edge[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistNodes(nds, eds), 1500);
  }, [persistNodes]);

  const onNodesChangeHandler = useCallback((changes: any) => {
    onNodesChange(changes);
    const needsSave = changes.some((c: any) => c.type === 'position' || c.type === 'add' || c.type === 'remove');
    if (needsSave) {
      setNodes((nds) => {
        debouncedPersist(nds, edges);
        return nds;
      });
    }
  }, [onNodesChange, edges, debouncedPersist]);

  const onEdgesChangeHandler = useCallback((changes: any) => {
    onEdgesChange(changes);
    setEdges((eds) => {
      debouncedPersist(nodes, eds);
      return eds;
    });
  }, [onEdgesChange, nodes, debouncedPersist]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => {
      const newEdges = addEdge({ ...params }, eds);
      debouncedPersist(nodes, newEdges);
      return newEdges;
    });
  }, [nodes, debouncedPersist]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/reactflow-label');
    if (!type || !rfInstance) return;

    const position = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `node-${nodeCounter++}`,
      type,
      position,
      data: { label: label || type, config: {}, nodeType: type },
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      debouncedPersist(updated, edges);
      return updated;
    });
  }, [rfInstance, edges, debouncedPersist]);

  const onDragStart = (event: React.DragEvent, item: any) => {
    event.dataTransfer.setData('application/reactflow', item.type);
    event.dataTransfer.setData('application/reactflow-label', item.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeConfigUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...data } };
        }
        return n;
      })
    );
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
    );
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflowName(e.target.value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateWorkflow.mutate({ name: e.target.value });
    }, 1000);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setExecResult(null);
    try {
      await persistNodes(nodes, edges);
      const result = await executeWorkflow.mutateAsync();
      setExecResult(`Execution queued: ${result.executionId.slice(0, 8)}...`);
    } catch (err: any) {
      setExecResult(`Error: ${err?.response?.data?.error || 'Execution failed'}`);
    } finally {
      setExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <NodePalette onDragStart={onDragStart} />

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={handleNameChange}
              className="bg-transparent text-white text-base font-semibold focus:outline-none border-b border-transparent focus:border-primary-500"
            />
            <span className={`text-xs px-2 py-0.5 rounded ${saving ? 'bg-amber-600/30 text-amber-300' : 'bg-emerald-600/30 text-emerald-300'}`}>
              {saving ? 'Saving...' : 'Saved'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/workflow/${id}/executions`}
              className="text-gray-400 hover:text-gray-200 text-sm transition"
            >
              History
            </Link>
            <button
              onClick={handleExecute}
              disabled={executing || !nodes.length}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {executing ? 'Running...' : '▶ Execute'}
            </button>
          </div>
        </div>

        {execResult && (
          <div className={`px-5 py-2 text-sm flex items-center gap-2 ${execResult.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
            {execResult}
            <button onClick={() => setExecResult(null)} className="ml-auto hover:text-white">✕</button>
          </div>
        )}

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={NODE_TYPES}
            fitView
            deleteKeyCode="Delete"
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Controls />
            <Background variant="dots" gap={20} size={1} color="#374151" />
            <MiniMap
              nodeColor={(n) => {
                if (n.type === 'webhook' || n.type === 'schedule') return '#059669';
                if (n.type === 'http' || n.type === 'email' || n.type === 'database') return '#2563eb';
                if (n.type === 'condition' || n.type === 'transform' || n.type === 'delay') return '#d97706';
                if (n.type === 'aiGenerate' || n.type === 'aiSummarize') return '#9333ea';
                return '#6b7280';
              }}
              maskColor="rgba(3, 7, 18, 0.8)"
              style={{ background: '#111827' }}
            />
          </ReactFlow>
        </div>
      </div>

      <NodeConfigPanel
        node={selectedNode}
        onUpdate={onNodeConfigUpdate}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <EditorCanvas />
    </ReactFlowProvider>
  );
}
