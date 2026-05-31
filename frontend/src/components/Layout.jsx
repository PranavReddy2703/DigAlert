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
  Bell
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { label: 'Road Work Map', path: '/citizen', icon: Map },
        { label: 'File Complaint', path: '/citizen/report', icon: AlertOctagon },
        { label: 'Track Complaint', path: '/citizen/track', icon: ClipboardCheck }
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'City Map', path: '/citizen', icon: Map },
        { label: 'Permit Approvals', path: '/admin/permits', icon: ClipboardCheck },
        { label: 'Restoration Center', path: '/admin/verifications', icon: ClipboardCheck },
        { label: 'Conflict Manager', path: '/admin/conflicts', icon: ShieldAlert },
        { label: 'Complaints', path: '/admin/complaints', icon: AlertOctagon }
      ];
    }

    if (user.role === 'UTILITY') {
      return [
        { label: 'Dashboard', path: '/utility', icon: LayoutDashboard },
        { label: 'Live Map', path: '/citizen', icon: Map },
        { label: 'Apply Permit', path: '/utility/apply', icon: FilePlus }
      ];
    }

    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-30 w-64 bg-slate-50 border-r border-slate-200 p-5">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white font-bold">
            DA
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              DigAlert
            </h1>
            <p className="text-xs text-slate-500">
              Hyderabad Civic Platform
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-teal-700 border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? 'text-teal-700'
                      : 'text-slate-500'
                  }`}
                />
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          {user ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-white">
                  <UserIcon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {user.username}
                  </p>

                  <p className="text-xs text-slate-500">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition"
            >
              Utility Login
            </button>
          )}
        </div>
      </aside>

      {/* Content Area */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-600 animate-pulse"></div>

            <span className="text-sm font-semibold text-slate-700 tracking-wide">
              GHMC CENTRAL CONTROL GRID • ACTIVE AREA: HYDERABAD (ZONES 1–6)
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-600 hover:text-slate-900 transition">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </button>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Server Connection
              </p>

              <p className="text-sm font-bold text-green-700">
                Operational
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
