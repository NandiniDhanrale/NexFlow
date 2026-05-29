import { Handle, Position, NodeProps } from 'reactflow';

const ICONS: Record<string, string> = {
  email: '✉️',
  http: '🌐',
  database: '🗄️',
};

export default function ActionNode({ data }: NodeProps) {
  const icon = ICONS[data.nodeType?.replace('action-', '')] || '⚙️';
  const label = data.config?.url || data.config?.to || '';

  return (
    <div className="node-container bg-blue-900/80 border border-blue-600 rounded-lg px-4 py-3 min-w-[160px]">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2">
        <span className="text-blue-400">{icon}</span>
        <div>
          <p className="text-white text-sm font-medium">{data.label}</p>
          {label && <p className="text-blue-300 text-xs mt-0.5 truncate max-w-[120px]">{label}</p>}
        </div>
      </div>
    </div>
  );
}
