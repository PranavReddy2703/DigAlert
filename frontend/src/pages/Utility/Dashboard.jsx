import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { permitsAPI, complaintsAPI } from '../../utils/api';
import { FilePlus, Map, AlertTriangle, CheckCircle, ShieldAlert, Clock } from 'lucide-react';

const UtilityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [permits, setPermits] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    loadDashboardData();
  }, [user]);

  // Aggregate stats
  const activeDigs = permits.filter(p => p.status === 'IN_PROGRESS').length;
  const pendingReviews = permits.filter(p => p.status === 'PENDING_REVIEW').length;
  const clashAlerts = permits.filter(p => p.status === 'CLASH_DETECTED').length;
  const openComplaints = assignedComplaints.filter(c => c.status !== 'RESOLVED').length;

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Excavations</p>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{activeDigs}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-cyan-950/40 text-primaryAqua border border-cyan-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pending GHMC Review</p>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{pendingReviews}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-950/40 text-warningYellow border border-yellow-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Clashes Flagged</p>
              <h3 className="text-2xl font-extrabold text-alertRed mt-1.5">{clashAlerts}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-950/40 text-alertRed border border-red-900/30 flex items-center justify-center red-glow animate-bounce">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Open Citizen Safety Reports</p>
              <h3 className="text-2xl font-extrabold text-orange-400 mt-1.5">{openComplaints}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-950/40 text-orange-400 border border-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
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
                          permit.status === 'APPROVED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30' :
                          permit.status === 'CLASH_DETECTED' ? 'bg-red-950/50 text-alertRed border border-red-900/30' :
                          permit.status === 'PENDING_REVIEW' ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30' :
                          'bg-gray-800 text-gray-300'
                        }`}>
                          {permit.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => navigate('/citizen', { state: { permitId: permit.id } })}
                          className="rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 px-3 py-1.5 text-[10px] font-bold text-primaryAqua transition duration-300"
                        >
                          Show on Map
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
