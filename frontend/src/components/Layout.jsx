import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Map, 
  FilePlus, 
  ShieldAlert, 
  ClipboardCheck, 
  AlertOctagon, 
  LogOut, 
  User as UserIcon,
  BellRing
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine sidebar navigation links based on user role
  const getNavLinks = () => {
    if (!user) {
      // Citizen links (unauthenticated or public)
      return [
        { label: 'Excavation Map', path: '/citizen', icon: Map },
        { label: 'File Complaint', path: '/citizen/report', icon: AlertOctagon },
        { label: 'Track Complaint', path: '/citizen/track', icon: ClipboardCheck },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Control Panel', path: '/admin', icon: LayoutDashboard },
        { label: 'Active Hyderabad Map', path: '/citizen', icon: Map },
        { label: 'Permit Approvals', path: '/admin/permits', icon: ClipboardCheck },
        { label: 'Conflict Manager', path: '/admin/conflicts', icon: ShieldAlert },
        { label: 'Citizen Complaints', path: '/admin/complaints', icon: AlertOctagon },
      ];
    }

    if (user.role === 'UTILITY') {
      return [
        { label: 'Utility Dashboard', path: '/utility', icon: LayoutDashboard },
        { label: 'Live Dig Map', path: '/citizen', icon: Map },
        { label: 'Apply Permit', path: '/utility/apply', icon: FilePlus },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex min-h-screen bg-darkBg animated-gradient">
      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 w-64 glass-panel border-r border-gray-800 p-4 transition-transform duration-300 md:translate-x-0">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primaryAqua to-primaryEmerald text-black font-extrabold shadow-aquaGlow">
            DA
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">DigAlert</h1>
            <p className="text-[10px] uppercase tracking-widest text-primaryAqua font-semibold">Hyderabad GHMC</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950 to-emerald-950 text-primaryAqua border border-cyan-800 shadow-aquaGlow'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primaryAqua' : 'text-gray-400'}`} />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          {user ? (
            <div className="glass-panel rounded-xl p-3 border border-gray-800/80">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-300 border border-gray-700">
                  <UserIcon className="h-5 w-5 text-primaryAqua" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-white truncate">{user.username}</h4>
                  <p className="text-[9px] uppercase tracking-wider text-primaryEmerald font-semibold">{user.role}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mb-2 truncate">Agency: {user.agency_name}</p>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-950/20 border border-red-900/30 px-3 py-1.5 text-xs font-semibold text-alertRed hover:bg-red-950/40 transition duration-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-4 py-3 text-sm font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
            >
              <UserIcon className="h-4 w-4" />
              Utility Login
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-800/60 bg-darkBg/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primaryEmerald animate-ping"></span>
            <h2 className="text-sm font-semibold tracking-wider uppercase text-gray-400">
              GHMC Central Control Grid • <span className="text-white">Active Area: Hyderabad (Zones 1-6)</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Realtime Alert Center Widget */}
            <div className="relative cursor-pointer hover:text-white text-gray-400 p-2 rounded-lg hover:bg-gray-800/40 transition duration-300">
              <BellRing className="h-5 w-5 hover:text-primaryAqua transition duration-300" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-alertRed"></span>
            </div>

            <div className="h-8 w-[1px] bg-gray-800"></div>

            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold">Server Connection</p>
              <p className="text-xs font-bold text-primaryEmerald uppercase">Operational</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
