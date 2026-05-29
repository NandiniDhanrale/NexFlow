import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';

export const executeWebhookTrigger: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  return {
    success: true,
    output: {
      ...context.triggerData,
      headers: context.triggerData?.headers || {},
      method: context.triggerData?.method || 'POST',
    },
  };
};
