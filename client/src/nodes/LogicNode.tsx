import { Handle, Position, NodeProps } from 'reactflow';

const ICONS: Record<string, string> = {
  condition: '🔀',
  transform: '🔄',
  delay: '⏳',
};

export default function LogicNode({ data }: NodeProps) {
  const icon = ICONS[data.nodeType?.replace('logic-', '')] || '🔧';

  return (
    <div className="node-container bg-amber-900/80 border border-amber-600 rounded-lg px-4 py-3 min-w-[160px]">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2">
        <span className="text-amber-400">{icon}</span>
        <div>
          <p className="text-white text-sm font-medium">{data.label}</p>
          <p className="text-amber-300 text-xs mt-0.5">Logic</p>
        </div>
      </div>
    </div>
  );
}
