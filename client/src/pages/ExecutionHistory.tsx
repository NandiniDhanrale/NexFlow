import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useExecutions, useWorkflow } from '../hooks/useWorkflows';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../services/socket';

export default function ExecutionHistory() {
  const { id } = useParams<{ id: string }>();
  const { data: workflow } = useWorkflow(id || '');
  const { data: executions } = useExecutions(id || '');
  const [selectedExec, setSelectedExec] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedExec) {
      joinExecutionRoom(selectedExec);
      setLiveLogs([]);

      const socket = getSocket();
      const onLog = (entry: any) => setLiveLogs((prev) => [...prev, entry]);
      const onStatus = (data: any) => console.log('Status:', data);

      socket.on('log', onLog);
      socket.on('node_started', onLog);
      socket.on('node_completed', onLog);
      socket.on('node_failed', (data: any) => setLiveLogs((prev) => [...prev, { ...data, level: 'error', message: `Failed: ${data.nodeType}` }]));
      socket.on('execution_started', (data: any) => setLiveLogs((prev) => [...prev, { ...data, level: 'info', message: 'Execution started' }]));
      socket.on('execution_completed', (data: any) => setLiveLogs((prev) => [...prev, { ...data, level: 'info', message: 'Execution completed' }]));
      socket.on('execution_failed', (data: any) => setLiveLogs((prev) => [...prev, { ...data, level: 'error', message: `Execution failed: ${data.error}` }]));

      return () => {
        leaveExecutionRoom(selectedExec);
        socket.off('log', onLog);
        socket.off('node_started', onLog);
        socket.off('node_completed', onLog);
        socket.off('node_failed');
        socket.off('execution_started');
        socket.off('execution_completed');
        socket.off('execution_failed');
      };
    }
  }, [selectedExec]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-600',
    queued: 'bg-amber-600',
    running: 'bg-blue-600',
    completed: 'bg-emerald-600',
    failed: 'bg-red-600',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {id && (
          <Link to={`/workflow/${id}`} className="text-primary-400 hover:text-primary-300 text-sm">
            ← Back to Editor
          </Link>
        )}
        <h1 className="text-2xl font-bold text-white">
          {workflow?.name || 'All'} Executions
        </h1>
        {!id && <span className="text-gray-500 text-sm">(all workflows)</span>}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-200 font-semibold mb-3 text-sm uppercase tracking-wider">History</h2>
          {!executions?.length ? (
            <p className="text-gray-500 text-sm">No executions yet</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {executions.map((exec) => (
                <button
                  key={exec.id}
                  onClick={() => setSelectedExec(exec.id)}
                  className={`w-full text-left bg-gray-800/50 rounded-lg p-3 transition ${
                    selectedExec === exec.id ? 'ring-1 ring-primary-500 bg-gray-800' : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${statusColors[exec.status] || 'bg-gray-600'}`} />
                    <span className="text-white text-sm capitalize">{exec.status}</span>
                    {exec.executionTime != null && (
                      <span className="text-gray-500 text-xs ml-auto">{exec.executionTime}s</span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {exec.triggeredBy} • {new Date(exec.createdAt).toLocaleString()}
                  </div>
                  {exec.workflow && (
                    <div className="text-gray-400 text-xs mt-1">{exec.workflow.name}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-200 font-semibold mb-3 text-sm uppercase tracking-wider">Logs</h2>
          {!selectedExec ? (
            <p className="text-gray-500 text-sm">Select an execution to view logs</p>
          ) : (
            <>
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs max-h-[500px] overflow-y-auto">
                {liveLogs.length === 0 && (
                  <p className="text-gray-500">Waiting for logs... Connect and run the workflow to see live output.</p>
                )}
                {liveLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`mb-1 ${
                      log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : 'text-gray-400'
                    }`}
                  >
                    <span className="text-gray-600">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>{' '}
                    {log.nodeId && <span className="text-gray-600">[{log.nodeId.slice(0, 6)}]</span>}{' '}
                    {log.message || `${log.nodeType || ''} ${log.level || ''}`}
                    {log.output && (
                      <pre className="text-emerald-400 ml-4 mt-1">{JSON.stringify(log.output, null, 2)}</pre>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>

              {executions?.find((e) => e.id === selectedExec)?.outputData && (
                <div className="mt-4">
                  <h3 className="text-gray-500 text-xs uppercase font-medium mb-2">Output</h3>
                  <pre className="bg-gray-950 rounded-lg p-4 text-xs text-emerald-300 overflow-x-auto">
                    {JSON.stringify(
                      executions.find((e) => e.id === selectedExec)?.outputData,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
