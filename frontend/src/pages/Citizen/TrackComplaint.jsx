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
      setError('CRITICAL: Complaint ticket ID not found on active control grid.');
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
        <h2 className="text-2xl font-bold text-white tracking-wide">Track Central Safety Complaint</h2>
        <p className="text-xs text-gray-400 mt-1">Check progress, assigned agencies, and physical restoration updates on citizen-filed hazard tickets.</p>
      </div>

      {/* Search Input Card */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-800 shadow-glass">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="Enter 5-digit Complaint ID (e.g. 1, 2, 3...)"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-primaryAqua transition duration-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-6 py-3 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
          >
            {loading ? 'Searching...' : 'Scan Control Grid'}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs font-semibold text-alertRed red-glow">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Main Timeline details */}
      {complaint && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left panel: Ticket summary */}
          <div className="glass-panel rounded-2xl p-5 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-500">Ticket ref</span>
              <span className="text-sm font-bold text-primaryAqua font-mono">#{complaint.id}</span>
            </div>
            
            <div className="h-[1px] bg-gray-800"></div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-500 font-bold uppercase text-[9px] mb-1">Hazard Category</p>
                <p className="text-white font-bold">{complaint.complaint_type.replace('_', ' ')}</p>
              </div>

              <div>
                <p className="text-gray-500 font-bold uppercase text-[9px] mb-1">Logged Description</p>
                <p className="text-gray-300 leading-relaxed">{complaint.description}</p>
              </div>

              {complaint.photo_url && (
                <div className="rounded-xl overflow-hidden border border-gray-800 h-28 bg-gray-950">
                  <img src={complaint.photo_url} className="w-full h-full object-cover opacity-80" alt="Proof" />
                </div>
              )}

              <div className="pt-2">
                <p className="text-gray-500 font-bold uppercase text-[9px] mb-1">Ticket Allocation Status</p>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  complaint.status === 'RESOLVED' ? 'bg-emerald-950/50 text-primaryEmerald border border-emerald-900/30' : 'bg-red-950/50 text-alertRed border border-red-900/30'
                }`}>
                  {complaint.status}
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: Timeline of activities */}
          <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Complaint Resolution Timeline</h3>
            
            <div className="relative border-l border-gray-800 pl-6 ml-3 space-y-8">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Glowing Node indicator */}
                  <span className={`absolute -left-[31px] top-0 flex h-4.5 w-4.5 items-center justify-center rounded-full border ${
                    step.isDone 
                      ? 'bg-emerald-950 text-primaryEmerald border-primaryEmerald shadow-emeraldGlow' 
                      : 'bg-gray-900 text-gray-500 border-gray-800'
                  }`}>
                    {step.isDone ? <ShieldCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </span>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${step.isDone ? 'text-white' : 'text-gray-500'}`}>{step.title}</h4>
                      {step.date && <span className="text-[10px] text-gray-500 font-medium">{step.date}</span>}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {complaint.status === "RESOLVED" && (
              <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 mt-6">
                <Award className="h-10 w-10 text-primaryEmerald animate-pulse shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">GHMC Safety Standard Fulfilled</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
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
