import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';

export const executeTransform: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const expression = config.expression || config.code || 'payload';
    const sandboxVars = { ...context.variables, payload: context.variables };

    const fn = new Function(...Object.keys(sandboxVars), `"use strict"; return (${expression});`);
    const result = fn(...Object.values(sandboxVars));

    return {
      success: true,
      output: result,
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Transform failed: ${error.message}`,
    };
  }
};
