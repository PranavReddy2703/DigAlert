import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HyderabadMap from '../../components/HyderabadMap';
import { permitsAPI, complaintsAPI } from '../../utils/api';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Hyderabad Road Work Grid</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time public portal tracking GHMC road cutting permissions and citizen reports.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/citizen/report')}
            className="rounded-xl bg-gradient-to-r from-red-600 to-alertRed px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 shadow-redGlow transition duration-300"
          >
            Report Hazard / Complaint
          </button>
          <button
            onClick={() => navigate('/citizen/track')}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-200 transition duration-300"
          >
            Track My Complaint
          </button>
        </div>
      </div>

      {/* Filters & Map Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Component */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtering bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between glass-panel rounded-xl p-3 border border-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primaryAqua"
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
                  className="rounded-lg bg-gray-900 border border-gray-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primaryAqua"
                >
                  <option value="">All Statuses</option>
                  <option value="IN_PROGRESS">Active Excavation</option>
                  <option value="APPROVED">Upcoming Digging</option>
                  <option value="EMERGENCY">Emergency Works</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="text-[10px] uppercase font-bold text-primaryAqua tracking-widest">
              Live Feed: {permits.length} Projects, {complaints.length} Complaints
            </div>
          </div>

          {/* Hyderabad Leaflet Map */}
          {loading ? (
            <div className="h-[500px] flex items-center justify-center glass-panel rounded-xl border border-gray-800">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-800"></div>
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
            <div className="glass-panel rounded-2xl p-8 border border-gray-800 text-center h-[560px] flex flex-col items-center justify-center">
              <MapPin className="h-12 w-12 text-primaryAqua animate-pulse mb-3" />
              <h3 className="text-white font-bold text-lg">Interactive Inspector</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                Click on any colored road segment or public complaint dot on the Hyderabad map to inspect active permits, timings, agencies, and reports.
              </p>
            </div>
          ) : selectedPermit ? (
            <div className="glass-panel rounded-2xl p-6 border border-gray-800 h-[560px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-cyan-950/40 text-primaryAqua border border-cyan-900/30">
                    Permit Ref: #{selectedPermit.id}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-emerald-950/40 text-primaryEmerald border border-emerald-900/30">
                    {selectedPermit.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{selectedPermit.title}</h3>
                  <p className="text-xs text-primaryEmerald font-semibold mt-1">Utility Agency: {selectedPermit.agency_name}</p>
                </div>

                <div className="h-[1px] bg-gray-800"></div>

                <p className="text-xs text-gray-400 leading-relaxed">{selectedPermit.description || "No project description provided."}</p>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primaryAqua" />
                    <span>Timeline: {selectedPermit.start_date} to {selectedPermit.end_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primaryAqua" />
                    <span>Depth Zone: {selectedPermit.depth_meters} meters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primaryAqua" />
                    <span>Work Domain: {selectedPermit.work_type} Layout</span>
                  </div>
                </div>

                {selectedPermit.clashes && selectedPermit.clashes.length > 0 && (
                  <div className="rounded-xl border border-red-950/50 bg-red-950/10 p-4 border border-red-900/20">
                    <div className="flex items-center gap-2 text-alertRed mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Clash Analysis Detected</h4>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      This project overlaps with another excavation work. Co-digging operations might apply to reduce road damage.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={() => navigate('/citizen/report', { state: { permitId: selectedPermit.id } })}
                  className="w-full rounded-xl bg-gradient-to-r from-red-600 to-alertRed py-2.5 text-xs font-bold text-white hover:opacity-90 shadow-redGlow transition duration-300"
                >
                  File Complaint Against This Site
                </button>
                <button
                  onClick={() => setSelectedPermit(null)}
                  className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 py-2 text-xs font-bold text-gray-400 hover:text-white transition duration-300"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 border border-gray-800 h-[560px] overflow-y-auto space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-red-950/40 text-alertRed border border-red-900/30">
                    Reported Hazard
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
                    {selectedComplaint.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{selectedComplaint.complaint_type.replace('_', ' ')}</h3>
                  <p className="text-xs text-gray-500 mt-1">Submitted by {selectedComplaint.citizen_name}</p>
                </div>

                <div className="h-[1px] bg-gray-800"></div>

                <p className="text-xs text-gray-300 leading-relaxed">{selectedComplaint.description}</p>

                {selectedComplaint.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-800 h-32 bg-gray-950">
                    <img 
                      src={selectedComplaint.photo_url} 
                      alt="Citizen uploaded proof" 
                      className="w-full h-full object-cover opacity-75 hover:opacity-100 transition duration-300"
                    />
                  </div>
                )}

                <div className="space-y-2 text-xs text-gray-400">
                  <p>Responsible Utility: <span className="font-semibold text-primaryEmerald">{selectedComplaint.agency_assigned || "GHMC Oversight"}</span></p>
                  <p>Report Date: <span className="font-medium text-gray-300">{new Date(selectedComplaint.created_at).toLocaleDateString()}</span></p>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={() => navigate('/citizen/track', { state: { complaintId: selectedComplaint.id } })}
                  className="w-full rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald py-2.5 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
                >
                  Track Resolution Progress
                </button>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 py-2 text-xs font-bold text-gray-400 hover:text-white transition duration-300"
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
