import { useState, useEffect } from 'react';
import { Node } from 'reactflow';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
}

const CONFIG_FIELDS: Record<string, Field[]> = {
  webhook: [],
  schedule: [
    { key: 'cronExpression', label: 'Cron Expression', type: 'text', placeholder: '*/5 * * * *' },
  ],
  http: [
    { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com' },
    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
    { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer {{token}}"}' },
    { key: 'body', label: 'Body', type: 'textarea', placeholder: '{"message": "{{payload}}"}' },
  ],
  email: [
    { key: 'to', label: 'To', type: 'text', placeholder: '{{email}}' },
    { key: 'cc', label: 'CC', type: 'text', placeholder: 'cc@example.com' },
    { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Hello {{name}}' },
    { key: 'body', label: 'HTML Body', type: 'textarea', placeholder: '<h1>Hello {{name}}</h1>' },
  ],
  database: [
    { key: 'operation', label: 'Operation', type: 'select', options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
    { key: 'table', label: 'Table', type: 'text', placeholder: 'users' },
  ],
  condition: [
    { key: 'condition', label: 'Condition', type: 'text', placeholder: 'payload.age > 18' },
  ],
  transform: [
    { key: 'expression', label: 'Transform Expression', type: 'textarea', placeholder: '({ firstName, lastName }) => ({ fullName: `${firstName} ${lastName}` })' },
  ],
  delay: [
    { key: 'seconds', label: 'Seconds', type: 'number', placeholder: '5' },
    { key: 'minutes', label: 'Minutes', type: 'number', placeholder: '0' },
    { key: 'hours', label: 'Hours', type: 'number', placeholder: '0' },
  ],
  aiGenerate: [
    { key: 'provider', label: 'Provider', type: 'select', options: ['openai', 'gemini', 'openrouter'] },
    { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-4o-mini' },
    { key: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Generate an email for {{name}}' },
  ],
  aiSummarize: [
    { key: 'provider', label: 'Provider', type: 'select', options: ['openai', 'gemini'] },
    { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Text to summarize with {{variables}}' },
  ],
};

interface Props {
  node: Node | null;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({ node, onUpdate, onClose }: Props) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (node) {
      setConfig(node.data?.config || {});
      setLabel(node.data?.label || '');
    }
  }, [node?.id]);

  if (!node) {
    return (
      <div className="bg-gray-900 border-l border-gray-800 w-72 p-4 shrink-0">
        <p className="text-gray-500 text-sm text-center mt-10">Select a node to configure</p>
      </div>
    );
  }

  const fields = CONFIG_FIELDS[node.type || ''] || [];

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(node.id, { config: newConfig, label });
  };

  const handleLabelChange = (value: string) => {
    setLabel(value);
    onUpdate(node.id, { config, label: value });
  };

  const nodeColor = (() => {
    if (node.type === 'webhook' || node.type === 'schedule') return 'border-emerald-600 bg-emerald-900/30 text-emerald-300';
    if (node.type === 'http' || node.type === 'email' || node.type === 'database') return 'border-blue-600 bg-blue-900/30 text-blue-300';
    if (node.type === 'condition' || node.type === 'transform' || node.type === 'delay') return 'border-amber-600 bg-amber-900/30 text-amber-300';
    if (node.type === 'aiGenerate' || node.type === 'aiSummarize') return 'border-purple-600 bg-purple-900/30 text-purple-300';
    return 'border-gray-600 bg-gray-800 text-gray-300';
  })();

  return (
    <div className="bg-gray-900 border-l border-gray-800 w-72 p-4 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Configure Node</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">✕</button>
      </div>

      <div className={`border rounded-lg px-3 py-1.5 text-xs font-mono mb-4 ${nodeColor}`}>
        {node.type}
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 text-xs uppercase font-medium mb-1">Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
        />
      </div>

      {fields.length === 0 && (
        <p className="text-gray-500 text-xs">No configuration needed</p>
      )}

      {fields.map((field) => (
        <div key={field.key} className="mb-4">
          <label className="block text-gray-400 text-xs uppercase font-medium mb-1">
            {field.label}
          </label>
          {field.type === 'select' ? (
            <select
              value={config[field.key] || field.options?.[0] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={config[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 resize-none font-mono"
            />
          ) : (
            <input
              type={field.type || 'text'}
              value={config[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}
