import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import digalertLogo from '../assets/digalert_logo.png';
import { User, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusText, setStatusText] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      setStatusText('Validating credentials...');
      // Simulated delay for premium feel
      await new Promise((resolve) => setTimeout(resolve, 600));

      setStatusText('Authenticating with server...');
      const user = await login(username, password);

      setStatusText('Success! Redirecting...');
      setSuccess(true);

      localStorage.setItem('role', user.role);
      localStorage.setItem('agency', user.agency_name || '');
      localStorage.setItem('username', user.username);

      await new Promise((resolve) => setTimeout(resolve, 800));

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
      setIsLoading(false);
      setSuccess(false);
      setStatusText('');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D2137 40%, #0A2E2A 100%)' }}
    >
      {/* Animated glow orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '8%',
        width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15,118,110,0.18) 0%, transparent 70%)',
        animation: 'pulse 6s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', right: '6%',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(5,150,105,0.14) 0%, transparent 70%)',
        animation: 'pulse 8s ease-in-out infinite 2s',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '50%', right: '20%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
        animation: 'pulse 7s ease-in-out infinite 1s',
        pointerEvents: 'none'
      }} />

      {/* Dot grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />

      {/* Top-left city branding */}
      <div style={{ position: 'absolute', top: 24, left: 32 }} className="bg-[#0F766E]/[0.05] rounded-2xl p-2.5 shadow-md border border-[#0F766E]/20 backdrop-blur-sm flex items-center gap-3">
        <img 
          src={digalertLogo} 
          alt="DigAlert Logo" 
          className="h-9 w-9 object-contain rounded-xl p-0.5 bg-slate-50 border border-slate-100"
        />
        <div>
          <p className="font-extrabold text-[#0F766E] text-sm leading-none m-0">DigAlert</p>
          <p className="text-[8px] uppercase tracking-wider text-[#0D9488] font-extrabold leading-none mt-1 m-0">Hyderabad Civic Platform</p>
        </div>
      </div>

      {/* Floating stat badges with levitate animation */}
      <div style={{
        position: 'absolute', top: '22%', left: '5%',
        background: 'rgba(15,118,110,0.15)', border: '1px solid rgba(15,118,110,0.3)',
        borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(8px)',
        animation: 'floatBadge 4s ease-in-out infinite'
      }}>
        <p style={{ color: '#34D399', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Active Permits</p>
        <p style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '2px 0 0' }}>247</p>
      </div>
      <div style={{
        position: 'absolute', bottom: '28%', left: '4%',
        background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)',
        borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(8px)',
        animation: 'floatBadge 5s ease-in-out infinite 1s'
      }}>
        <p style={{ color: '#FCA5A5', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Open Complaints</p>
        <p style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '2px 0 0' }}>18</p>
      </div>
      <div style={{
        position: 'absolute', top: '30%', right: '4%',
        background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(8px)',
        animation: 'floatBadge 4.5s ease-in-out infinite 0.5s'
      }}>
        <p style={{ color: '#7DD3FC', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Zones Active</p>
        <p style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '2px 0 0' }}>6</p>
      </div>
      <div style={{
        position: 'absolute', bottom: '22%', right: '5%',
        background: 'rgba(15,118,110,0.12)', border: '1px solid rgba(15,118,110,0.25)',
        borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(8px)',
        animation: 'floatBadge 6s ease-in-out infinite 1.5s'
      }}>
        <p style={{ color: '#6EE7B7', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Clashes Resolved</p>
        <p style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: '2px 0 0' }}>53</p>
      </div>

      {/* Bottom status bar */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 999, padding: '6px 16px', backdropFilter: 'blur(8px)'
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 6px #22C55E' }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>GHMC CENTRAL CONTROL GRID • HYDERABAD</span>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes floatBadge { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
      `}</style>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0F766E]/[0.03] rounded-2xl p-8 border border-[#0F766E]/20 shadow-card backdrop-blur-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <img 
            src={digalertLogo} 
            alt="DigAlert Logo" 
            className="mx-auto mb-3 h-12 w-12 object-contain rounded-2xl shadow-md"
          />

          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Utility Login
          </h2>

          <p className="mt-1.5 text-xs tracking-wider uppercase text-[#0F766E] font-semibold">
            Hyderabad Civic Platform
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs font-semibold text-[#DC2626]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p>{statusText}</p>
          </div>
        )}

        {isLoading && !success && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs font-semibold text-[#64748B]">
            <svg className="animate-spin h-4 w-4 text-[#0F766E] shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>{statusText}</p>
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
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-3 pl-10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-3 pl-10 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#0F766E] hover:bg-[#115E59] py-3 text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Citizen Complaint Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => navigate('/citizen/report')}
            className="w-full rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] py-3 text-sm font-bold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            File Complaint
          </button>

          {/* Citizen Tracking Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => navigate('/citizen/track')}
            className="w-full rounded-xl border border-[#E2E8F0] bg-white py-3 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Track Existing Complaint
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;