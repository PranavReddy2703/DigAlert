import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../../utils/api';
import { AlertCircle, User, CheckCircle, ShieldAlert, Camera, MapPin, RefreshCw, XCircle } from 'lucide-react';

const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successId, setSuccessId] = useState(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintsAPI.list();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints list", err);
      showError("Failed to load complaints. Is the backend running?");
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
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
      await loadComplaints();
    } catch (err) {
      console.error("Failed to update status", err);
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 401) {
        showError("Session expired. Please log out and log in again.");
      } else if (err?.response?.status === 403) {
        showError(detail || "You don't have permission to close this ticket.");
      } else {
        showError(detail || "Failed to close ticket. Please try again.");
      }
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
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 401) {
        showError("Session expired. Please log out and log in again.");
      } else if (err?.response?.status === 403) {
        showError(detail || "Only GHMC administrators or utility agencies can assign complaints.");
      } else {
        showError(detail || "Failed to assign agency. Please try again.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-card">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-wide">Citizen Complaint Supervisor</h2>
          <p className="text-[#64748B] text-sm mt-1">Oversee safety hazards reported by the public. Track automated geo-routing allocations and verify concrete road restorations.</p>
        </div>
        <button
          onClick={loadComplaints}
          className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2.5 text-xs font-bold text-[#64748B] transition duration-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">
          <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
          <span className="text-xs font-semibold text-[#DC2626]">{errorMsg}</span>
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center bg-white rounded-2xl border border-[#E2E8F0]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0F766E]"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E2E8F0] shadow-card text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-[#16A34A] mx-auto" />
          <h3 className="text-[#0F172A] font-bold text-lg">No Active Citizen Safety Tickets</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
            All excavation zones are reported as safely barricaded and fully restored. Central control grid cleared!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#DC2626] font-mono">Ticket Ref #{complaint.id}</span>
                  <span className={`text-[9px] uppercase font-bold px-2.5 py-0.5 rounded border ${
                    complaint.status === 'RESOLVED' 
                      ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' 
                      : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  }`}>
                    {complaint.status}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] shrink-0 text-[#94A3B8]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">{complaint.complaint_type.replace('_', ' ')}</h3>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">Submitted by {complaint.citizen_name}</p>
                  </div>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed font-medium bg-[#F8FAFC] p-3 rounded-lg border border-[#F1F5F9]">
                  {complaint.description}
                </p>

                {complaint.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-[#E2E8F0] h-32 bg-[#F8FAFC]">
                    <img 
                      src={complaint.photo_url} 
                      alt="Citizen Proof" 
                      className="w-full h-full object-cover hover:opacity-90 transition duration-200"
                    />
                  </div>
                )}

                <div className="h-[1px] bg-[#E2E8F0]"></div>

                {/* Geospatial matching status */}
                <div className="text-[10px] space-y-2 text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#0F766E]" />
                    <span>Coordinates: [{complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}]</span>
                  </div>
                  {complaint.permit_id ? (
                    <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Geospatially linked with excavation permit #{complaint.permit_id}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[#D97706] font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Stand-alone hazard. No active permit matches proximity buffer (25m).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Allocations Bar */}
              <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Assign Operator</label>
                    <select
                      value={complaint.agency_assigned || ''}
                      onChange={(e) => handleAssignAgency(complaint.id, e.target.value)}
                      disabled={updatingId === complaint.id}
                      className="w-full rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[10px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
                    >
                      <option value="">Unassigned</option>
                      <option value="TSSPDCL">TSSPDCL (Power Distribution Grid)</option>
                      <option value="HMWSSB">HMWSSB (Water Supply & Sewerage)</option>
                      <option value="Telecom">Telecom (Airtel, BSNL Fiber Grid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Close Ticket</label>
                    <button
                      onClick={() => handleUpdateStatus(complaint.id, 'RESOLVED')}
                      disabled={updatingId === complaint.id || complaint.status === 'RESOLVED'}
                      className={`w-full rounded-lg border py-2 text-[10px] font-bold transition duration-200 ${
                        complaint.status === 'RESOLVED'
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                          : updatingId === complaint.id
                          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A] opacity-60 cursor-wait'
                          : 'bg-[#F0FDF4] hover:bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A] cursor-pointer'
                      }`}
                    >
                      {updatingId === complaint.id ? 'Updating...' : complaint.status === 'RESOLVED' ? '✓ Resolved' : 'Verify & Resolve'}
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
