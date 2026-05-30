import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../../utils/api';
import { AlertCircle, User, CheckCircle, ShieldAlert, Camera, MapPin, RefreshCw } from 'lucide-react';

const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintsAPI.list();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await complaintsAPI.update(id, { status });
      await loadComplaints();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignAgency = async (id, agency) => {
    setUpdatingId(id);
    try {
      await complaintsAPI.update(id, { agency_assigned: agency });
      await loadComplaints();
    } catch (err) {
      console.error("Failed to assign agency", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Citizen Complaint Supervisor</h2>
          <p className="text-gray-400 text-sm mt-1">Oversee safety hazards reported by the public. Track automated geo-routing allocations and verify concrete road restorations.</p>
        </div>
        <button
          onClick={loadComplaints}
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-300 transition duration-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center glass-panel rounded-2xl border border-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-800"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 border border-gray-800 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-primaryEmerald mx-auto animate-bounce" />
          <h3 className="text-white font-bold text-lg">No Active Citizen Safety Tickets</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            All excavation zones are reported as safely barricaded and fully restored. Central control grid cleared!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="glass-panel rounded-2xl p-6 border border-gray-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-alertRed font-mono">Ticket Ref #{complaint.id}</span>
                  <span className={`text-[9px] uppercase font-bold px-2.5 py-0.5 rounded border ${
                    complaint.status === 'RESOLVED' 
                      ? 'bg-emerald-950/40 text-primaryEmerald border-emerald-900/30' 
                      : 'bg-red-950/40 text-alertRed border-red-900/30 animate-pulse'
                  }`}>
                    {complaint.status}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 border border-gray-850 shrink-0 text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{complaint.complaint_type.replace('_', ' ')}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Submitted by {complaint.citizen_name}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed font-semibold bg-gray-950/30 p-3 rounded-lg border border-gray-850/50">
                  {complaint.description}
                </p>

                {complaint.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-850 h-32 bg-gray-950">
                    <img 
                      src={complaint.photo_url} 
                      alt="Citizen Proof" 
                      className="w-full h-full object-cover opacity-75 hover:opacity-100 transition duration-300"
                    />
                  </div>
                )}

                <div className="h-[1px] bg-gray-800"></div>

                {/* Geospatial matching status */}
                <div className="text-[10px] space-y-2 text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primaryAqua" />
                    <span>Coordinates: [{complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}]</span>
                  </div>
                  {complaint.permit_id ? (
                    <div className="flex items-center gap-1.5 text-primaryEmerald font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Geospatially linked with excavation permit #{complaint.permit_id}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-warningYellow font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Stand-alone hazard. No active permit matches proximity buffer (25m).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Allocations Bar */}
              <div className="space-y-3 pt-4 border-t border-gray-800/80">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-gray-500 mb-1">Assign Operator</label>
                    <select
                      value={complaint.agency_assigned || ''}
                      onChange={(e) => handleAssignAgency(complaint.id, e.target.value)}
                      disabled={updatingId === complaint.id}
                      className="w-full rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-[10px] text-white focus:outline-none focus:border-primaryAqua transition duration-300"
                    >
                      <option value="">Unassigned</option>
                      <option value="TSSPDCL">TSSPDCL (Electricity)</option>
                      <option value="HMWSSB">HMWSSB (Water Grid)</option>
                      <option value="Airtel">Airtel Fiber</option>
                      <option value="BSNL">BSNL Broadband</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-gray-500 mb-1">Close Ticket</label>
                    <button
                      onClick={() => handleUpdateStatus(complaint.id, 'RESOLVED')}
                      disabled={updatingId === complaint.id || complaint.status === 'RESOLVED'}
                      className="w-full rounded-lg bg-emerald-950/20 hover:bg-emerald-950/50 border border-emerald-900/40 py-2 text-[10px] font-bold text-primaryEmerald transition duration-300"
                    >
                      Verify & Resolve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;
