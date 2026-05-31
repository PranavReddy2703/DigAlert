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
  User as UserIcon
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
        { label: 'Restoration Center', path: '/admin/verifications', icon: ClipboardCheck },
        { label: 'Conflict Manager', path: '/admin/conflicts', icon: ShieldAlert },
        { label: 'Permit Tracker', path: '/tracker', icon: ClipboardCheck },
        { label: 'Citizen Complaints', path: '/admin/complaints', icon: AlertOctagon },
      ];
    }

    if (user.role === 'UTILITY') {
      return [
        { label: 'Utility Dashboard', path: '/utility', icon: LayoutDashboard },
        { label: 'Live Dig Map', path: '/citizen', icon: Map },
        { label: 'Apply Permit', path: '/utility/apply', icon: FilePlus },
        { label: 'Permit Tracker', path: '/tracker', icon: ClipboardCheck },
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 w-64 bg-white border-r border-[#E2E8F0] p-4 transition-transform duration-300 md:translate-x-0">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0F766E] to-[#059669] text-white font-extrabold shadow-sm text-sm">
            DA
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-[#0F172A]">DigAlert</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#0F766E] font-semibold">Hyderabad Civic Platform</p>
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
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F0FDFA] text-[#0F766E] border-l-[3px] border-[#0F766E] font-semibold'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#0F766E]' : 'text-[#94A3B8]'}`} />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          {user ? (
            <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0F766E] border border-[#E2E8F0]">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-[#0F172A] truncate">{user.username}</h4>
                  <p className="text-[9px] uppercase tracking-wider text-[#0F766E] font-semibold">{user.role}</p>
                </div>
              </div>
              <p className="text-[10px] text-[#94A3B8] mb-2 truncate">Agency: {user.agency_name}</p>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] px-4 py-3 text-sm font-bold text-white shadow-sm transition duration-200"
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
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A]"></span>
            </span>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-[#94A3B8]">
              GHMC Central Control Grid • <span className="text-[#0F172A]">Active Area: Hyderabad (Zones 1-6)</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[#94A3B8] font-medium">Server Connection</p>
              <p className="text-xs font-bold text-[#16A34A] uppercase">Operational</p>
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
