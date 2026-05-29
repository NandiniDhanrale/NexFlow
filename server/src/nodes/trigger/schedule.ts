import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';

export const executeScheduleTrigger: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  return {
    success: true,
    output: {
      triggeredAt: new Date().toISOString(),
      cronExpression: config.cronExpression || '',
      ...context.triggerData,
    },
  };
};
