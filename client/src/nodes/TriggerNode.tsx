import { Handle, Position, NodeProps } from 'reactflow';

export default function TriggerNode({ data }: NodeProps) {
  return (
    <div className="node-container bg-emerald-900/80 border border-emerald-600 rounded-lg px-4 py-3 min-w-[160px]">
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center gap-2">
        <span className="text-emerald-400">⚡</span>
        <div>
          <p className="text-white text-sm font-medium">{data.label}</p>
          <p className="text-emerald-300 text-xs mt-0.5">Trigger</p>
        </div>
      </div>
    </div>
  );
}
