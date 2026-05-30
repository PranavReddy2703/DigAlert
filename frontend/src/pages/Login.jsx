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
    <div className="flex min-h-screen items-center justify-center bg-darkBg animated-gradient px-4">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-gray-800 shadow-glass">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primaryAqua to-primaryEmerald text-black font-extrabold shadow-aquaGlow">
            DA
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            DigAlert Hyderabad
          </h2>

          <p className="mt-1.5 text-xs tracking-wider uppercase text-primaryAqua font-semibold">
            Excavation Coordination Control
          </p>
        </div>

        {/* Error Box */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs font-semibold text-alertRed">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Username
            </label>

            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />

              <input
                type="text"
                placeholder="Enter username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-primaryAqua"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>

            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />

              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:border-primaryAqua"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald py-3 text-sm font-bold text-black hover:opacity-90 transition-all"
          >
            Sign In
          </button>

          {/* Citizen Complaint Button */}
          <button
            type="button"
            onClick={() => navigate('/citizen/report')}
            className="w-full rounded-xl border border-primaryAqua py-3 text-sm font-bold text-primaryAqua hover:bg-primaryAqua hover:text-black transition-all duration-300"
          >
            Raise Complaint as Citizen
          </button>

          {/* Citizen Tracking Button */}
          <button
            type="button"
            onClick={() => navigate('/citizen/track')}
            className="w-full rounded-xl border border-gray-700 py-3 text-sm font-bold text-gray-300 hover:bg-gray-800 transition-all duration-300"
          >
            Track Existing Complaint
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;