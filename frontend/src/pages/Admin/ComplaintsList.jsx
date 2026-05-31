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
                      <option value="TSSPDCL">TSSPDCL (Electricity)</option>
                      <option value="HMWSSB">HMWSSB (Water Grid)</option>
                      <option value="Airtel">Airtel Fiber</option>
                      <option value="BSNL">BSNL Broadband</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Close Ticket</label>
                    <button
                      onClick={() => handleUpdateStatus(complaint.id, 'RESOLVED')}
                      disabled={updatingId === complaint.id || complaint.status === 'RESOLVED'}
                      className="w-full rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#BBF7D0] py-2 text-[10px] font-bold text-[#16A34A] transition duration-200"
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
