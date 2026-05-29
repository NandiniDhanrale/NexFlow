import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';
import { parseTemplate } from '../../utils/templateParser';

async function callOpenAI(prompt: string, model: string): Promise<string> {
  const { default: axios } = await import('axios');
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return res.data.choices[0]?.message?.content || '';
}

async function callGemini(prompt: string, model: string): Promise<string> {
  const { default: axios } = await import('axios');
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 30000 }
  );
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenRouter(prompt: string, model: string): Promise<string> {
  const { default: axios } = await import('axios');
  const res = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: model || 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return res.data.choices[0]?.message?.content || '';
}

export const executeAiGenerate: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const provider = config.provider || 'openai';
    const model = config.model || '';
    const prompt = parseTemplate(config.prompt || '', context.variables);

    if (!prompt) {
      return { success: false, output: null, error: 'Prompt is required' };
    }

    let response: string;

    switch (provider) {
      case 'openai':
        response = await callOpenAI(prompt, model);
        break;
      case 'gemini':
        response = await callGemini(prompt, model);
        break;
      case 'openrouter':
        response = await callOpenRouter(prompt, model);
        break;
      default:
        return { success: false, output: null, error: `Unknown AI provider: ${provider}` };
    }

    return {
      success: true,
      output: { aiOutput: response, provider, model },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `AI generation failed: ${error.message}`,
    };
  }
};
