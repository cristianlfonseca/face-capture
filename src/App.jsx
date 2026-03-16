import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Camera, Users, LayoutDashboard } from 'lucide-react';
import Reception from './pages/Reception';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';

function Navigation() {
  const location = useLocation();
  
  const links = [
    { path: '/', label: 'Recepção', icon: Camera },
    { path: '/cadastro', label: 'Cadastrar Membro', icon: Users },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <nav className="flex items-center gap-4 ml-6">
      {links.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors ${
            location.pathname === path
              ? 'bg-blue-800 text-yellow-400'
              : 'text-slate-300 hover:bg-blue-800 hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden md:inline">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
        {/* Header */}
        <header className="bg-blue-900 border-b-4 border-yellow-500 py-3 px-6 flex items-center justify-between shadow-md z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-blue-900 font-bold text-xl">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase hidden sm:block">
              Church <span className="text-yellow-400">Hospitality</span>
            </h1>
            <Navigation />
          </div>
        </header>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Reception />} />
          <Route path="/cadastro" element={<Registration />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
