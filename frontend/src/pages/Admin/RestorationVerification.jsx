import React, { useState, useEffect } from 'react';
import { permitsAPI } from '../../utils/api';
import HyderabadMap from '../../components/HyderabadMap';
import { 
  CheckCircle, XCircle, Calendar, Layers, Map, RefreshCw, Clock, AlertTriangle
} from 'lucide-react';

const RestorationVerification = () => {
  const [permits, setPermits] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadVerificationQueue = async () => {
    setLoading(true);
    try {
      const data = await permitsAPI.list();
      const completed = data.filter(p => p.status === 'EXCAVATION_COMPLETED');
      setPermits(completed);
    } catch (err) { console.error("Failed to load verification queue", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadVerificationQueue(); }, []);

  const handleSelectPermit = async (permit) => {
    try { const fullDetail = await permitsAPI.get(permit.id); setSelectedPermit(fullDetail); }
    catch (err) { console.error("Failed to fetch permit details", err); }
  };

  const handleVerifyRestoration = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.verifyRestoration(id, { remarks }); setRemarks(''); setSelectedPermit(null); await loadVerificationQueue(); }
    catch (err) { setError('Verification failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  const handleRequestRework = async (id) => {
    setActionLoading(true); setError('');
    try { await permitsAPI.requestRework(id, { remarks }); setRemarks(''); setSelectedPermit(null); await loadVerificationQueue(); }
    catch (err) { setError('Rework request failed. Please try again.'); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F766E] rounded-2xl p-6 border border-[#0D9488] shadow-card">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Restoration Verification Center</h2>
          <p className="text-[#A7F3D0] text-xs mt-1">Review completed excavations, inspect physical road restorations, verify asphalt concrete density, and authorize rework loops.</p>
        </div>
        <button onClick={loadVerificationQueue} className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#F0FDF4] border border-white/20 px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:text-[#0F766E] transition duration-200 shrink-0">
          <RefreshCw className="h-4 w-4 text-[#D97706]" /> Sync Queue Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Permits Queue */}
        <div className="lg:col-span-2 min-w-0 bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card backdrop-blur-sm space-y-4 h-[650px] overflow-y-auto">
          <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Awaiting Verification Queue ({permits.length})</h3>
          
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#D97706]"></div>
            </div>
          ) : permits.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center space-y-3">
              <CheckCircle className="h-10 w-10 text-[#16A34A]" />
              <p className="text-xs text-[#94A3B8]">No completed excavations currently awaiting restoration verification.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permits.map((permit) => (
                <div key={permit.id} onClick={() => handleSelectPermit(permit)}
                  className={`rounded-xl border p-4 space-y-2 cursor-pointer transition-all duration-200 ${
                    selectedPermit?.id === permit.id ? 'bg-[#FFFBEB] border-[#D97706] shadow-sm' : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-[#94A3B8] font-mono">Permit Ref #{permit.id}</span>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                      {permit.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] leading-snug">{permit.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                    <p className="font-semibold text-[#0F766E]">Agency: {permit.agency_name}</p>
                    <p className="font-medium">Completed: {permit.completed_at ? new Date(permit.completed_at).toLocaleDateString() : 'N/A'}</p>
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
              <AlertTriangle className="h-12 w-12 text-[#D97706] mb-3" />
              <h3 className="text-[#0F172A] font-bold text-base">Select Permit to Inspect</h3>
              <p className="text-xs text-[#94A3B8] max-w-xs mt-1.5 leading-relaxed">
                Click on any application card in the restoration queue to view completed trench parameters, on-site photos, GPS coordinates, and authorize inspection closures.
              </p>
            </div>
          ) : (
            <div className="bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card backdrop-blur-sm h-[650px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-[#0F766E] font-mono">ref #{selectedPermit.id}</span>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                    {selectedPermit.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{selectedPermit.title}</h3>
                  <p className="text-xs text-[#0F766E] font-semibold mt-1">Utility Agency: {selectedPermit.agency_name}</p>
                </div>

                <div className="h-[1px] bg-[#E2E8F0]"></div>

                {error && <p className="text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] p-2.5 rounded-lg">{error}</p>}

                {/* Focus Map */}
                <div className="h-40 rounded-xl overflow-hidden border border-[#E2E8F0]">
                  <HyderabadMap permits={[selectedPermit]} complaints={[]} />
                </div>

                <div className="space-y-3 text-xs text-[#475569]">
                  <div className="flex items-start gap-2"><Calendar className="h-4 w-4 text-[#D97706] shrink-0" /><p>Timeline: <span className="font-semibold text-[#0F172A]">{selectedPermit.start_date} to {selectedPermit.end_date}</span></p></div>
                  <div className="flex items-start gap-2"><Layers className="h-4 w-4 text-[#D97706] shrink-0" /><p>Excavation Depth: <span className="font-semibold text-[#0F172A]">{selectedPermit.depth_meters} meters</span></p></div>
                  <div className="flex items-start gap-2"><Map className="h-4 w-4 text-[#D97706] shrink-0" /><p className="max-w-[200px] truncate">Geometry (WKT): <span className="font-mono text-[10px] text-[#94A3B8]">{selectedPermit.wkt_geometry}</span></p></div>
                </div>

                {/* Excavation Completion Log */}
                <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#D97706]" /> Excavation Completion Log
                  </h4>
                  <div className="space-y-1.5 text-xs text-[#475569]">
                    <p>Completed At: <span className="font-semibold text-[#0F172A]">{selectedPermit.completed_at ? new Date(selectedPermit.completed_at).toLocaleString() : 'N/A'}</span></p>
                    <p>Completed By: <span className="font-semibold text-[#0F172A]">{selectedPermit.completed_by || 'N/A'}</span></p>
                    <p>Completion Notes: <span className="font-semibold text-[#0F172A]">{selectedPermit.completion_notes || 'No notes provided.'}</span></p>
                    {selectedPermit.restoration_deadline && <p>Restoration Deadline: <span className="font-semibold text-[#0F172A]">{selectedPermit.restoration_deadline}</span></p>}
                  </div>
                  <div className="mt-3">
                    <p className="text-[10px] uppercase font-bold text-[#94A3B8] mb-1">On-Site Evidence Photo</p>
                    <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80" alt="Excavation Evidence" className="rounded-lg w-full h-32 object-cover border border-[#E2E8F0]" />
                  </div>
                </div>
              </div>

              {/* Action panel */}
              <div className="space-y-2 pt-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Verification Notes / remarks</label>
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Provide details about road quality, restoration finish, or reason for rework..."
                      className="w-full rounded-xl bg-white border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] min-h-[60px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleVerifyRestoration(selectedPermit.id)} disabled={actionLoading}
                      className="rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] py-2.5 text-xs font-bold text-[#16A34A] transition duration-200 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Verify Restoration
                    </button>
                    <button onClick={() => handleRequestRework(selectedPermit.id)} disabled={actionLoading || !remarks.trim()}
                      className={`rounded-xl py-2.5 text-xs font-bold transition duration-200 flex items-center justify-center gap-1 ${
                        remarks.trim() ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626]' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                      }`} title={!remarks.trim() ? "Remarks are required to request rework" : ""}>
                      <XCircle className="h-3.5 w-3.5" /> Request Rework
                    </button>
                  </div>
                </div>
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

export default RestorationVerification;
