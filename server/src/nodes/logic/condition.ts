import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';

export const executeCondition: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const condition = config.condition || config.expression || 'true';
    const sandboxVars = { ...context.variables, payload: context.variables };

    const fn = new Function(...Object.keys(sandboxVars), `"use strict"; return Boolean(${condition});`);
    const result = fn(...Object.values(sandboxVars));

    return {
      success: true,
      output: { ...context.variables, conditionResult: result },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Condition evaluation failed: ${error.message}`,
    };
  }
};
