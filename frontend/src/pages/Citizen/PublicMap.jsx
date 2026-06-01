import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HyderabadMap from '../../components/HyderabadMap';
import { permitsAPI, complaintsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Layers, MapPin, Eye, AlertTriangle } from 'lucide-react';


const PublicMap = () => {
  const [permits, setPermits] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [agencyFilter, setAgencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  // Only unauthenticated citizens or those without a staff role can file/track complaints
  const isCitizenUser = !user || (user.role !== 'ADMIN' && user.role !== 'UTILITY');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const filters = {};
        if (agencyFilter) filters.agency = agencyFilter;
        if (statusFilter) filters.status = statusFilter;
        
        const permitsData = await permitsAPI.list(filters);
        const complaintsData = await complaintsAPI.list();
        
        setPermits(permitsData);
        setComplaints(complaintsData);
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [agencyFilter, statusFilter]);

  const handleSelectPermit = (permit) => {
    setSelectedPermit(permit);
    setSelectedComplaint(null);
  };

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedPermit(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F766E] rounded-2xl p-6 border border-[#0D9488] shadow-card">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Hyderabad Road Work Grid</h2>
          <p className="text-[#A7F3D0] text-sm mt-1">Real-time public portal tracking GHMC road cutting permissions and citizen reports.</p>
        </div>
        {isCitizenUser && (
          <div className="flex gap-2 text-left">
            <button
              onClick={() => navigate('/citizen/report')}
              className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition duration-200"
            >
              Report Hazard / Complaint
            </button>
            <button
              onClick={() => navigate('/citizen/track')}
              className="rounded-xl bg-white hover:bg-[#F0FDF4] px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:text-[#0F766E] shadow-sm transition duration-200"
            >
              Track My Complaint
            </button>
          </div>
        )}

      </div>

      {/* Filters & Map Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Component */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtering bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-white rounded-xl p-3 border border-[#E2E8F0] shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="">All Utility Agencies</option>
                  <option value="TSSPDCL">TSSPDCL (Electricity)</option>
                  <option value="HMWSSB">HMWSSB (Water Grid)</option>
                  <option value="Airtel">Airtel Fiber</option>
                  <option value="BSNL">BSNL Telecom</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value="">All Statuses</option>
                  <option value="IN_PROGRESS">Active Excavation</option>
                  <option value="APPROVED">Upcoming Digging</option>
                  <option value="EMERGENCY">Emergency Works</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="text-[10px] uppercase font-bold text-[#0F766E] tracking-widest">
              Live Feed: {permits.length} Projects, {complaints.length} Complaints
            </div>
          </div>

          {/* Hyderabad Leaflet Map */}
          {loading ? (
            <div className="h-[500px] flex items-center justify-center bg-white rounded-xl border border-[#E2E8F0]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0F766E]"></div>
            </div>
          ) : (
            <HyderabadMap
              permits={permits}
              complaints={complaints}
              onSelectPermit={handleSelectPermit}
              onSelectComplaint={handleSelectComplaint}
            />
          )}
        </div>

        {/* Dynamic Detail Card Drawer (Right hand sidebar panel) */}
        <div className="space-y-4">
          {!selectedPermit && !selectedComplaint ? (
            <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-card text-center h-[560px] flex flex-col items-center justify-center">
              <MapPin className="h-12 w-12 text-[#0F766E] mb-3" />
              <h3 className="text-[#0F172A] font-bold text-lg">Interactive Inspector</h3>
              <p className="text-xs text-[#94A3B8] max-w-xs mt-1.5 leading-relaxed">
                Click on any colored road segment or public complaint dot on the Hyderabad map to inspect active permits, timings, agencies, and reports.
              </p>
            </div>
          ) : selectedPermit ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-card h-[560px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                    Permit Ref: #{selectedPermit.id}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                    {selectedPermit.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{selectedPermit.title}</h3>
                  <p className="text-xs text-[#0F766E] font-semibold mt-1">Utility Agency: {selectedPermit.agency_name}</p>
                </div>

                <div className="h-[1px] bg-[#E2E8F0]"></div>

                <p className="text-xs text-[#64748B] leading-relaxed">{selectedPermit.description || "No project description provided."}</p>

                <div className="space-y-2.5 text-xs text-[#475569]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#0F766E]" />
                    <span>Timeline: {selectedPermit.start_date} to {selectedPermit.end_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#0F766E]" />
                    <span>Depth Zone: {selectedPermit.depth_meters} meters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#0F766E]" />
                    <span>Work Domain: {selectedPermit.work_type} Layout</span>
                  </div>
                </div>

                {selectedPermit.clashes && selectedPermit.clashes.length > 0 && (
                  <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
                    <div className="flex items-center gap-2 text-[#DC2626] mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Clash Analysis Detected</h4>
                    </div>
                    <p className="text-[10px] text-[#64748B] leading-relaxed">
                      This project overlaps with another excavation work. Co-digging operations might apply to reduce road damage.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                {isCitizenUser && (
                  <button
                    onClick={() => navigate('/citizen/report', { state: { permitId: selectedPermit.id } })}
                    className="w-full rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] py-2.5 text-xs font-bold text-white shadow-sm transition duration-200"
                  >
                    File Complaint Against This Site
                  </button>
                )}
                <button
                  onClick={() => setSelectedPermit(null)}
                  className="w-full rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] py-2 text-xs font-bold text-[#94A3B8] hover:text-[#0F172A] transition duration-200"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-card h-[560px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                    Reported Hazard
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                    {selectedComplaint.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{selectedComplaint.complaint_type.replace('_', ' ')}</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">Submitted by {selectedComplaint.citizen_name}</p>
                </div>

                <div className="h-[1px] bg-[#E2E8F0]"></div>

                <p className="text-xs text-[#475569] leading-relaxed">{selectedComplaint.description}</p>

                {selectedComplaint.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-[#E2E8F0] h-32 bg-[#F8FAFC]">
                    <img 
                      src={selectedComplaint.photo_url} 
                      alt="Citizen uploaded proof" 
                      className="w-full h-full object-cover hover:opacity-90 transition duration-200"
                    />
                  </div>
                )}

                <div className="space-y-2 text-xs text-[#64748B]">
                  <p>Responsible Utility: <span className="font-semibold text-[#0F766E]">{selectedComplaint.agency_assigned || "GHMC Oversight"}</span></p>
                  <p>Report Date: <span className="font-medium text-[#0F172A]">{new Date(selectedComplaint.created_at).toLocaleDateString()}</span></p>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                {isCitizenUser && (
                  <button
                    onClick={() => navigate('/citizen/track', { state: { complaintId: selectedComplaint.id } })}
                    className="w-full rounded-xl bg-[#0F766E] hover:bg-[#115E59] py-2.5 text-xs font-bold text-white shadow-sm transition duration-200"
                  >
                    Track Resolution Progress
                  </button>
                )}
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="w-full rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] py-2 text-xs font-bold text-[#94A3B8] hover:text-[#0F172A] transition duration-200"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicMap;
