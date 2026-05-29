import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';

export const executeDelay: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  const seconds = parseInt(config.seconds || '0', 10);
  const minutes = parseInt(config.minutes || '0', 10);
  const hours = parseInt(config.hours || '0', 10);

  const totalMs = (seconds + minutes * 60 + hours * 3600) * 1000;

  if (totalMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, totalMs));
  }

  return {
    success: true,
    output: { ...context.variables, delayed: true, delayMs: totalMs },
  };
};
