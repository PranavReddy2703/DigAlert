import React, { useState, useEffect } from 'react';
import { permitsAPI } from '../../utils/api';
import { ShieldAlert, CheckCircle, HelpCircle, Award, RefreshCw } from 'lucide-react';

const ConflictManager = () => {
  const [clashPermits, setClashPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadConflictPermits = async () => {
    setLoading(true);
    try {
      const data = await permitsAPI.list();
      // Filter only permits with status CLASH_DETECTED
      const clashing = data.filter(p => p.status === 'CLASH_DETECTED');
      setClashPermits(clashing);
    } catch (err) {
      console.error("Failed to load conflicts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflictPermits();
  }, []);

  const handleResolveClash = async (permitId) => {
    setActionLoading(true);
    setError('');
    try {
      await permitsAPI.resolveClash(permitId);
      await loadConflictPermits();
    } catch (err) {
      setError('Failed to resolve spatial clash. Spatial boundary conflict.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Conflict Management Center</h2>
          <p className="text-gray-400 text-sm mt-1">Review overlapping excavations, inspect temporal date collisions, and approve joint co-dig coordination operations.</p>
        </div>
        <button
          onClick={loadConflictPermits}
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-300 transition duration-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Registry
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs font-semibold text-alertRed red-glow">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Grid of clash items */}
      {loading ? (
        <div className="flex h-40 items-center justify-center glass-panel rounded-2xl border border-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-800"></div>
        </div>
      ) : clashPermits.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 border border-gray-800 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-primaryEmerald mx-auto animate-bounce" />
          <h3 className="text-white font-bold text-lg">No Active Utility Clashes</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            All registered utilities are currently scheduled in disjoint temporal blocks and separate road sections. Central grid is conflict-free!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clashPermits.map((permit) => (
            <div key={permit.id} className="glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-primaryAqua font-mono">Clashing Ref #{permit.id}</span>
                  <span className="text-[10px] uppercase font-bold bg-red-950/40 text-alertRed border border-red-900/30 px-2.5 py-0.5 rounded animate-pulse">
                    Clash Detected
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{permit.title}</h3>
                  <p className="text-xs text-primaryEmerald font-semibold mt-1">Utility Agency: {permit.agency_name}</p>
                </div>

                <div className="h-[1px] bg-gray-800"></div>

                {/* Overlap list */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Overlapping Targets ({permit.clashes.length})</p>
                  
                  {permit.clashes.map((clash, idx) => {
                    const isRoadLock = clash.conflicting_permit_id < 0;
                    return (
                      <div key={idx} className={`rounded-xl border p-4 space-y-2 ${
                        isRoadLock ? 'bg-red-950/10 border-red-900/30' : 'bg-gray-900/40 border-gray-800'
                      }`}>
                        <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider">
                          <span className={isRoadLock ? 'text-alertRed' : 'text-warningYellow'}>
                            {isRoadLock ? 'GHMC Resurfacing Protection' : 'Utility Overlap'}
                          </span>
                          {!isRoadLock && <span className="text-gray-400">Overlap: {clash.overlap_percentage}%</span>}
                        </div>
                        <h4 className="text-xs font-bold text-white">{clash.conflicting_title}</h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">{clash.recommendation_text}</p>

                        {!isRoadLock && clash.estimated_savings > 0 && (
                          <div className="flex items-center gap-1.5 text-primaryEmerald font-bold text-[10px] pt-1">
                            <Award className="h-4 w-4 shrink-0" />
                            <span>Potential Co-Dig split savings: ₹{clash.estimated_savings.toLocaleString()} INR</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={() => handleResolveClash(permit.id)}
                  disabled={actionLoading || permit.clashes.some(c => c.conflicting_permit_id < 0)} // Block completely if road segment lock
                  className={`w-full rounded-xl py-3 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300 flex items-center justify-center gap-1.5 ${
                    permit.clashes.some(c => c.conflicting_permit_id < 0)
                      ? 'bg-red-500 opacity-60 cursor-not-allowed text-white hover:opacity-60'
                      : 'bg-gradient-to-r from-primaryAqua to-primaryEmerald'
                  }`}
                >
                  {permit.clashes.some(c => c.conflicting_permit_id < 0) ? (
                    'Submission Locked - Resurfaced Road'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve Co-Digging Schedule & Joint Restoration
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConflictManager;
