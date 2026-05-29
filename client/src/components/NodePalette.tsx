interface PaletteItem {
  type: string;
  label: string;
  icon: string;
  category: string;
}

const CATEGORIES: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'Triggers',
    items: [
      { type: 'webhook', label: 'Webhook', icon: '⚡', category: 'triggers' },
      { type: 'schedule', label: 'Schedule', icon: '⏰', category: 'triggers' },
    ],
  },
  {
    name: 'Actions',
    items: [
      { type: 'http', label: 'HTTP Request', icon: '🌐', category: 'actions' },
      { type: 'email', label: 'Send Email', icon: '✉️', category: 'actions' },
      { type: 'database', label: 'Database', icon: '🗄️', category: 'actions' },
    ],
  },
  {
    name: 'Logic',
    items: [
      { type: 'condition', label: 'Condition', icon: '🔀', category: 'logic' },
      { type: 'transform', label: 'Transform', icon: '🔄', category: 'logic' },
      { type: 'delay', label: 'Delay', icon: '⏳', category: 'logic' },
    ],
  },
  {
    name: 'AI',
    items: [
      { type: 'aiGenerate', label: 'AI Generate', icon: '🤖', category: 'ai' },
      { type: 'aiSummarize', label: 'AI Summarize', icon: '📝', category: 'ai' },
    ],
  },
];

interface Props {
  onDragStart: (event: React.DragEvent, item: PaletteItem) => void;
}

export default function NodePalette({ onDragStart }: Props) {
  return (
    <div className="bg-gray-900 border-r border-gray-800 w-60 p-4 overflow-y-auto shrink-0">
      <h2 className="text-gray-200 font-semibold mb-4 text-sm uppercase tracking-wider">Nodes</h2>
      {CATEGORIES.map((cat) => (
        <div key={cat.name} className="mb-5">
          <h3 className="text-gray-500 text-xs uppercase font-medium mb-2">{cat.name}</h3>
          <div className="space-y-1">
            {cat.items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing text-gray-300 text-sm transition border border-gray-800/50 hover:border-gray-700"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
