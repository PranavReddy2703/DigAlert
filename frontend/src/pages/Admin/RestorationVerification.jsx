import React, { useState, useEffect } from 'react';
import { permitsAPI } from '../../utils/api';
import HyderabadMap from '../../components/HyderabadMap';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Info, 
  Calendar, 
  Layers, 
  Map, 
  RefreshCw,
  Clock,
  User,
  AlertTriangle
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
      // Filter only EXCAVATION_COMPLETED
      const completed = data.filter(p => p.status === 'EXCAVATION_COMPLETED');
      setPermits(completed);
    } catch (err) {
      console.error("Failed to load verification queue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationQueue();
  }, []);

  const handleSelectPermit = async (permit) => {
    try {
      const fullDetail = await permitsAPI.get(permit.id);
      setSelectedPermit(fullDetail);
    } catch (err) {
      console.error("Failed to fetch permit details", err);
    }
  };

  const handleVerifyRestoration = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.verifyRestoration(id, { remarks });
      setRemarks('');
      setSelectedPermit(null);
      await loadVerificationQueue();
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
      await loadVerificationQueue();
    } catch (err) {
      setError('Rework request failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Restoration Verification Center</h2>
          <p className="text-xs text-gray-400 mt-1">Review completed excavations, inspect physical road restorations, verify asphalt concrete density, and authorize rework loops.</p>
        </div>
        <button
          onClick={loadVerificationQueue}
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-300 transition duration-300 shrink-0"
        >
          <RefreshCw className="h-4 w-4 text-warningYellow animate-spin-slow" />
          Sync Queue Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Permits Queue Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4 h-[650px] overflow-y-auto">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Awaiting Verification Queue ({permits.length})</h3>
          
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-warningYellow border-gray-800"></div>
            </div>
          ) : permits.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center space-y-3">
              <CheckCircle className="h-10 w-10 text-primaryEmerald animate-bounce" />
              <p className="text-xs text-gray-500">No completed excavations currently awaiting restoration verification.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permits.map((permit) => (
                <div
                  key={permit.id}
                  onClick={() => handleSelectPermit(permit)}
                  className={`rounded-xl border p-4 space-y-2 cursor-pointer transition-all duration-300 ${
                    selectedPermit?.id === permit.id 
                      ? 'bg-gray-800/40 border-warningYellow shadow-yellowGlow' 
                      : 'bg-gray-900/10 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Permit Ref #{permit.id}</span>
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-yellow-950/50 text-warningYellow border border-yellow-900/30 font-bold">
                      {permit.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-snug">{permit.title}</h4>
                  
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <p className="font-semibold text-primaryEmerald">Agency: {permit.agency_name}</p>
                    <p className="font-medium">Completed: {permit.completed_at ? new Date(permit.completed_at).toLocaleDateString() : 'N/A'}</p>
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
              <AlertTriangle className="h-12 w-12 text-warningYellow animate-pulse mb-3" />
              <h3 className="text-white font-bold text-base">Select Permit to Inspect</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                Click on any application card in the restoration queue to view completed trench parameters, on-site photos, GPS coordinates, and authorize inspection closures.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 border border-gray-800 h-[650px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-primaryAqua font-mono">ref #{selectedPermit.id}</span>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded bg-yellow-950/50 text-warningYellow border border-yellow-900/30 font-semibold">
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

                {/* Focus Map block */}
                <div className="h-40 rounded-xl overflow-hidden border border-gray-800">
                  <HyderabadMap
                    permits={[selectedPermit]}
                    complaints={[]}
                  />
                </div>

                <div className="space-y-3 text-xs text-gray-300">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-warningYellow shrink-0" />
                    <p>Timeline: <span className="font-semibold text-white">{selectedPermit.start_date} to {selectedPermit.end_date}</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers className="h-4 w-4 text-warningYellow shrink-0" />
                    <p>Excavation Depth: <span className="font-semibold text-white">{selectedPermit.depth_meters} meters</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Map className="h-4 w-4 text-warningYellow shrink-0" />
                    <p className="max-w-[200px] truncate">Geometry (WKT): <span className="font-mono text-[10px] text-gray-500">{selectedPermit.wkt_geometry}</span></p>
                  </div>
                </div>

                {/* Restoration Verification Info */}
                <div className="rounded-xl border border-yellow-950/30 bg-yellow-950/5 p-4 space-y-3 border border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warningYellow flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-warningYellow" />
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
                  {/* On-Site Evidence Photo */}
                  <div className="mt-3">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">On-Site Evidence Photo</p>
                    <img 
                      src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80" 
                      alt="Excavation Evidence" 
                      className="rounded-lg w-full h-32 object-cover border border-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Action approvals panel */}
              <div className="space-y-2 pt-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verification Notes / remarks</label>
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
                      Verify Restoration
                    </button>
                    <button
                      onClick={() => handleRequestRework(selectedPermit.id)}
                      disabled={actionLoading || !remarks.trim()}
                      className={`rounded-xl py-2.5 text-xs font-bold transition duration-300 flex items-center justify-center gap-1 ${
                        remarks.trim() 
                          ? 'bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 text-alertRed shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                          : 'bg-gray-900 border border-gray-800 text-gray-650 cursor-not-allowed'
                      }`}
                      title={!remarks.trim() ? "Remarks are required to request rework" : ""}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Request Rework
                    </button>
                  </div>
                </div>

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

export default RestorationVerification;
