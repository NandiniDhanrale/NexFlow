import { NodeExecutor, NodeExecuteResult, NodeExecutionContext } from '../registry';
import { parseTemplate } from '../../utils/templateParser';

async function summarizeOpenAI(text: string): Promise<string> {
  const { default: axios } = await import('axios');
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a concise summarizer. Summarize the following content in 2-3 sentences.',
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
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

async function summarizeGemini(text: string): Promise<string> {
  const { default: axios } = await import('axios');
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{
        parts: [{
          text: `Summarize the following in 2-3 sentences:\n\n${text}`,
        }],
      }],
    },
    { timeout: 30000 }
  );
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const executeAiSummarize: NodeExecutor = async (
  config: any,
  context: NodeExecutionContext
): Promise<NodeExecuteResult> => {
  try {
    const provider = config.provider || 'openai';
    const content = parseTemplate(config.content || config.text || '', context.variables);

    if (!content) {
      return { success: false, output: null, error: 'Content to summarize is required' };
    }

    let summary: string;

    switch (provider) {
      case 'openai':
        summary = await summarizeOpenAI(content);
        break;
      case 'gemini':
        summary = await summarizeGemini(content);
        break;
      default:
        summary = await summarizeOpenAI(content);
    }

    return {
      success: true,
      output: { summary, provider },
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: `AI summarization failed: ${error.message}`,
    };
  }
};
