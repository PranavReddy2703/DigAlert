import React, { useState, useEffect } from 'react';
import { permitsAPI } from '../../utils/api';
import HyderabadMap from '../../components/HyderabadMap';
import { ShieldAlert, CheckCircle, XCircle, Info, Calendar, Layers, Map, RefreshCw } from 'lucide-react';

const PermitApprovals = () => {
  const [permits, setPermits] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Dual-tab queue center states
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' or 'verifications'
  const [remarks, setRemarks] = useState('');

  const loadPermitQueue = async () => {
    setLoading(true);
    try {
      const data = await permitsAPI.list();
      setPermits(data);
    } catch (err) {
      console.error("Failed to load permit queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermitQueue();
  }, []);

  const handleSelectPermit = async (permit) => {
    try {
      const fullDetail = await permitsAPI.get(permit.id);
      setSelectedPermit(fullDetail);
    } catch (err) {
      console.error("Failed to fetch permit detail", err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.updateStatus(id, status);
      setSelectedPermit(null);
      await loadPermitQueue();
    } catch (err) {
      setError('Operation failed. Please verify credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthorizeExcavation = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.authorize(id);
      setSelectedPermit(null);
      await loadPermitQueue();
    } catch (err) {
      setError('Excavation authorization failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyRestoration = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.verifyRestoration(id, { remarks });
      setRemarks('');
      setSelectedPermit(null);
      await loadPermitQueue();
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRework = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.requestRework(id, { remarks });
      setRemarks('');
      setSelectedPermit(null);
      await loadPermitQueue();
    } catch (err) {
      setError('Rework request failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseProject = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.closeProject(id);
      setSelectedPermit(null);
      await loadPermitQueue();
    } catch (err) {
      setError('Project closure failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCoDig = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.resolveClash(id);
      setSelectedPermit(null);
      await loadPermitQueue();
    } catch (err) {
      setError('Operation failed. Coordinate error.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Permit Approval Workflows</h2>
          <p className="text-xs text-gray-400 mt-1">Review incoming road cutting applications, check lock-in road protections, and authorize or reject work schedules.</p>
        </div>
        <button
          onClick={loadPermitQueue}
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-300 transition duration-300 shrink-0"
        >
          <RefreshCw className="h-4 w-4 text-primaryAqua" />
          Sync Queue Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Permits Queue Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4 h-[650px] overflow-y-auto">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-800 mb-2">
            <button
              onClick={() => { setActiveTab('applications'); setSelectedPermit(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition duration-300 border-b-2 ${
                activeTab === 'applications' 
                  ? 'text-primaryAqua border-primaryAqua' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Permit Applications Queue ({permits.filter(p => ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED', 'APPROVED'].includes(p.status)).length})
            </button>
            <button
              onClick={() => { setActiveTab('verifications'); setSelectedPermit(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition duration-300 border-b-2 ${
                activeTab === 'verifications' 
                  ? 'text-warningYellow border-warningYellow' 
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Restoration Verification Queue ({permits.filter(p => ['EXCAVATION_COMPLETED', 'ROAD_RESTORED'].includes(p.status)).length})
            </button>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-800"></div>
            </div>
          ) : permits.filter(permit => {
              if (activeTab === 'applications') {
                return ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED', 'APPROVED'].includes(permit.status);
              } else {
                return ['EXCAVATION_COMPLETED', 'ROAD_RESTORED'].includes(permit.status);
              }
            }).length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-20">
              {activeTab === 'applications' 
                ? 'No pending permit submissions found.' 
                : 'No completed excavations awaiting restoration verification.'}
            </p>
          ) : (
            <div className="space-y-3">
              {permits
                .filter(permit => {
                  if (activeTab === 'applications') {
                    return ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED', 'APPROVED'].includes(permit.status);
                  } else {
                    return ['EXCAVATION_COMPLETED', 'ROAD_RESTORED'].includes(permit.status);
                  }
                })
                .map((permit) => (
                  <div
                    key={permit.id}
                    onClick={() => handleSelectPermit(permit)}
                    className={`rounded-xl border p-4 space-y-2 cursor-pointer transition-all duration-300 ${
                      selectedPermit?.id === permit.id 
                        ? 'bg-gray-800/40 border-primaryAqua shadow-aquaGlow' 
                        : 'bg-gray-900/10 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Permit Ref #{permit.id}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        permit.status === 'CLASH_DETECTED' ? 'bg-red-950/50 text-alertRed border border-red-900/30 font-extrabold animate-pulse' :
                        permit.status === 'PENDING_REVIEW' ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30' :
                        permit.status === 'APPROVED' ? 'bg-cyan-950/50 text-primaryAqua border border-cyan-900/30 font-bold' :
                        permit.status === 'AUTHORIZED_EXCAVATION' ? 'bg-purple-950/50 text-purple-400 border border-purple-900/30 font-bold shadow-[0_0_8px_rgba(147,51,234,0.2)]' :
                        permit.status === 'IN_PROGRESS' ? 'bg-orange-950/50 text-orange-400 border border-orange-900/30 font-bold' :
                        permit.status === 'EXCAVATION_COMPLETED' ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30 font-bold' :
                        permit.status === 'ROAD_RESTORED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30 font-bold' :
                        permit.status === 'PROJECT_CLOSED' ? 'bg-teal-950/50 text-teal-400 border border-teal-900/30 font-bold' :
                        permit.status === 'COMPLETED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30 font-bold' :
                        permit.status === 'REJECTED' ? 'bg-red-950/50 text-alertRed border border-red-900/30 font-bold' :
                        'bg-gray-850 text-gray-300'
                      }`}>
                        {permit.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">{permit.title}</h4>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <p className="font-semibold text-primaryEmerald">Agency: {permit.agency_name}</p>
                      <p className="font-medium">Dates: {permit.start_date} to {permit.end_date}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Dynamic Detail Card / Drawer Panel */}
        <div className="space-y-4">
          {!selectedPermit ? (
            <div className="glass-panel rounded-2xl p-8 border border-gray-800 text-center h-[650px] flex flex-col items-center justify-center">
              <Info className="h-12 w-12 text-primaryAqua animate-pulse mb-3" />
              <h3 className="text-white font-bold text-base">Select Permit to Inspect</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                Click on any application card in the permit queue to view detailed route coordinates, schedule check, depth overlap, and authorize approvals.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 border border-gray-800 h-[650px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-primaryAqua font-mono">ref #{selectedPermit.id}</span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded ${
                    selectedPermit.status === 'CLASH_DETECTED' ? 'bg-red-950/50 text-alertRed border border-red-900/30 font-extrabold animate-pulse' :
                    selectedPermit.status === 'PENDING_REVIEW' ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30 font-semibold' :
                    selectedPermit.status === 'APPROVED' ? 'bg-cyan-950/50 text-primaryAqua border border-cyan-900/30 font-semibold' :
                    selectedPermit.status === 'AUTHORIZED_EXCAVATION' ? 'bg-purple-950/50 text-purple-400 border border-purple-900/30 font-semibold shadow-[0_0_8px_rgba(147,51,234,0.3)]' :
                    selectedPermit.status === 'IN_PROGRESS' ? 'bg-orange-950/50 text-orange-400 border border-orange-900/30 font-semibold' :
                    selectedPermit.status === 'EXCAVATION_COMPLETED' ? 'bg-yellow-950/50 text-warningYellow border border-yellow-900/30 font-semibold' :
                    selectedPermit.status === 'ROAD_RESTORED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30 font-semibold' :
                    selectedPermit.status === 'PROJECT_CLOSED' ? 'bg-teal-950/50 text-teal-400 border border-teal-900/30 font-semibold' :
                    selectedPermit.status === 'COMPLETED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30 font-semibold' :
                    selectedPermit.status === 'REJECTED' ? 'bg-red-950/50 text-alertRed border border-red-900/30 font-semibold' :
                    'bg-gray-850 text-gray-300'
                  }`}>
                    {selectedPermit.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{selectedPermit.title}</h3>
                  <p className="text-xs text-primaryEmerald font-semibold mt-1">Utility Agency: {selectedPermit.agency_name}</p>
                </div>

                <div className="h-[1px] bg-gray-800"></div>

                {error && (
                  <p className="text-[10px] font-bold text-alertRed bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">{error}</p>
                )}

                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-primaryAqua shrink-0" />
                    <p>Timeline: <span className="font-semibold text-white">{selectedPermit.start_date} to {selectedPermit.end_date}</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers className="h-4 w-4 text-primaryAqua shrink-0" />
                    <p>Excavation Depth: <span className="font-semibold text-white">{selectedPermit.depth_meters} meters</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Map className="h-4 w-4 text-primaryAqua shrink-0" />
                    <p className="max-w-[200px] truncate">Geometry (WKT): <span className="font-mono text-[10px] text-gray-500">{selectedPermit.wkt_geometry}</span></p>
                  </div>
                </div>

                {/* Restoration Verification Info */}
                {['EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(selectedPermit.status) && (
                  <div className="rounded-xl border border-yellow-950/30 bg-yellow-950/5 p-4 space-y-3 border border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-warningYellow flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-warningYellow" />
                      Excavation Completion Log
                    </h4>
                    <div className="space-y-1.5 text-xs text-gray-300">
                      <p>Completed At: <span className="font-semibold text-white">{selectedPermit.completed_at ? new Date(selectedPermit.completed_at).toLocaleString() : 'N/A'}</span></p>
                      <p>Completed By: <span className="font-semibold text-white">{selectedPermit.completed_by || 'N/A'}</span></p>
                      <p>Completion Notes: <span className="font-semibold text-white">{selectedPermit.completion_notes || 'No notes provided.'}</span></p>
                      {selectedPermit.restoration_deadline && (
                        <p>Restoration Deadline: <span className="font-semibold text-white">{selectedPermit.restoration_deadline}</span></p>
                      )}
                    </div>
                    {/* Mock Restoration Photo */}
                    <div className="mt-3">
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">On-Site Work Evidence</p>
                      <img 
                        src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80" 
                        alt="Excavation Evidence" 
                        className="rounded-lg w-full h-32 object-cover border border-gray-800"
                      />
                    </div>
                  </div>
                )}

                {['ROAD_RESTORED', 'PROJECT_CLOSED'].includes(selectedPermit.status) && (
                  <div className="rounded-xl border border-emerald-950/30 bg-emerald-950/5 p-4 space-y-2 border border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primaryEmerald flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-primaryEmerald" />
                      GHMC Verification Details
                    </h4>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>Verified At: <span className="font-semibold text-white">{selectedPermit.restoration_verified_at ? new Date(selectedPermit.restoration_verified_at).toLocaleString() : 'N/A'}</span></p>
                      <p>Verified By: <span className="font-semibold text-white">{selectedPermit.restoration_verified_by || 'N/A'}</span></p>
                      <p>Remarks: <span className="font-semibold text-white">{selectedPermit.restoration_remarks || 'No remarks provided.'}</span></p>
                    </div>
                  </div>
                )}

                {selectedPermit.status === 'PROJECT_CLOSED' && (
                  <div className="rounded-xl border border-teal-950/30 bg-teal-950/5 p-4 space-y-2 border border-gray-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-teal-400" />
                      Project Closed
                    </h4>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p>Closed At: <span className="font-semibold text-white">{selectedPermit.closed_at ? new Date(selectedPermit.closed_at).toLocaleString() : 'N/A'}</span></p>
                      <p>Closed By: <span className="font-semibold text-white">{selectedPermit.closed_by || 'N/A'}</span></p>
                    </div>
                  </div>
                )}

                {/* Display Clashes if flagged */}
                {selectedPermit.clashes && selectedPermit.clashes.length > 0 && (
                  <div className="rounded-xl border border-red-950/50 bg-red-950/10 p-4 space-y-3 border border-red-900/20">
                    <div className="flex items-center gap-2 text-alertRed">
                      <ShieldAlert className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Spatial Clash Analyzer ({selectedPermit.clashes.length})</h4>
                    </div>

                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {selectedPermit.clashes.map((clash, idx) => {
                        const isRoadLock = clash.conflicting_permit_id < 0;
                        return (
                          <div key={idx} className="rounded-lg bg-gray-950/60 p-3 border border-gray-850 space-y-1">
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider mb-1">
                              <span className={isRoadLock ? 'text-alertRed' : 'text-warningYellow'}>
                                {isRoadLock ? 'Resurfacing lock' : 'Utility conflict'}
                              </span>
                              {!isRoadLock && <span className="text-gray-500 font-mono">Overlap: {clash.overlap_percentage}%</span>}
                            </div>
                            <h5 className="text-[11px] font-bold text-white">{clash.conflicting_title}</h5>
                            <p className="text-[10px] text-gray-400 leading-snug">{clash.recommendation_text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action approvals panel */}
              <div className="space-y-2 pt-4">
                {selectedPermit.status === 'CLASH_DETECTED' && selectedPermit.clashes.some(c => c.conflicting_permit_id > 0) && (
                  <button
                    onClick={() => handleApproveCoDig(selectedPermit.id)}
                    disabled={actionLoading || selectedPermit.clashes.some(c => c.conflicting_permit_id < 0)} // lock out resurfaced completely
                    className="w-full rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald py-2.5 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Joint Co-Digging Project
                  </button>
                )}

                {/* Approve/Reject for review queue */}
                {(selectedPermit.status === 'SUBMITTED' || selectedPermit.status === 'PENDING_REVIEW' || selectedPermit.status === 'CLASH_DETECTED') && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedPermit.id, 'APPROVED')}
                      disabled={actionLoading || selectedPermit.clashes.some(c => c.conflicting_permit_id < 0)} // lock out resurfaced completely
                      className="rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-900/40 py-2.5 text-xs font-bold text-primaryEmerald transition duration-300 flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Approve Permit
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedPermit.id, 'REJECTED')}
                      disabled={actionLoading}
                      className="rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 py-2.5 text-xs font-bold text-alertRed transition duration-300 flex items-center justify-center gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}

                {/* Authorize Excavation for APPROVED permits */}
                {selectedPermit.status === 'APPROVED' && (
                  <button
                    onClick={() => handleAuthorizeExcavation(selectedPermit.id)}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:shadow-[0_0_20px_rgba(147,51,234,0.6)] transition duration-300 flex items-center justify-center gap-1.5 border border-purple-500/30"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Authorize Excavation
                  </button>
                )}

                {/* Verification Actions for EXCAVATION_COMPLETED */}
                {selectedPermit.status === 'EXCAVATION_COMPLETED' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Restoration Inspection Remarks</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Provide details about road quality, restoration finish, or reason for rework..."
                        className="w-full rounded-xl bg-gray-950 border border-gray-800 px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primaryAqua min-h-[60px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleVerifyRestoration(selectedPermit.id)}
                        disabled={actionLoading}
                        className="rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-900/40 py-2.5 text-xs font-bold text-primaryEmerald transition duration-300 flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verify
                      </button>
                      <button
                        onClick={() => handleRequestRework(selectedPermit.id)}
                        disabled={actionLoading || !remarks.trim()}
                        className={`rounded-xl py-2.5 text-xs font-bold transition duration-300 flex items-center justify-center gap-1 ${
                          remarks.trim() 
                            ? 'bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 text-alertRed shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                            : 'bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                        title={!remarks.trim() ? "Remarks are required to request rework" : ""}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Request Rework
                      </button>
                    </div>
                  </div>
                )}

                {/* Project Closure for ROAD_RESTORED */}
                {selectedPermit.status === 'ROAD_RESTORED' && (
                  <button
                    onClick={() => handleCloseProject(selectedPermit.id)}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition duration-300 flex items-center justify-center gap-1.5 border border-emerald-500/30"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Close Project
                  </button>
                )}

                <button
                  onClick={() => setSelectedPermit(null)}
                  className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 py-2 text-xs font-bold text-gray-500 hover:text-white transition duration-300"
                >
                  Close panel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermitApprovals;
