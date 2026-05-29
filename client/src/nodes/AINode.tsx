import { Handle, Position, NodeProps } from 'reactflow';

export default function AINode({ data }: NodeProps) {
  return (
    <div className="node-container bg-purple-900/80 border border-purple-600 rounded-lg px-4 py-3 min-w-[160px]">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2">
        <span className="text-purple-400">🤖</span>
        <div>
          <p className="text-white text-sm font-medium">{data.label}</p>
          <p className="text-purple-300 text-xs mt-0.5">AI</p>
        </div>
      </div>
    </div>
  );
}
