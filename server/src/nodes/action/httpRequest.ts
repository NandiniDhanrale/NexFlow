import axios from 'axios';
import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';
import { parseTemplate } from '../../utils/templateParser';

export const executeHttpRequest: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const url = parseTemplate(config.url || '', context.variables);
    const method = (config.method || 'GET').toUpperCase();
    const headers = config.headers || {};

    const resolvedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      resolvedHeaders[key] = parseTemplate(String(value), context.variables);
    }

    const options: any = {
      method,
      url,
      headers: resolvedHeaders,
      timeout: 30000,
      validateStatus: () => true,
    };

    if (config.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const bodyStr = typeof config.body === 'string'
        ? config.body
        : JSON.stringify(config.body);
      options.data = parseTemplate(bodyStr, context.variables);
      try {
        options.data = JSON.parse(options.data);
      } catch {
        // keep as string
      }
      if (!resolvedHeaders['Content-Type']) {
        resolvedHeaders['Content-Type'] = typeof options.data === 'string'
          ? 'text/plain'
          : 'application/json';
      }
    }

    const response = await axios(options);

    return {
      success: true,
      output: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `HTTP request failed: ${error.message}`,
    };
  }
};
