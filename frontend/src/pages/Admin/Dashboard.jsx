import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, permitsAPI } from '../../utils/api';
import { 
  Building2, 
  Coins, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  MessageSquareWarning, 
  Trophy, 
  LineChart,
  Clock,
  Lock,
  CheckSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const summaryData = await analyticsAPI.getSummary();
        const leaderboardData = await analyticsAPI.getLeaderboard();
        const permitsData = await permitsAPI.list();
        setSummary(summaryData);
        setLeaderboard(leaderboardData);
        setPermits(permitsData);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  // Compute status aggregates
  const pendingApprovals = permits.filter(p => ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED'].includes(p.status)).length;
  const authorizedExcavations = permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').length;
  const activeExcavations = permits.filter(p => p.status === 'IN_PROGRESS').length;
  const awaitingVerification = permits.filter(p => p.status === 'EXCAVATION_COMPLETED').length;
  const restoredRoads = permits.filter(p => p.status === 'ROAD_RESTORED').length;
  const closedProjects = permits.filter(p => p.status === 'PROJECT_CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Dashboard Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F766E] rounded-2xl p-6 border border-[#0D9488] shadow-card">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">GHMC Central Excavation Control</h2>
          <p className="text-[#A7F3D0] text-sm mt-1">
            Hyderabad Road Integrity Grid. Real-time clash detection analytics, citizen complaint routing, and monetary savings tracker.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/permits')}
            className="rounded-xl bg-white hover:bg-[#F0FDF4] border border-white/20 px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:text-[#0F766E] transition duration-200"
          >
            Review Permit Queue
          </button>
          <button
            onClick={() => navigate('/admin/conflicts')}
            className="rounded-xl bg-white hover:bg-[#F0FDF4] border border-white/20 px-4 py-2.5 text-xs font-bold text-[#0F766E] shadow-sm transition duration-200"
          >
            Resolve Active Clashes
          </button>
        </div>
      </div>

      {/* Loading Counter */}
      {loading ? (
        <div className="flex h-32 items-center justify-center bg-[#0F766E]/[0.03] rounded-2xl border border-[#0F766E]/20 backdrop-blur-sm" style={{ boxShadow: '0 0 20px 0 rgba(15,118,110,0.10), 0 1px 4px 0 rgba(15,118,110,0.06)' }}>
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0F766E]"></div>
        </div>
      ) : (
        <>
          {/* Central Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Pending Permit Approvals */}
            <div className="bg-[#0284C7]/[0.04] rounded-xl p-4 border border-[#0284C7]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(2,132,199,0.10), 0 1px 3px 0 rgba(2,132,199,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Pending Approvals</span>
                <Lock className="h-4 w-4 text-[#0284C7]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#0284C7] font-mono">{pendingApprovals}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Permit Approvals</p>
              </div>
            </div>

            {/* Authorized Excavations */}
            <div className="bg-[#7C3AED]/[0.04] rounded-xl p-4 border border-[#7C3AED]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(124,58,237,0.10), 0 1px 3px 0 rgba(124,58,237,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Authorized</span>
                <Clock className="h-4 w-4 text-[#7C3AED]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#7C3AED] font-mono">{authorizedExcavations}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Excavations</p>
              </div>
            </div>

            {/* Active Excavations */}
            <div className="bg-[#EA580C]/[0.04] rounded-xl p-4 border border-[#EA580C]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(234,88,12,0.10), 0 1px 3px 0 rgba(234,88,12,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Active Digs</span>
                <Activity className="h-4 w-4 text-[#EA580C]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#EA580C] font-mono">{activeExcavations}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Excavations</p>
              </div>
            </div>

            {/* Completed Excavations */}
            <div className="bg-[#D97706]/[0.04] rounded-xl p-4 border border-[#D97706]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(217,119,6,0.10), 0 1px 3px 0 rgba(217,119,6,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Completed</span>
                <CheckSquare className="h-4 w-4 text-[#D97706]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#D97706] font-mono">{awaitingVerification}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Excavations</p>
              </div>
            </div>

            {/* Awaiting Restoration Verification */}
            <div className="bg-[#D97706]/[0.04] rounded-xl p-4 border border-[#D97706]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(217,119,6,0.10), 0 1px 3px 0 rgba(217,119,6,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Awaiting Verification</span>
                <Clock className="h-4 w-4 text-[#D97706]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#D97706] font-mono">{awaitingVerification}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Restorations</p>
              </div>
            </div>

            {/* Road Restored */}
            <div className="bg-[#16A34A]/[0.04] rounded-xl p-4 border border-[#16A34A]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(22,163,74,0.10), 0 1px 3px 0 rgba(22,163,74,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Road Restored</span>
                <CheckSquare className="h-4 w-4 text-[#16A34A]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#16A34A] font-mono">{restoredRoads}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Restored</p>
              </div>
            </div>

            {/* Projects Closed */}
            <div className="bg-[#0F766E]/[0.04] rounded-xl p-4 border border-[#0F766E]/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300" style={{ boxShadow: '0 0 12px 0 rgba(15,118,110,0.10), 0 1px 3px 0 rgba(15,118,110,0.08)' }}>
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span className="text-[9px] uppercase font-bold tracking-wider">Projects Closed</span>
                <CheckSquare className="h-4 w-4 text-[#0F766E]" />
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-extrabold text-[#0F766E] font-mono">{closedProjects}</h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">Archived</p>
              </div>
            </div>
          </div>

          {/* Leaderboard and SVG Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard Table */}
            <div className="lg:col-span-2 min-w-0 bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card space-y-5 backdrop-blur-sm" style={{ boxShadow: '0 0 20px 0 rgba(15,118,110,0.10), 0 1px 4px 0 rgba(15,118,110,0.06)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] shadow-sm">
                    <Trophy className="h-5 w-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Utility Compliance Leaderboard</h3>
                    <p className="text-[9px] text-[#94A3B8] font-medium mt-0.5">Ranked by compliance performance score</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0F766E]/[0.06] border-b border-[#0F766E]/15">
                      <th className="py-3 px-2 text-center text-[10px] text-[#0F766E] font-extrabold uppercase tracking-widest">Rank</th>
                      <th className="py-3 text-[10px] text-[#0F766E] font-extrabold uppercase tracking-widest">Utility Operator</th>
                      <th className="py-3 text-center text-[10px] text-[#0F766E] font-extrabold uppercase tracking-widest">Permits</th>
                      <th className="py-3 text-center text-[10px] text-[#0F766E] font-extrabold uppercase tracking-widest">Resolutions</th>
                      <th className="py-3 text-center text-[10px] text-[#0F766E] font-extrabold uppercase tracking-widest">Complaints</th>
                      <th className="py-3 pr-2 text-right text-[10px] text-[#0F766E] font-extrabold uppercase tracking-widest">Compliance Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item, index) => {
                      const barColor = item.compliance_score >= 80 ? '#0F766E' : item.compliance_score >= 50 ? '#D97706' : '#DC2626';
                      const barBg = item.compliance_score >= 80 ? 'bg-gradient-to-r from-[#0F766E] to-[#16A34A]' : item.compliance_score >= 50 ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]' : 'bg-gradient-to-r from-[#DC2626] to-[#F87171]';
                      return (
                        <tr key={item.agency_name} className={`group transition-all duration-200 hover:bg-[#F0FDFA]/60 ${index !== leaderboard.length - 1 ? 'border-b border-[#F1F5F9]' : ''}`}>
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full font-extrabold text-[10px] transition-transform duration-200 group-hover:scale-110 ${
                              item.rank === 1 ? 'bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] text-[#B45309] border border-[#FCD34D] shadow-sm' :
                              item.rank === 2 ? 'bg-gradient-to-br from-[#F1F5F9] to-[#E2E8F0] text-[#475569] border border-[#CBD5E1] shadow-sm' :
                              item.rank === 3 ? 'bg-gradient-to-br from-[#FED7AA] to-[#FDBA74] text-[#9A3412] border border-[#FB923C] shadow-sm' :
                              'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0]'
                            }`}>
                              {item.rank}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors duration-200">{item.agency_name}</span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded-md bg-[#F1F5F9] font-mono font-bold text-[#475569] text-[11px]">{item.total_permits}</span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded-md bg-[#F1F5F9] font-mono font-bold text-[#475569] text-[11px]">{item.conflicts_resolved}</span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded-md font-mono font-bold text-[11px] ${
                              item.complaints_count > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F0FDF4] text-[#16A34A]'
                            }`}>{item.complaints_count}</span>
                          </td>
                          <td className="py-4 text-right pr-1">
                            <div className="flex items-center justify-end gap-2.5">
                              <div className="w-24 bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full ${barBg} transition-all duration-500`} style={{ width: `${item.compliance_score}%` }}></div>
                              </div>
                              <span className="font-extrabold font-mono text-[11px] min-w-[36px] text-right" style={{ color: barColor }}>{item.compliance_score}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom SVG Data Visualization Chart */}
            <div className="bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card space-y-4 backdrop-blur-sm" style={{ boxShadow: '0 0 20px 0 rgba(15,118,110,0.10), 0 1px 4px 0 rgba(15,118,110,0.06)' }}>
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-[#0F766E]" />
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Citizen Hazard Metrics</h3>
              </div>

              {/* Pie/Donut Chart representation in SVG */}
              <div className="flex justify-center py-4">
                <svg className="w-48 h-48" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="10" />
                  
                  {/* OPEN complaints arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#DC2626" 
                    strokeWidth="10" 
                    strokeDasharray="88 251.2"
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />

                  {/* ASSIGNED complaints arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#D97706" 
                    strokeWidth="10" 
                    strokeDasharray="113 251.2"
                    strokeDashoffset="-88"
                    transform="rotate(-90 50 50)"
                  />

                  {/* RESOLVED complaints arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#16A34A" 
                    strokeWidth="10" 
                    strokeDasharray="50.2 251.2"
                    strokeDashoffset="-201"
                    transform="rotate(-90 50 50)"
                  />
                  
                  {/* Center Text */}
                  <text x="50" y="47" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold" className="uppercase tracking-widest">Total Reports</text>
                  <text x="50" y="60" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="black" fontFamily="mono">{summary.total_complaints}</text>
                </svg>
              </div>

              {/* Custom Legends list */}
              <div className="space-y-2 text-[10px] uppercase font-bold tracking-wider pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]"></span>
                    <span className="text-[#64748B]">Open Hazards</span>
                  </div>
                  <span className="text-[#0F172A] font-mono">{summary.complaints_by_status.OPEN} reports</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]"></span>
                    <span className="text-[#64748B]">Assigned / Ops Active</span>
                  </div>
                  <span className="text-[#0F172A] font-mono">{summary.complaints_by_status.ASSIGNED} reports</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]"></span>
                    <span className="text-[#64748B]">Resolved Restoration</span>
                  </div>
                  <span className="text-[#0F172A] font-mono">{summary.complaints_by_status.RESOLVED} reports</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
