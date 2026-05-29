import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow, useDashboardStats } from '../hooks/useWorkflows';

export default function Dashboard() {
  const { data: workflows, isLoading } = useWorkflows();
  const { data: stats } = useDashboardStats();
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    try {
      const wf = await createWorkflow.mutateAsync({ name: newName || 'Untitled Workflow' });
      setShowCreate(false);
      setNewName('');
      navigate(`/workflow/${wf.id}`);
    } catch {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this workflow?')) return;
    deleteWorkflow.mutate(id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your automation workflows</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-medium transition"
        >
          + New Workflow
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase font-medium">Total Workflows</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalWorkflows}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase font-medium">Executions Today</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.executionsToday}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.successRate}%</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase font-medium">Failures</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.failures}</p>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-3">Create New Workflow</h2>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Workflow name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-primary-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={createWorkflow.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {createWorkflow.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
        </div>
      ) : workflows?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No workflows yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition"
          >
            Create your first workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows?.map((wf) => (
            <Link
              key={wf.id}
              to={`/workflow/${wf.id}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-primary-700 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-semibold truncate">{wf.name}</h3>
                <button
                  onClick={(e) => handleDelete(wf.id, e)}
                  className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{wf._count?.executions || 0} runs</span>
                <span>•</span>
                <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                {wf.schedules?.some((s) => s.isActive) && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400">Scheduled</span>
                  </>
                )}
              </div>
              <Link
                to={`/workflow/${wf.id}/executions`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary-400 hover:text-primary-300 text-sm mt-3 inline-block"
              >
                View executions →
              </Link>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
