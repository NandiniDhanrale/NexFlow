import { executeWebhookTrigger } from './trigger/webhook';
import { executeScheduleTrigger } from './trigger/schedule';
import { executeHttpRequest } from './action/httpRequest';
import { executeSendEmail } from './action/sendEmail';
import { executeDatabase } from './action/database';
import { executeTransform } from './logic/transform';
import { executeCondition } from './logic/condition';
import { executeDelay } from './logic/delay';
import { executeAiGenerate } from './ai/aiGenerate';
import { executeAiSummarize } from './ai/aiSummarize';

export interface NodeExecutionContext {
  executionId: string;
  workflowId: string;
  triggerData: any;
  variables: Record<string, any>;
  logs: Array<{ nodeId: string; level: string; message: string; timestamp: string }>;
  currentNode: string | null;
}

export interface NodeExecuteResult {
  success: boolean;
  output: any;
  error?: string;
}

export type NodeExecutor = (
  config: any,
  context: NodeExecutionContext
) => Promise<NodeExecuteResult>;

const nodeRegistry = new Map<string, NodeExecutor>();

export function registerNode(type: string, executor: NodeExecutor): void {
  nodeRegistry.set(type, executor);
}

export function getNodeExecutor(type: string): NodeExecutor | undefined {
  return nodeRegistry.get(type);
}

export function getAllNodeTypes(): string[] {
  return Array.from(nodeRegistry.keys());
}

registerNode('webhook', executeWebhookTrigger);
registerNode('schedule', executeScheduleTrigger);
registerNode('http', executeHttpRequest);
registerNode('email', executeSendEmail);
registerNode('database', executeDatabase);
registerNode('transform', executeTransform);
registerNode('condition', executeCondition);
registerNode('delay', executeDelay);
registerNode('aiGenerate', executeAiGenerate);
registerNode('aiSummarize', executeAiSummarize);

export { nodeRegistry };
