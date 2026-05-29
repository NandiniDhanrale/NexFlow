import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '◻' },
  { path: '/executions', label: 'Executions', icon: '◷' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function MainLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <Link to="/" className="text-xl font-bold text-primary-400">
            NexFlow
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                location.pathname === item.path
                  ? 'bg-primary-600/20 text-primary-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-gray-300 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-300 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
