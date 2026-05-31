import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { permitsAPI, complaintsAPI } from '../../utils/api';
import { FilePlus, Map, AlertTriangle, CheckCircle, ShieldAlert, Clock, ArrowRight, Lock, CheckSquare } from 'lucide-react';

const UtilityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [permits, setPermits] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completionNotes, setCompletionNotes] = useState({});

  const loadDashboardData = async () => {
    try {
      const agency = user.agency_name;
      const permitsData = await permitsAPI.list({ agency });
      const complaintsData = await complaintsAPI.list({ agency });
      
      setPermits(permitsData);
      setAssignedComplaints(complaintsData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Aggregate stats
  const awaitingAuthorization = permits.filter(p => p.status === 'APPROVED').length;
  const readyToStart = permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').length;
  const activeWorks = permits.filter(p => p.status === 'IN_PROGRESS').length;
  const completedWorks = permits.filter(p => p.status === 'EXCAVATION_COMPLETED').length;
  const verifiedRestorations = permits.filter(p => p.status === 'ROAD_RESTORED').length;
  const closedProjects = permits.filter(p => p.status === 'PROJECT_CLOSED').length;

  const handleResolveComplaint = async (complaintId) => {
    try {
      await complaintsAPI.update(complaintId, { status: 'RESOLVED' });
      // Reload
      const freshComplaints = await complaintsAPI.list({ agency: user.agency_name });
      setAssignedComplaints(freshComplaints);
    } catch (err) {
      console.error("Failed to resolve complaint", err);
    }
  };

  const handleStartExcavation = async (permitId) => {
    try {
      await permitsAPI.startExcavation(permitId);
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to start excavation", err);
    }
  };

  const handleCompleteExcavation = async (permitId) => {
    try {
      const notes = completionNotes[permitId] || '';
      await permitsAPI.completeExcavation(permitId, { completion_notes: notes });
      setCompletionNotes(prev => ({ ...prev, [permitId]: '' }));
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to complete excavation", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">{user.agency_name} Excavation Hub</h2>
          <p className="text-gray-400 text-sm mt-1">Manage network excavations, draw new permits, resolve spatial clashes, and clear citizen reports.</p>
        </div>
        <div>
          <button
            onClick={() => navigate('/utility/apply')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-5 py-3 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
          >
            <FilePlus className="h-4 w-4" />
            Apply Excavation Permit
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      {loading ? (
        <div className="flex h-32 items-center justify-center glass-panel rounded-2xl border border-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-800"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-panel rounded-xl p-4 border border-gray-800 flex items-center justify-between glass-panel-hover">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-550 tracking-wider">Awaiting Auth</p>
              <h3 className="text-xl font-extrabold text-cyan-400 mt-1">{awaitingAuthorization}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 border border-gray-800 flex items-center justify-between glass-panel-hover">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-555 tracking-wider">Ready To Start</p>
              <h3 className="text-xl font-extrabold text-purple-400 mt-1">{readyToStart}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-900/30 flex items-center justify-center animate-pulse">
              <Clock className="h-4.5 w-4.5 animate-pulse" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 border border-gray-800 flex items-center justify-between glass-panel-hover">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-555 tracking-wider">Active Digs</p>
              <h3 className="text-xl font-extrabold text-orange-400 mt-1">{activeWorks}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-orange-950/40 text-orange-400 border border-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 border border-gray-800 flex items-center justify-between glass-panel-hover">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-555 tracking-wider">Completed</p>
              <h3 className="text-xl font-extrabold text-yellow-400 mt-1">{completedWorks}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-yellow-950/40 text-yellow-400 border border-yellow-900/30 flex items-center justify-center">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 border border-gray-800 flex items-center justify-between glass-panel-hover">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-555 tracking-wider">Restored</p>
              <h3 className="text-xl font-extrabold text-green-400 mt-1">{verifiedRestorations}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-green-950/40 text-green-400 border border-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 border border-gray-800 flex items-center justify-between glass-panel-hover">
            <div>
              <p className="text-[9px] uppercase font-bold text-gray-555 tracking-wider">Closed</p>
              <h3 className="text-xl font-extrabold text-primaryEmerald mt-1">{closedProjects}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-950/40 text-primaryEmerald border border-emerald-900/30 flex items-center justify-center">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
          </div>
        </div>
      )}

      {/* 1. READY FOR ACTIVATION */}
      {!loading && permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 border-l-4 border-l-purple-500 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-500 animate-ping"></span>
              Ready For Field Activation (Cutting Orders)
            </h3>
            <span className="text-[10px] font-bold bg-purple-950/40 text-purple-400 border border-purple-900/30 px-2 py-0.5 rounded">
              {permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').length} Permits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').map((permit) => (
              <div key={permit.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 flex flex-col justify-between space-y-3 hover:border-purple-900/50 transition duration-300">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-primaryAqua font-mono">Ref ID #{permit.id}</span>
                    <span className="text-gray-400 font-semibold font-mono">Restoration Deadline: {permit.restoration_deadline || permit.end_date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-relaxed">{permit.title}</h4>
                  <p className="text-[10px] text-gray-450 leading-snug">Excavation authorized by: <span className="text-purple-400 font-bold">{permit.authorized_by || 'GHMC Admin'}</span></p>
                </div>

                <button
                  onClick={() => handleStartExcavation(permit.id)}
                  className="w-full rounded-lg bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 py-2.5 text-xs font-bold text-purple-400 hover:text-white transition duration-300 flex items-center justify-center gap-1.5 shadow-purple-950/20"
                >
                  <ArrowRight className="h-4 w-4 shrink-0" />
                  Start Excavation (Activate Cutting Order)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ACTIVE EXCAVATIONS */}
      {!loading && permits.filter(p => p.status === 'IN_PROGRESS').length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 border-l-4 border-l-orange-500 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping"></span>
              Active Excavations
            </h3>
            <span className="text-[10px] font-bold bg-orange-950/40 text-orange-400 border border-orange-900/30 px-2 py-0.5 rounded">
              {permits.filter(p => p.status === 'IN_PROGRESS').length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.filter(p => p.status === 'IN_PROGRESS').map((permit) => (
              <div key={permit.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 flex flex-col justify-between space-y-3 hover:border-orange-900/50 transition duration-300">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-primaryAqua font-mono">Ref ID #{permit.id}</span>
                    <span className="text-gray-400 font-semibold font-mono">Active schedule: {permit.start_date} to {permit.end_date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-relaxed">{permit.title}</h4>
                  <p className="text-[10px] text-gray-455 leading-snug">Excavation depth: <span className="text-white font-bold font-mono">{permit.depth_meters}m</span></p>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={completionNotes[permit.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompletionNotes(prev => ({ ...prev, [permit.id]: val }));
                    }}
                    placeholder="Enter on-site notes for backfill check & asphalt concrete..."
                    className="w-full rounded-lg bg-gray-950 border border-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 min-h-[40px]"
                  />
                  <button
                    onClick={() => handleCompleteExcavation(permit.id)}
                    disabled={!(completionNotes[permit.id] || '').trim()}
                    className={`w-full rounded-lg py-2.5 text-xs font-bold transition duration-300 flex items-center justify-center gap-1.5 ${
                      (completionNotes[permit.id] || '').trim()
                        ? 'bg-orange-950/30 hover:bg-orange-900/40 border border-orange-900/40 text-orange-400 hover:text-white shadow-orange-900/10'
                        : 'bg-gray-900 border border-gray-800 text-gray-650 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Mark Excavation Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 & 4. COMPLETED EXCAVATIONS & AWAITING GHMC VERIFICATION */}
      {!loading && permits.filter(p => p.status === 'EXCAVATION_COMPLETED').length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 border-l-4 border-l-yellow-500 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              Completed & Awaiting GHMC Verification
            </h3>
            <span className="text-[10px] font-bold bg-yellow-950/40 text-yellow-400 border border-yellow-900/30 px-2 py-0.5 rounded">
              {permits.filter(p => p.status === 'EXCAVATION_COMPLETED').length} Permits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.filter(p => p.status === 'EXCAVATION_COMPLETED').map((permit) => (
              <div key={permit.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 space-y-2 hover:border-yellow-900/50 transition duration-300">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-primaryAqua font-mono">Ref ID #{permit.id}</span>
                  <span className="text-gray-400 font-semibold font-mono">Completed: {permit.completed_at ? new Date(permit.completed_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <h4 className="text-xs font-bold text-white leading-relaxed">{permit.title}</h4>
                <div className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-850 text-[10.5px] text-gray-400 italic">
                  Notes: "{permit.completion_notes || 'No notes provided'}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Permits Table & Complaints allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permits Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Our Excavation Submissions</h3>
          
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-primaryAqua border-gray-850"></div>
            </div>
          ) : permits.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-10">No excavation permits found for your agency.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-2">ID</th>
                    <th className="pb-3">Project Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-center">Depth</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {permits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-gray-800/10">
                      <td className="py-4 font-semibold text-gray-400">#{permit.id}</td>
                      <td className="py-4 font-bold text-white max-w-[200px] truncate">{permit.title}</td>
                      <td className="py-4 text-gray-400">{permit.work_type}</td>
                      <td className="py-4 text-center font-mono">{permit.depth_meters}m</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                          permit.status === 'APPROVED' ? 'bg-cyan-950/30 text-primaryAqua border border-cyan-900/30' :
                          permit.status === 'AUTHORIZED_EXCAVATION' ? 'bg-purple-950/50 text-purple-400 border border-purple-900/30 font-bold shadow-[0_0_8px_rgba(147,51,234,0.15)]' :
                          permit.status === 'IN_PROGRESS' ? 'bg-orange-950/50 text-orange-400 border border-orange-900/30 animate-pulse font-bold' :
                          permit.status === 'EXCAVATION_COMPLETED' ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-900/30 font-bold' :
                          permit.status === 'ROAD_RESTORED' ? 'bg-green-950/50 text-green-400 border border-green-900/30 font-bold' :
                          permit.status === 'PROJECT_CLOSED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30 font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]' :
                          permit.status === 'CLASH_DETECTED' ? 'bg-red-950/50 text-alertRed border border-red-900/30' :
                          permit.status === 'PENDING_REVIEW' ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30' :
                          'bg-gray-850 text-gray-300'
                        }`}>
                          {permit.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => navigate('/tracker', { state: { permitId: permit.id } })}
                          className="rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 px-3 py-1.5 text-[10px] font-bold text-primaryAqua transition duration-300"
                        >
                          Show in Tracker
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Complaints allocation list */}
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Citizen Safety Hazards</h3>
            <span className="text-[10px] font-bold bg-orange-950/40 text-orange-400 border border-orange-900/30 px-2 py-0.5 rounded">
              Requires Action
            </span>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-primaryAqua border-gray-850"></div>
            </div>
          ) : assignedComplaints.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center space-y-2">
              <CheckCircle className="h-10 w-10 text-primaryEmerald animate-bounce" />
              <p className="text-xs text-gray-500 font-medium">All clear! No hazard complaints assigned.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {assignedComplaints.map((complaint) => (
                <div key={complaint.id} className="rounded-xl border border-gray-800 bg-gray-900/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-alertRed font-mono">#{complaint.complaint_type.replace('_', ' ')}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      complaint.status === 'RESOLVED' ? 'bg-emerald-950/40 text-primaryEmerald' : 'bg-red-950/40 text-alertRed animate-pulse'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-medium">{complaint.description}</p>
                  
                  {complaint.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolveComplaint(complaint.id)}
                      className="w-full rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-900/40 py-2 text-xs font-bold text-primaryEmerald transition duration-300"
                    >
                      Verify Site Restoration & Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UtilityDashboard;
