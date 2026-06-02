import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { complaintsAPI } from '../../utils/api';
import { Search, MapPin, Calendar, Clock, Award, ShieldCheck, AlertCircle } from 'lucide-react';

const TrackComplaint = () => {
  const location = useLocation();
  
  const [complaintId, setComplaintId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if redirecting from a successful submit or selection
    const targetId = location.state?.complaintId;
    if (targetId) {
      setComplaintId(targetId.toString());
      fetchComplaint(targetId);
    }
  }, [location.state]);

  const fetchComplaint = async (id) => {
    setLoading(true);
    setError('');
    setComplaint(null);
    try {
      const data = await complaintsAPI.get(id);
      setComplaint(data);
    } catch (err) {
      setError('Complaint ticket ID not found. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!complaintId) return;
    fetchComplaint(complaintId);
  };

  // Timeline helper
  const getTimelineStatus = () => {
    if (!complaint) return [];
    
    const steps = [
      {
        title: "Ticket Logged",
        description: `Citizen registered hazard at coordinates: [${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}].`,
        date: new Date(complaint.created_at).toLocaleDateString(),
        isDone: true,
      },
      {
        title: "Spatial Proximity Scanned & Dispatched",
        description: complaint.agency_assigned 
          ? `Geospatial algorithm linked complaint with active digging and auto-assigned responsible utility agency: ${complaint.agency_assigned}.`
          : "Complaint is being reviewed by GHMC Central Ward Officer for manual utility allocation.",
        date: complaint.status !== "OPEN" ? new Date(complaint.created_at).toLocaleDateString() : null,
        isDone: complaint.status !== "OPEN",
      },
      {
        title: "Restoration Resolved",
        description: `Utility engineers resolved hazard. Tarring and barricading verified.`,
        date: complaint.status === "RESOLVED" ? "Completed recently" : null,
        isDone: complaint.status === "RESOLVED",
      }
    ];
    return steps;
  };

  const steps = getTimelineStatus();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-wide">Track Complaint</h2>
        <p className="text-xs text-[#64748B] mt-1">Check progress, assigned agencies, and physical restoration updates on citizen-filed hazard tickets.</p>
      </div>

      {/* Search Input Card */}
      <div className="bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card backdrop-blur-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Enter Complaint ID (e.g. 1, 2, 3...)"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-3 pl-11 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#0F766E] hover:bg-[#115E59] px-6 py-3 text-xs font-bold text-white shadow-sm transition duration-200"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs font-semibold text-[#DC2626]">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Main Timeline details */}
      {complaint && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left panel: Ticket summary */}
          <div className="bg-[#0F766E]/[0.03] rounded-2xl p-5 border border-[#0F766E]/20 shadow-card backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Ticket ref</span>
              <span className="text-sm font-bold text-[#0F766E] font-mono">#{complaint.id}</span>
            </div>
            
            <div className="h-[1px] bg-[#E2E8F0]"></div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[#94A3B8] font-bold uppercase text-[9px] mb-1">Hazard Category</p>
                <p className="text-[#0F172A] font-bold">{complaint.complaint_type.replace('_', ' ')}</p>
              </div>

              <div>
                <p className="text-[#94A3B8] font-bold uppercase text-[9px] mb-1">Logged Description</p>
                <p className="text-[#475569] leading-relaxed">{complaint.description}</p>
              </div>

              {complaint.photo_url && (
                <div className="rounded-xl overflow-hidden border border-[#E2E8F0] h-28 bg-[#F8FAFC]">
                  <img src={complaint.photo_url} className="w-full h-full object-cover" alt="Proof" />
                </div>
              )}

              <div className="pt-2">
                <p className="text-[#94A3B8] font-bold uppercase text-[9px] mb-1">Ticket Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  complaint.status === 'RESOLVED' ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                }`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: Timeline of activities */}
          <div className="md:col-span-2 bg-[#0F766E]/[0.03] rounded-2xl p-6 border border-[#0F766E]/20 shadow-card backdrop-blur-sm space-y-6">
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Complaint Resolution Timeline</h3>
            
            <div className="relative border-l-2 border-[#E2E8F0] pl-6 ml-3 space-y-8">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Node indicator */}
                  <span className={`absolute -left-[29px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    step.isDone 
                      ? 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]' 
                      : 'bg-white text-[#94A3B8] border-[#E2E8F0]'
                  }`}>
                    {step.isDone ? <ShieldCheck className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${step.isDone ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{step.title}</h4>
                      {step.date && <span className="text-[10px] text-[#94A3B8] font-medium">{step.date}</span>}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {complaint.status === "RESOLVED" && (
              <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 mt-6">
                <Award className="h-10 w-10 text-[#16A34A] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase">GHMC Safety Standard Fulfilled</h4>
                  <p className="text-[10px] text-[#64748B] mt-0.5">
                    This ticket has been officially closed. The utility partner has verified concrete restoration and barricading clearance.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackComplaint;
