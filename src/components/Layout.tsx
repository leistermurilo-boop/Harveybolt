import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Home, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

type LayoutProps = {
  children: ReactNode;
  currentPage: 'dashboard' | 'settings';
  onNavigate: (page: 'dashboard' | 'settings') => void;
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { company, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">Harvey</h1>
            </div>
            {company && (
              <p className="text-sm text-slate-400 truncate">{company.name}</p>
            )}
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id as 'dashboard' | 'settings');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {menuItems.find((item) => item.id === currentPage)?.label}
              </h2>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
