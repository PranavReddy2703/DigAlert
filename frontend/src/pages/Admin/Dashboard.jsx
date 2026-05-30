import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../utils/api';
import { 
  Building2, 
  Coins, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  MessageSquareWarning, 
  Trophy, 
  LineChart 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const summaryData = await analyticsAPI.getSummary();
        const leaderboardData = await analyticsAPI.getLeaderboard();
        setSummary(summaryData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Dashboard Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">GHMC Central Excavation Control</h2>
          <p className="text-gray-400 text-sm mt-1">
            Hyderabad Road Integrity Grid. Real-time clash detection analytics, citizen complaint routing, and monetary savings tracker.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/permits')}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-200 transition duration-300"
          >
            Review Permit Queue
          </button>
          <button
            onClick={() => navigate('/admin/conflicts')}
            className="rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-4 py-2.5 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
          >
            Resolve Active Clashes
          </button>
        </div>
      </div>

      {/* Loading Counter */}
      {loading ? (
        <div className="flex h-32 items-center justify-center glass-panel rounded-2xl border border-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-800"></div>
        </div>
      ) : (
        <>
          {/* Central Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Permits */}
            <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between glass-panel-hover">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Permits Registered</p>
                <h3 className="text-2xl font-extrabold text-white mt-1.5">{summary.total_permits}</h3>
                <p className="text-[10px] text-primaryAqua mt-1 font-semibold">Active digs: {summary.active_permits}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-cyan-950/40 text-primaryAqua border border-cyan-900/30 flex items-center justify-center aqua-glow">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            {/* Money Saved */}
            <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between glass-panel-hover">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Co-Dig Monetary Saved</p>
                <h3 className="text-2xl font-extrabold text-primaryEmerald mt-1.5 font-mono">₹{summary.money_saved_inr.toLocaleString()}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Co-dig projects: {summary.co_dig_projects}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-950/40 text-primaryEmerald border border-emerald-900/30 flex items-center justify-center emerald-glow">
                <Coins className="h-5 w-5 animate-pulse" />
              </div>
            </div>

            {/* Conflicts */}
            <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between glass-panel-hover">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Geospatial Conflicts</p>
                <h3 className="text-2xl font-extrabold text-alertRed mt-1.5">{summary.conflicts_detected}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Resolved: {summary.conflicts_resolved} clashes</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-950/40 text-alertRed border border-red-900/30 flex items-center justify-center red-glow">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            {/* Citizen Complaints */}
            <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between glass-panel-hover">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Citizen Safety Reports</p>
                <h3 className="text-2xl font-extrabold text-orange-400 mt-1.5">{summary.total_complaints}</h3>
                <p className="text-[10px] text-gray-400 mt-1">Pending: {summary.complaints_by_status.OPEN + summary.complaints_by_status.ASSIGNED}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-950/40 text-orange-400 border border-orange-900/30 flex items-center justify-center">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Leaderboard and SVG Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard Table */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warningYellow animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Utility Compliance Leaderboard</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pr-2 text-center">Rank</th>
                      <th className="pb-3">Utility Operator</th>
                      <th className="pb-3 text-center">Permits</th>
                      <th className="pb-3 text-center">Resolutions</th>
                      <th className="pb-3 text-center">Complaints</th>
                      <th className="pb-3 text-right">Compliance Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {leaderboard.map((item) => (
                      <tr key={item.agency_name} className="hover:bg-gray-800/10">
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-bold text-[10px] ${
                            item.rank === 1 ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30' :
                            item.rank === 2 ? 'bg-slate-800 text-gray-300' :
                            'bg-gray-900/40 text-gray-500 border border-gray-850'
                          }`}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-white">{item.agency_name}</td>
                        <td className="py-4 text-center font-mono text-gray-400">{item.total_permits}</td>
                        <td className="py-4 text-center font-mono text-gray-400">{item.conflicts_resolved}</td>
                        <td className="py-4 text-center font-mono text-gray-400">{item.complaints_count}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-gray-900 rounded-full h-1.5 overflow-hidden border border-gray-800">
                              <div className="h-full bg-gradient-to-r from-primaryAqua to-primaryEmerald" style={{ width: `${item.compliance_score}%` }}></div>
                            </div>
                            <span className="font-extrabold text-primaryEmerald font-mono text-[10px]">{item.compliance_score}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom SVG Data Visualization Chart */}
            <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primaryAqua" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Citizen Hazard Metrics</h3>
              </div>

              {/* Pie/Donut Chart representation in SVG */}
              <div className="flex justify-center py-4">
                <svg className="w-48 h-48" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="10" />
                  
                  {/* OPEN complaints arc (e.g. 35%) */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#FF3366" 
                    strokeWidth="10" 
                    strokeDasharray="88 251.2"
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                    className="red-glow"
                  />

                  {/* ASSIGNED complaints arc (e.g. 45%) */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#FFD000" 
                    strokeWidth="10" 
                    strokeDasharray="113 251.2"
                    strokeDashoffset="-88"
                    transform="rotate(-90 50 50)"
                  />

                  {/* RESOLVED complaints arc (e.g. 20%) */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#05F0A4" 
                    strokeWidth="10" 
                    strokeDasharray="50.2 251.2"
                    strokeDashoffset="-201"
                    transform="rotate(-90 50 50)"
                    className="emerald-glow"
                  />
                  
                  {/* Center Text */}
                  <text x="50" y="47" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="bold" className="uppercase tracking-widest">Total Reports</text>
                  <text x="50" y="60" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="black" fontFamily="mono">{summary.total_complaints}</text>
                </svg>
              </div>

              {/* Custom Legends list */}
              <div className="space-y-2 text-[10px] uppercase font-bold tracking-wider pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-alertRed"></span>
                    <span className="text-gray-400">Open Hazards</span>
                  </div>
                  <span className="text-white font-mono">{summary.complaints_by_status.OPEN} reports</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-warningYellow"></span>
                    <span className="text-gray-400">Assigned / Ops Active</span>
                  </div>
                  <span className="text-white font-mono">{summary.complaints_by_status.ASSIGNED} reports</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primaryEmerald"></span>
                    <span className="text-gray-400">Resolved Restoration</span>
                  </div>
                  <span className="text-white font-mono">{summary.complaints_by_status.RESOLVED} reports</span>
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
