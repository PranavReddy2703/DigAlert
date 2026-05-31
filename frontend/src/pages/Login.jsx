import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, KeyRound, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setError('');

    try {
      const user = await login(username, password);

      localStorage.setItem('role', user.role);
      localStorage.setItem('agency', user.agency_name || '');
      localStorage.setItem('username', user.username);

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'UTILITY') {
        navigate('/utility');
      } else {
        navigate('/citizen');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Authentication failed. Please verify credentials.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-card">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0F766E] to-[#059669] text-white font-extrabold shadow-sm text-sm">
            DA
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Utility Login
          </h2>

          <p className="mt-1.5 text-xs tracking-wider uppercase text-[#0F766E] font-semibold">
            Hyderabad Civic Platform
          </p>
        </div>

        {/* Error Box */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs font-semibold text-[#DC2626]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
              Username
            </label>

            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94A3B8]" />

              <input
                type="text"
                placeholder="Enter username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-3 pl-10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">
              Password
            </label>

            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94A3B8]" />

              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-3 pl-10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#0F766E] hover:bg-[#115E59] py-3 text-sm font-bold text-white transition-all shadow-sm"
          >
            Sign In
          </button>

          {/* Citizen Complaint Button */}
          <button
            type="button"
            onClick={() => navigate('/citizen/report')}
            className="w-full rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] py-3 text-sm font-bold text-white transition-all shadow-sm"
          >
            File Complaint
          </button>

          {/* Citizen Tracking Button */}
          <button
            type="button"
            onClick={() => navigate('/citizen/track')}
            className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all"
          >
            Track Existing Complaint
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;