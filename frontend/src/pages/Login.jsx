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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold text-lg shadow-sm">
            DA
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            DigAlert
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Smart Permit Intelligence for Safer Cities
          </p>
        </div>

        {/* Login Card */}

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Sign In
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Access the DigAlert platform
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>

              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Sign In
            </button>

            <div className="pt-2 border-t border-slate-200 space-y-3">

              <button
                type="button"
                onClick={() => navigate('/citizen/report')}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Report a Civic Issue
              </button>

              <button
                type="button"
                onClick={() => navigate('/citizen/track')}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Track Existing Complaint
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default Login;