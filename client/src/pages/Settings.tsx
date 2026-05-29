import { useState } from 'react';

export default function Settings() {
  const [form, setForm] = useState({
    emailNotifications: true,
    autoSave: true,
    theme: 'dark',
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Preferences</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Email Notifications</span>
              <input
                type="checkbox"
                checked={form.emailNotifications}
                onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })}
                className="rounded bg-gray-800 border-gray-600 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Auto-Save Workflows</span>
              <input
                type="checkbox"
                checked={form.autoSave}
                onChange={(e) => setForm({ ...form, autoSave: e.target.checked })}
                className="rounded bg-gray-800 border-gray-600 text-primary-600 focus:ring-primary-500"
              />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Theme</span>
              <select
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">API Keys</h2>
          <p className="text-gray-400 text-sm mb-4">
            Configure AI provider API keys in the backend environment variables.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p><span className="text-gray-400">OpenAI:</span> <code className="text-primary-300">OPENAI_API_KEY</code></p>
            <p><span className="text-gray-400">Gemini:</span> <code className="text-primary-300">GEMINI_API_KEY</code></p>
            <p><span className="text-gray-400">OpenRouter:</span> <code className="text-primary-300">OPENROUTER_API_KEY</code></p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">About</h2>
          <div className="space-y-1 text-sm text-gray-400">
            <p>NexFlow v1.0.0</p>
            <p>Workflow Automation Platform</p>
            <p>Built with React, Node.js, PostgreSQL, Redis, and BullMQ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
