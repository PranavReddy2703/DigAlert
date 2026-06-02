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
  
  const [activeTab, setActiveTab] = useState('applications');
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

  useEffect(() => { loadPermitQueue(); }, []);

  const handleSelectPermit = async (permit) => {
    try {
      const fullDetail = await permitsAPI.get(permit.id);
      setSelectedPermit(fullDetail);
    } catch (err) { console.error("Failed to fetch permit detail", err); }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.updateStatus(id, status); setSelectedPermit(null); await loadPermitQueue(); }
    catch (err) { setError('Operation failed. Please verify credentials.'); }
    finally { setActionLoading(false); }
  };

  const handleAuthorizeExcavation = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.authorize(id); setSelectedPermit(null); await loadPermitQueue(); }
    catch (err) { setError('Excavation authorization failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleVerifyRestoration = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.verifyRestoration(id, { remarks }); setRemarks(''); setSelectedPermit(null); await loadPermitQueue(); }
    catch (err) { setError('Verification failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleRequestRework = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.requestRework(id, { remarks }); setRemarks(''); setSelectedPermit(null); await loadPermitQueue(); }
    catch (err) { setError('Rework request failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleCloseProject = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.closeProject(id); setSelectedPermit(null); await loadPermitQueue(); }
    catch (err) { setError('Project closure failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleApproveCoDig = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.resolveClash(id); setSelectedPermit(null); await loadPermitQueue(); }
    catch (err) { setError('Operation failed. Coordinate error.'); }
    finally { setActionLoading(false); }
  };

  const getStatusBadgeClasses = (status) => {
    const map = {
      'CLASH_DETECTED': 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
      'PENDING_REVIEW': 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      'SUBMITTED': 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      'APPROVED': 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
      'AUTHORIZED_EXCAVATION': 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
      'IN_PROGRESS': 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]',
      'EXCAVATION_COMPLETED': 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
      'ROAD_RESTORED': 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
      'PROJECT_CLOSED': 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
      'COMPLETED': 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
      'REJECTED': 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
    };
    return map[status] || 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F766E] rounded-2xl p-6 border border-[#0D9488] shadow-card">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Permit Approval Workflows</h2>
          <p className="text-[#A7F3D0] text-xs mt-1">Review incoming road cutting applications, check lock-in road protections, and authorize or reject work schedules.</p>
        </div>
        <button onClick={loadPermitQueue} className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#F0FDF4] border border-white/20 px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:text-[#0F766E] transition duration-200 shrink-0">
          <RefreshCw className="h-4 w-4 text-[#0F766E]" /> Sync Queue Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Permits Queue Table */}
        <div className="lg:col-span-2 min-w-0 bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card backdrop-blur-sm space-y-4 h-[650px] overflow-y-auto">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#E2E8F0] mb-2">
            <button
              onClick={() => { setActiveTab('applications'); setSelectedPermit(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition duration-200 border-b-2 ${
                activeTab === 'applications' ? 'text-[#0F766E] border-[#0F766E]' : 'text-[#94A3B8] border-transparent hover:text-[#0F172A]'
              }`}
            >
              Permit Applications ({permits.filter(p => ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED', 'APPROVED'].includes(p.status)).length})
            </button>
            <button
              onClick={() => { setActiveTab('verifications'); setSelectedPermit(null); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition duration-200 border-b-2 ${
                activeTab === 'verifications' ? 'text-[#D97706] border-[#D97706]' : 'text-[#94A3B8] border-transparent hover:text-[#0F172A]'
              }`}
            >
              Restoration Verification ({permits.filter(p => ['EXCAVATION_COMPLETED', 'ROAD_RESTORED'].includes(p.status)).length})
            </button>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0F766E]"></div>
            </div>
          ) : permits.filter(permit => {
              if (activeTab === 'applications') return ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED', 'APPROVED'].includes(permit.status);
              else return ['EXCAVATION_COMPLETED', 'ROAD_RESTORED'].includes(permit.status);
            }).length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-20">
              {activeTab === 'applications' ? 'No pending permit submissions found.' : 'No completed excavations awaiting restoration verification.'}
            </p>
          ) : (
            <div className="space-y-3">
              {permits
                .filter(permit => {
                  if (activeTab === 'applications') return ['SUBMITTED', 'PENDING_REVIEW', 'CLASH_DETECTED', 'APPROVED'].includes(permit.status);
                  else return ['EXCAVATION_COMPLETED', 'ROAD_RESTORED'].includes(permit.status);
                })
                .map((permit) => (
                  <div key={permit.id} onClick={() => handleSelectPermit(permit)}
                      className={`rounded-xl border p-4 space-y-2 cursor-pointer transition-all duration-200 ${
                      selectedPermit?.id === permit.id ? 'bg-[#F0FDFA] border-[#0F766E] shadow-sm' : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-[#94A3B8] font-mono">Permit Ref #{permit.id}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusBadgeClasses(permit.status)}`}>
                        {permit.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#0F172A] leading-snug">{permit.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                      <p className="font-semibold text-[#0F766E]">Agency: {permit.agency_name}</p>
                      <p className="font-medium">Dates: {permit.start_date} to {permit.end_date}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {!selectedPermit ? (
            <div className="bg-[#0F766E]/[0.03] rounded-2xl p-8 border border-[#0F766E]/20 shadow-card backdrop-blur-sm text-center h-[650px] flex flex-col items-center justify-center">
              <Info className="h-12 w-12 text-[#0F766E] mb-3" />
              <h3 className="text-[#0F172A] font-bold text-base">Select Permit to Inspect</h3>
              <p className="text-xs text-[#94A3B8] max-w-xs mt-1.5 leading-relaxed">
                Click on any application card in the permit queue to view detailed route coordinates, schedule check, depth overlap, and authorize approvals.
              </p>
            </div>
          ) : (
            <div className="bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card backdrop-blur-sm h-[650px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-[#0F766E] font-mono">ref #{selectedPermit.id}</span>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border ${getStatusBadgeClasses(selectedPermit.status)}`}>
                    {selectedPermit.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{selectedPermit.title}</h3>
                  <p className="text-xs text-[#0F766E] font-semibold mt-1">Utility Agency: {selectedPermit.agency_name}</p>
                </div>

                <div className="h-[1px] bg-[#E2E8F0]"></div>

                {error && <p className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] p-2.5 rounded-lg">{error}</p>}

                <div className="space-y-3 text-xs text-[#475569]">
                  <div className="flex items-start gap-2"><Calendar className="h-4 w-4 text-[#0F766E] shrink-0" /><p>Timeline: <span className="font-semibold text-[#0F172A]">{selectedPermit.start_date} to {selectedPermit.end_date}</span></p></div>
                  <div className="flex items-start gap-2"><Layers className="h-4 w-4 text-[#0F766E] shrink-0" /><p>Excavation Depth: <span className="font-semibold text-[#0F172A]">{selectedPermit.depth_meters} meters</span></p></div>
                  <div className="flex items-start gap-2"><Map className="h-4 w-4 text-[#0F766E] shrink-0" /><p className="max-w-[200px] truncate">Geometry (WKT): <span className="font-mono text-[10px] text-[#94A3B8]">{selectedPermit.wkt_geometry}</span></p></div>
                </div>

                {/* Restoration Verification Info */}
                {['EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(selectedPermit.status) && (
                  <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-[#D97706]" /> Excavation Completion Log
                    </h4>
                    <div className="space-y-1.5 text-xs text-[#475569]">
                      <p>Completed At: <span className="font-semibold text-[#0F172A]">{selectedPermit.completed_at ? new Date(selectedPermit.completed_at).toLocaleString() : 'N/A'}</span></p>
                      <p>Completed By: <span className="font-semibold text-[#0F172A]">{selectedPermit.completed_by || 'N/A'}</span></p>
                      <p>Completion Notes: <span className="font-semibold text-[#0F172A]">{selectedPermit.completion_notes || 'No notes provided.'}</span></p>
                      {selectedPermit.restoration_deadline && <p>Restoration Deadline: <span className="font-semibold text-[#0F172A]">{selectedPermit.restoration_deadline}</span></p>}
                    </div>
                    <div className="mt-3">
                      <p className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1">On-Site Work Evidence</p>
                      <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80" alt="Excavation Evidence" className="rounded-lg w-full h-32 object-cover border border-[#E2E8F0]" />
                    </div>
                  </div>
                )}

                {['ROAD_RESTORED', 'PROJECT_CLOSED'].includes(selectedPermit.status) && (
                  <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-[#16A34A]" /> GHMC Verification Details
                    </h4>
                    <div className="space-y-1 text-xs text-[#475569]">
                      <p>Verified At: <span className="font-semibold text-[#0F172A]">{selectedPermit.restoration_verified_at ? new Date(selectedPermit.restoration_verified_at).toLocaleString() : 'N/A'}</span></p>
                      <p>Verified By: <span className="font-semibold text-[#0F172A]">{selectedPermit.restoration_verified_by || 'N/A'}</span></p>
                      <p>Remarks: <span className="font-semibold text-[#0F172A]">{selectedPermit.restoration_remarks || 'No remarks provided.'}</span></p>
                    </div>
                  </div>
                )}

                {selectedPermit.status === 'PROJECT_CLOSED' && (
                  <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA] p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-[#0F766E]" /> Project Closed
                    </h4>
                    <div className="space-y-1 text-xs text-[#475569]">
                      <p>Closed At: <span className="font-semibold text-[#0F172A]">{selectedPermit.closed_at ? new Date(selectedPermit.closed_at).toLocaleString() : 'N/A'}</span></p>
                      <p>Closed By: <span className="font-semibold text-[#0F172A]">{selectedPermit.closed_by || 'N/A'}</span></p>
                    </div>
                  </div>
                )}

                {/* Display Clashes if flagged */}
                {selectedPermit.clashes && selectedPermit.clashes.length > 0 && (
                  <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#DC2626]">
                      <ShieldAlert className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Spatial Clash Analyzer ({selectedPermit.clashes.length})</h4>
                    </div>
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {selectedPermit.clashes.map((clash, idx) => {
                        const isRoadLock = clash.conflicting_permit_id < 0;
                        return (
                          <div key={idx} className="rounded-lg bg-white p-3 border border-[#E2E8F0] space-y-1">
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider mb-1">
                              <span className={isRoadLock ? 'text-[#DC2626]' : 'text-[#D97706]'}>{isRoadLock ? 'Resurfacing lock' : 'Utility conflict'}</span>
                              {!isRoadLock && <span className="text-[#94A3B8] font-mono">Overlap: {clash.overlap_percentage}%</span>}
                            </div>
                            <h5 className="text-[11px] font-bold text-[#0F172A]">{clash.conflicting_title}</h5>
                            <p className="text-[10px] text-[#64748B] leading-snug">{clash.recommendation_text}</p>
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
                  <button onClick={() => handleApproveCoDig(selectedPermit.id)} disabled={actionLoading || selectedPermit.clashes.some(c => c.conflicting_permit_id < 0)}
                    className="w-full rounded-xl bg-[#0F766E] hover:bg-[#115E59] py-2.5 text-xs font-bold text-white shadow-sm transition duration-200 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Approve Joint Co-Digging Project
                  </button>
                )}

                {(selectedPermit.status === 'SUBMITTED' || selectedPermit.status === 'PENDING_REVIEW' || selectedPermit.status === 'CLASH_DETECTED') && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleUpdateStatus(selectedPermit.id, 'APPROVED')} disabled={actionLoading || selectedPermit.clashes?.some(c => c.conflicting_permit_id < 0)}
                      className="rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] py-2.5 text-xs font-bold text-[#16A34A] transition duration-200 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Approve Permit
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedPermit.id, 'REJECTED')} disabled={actionLoading}
                      className="rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] py-2.5 text-xs font-bold text-[#DC2626] transition duration-200 flex items-center justify-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}

                {selectedPermit.status === 'APPROVED' && (
                  <button onClick={() => handleAuthorizeExcavation(selectedPermit.id)} disabled={actionLoading}
                    className="w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] py-2.5 text-xs font-bold text-white shadow-sm transition duration-200 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Authorize Excavation
                  </button>
                )}

                {selectedPermit.status === 'EXCAVATION_COMPLETED' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Restoration Inspection Remarks</label>
                      <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Provide details about road quality, restoration finish, or reason for rework..."
                        className="w-full rounded-xl bg-white border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleVerifyRestoration(selectedPermit.id)} disabled={actionLoading}
                        className="rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] py-2.5 text-xs font-bold text-[#16A34A] transition duration-200 flex items-center justify-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Verify
                      </button>
                      <button onClick={() => handleRequestRework(selectedPermit.id)} disabled={actionLoading || !remarks.trim()}
                        className={`rounded-xl py-2.5 text-xs font-bold transition duration-200 flex items-center justify-center gap-1 ${
                          remarks.trim() ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626]' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                        }`} title={!remarks.trim() ? "Remarks are required to request rework" : ""}>
                        <XCircle className="h-3.5 w-3.5" /> Request Rework
                      </button>
                    </div>
                  </div>
                )}

                {selectedPermit.status === 'ROAD_RESTORED' && (
                  <button onClick={() => handleCloseProject(selectedPermit.id)} disabled={actionLoading}
                    className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803D] py-2.5 text-xs font-bold text-white shadow-sm transition duration-200 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Close Project
                  </button>
                )}

                <button onClick={() => setSelectedPermit(null)}
                  className="w-full rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] py-2 text-xs font-bold text-[#94A3B8] hover:text-[#0F172A] transition duration-200">
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
