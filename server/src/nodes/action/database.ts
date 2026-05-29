import { prisma } from '../../config/database';
import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';
import { parseTemplate } from '../../utils/templateParser';

export const executeDatabase: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const operation = (config.operation || 'SELECT').toUpperCase();
    const table = config.table || '';
    const query = config.query ? parseTemplate(config.query, context.variables) : '';
    const data = config.data ? JSON.parse(parseTemplate(JSON.stringify(config.data), context.variables)) : {};

    if (!table && !query) {
      return { success: false, output: null, error: 'Table name or query is required' };
    }

    let result: any;

    switch (operation) {
      case 'SELECT':
        if (query) {
          result = await prisma.$queryRawUnsafe(query);
        } else {
          result = await (prisma as any)[table]?.findMany?.() || [];
        }
        break;

      case 'INSERT':
        result = await (prisma as any)[table]?.create?.({ data }) || null;
        break;

      case 'UPDATE':
        result = await (prisma as any)[table]?.update?.({
          where: { id: config.where?.id },
          data,
        }) || null;
        break;

      case 'DELETE':
        result = await (prisma as any)[table]?.delete?.({
          where: { id: config.where?.id },
        }) || null;
        break;

      default:
        return { success: false, output: null, error: `Unknown operation: ${operation}` };
    }

    return {
      success: true,
      output: { operation, table, result },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `Database operation failed: ${error.message}`,
    };
  }
};
