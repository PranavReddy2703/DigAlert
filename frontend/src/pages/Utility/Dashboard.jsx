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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm p-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">{user.agency_name} Excavation Hub</h2>
          <p className="text-[#64748B] text-xs mt-1">Manage network excavations, draw new permits, resolve spatial clashes, and clear citizen reports.</p>
        </div>
        <div>
          <button
            onClick={() => navigate('/utility/apply')}
            className="flex items-center gap-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200"
          >
            <FilePlus className="h-4 w-4" />
            Apply Excavation Permit
          </button>
        </div>
      </div>

      {/* Stats Counter Row */}
      {loading ? (
        <div className="flex h-32 items-center justify-center bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0F766E]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-xl backdrop-blur-sm p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Awaiting Auth</p>
              <h3 className="text-2xl font-bold text-[#0F766E] mt-1">{awaitingAuthorization}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-xl backdrop-blur-sm p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Ready To Start</p>
              <h3 className="text-2xl font-bold text-purple-700 mt-1">{readyToStart}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-xl backdrop-blur-sm p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Active Digs</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{activeWorks}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-xl backdrop-blur-sm p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold text-yellow-700 mt-1">{completedWorks}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-100 flex items-center justify-center">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-xl backdrop-blur-sm p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Restored</p>
              <h3 className="text-2xl font-bold text-green-700 mt-1">{verifiedRestorations}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-green-50 text-green-700 border border-green-100 flex items-center justify-center">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-xl backdrop-blur-sm p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1]">
            <div>
              <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Closed</p>
              <h3 className="text-2xl font-bold text-slate-700 mt-1">{closedProjects}</h3>
            </div>
            <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
          </div>
        </div>
      )}

      {/* 1. READY FOR ACTIVATION */}
      {!loading && permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').length > 0 && (
        <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm p-6 border-l-4 border-l-purple-500 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-500"></span>
              Ready For Field Activation (Cutting Orders)
            </h3>
            <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded">
              {permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').length} Permits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.filter(p => p.status === 'AUTHORIZED_EXCAVATION').map((permit) => (
              <div key={permit.id} className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 flex flex-col justify-between space-y-3 hover:border-purple-300 transition duration-200">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-[#0F766E] font-mono">Ref ID #{permit.id}</span>
                    <span className="text-[#64748B] font-semibold font-mono">Restoration Deadline: {permit.restoration_deadline || permit.end_date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A] leading-normal">{permit.title}</h4>
                  <p className="text-[10px] text-[#64748B] leading-normal">Excavation authorized by: <span className="text-purple-700 font-bold">{permit.authorized_by || 'GHMC Admin'}</span></p>
                </div>

                <button
                  onClick={() => handleStartExcavation(permit.id)}
                  className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 py-2 text-xs font-semibold text-white transition duration-200 flex items-center justify-center gap-1.5 shadow-sm"
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
        <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm p-6 border-l-4 border-l-amber-500 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-550"></span>
              Active Excavations
            </h3>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
              {permits.filter(p => p.status === 'IN_PROGRESS').length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.filter(p => p.status === 'IN_PROGRESS').map((permit) => (
              <div key={permit.id} className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 flex flex-col justify-between space-y-3 hover:border-amber-300 transition duration-200">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-[#0F766E] font-mono">Ref ID #{permit.id}</span>
                    <span className="text-[#64748B] font-semibold font-mono">Active schedule: {permit.start_date} to {permit.end_date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A] leading-normal">{permit.title}</h4>
                  <p className="text-[10px] text-[#64748B] leading-normal">Excavation depth: <span className="text-[#0F172A] font-bold font-mono">{permit.depth_meters}m</span></p>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={completionNotes[permit.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompletionNotes(prev => ({ ...prev, [permit.id]: val }));
                    }}
                    placeholder="Enter on-site notes for backfill check & asphalt concrete..."
                    className="w-full rounded-lg bg-white border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-amber-500 min-h-[40px]"
                  />
                  <button
                    onClick={() => handleCompleteExcavation(permit.id)}
                    disabled={!(completionNotes[permit.id] || '').trim()}
                    className={`w-full rounded-lg py-2 text-xs font-semibold transition duration-200 flex items-center justify-center gap-1.5 ${
                      (completionNotes[permit.id] || '').trim()
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                        : 'bg-slate-100 border border-[#E2E8F0] text-slate-400 cursor-not-allowed'
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
        <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm p-6 border-l-4 border-l-yellow-500 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Completed & Awaiting GHMC Verification
            </h3>
            <span className="text-[10px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-100 px-2 py-0.5 rounded">
              {permits.filter(p => p.status === 'EXCAVATION_COMPLETED').length} Permits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permits.filter(p => p.status === 'EXCAVATION_COMPLETED').map((permit) => (
              <div key={permit.id} className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 space-y-2 hover:border-yellow-400 transition duration-200">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-[#0F766E] font-mono">Ref ID #{permit.id}</span>
                  <span className="text-[#64748B] font-semibold font-mono">Completed: {permit.completed_at ? new Date(permit.completed_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <h4 className="text-xs font-bold text-[#0F172A] leading-normal">{permit.title}</h4>
                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-[10.5px] text-[#64748B] italic">
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
        <div className="lg:col-span-2 min-w-0 bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Our Excavation Submissions</h3>
          
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#0F766E]"></div>
            </div>
          ) : permits.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-10 font-medium">No excavation permits found for your agency.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-2">ID</th>
                    <th className="pb-3">Project Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-center">Depth</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-slate-50/50">
                      <td className="py-4 font-semibold text-[#64748B]">#{permit.id}</td>
                      <td className="py-4 font-semibold text-[#0F172A] max-w-[200px] truncate">{permit.title}</td>
                      <td className="py-4 text-[#64748B]">{permit.work_type}</td>
                      <td className="py-4 text-center font-mono text-[#0F172A] font-semibold">{permit.depth_meters}m</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          permit.status === 'APPROVED' ? 'bg-teal-50 text-[#0F766E] border-teal-100' :
                          permit.status === 'AUTHORIZED_EXCAVATION' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          permit.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          permit.status === 'EXCAVATION_COMPLETED' ? 'bg-yellow-50 text-yellow-800 border-yellow-100' :
                          permit.status === 'ROAD_RESTORED' ? 'bg-green-50 text-green-700 border-green-100' :
                          permit.status === 'PROJECT_CLOSED' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          permit.status === 'CLASH_DETECTED' ? 'bg-red-50 text-[#DC2626] border-red-100' :
                          permit.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-[#D97706] border-amber-100' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {permit.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => navigate('/tracker', { state: { permitId: permit.id } })}
                          className="rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-[#0F766E] transition duration-200 shadow-sm"
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
        <div className="bg-[#0F766E]/[0.03] border border-[#0F766E]/20 shadow-sm rounded-2xl backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Citizen Safety Hazards</h3>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
              Requires Action
            </span>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#0F766E]"></div>
            </div>
          ) : assignedComplaints.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-xl border border-slate-100 p-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
              <p className="text-xs text-[#64748B] font-semibold">All clear! No hazard complaints assigned.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {assignedComplaints.map((complaint) => (
                <div key={complaint.id} className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4 space-y-3 hover:border-slate-300 transition duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#DC2626] font-mono">#{complaint.complaint_type.replace('_', ' ')}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      complaint.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-[#DC2626] border-red-100'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#0F172A] leading-normal font-medium">{complaint.description}</p>
                  
                  {complaint.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolveComplaint(complaint.id)}
                      className="w-full rounded-lg bg-[#16A34A] hover:bg-[#15803D] py-2 text-xs font-semibold text-white transition duration-200 shadow-sm"
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
