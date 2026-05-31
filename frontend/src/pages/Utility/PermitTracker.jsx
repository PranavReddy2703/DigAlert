import React, { useState, useEffect } from 'react';
import { permitsAPI, complaintsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import HyderabadMap from '../../components/HyderabadMap';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  Check,
  AlertTriangle, 
  Printer, 
  Layers, 
  Info, 
  Filter, 
  ArrowRight,
  TrendingUp,
  XCircle
} from 'lucide-react';

const PermitTracker = () => {
  const { user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agencyFilter, setAgencyFilter] = useState('ALL');

  // Action state variables
  const [completionNotes, setCompletionNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all permits (can be filtered by agency later)
        const permitsData = await permitsAPI.list();
        const complaintsData = await complaintsAPI.list();
        
        setPermits(permitsData);
        setComplaints(complaintsData);

        // Pre-select the first permit by default if any exist
        if (permitsData.length > 0) {
          // Fetch full detail for the pre-selected permit
          const fullDetail = await permitsAPI.get(permitsData[0].id);
          setSelectedPermit(fullDetail);
        }
      } catch (err) {
        console.error("Failed to load tracking data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectPermit = async (permit) => {
    try {
      const fullDetail = await permitsAPI.get(permit.id);
      setSelectedPermit(fullDetail);
    } catch (err) {
      console.error("Failed to fetch permit detail", err);
    }
  };

  const handleAuthorizeExcavation = async (id) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await permitsAPI.authorize(id);
      setSelectedPermit(updated);
      const permitsData = await permitsAPI.list();
      setPermits(permitsData);
    } catch (err) {
      console.error("Failed to authorize permit excavation", err);
      setActionError('Failed to authorize excavation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartExcavation = async (id) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await permitsAPI.startExcavation(id);
      setSelectedPermit(updated);
      const permitsData = await permitsAPI.list();
      setPermits(permitsData);
    } catch (err) {
      console.error("Failed to start excavation", err);
      setActionError('Failed to start excavation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteExcavation = async (id) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await permitsAPI.completeExcavation(id, { completion_notes: completionNotes });
      setSelectedPermit(updated);
      setCompletionNotes('');
      const permitsData = await permitsAPI.list();
      setPermits(permitsData);
    } catch (err) {
      console.error("Failed to complete excavation", err);
      setActionError('Failed to mark excavation complete.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyRestoration = async (id) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await permitsAPI.verifyRestoration(id, { remarks });
      setSelectedPermit(updated);
      setRemarks('');
      const permitsData = await permitsAPI.list();
      setPermits(permitsData);
    } catch (err) {
      console.error("Failed to verify restoration", err);
      setActionError('Failed to verify restoration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRework = async (id) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await permitsAPI.requestRework(id, { remarks });
      setSelectedPermit(updated);
      setRemarks('');
      const permitsData = await permitsAPI.list();
      setPermits(permitsData);
    } catch (err) {
      console.error("Failed to request rework", err);
      setActionError('Failed to request rework.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseProject = async (id) => {
    setActionLoading(true);
    setActionError('');
    try {
      const updated = await permitsAPI.closeProject(id);
      setSelectedPermit(updated);
      const permitsData = await permitsAPI.list();
      setPermits(permitsData);
    } catch (err) {
      console.error("Failed to close project", err);
      setActionError('Failed to close project.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredPermits = permits.filter(permit => {
    // 1. Text Search matches ID or Title
    const matchesSearch = 
      permit.id.toString().includes(searchQuery) || 
      permit.title.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status Filter
    const matchesStatus = 
      statusFilter === 'ALL' || 
      permit.status === statusFilter;

    // 3. Agency Filter:
    // Utility department users should default to seeing their own agency's permits, 
    // but can view others. Admins see ALL by default.
    let matchesAgency = true;
    if (agencyFilter !== 'ALL') {
      matchesAgency = permit.agency_name === agencyFilter;
    } else if (user && user.role === 'UTILITY' && agencyFilter === 'ALL' && searchQuery === '' && statusFilter === 'ALL') {
      // If a department user opens the page, default filter scope to their own agency unless they search/filter otherwise
      matchesAgency = permit.agency_name === user.agency_name;
    }

    return matchesSearch && matchesStatus && matchesAgency;
  });

  // Calculate duration of a permit in days
  const getDurationDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  // Get visual timeline step metadata based on permit status
  const getTimelineSteps = (permit) => {
    if (!permit) return [];
    
    const status = permit.status;
    
    return [
      {
        title: "Draft Created",
        desc: "Excavation specifics and geometrical route entered in DigAlert system.",
        isDone: true,
        isActive: status === 'DRAFT',
      },
      {
        title: "Geospatial Clash Scan",
        desc: status === 'CLASH_DETECTED' 
          ? "CRITICAL: Spatial/Temporal conflicts detected on current road segment."
          : "Scan Completed: No direct road protection conflicts flagged.",
        isDone: status !== 'DRAFT',
        isActive: status === 'CLASH_DETECTED',
        isError: status === 'CLASH_DETECTED',
      },
      {
        title: "GHMC Review Queue",
        desc: ['APPROVED', 'AUTHORIZED_EXCAVATION', 'IN_PROGRESS', 'EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status)
          ? "Permit schedule cleared by GHMC Central Ward."
          : status === 'REJECTED' 
            ? "Permit request denied by GHMC Central Ward."
            : "Awaiting administrative review and work scheduling.",
        isDone: ['APPROVED', 'AUTHORIZED_EXCAVATION', 'IN_PROGRESS', 'EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status),
        isActive: ['PENDING_REVIEW', 'SUBMITTED'].includes(status),
        isError: status === 'REJECTED',
      },
      {
        title: "Excavation Authorized",
        desc: ['AUTHORIZED_EXCAVATION', 'IN_PROGRESS', 'EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status)
          ? `Excavation ordered. Authorized by ${permit.authorized_by || 'GHMC'}.`
          : "Awaiting administrative excavation authorization order.",
        isDone: ['AUTHORIZED_EXCAVATION', 'IN_PROGRESS', 'EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status),
        isActive: status === 'APPROVED',
      },
      {
        title: "Excavation Active",
        desc: ['IN_PROGRESS', 'EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status)
          ? "Excavation active on site. Barricading and dust controls active."
          : "Awaiting utility agency physical field activation.",
        isDone: ['IN_PROGRESS', 'EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status),
        isActive: status === 'AUTHORIZED_EXCAVATION',
      },
      {
        title: "Excavation Completed",
        desc: ['EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status)
          ? `Excavation completed. Marked by ${permit.completed_by || 'Utility'}.`
          : "Awaiting utility on-site excavation completion.",
        isDone: ['EXCAVATION_COMPLETED', 'ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status),
        isActive: status === 'IN_PROGRESS',
      },
      {
        title: "Restoration Verified",
        desc: ['ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status)
          ? `Trench restoration inspected and approved by ${permit.restoration_verified_by || 'GHMC'}.`
          : "Awaiting physical road restoration inspection & verification.",
        isDone: ['ROAD_RESTORED', 'PROJECT_CLOSED'].includes(status),
        isActive: status === 'EXCAVATION_COMPLETED',
      },
      {
        title: "Project Closed",
        desc: status === 'PROJECT_CLOSED'
          ? `Excavation ticket closed and archived by ${permit.closed_by || 'GHMC'}.`
          : "Awaiting final administrative closure.",
        isDone: status === 'PROJECT_CLOSED',
        isActive: status === 'ROAD_RESTORED',
      }
    ];
  };

  // Print PDF Official report generator using elegant native browser print layouts
  const handlePrintReport = (permit) => {
    if (!permit) return;

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    const duration = getDurationDays(permit.start_date, permit.end_date);
    const linkedComplaints = complaints.filter(c => c.permit_id === permit.id);

    const htmlContent = `
      <html>
        <head>
          <title>DigAlert - Official Excavation Permit #${permit.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 3px double #0f766e;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-weight: 800;
              font-size: 24px;
              color: #0f766e;
              letter-spacing: 1px;
            }
            .badge {
              display: inline-block;
              padding: 5px 12px;
              font-size: 11px;
              font-weight: bold;
              border-radius: 4px;
              text-transform: uppercase;
              border: 1px solid;
            }
            .badge-approved { background: #e0f7fa; color: #006064; border-color: #b2ebf2; }
            .badge-authorized { background: #f3e5f5; color: #4a148c; border-color: #e1bee7; }
            .badge-inprogress { background: #fff3e0; color: #e65100; border-color: #ffe0b2; }
            .badge-completed { background: #e8f5e9; color: #1b5e20; border-color: #c8e6c9; }
            .badge-clash { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
            .badge-pending { background: #fef3c7; color: #b45309; border-color: #fde68a; }
            .badge-default { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
            
            h1 { font-size: 22px; margin: 0 0 10px 0; color: #0f172a; }
            .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }
            
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            
            .section-title {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              color: #0f766e;
              border-left: 4px solid #0f766e;
              padding-left: 10px;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .coordinates {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              font-family: monospace;
              font-size: 11px;
              word-break: break-all;
            }
            .warning-box {
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              border-left: 4px solid #d97706;
              padding: 15px;
              border-radius: 6px;
              font-size: 13px;
              color: #92400e;
              margin: 15px 0;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
            }
            .stamp {
              border: 2px solid #16a34a;
              color: #16a34a;
              padding: 10px 15px;
              font-weight: bold;
              text-transform: uppercase;
              transform: rotate(-5deg);
              border-radius: 6px;
              display: inline-block;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">DIGALERT INTEL</div>
              <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">GHMC Central Excavation Control</div>
            </div>
            <div>
              <span class="badge ${
                permit.status === 'APPROVED' ? 'badge-approved' : 
                permit.status === 'AUTHORIZED_EXCAVATION' ? 'badge-authorized' :
                permit.status === 'IN_PROGRESS' ? 'badge-inprogress' :
                (permit.status === 'COMPLETED' || permit.status === 'ROAD_RESTORED') ? 'badge-completed' :
                permit.status === 'CLASH_DETECTED' ? 'badge-clash' : 
                permit.status === 'PENDING_REVIEW' ? 'badge-pending' : 'badge-default'
              }">${permit.status}</span>
            </div>
          </div>

          <h1>Excavation Permit Protocol #${permit.id}</h1>
          <div class="subtitle">Official scheduling ledger of road digging authorization in Hyderabad Municipal jurisdiction.</div>

          <div class="section-title">Permit Parameters</div>
          <table>
            <tr>
              <th>Project Title</th>
              <td colspan="3"><strong>${permit.title}</strong></td>
            </tr>
            <tr>
              <th>Requesting Agency</th>
              <td>${permit.agency_name}</td>
              <th>Category of Work</th>
              <td>${permit.work_type}</td>
            </tr>
            <tr>
              <th>Start Schedule</th>
              <td>${permit.start_date}</td>
              <th>Completion Schedule</th>
              <td>${permit.end_date}</td>
            </tr>
            <tr>
              <th>Excavation Depth</th>
              <td>${permit.depth_meters} meters</td>
              <th>Work Duration</th>
              <td>${duration} days</td>
            </tr>
          </table>

          <div class="section-title">Project Scope / Description</div>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${permit.description || 'No additional scope details provided.'}
          </p>

          <div class="section-title">Geospatial Line Segment Coordinates (WKT)</div>
          <div class="coordinates">${permit.wkt_geometry}</div>

          ${permit.clashes && permit.clashes.length > 0 ? `
            <div class="section-title">Registered Spatial Conflicts (${permit.clashes.length})</div>
            <div class="warning-box">
              <strong>Spatial Clash Warning:</strong> This permit overlaps with other utility pipelines.
              <ul>
                ${permit.clashes.map(clash => `
                  <li>
                    <strong>${clash.conflicting_agency}:</strong> ${clash.conflicting_title}<br/>
                    <em>Recommendation:</em> ${clash.recommendation_text} (Estimated cost savings: ₹${clash.estimated_savings.toLocaleString()} INR)
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : `
            <div class="section-title">Geospatial Grid Scan</div>
            <p style="font-size: 13px; color: #0f766e; background-color: #f0fdf4; border-left: 4px solid #0d9488; padding: 12px; border-radius: 4px;">
              <strong>Geospatial check passed.</strong> No overlapping utility permits, depth collisions, or resurfacing lock-in periods flagged.
            </p>
          `}

          ${linkedComplaints.length > 0 ? `
            <div class="section-title">Citizen Hazard Tickets Logged (${linkedComplaints.length})</div>
            <table>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Citizen Description</th>
                <th>Status</th>
              </tr>
              ${linkedComplaints.map(c => `
                <tr>
                  <td>#${c.id}</td>
                  <td><strong>${c.complaint_type.replace('_', ' ')}</strong></td>
                  <td>${c.description}</td>
                  <td><span style="font-weight: bold; color: ${c.status === 'RESOLVED' ? '#059669' : '#d97706'}">${c.status}</span></td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          <div class="footer">
            <div>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>DigAlert Security ID: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            </div>
            <div style="text-align: right;">
              <div class="stamp">AUTHORIZED APPROVED</div>
              <p style="margin-top: 5px; font-weight: bold;">GHMC Central Ward Commissioner</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const selectedPermitTimeline = getTimelineSteps(selectedPermit);
  const linkedComplaints = selectedPermit 
    ? complaints.filter(c => c.permit_id === selectedPermit.id) 
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">Excavation Permit Tracker</h2>
          <p className="text-[#64748B] text-xs mt-1">
            {user.role === 'ADMIN' 
              ? 'GHMC Central Intelligence Portal. Search, trace, map, and print excavation records across all utility networks.'
              : `Utility control grid for ${user.agency_name}. Track excavation lifecycles, coordinate shared work segments, and clear citizen safety issues.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPermit && (
            <button
              onClick={() => handlePrintReport(selectedPermit)}
              className="flex items-center gap-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-[#0F766E] shadow-sm transition duration-200"
            >
              <Printer className="h-4 w-4" />
              Print Official Report
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Sidebar: Search, Filters & Permits List */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-5 space-y-4 h-[750px] flex flex-col justify-between">
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-[#0F766E]" />
              Registry Query
            </h3>

            {/* Query Inputs */}
            <div className="space-y-3 shrink-0">
              {/* Search text */}
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search ID or Title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#E2E8F0] pl-10 pr-4 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/10 transition duration-200 placeholder-slate-450"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Status Filter */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg bg-white border border-[#E2E8F0] px-2 py-1.5 text-[10px] font-semibold text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="CLASH_DETECTED">CLASH_DETECTED</option>
                    <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="AUTHORIZED_EXCAVATION">AUTHORIZED_EXCAVATION</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="EXCAVATION_COMPLETED">EXCAVATION_COMPLETED</option>
                    <option value="ROAD_RESTORED">ROAD_RESTORED</option>
                    <option value="PROJECT_CLOSED">PROJECT_CLOSED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                {/* Agency Filter */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-[#64748B] mb-1">Agency</label>
                  <select
                    value={agencyFilter}
                    onChange={(e) => setAgencyFilter(e.target.value)}
                    className="w-full rounded-lg bg-white border border-[#E2E8F0] px-2 py-1.5 text-[10px] font-semibold text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200"
                  >
                    <option value="ALL">{user.role === 'ADMIN' ? 'ALL AGENCIES' : `MY AGENCY (${user.agency_name})`}</option>
                    <option value="Airtel">Airtel Fiber</option>
                    <option value="BSNL">BSNL Telecom</option>
                    <option value="HMWSSB">HMWSSB Water</option>
                    <option value="TSSPDCL">TSSPDCL Power</option>
                    <option value="GHMC">GHMC Road</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-slate-100 my-2 shrink-0"></div>

            {/* List results */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#0F766E]"></div>
                </div>
              ) : filteredPermits.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <Info className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                  <p className="text-[11px] text-[#64748B] font-semibold">No permits match search parameters.</p>
                </div>
              ) : (
                filteredPermits.map((permit) => (
                  <div
                    key={permit.id}
                    onClick={() => handleSelectPermit(permit)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 space-y-2.5 ${
                      selectedPermit?.id === permit.id 
                        ? 'bg-slate-50 border-[#0F766E] shadow-sm' 
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-[#64748B] font-mono">Ref ID #{permit.id}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        permit.status === 'APPROVED' ? 'bg-teal-50 text-[#0F766E] border-teal-100' :
                        permit.status === 'CLASH_DETECTED' ? 'bg-red-50 text-[#DC2626] border-red-100 font-extrabold' :
                        permit.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-[#D97706] border-amber-100 font-semibold' :
                        permit.status === 'AUTHORIZED_EXCAVATION' ? 'bg-purple-50 text-purple-700 border-purple-100 font-semibold' :
                        permit.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100 font-semibold' :
                        permit.status === 'EXCAVATION_COMPLETED' ? 'bg-yellow-50 text-yellow-800 border-yellow-100 font-semibold' :
                        permit.status === 'ROAD_RESTORED' ? 'bg-green-50 text-green-700 border-green-100 font-semibold' :
                        permit.status === 'PROJECT_CLOSED' ? 'bg-slate-100 text-slate-700 border-slate-200 font-semibold' :
                        permit.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100 font-semibold' :
                        permit.status === 'REJECTED' ? 'bg-red-50 text-[#DC2626] border-red-100 font-semibold' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {permit.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#0F172A] leading-normal line-clamp-2">{permit.title}</h4>
                    
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#0F766E] uppercase">{permit.agency_name}</span>
                      <span className="text-[#64748B] font-semibold font-mono">{permit.start_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Summary Widget */}
          <div className="bg-slate-50 rounded-xl p-3 border border-[#E2E8F0] shrink-0 text-[10px] space-y-1.5">
            <div className="flex justify-between font-bold text-[#64748B]">
              <span>Matching Permits:</span>
              <span className="text-[#0F172A] font-mono">{filteredPermits.length}</span>
            </div>
            <div className="flex justify-between font-bold text-[#64748B]">
              <span>Active excavations:</span>
              <span className="text-[#0F766E] font-mono">
                {filteredPermits.filter(p => p.status === 'IN_PROGRESS').length}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[#64748B]">
              <span>Clashes flagged:</span>
              <span className="text-[#DC2626] font-mono">
                {filteredPermits.filter(p => p.status === 'CLASH_DETECTED').length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Permit full details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedPermit ? (
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-8 text-center h-[750px] flex flex-col items-center justify-center space-y-3">
              <Layers className="h-14 w-14 text-[#0F766E] animate-pulse mb-2" />
              <h3 className="text-[#0F172A] font-bold text-base">No Excavation Permit Selected</h3>
              <p className="text-xs text-[#64748B] max-w-sm leading-normal">
                Choose any excavation permit from the registry column on the left to track timeline approvals, inspect spatial maps, and analyze conflict schedules.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Timeline approvals tracker panel */}
              <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Excavation Progress Timeline</h3>
                  <span className="text-[10px] text-[#64748B] font-bold uppercase font-mono">
                    Permit Stage: <span className="text-[#0F766E] font-semibold">{selectedPermit.status}</span>
                  </span>
                </div>

                {/* Timeline node row */}
                <div className="grid grid-cols-2 md:grid-cols-8 gap-4 relative">
                  {selectedPermitTimeline.map((step, idx) => (
                    <div key={idx} className="relative flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                      {/* Timeline Dot Indicator */}
                      <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold ${
                        step.isActive 
                          ? step.isError 
                            ? 'bg-red-50 text-[#DC2626] border-[#DC2626] animate-bounce'
                            : 'bg-teal-50 text-[#0F766E] border-[#0F766E]'
                          : step.isDone
                            ? 'bg-green-50 text-green-600 border-green-200 shadow-sm shadow-green-500/10'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {step.isDone ? <Check className="h-3.5 w-3.5 stroke-[3px]" /> : idx + 1}
                      </span>

                      {/* Connection Line (Placed after span to avoid Tailwind space-y misalignment bug) */}
                      {idx < 7 && (
                        <div className={`hidden md:block absolute top-3 left-3 w-full h-[2px] z-0 ${
                          selectedPermitTimeline[idx+1].isDone ? 'bg-green-600' : 'bg-slate-100'
                        }`} />
                      )}

                      <div className="space-y-0.5 max-w-[150px]">
                        <h4 className={`text-xs font-semibold ${
                          step.isActive 
                            ? step.isError ? 'text-[#DC2626]' : 'text-[#0F766E]' 
                            : step.isDone ? 'text-[#0F172A]' : 'text-slate-450'
                        }`}>{step.title}</h4>
                        <p className="text-[9px] text-[#64748B] leading-normal line-clamp-3">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid: Map & Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Parameters panel */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Specifications</span>
                      <span className="text-xs font-semibold font-mono text-[#0F766E]">#{selectedPermit.id}</span>
                    </div>

                    <div className="h-[1px] bg-slate-100"></div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Project Title</p>
                        <p className="text-[#0F172A] font-semibold leading-normal">{selectedPermit.title}</p>
                      </div>

                      <div>
                        <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Requesting Agency</p>
                        <p className="text-green-700 font-bold uppercase">{selectedPermit.agency_name}</p>
                      </div>

                      <div>
                        <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Work Type / Category</p>
                        <p className="text-slate-700 font-bold uppercase">{selectedPermit.work_type}</p>
                      </div>

                      <div>
                        <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Excavation Depth</p>
                        <p className="text-[#0F172A] font-bold font-mono">{selectedPermit.depth_meters} meters</p>
                      </div>

                      <div>
                        <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Work Schedule Window</p>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-800 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
                          <span>{selectedPermit.start_date}</span>
                          <ArrowRight className="h-3 w-3 text-[#94A3B8]" />
                          <span>{selectedPermit.end_date}</span>
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-1 font-medium">
                          Total work duration: <span className="text-[#0F172A] font-bold font-mono">{getDurationDays(selectedPermit.start_date, selectedPermit.end_date)} days</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[#64748B] uppercase font-bold text-[9px] mb-1">Geospatial Geometry (WKT)</p>
                    <div className="text-[9px] font-mono text-[#64748B] bg-slate-50 p-2 rounded-lg border border-[#E2E8F0] break-all leading-normal max-h-16 overflow-y-auto">
                      {selectedPermit.wkt_geometry}
                    </div>
                  </div>

                  {/* Render Authorization info if available */}
                  {selectedPermit.authorized_at && (
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div>
                        <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Authorization Order</p>
                        <p className="text-[#0F172A] font-semibold">
                          Officer: <span className="font-bold text-purple-700">{selectedPermit.authorized_by}</span>
                        </p>
                        <p className="text-[#64748B] text-[10px] font-medium font-mono">
                          Date: {new Date(selectedPermit.authorized_at).toLocaleString()}
                        </p>
                      </div>

                      {selectedPermit.restoration_deadline && (
                        <div>
                          <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Restoration Deadline</p>
                          <p className="text-[#DC2626] font-bold font-mono">{selectedPermit.restoration_deadline}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Completion info if available */}
                  {selectedPermit.completed_at && (
                    <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                      <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Excavation Completion Log</p>
                      <p className="text-[#0F172A] font-semibold">
                        Actor: <span className="font-bold text-yellow-750">{selectedPermit.completed_by}</span>
                      </p>
                      <p className="text-[#64748B] text-[10px] font-medium font-mono">
                        Date: {new Date(selectedPermit.completed_at).toLocaleString()}
                      </p>
                      <p className="text-[#64748B] text-[10px] italic">
                        Notes: "{selectedPermit.completion_notes || 'None'}"
                      </p>
                    </div>
                  )}

                  {/* Render Verification info if available */}
                  {selectedPermit.restoration_verified_at && (
                    <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                      <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">GHMC Verification Details</p>
                      <p className="text-[#0F172A] font-semibold">
                        Inspector: <span className="font-bold text-green-700">{selectedPermit.restoration_verified_by}</span>
                      </p>
                      <p className="text-[#64748B] text-[10px] font-medium font-mono">
                        Date: {new Date(selectedPermit.restoration_verified_at).toLocaleString()}
                      </p>
                      <p className="text-[#64748B] text-[10px] italic">
                        Remarks: "{selectedPermit.restoration_remarks || 'None'}"
                      </p>
                    </div>
                  )}

                  {/* Render Closure info if available */}
                  {selectedPermit.closed_at && (
                    <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                      <p className="text-[#64748B] uppercase font-bold text-[9px] mb-0.5">Project Closure Stamp</p>
                      <p className="text-[#0F172A] font-semibold">
                        Manager: <span className="font-bold text-teal-600">{selectedPermit.closed_by}</span>
                      </p>
                      <p className="text-[#64748B] text-[10px] font-medium font-mono">
                        Date: {new Date(selectedPermit.closed_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Action Controls for Excavation authorization (Admin only) */}
                  {user && user.role === 'ADMIN' && selectedPermit.status === 'APPROVED' && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Administrative Controls</p>
                      <button
                        onClick={() => handleAuthorizeExcavation(selectedPermit.id)}
                        className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Authorize Excavation
                      </button>
                    </div>
                  )}

                  {/* Action Controls for Starting physical excavation (Utility only) */}
                  {user && user.role === 'UTILITY' && selectedPermit.status === 'AUTHORIZED_EXCAVATION' && selectedPermit.agency_name === user.agency_name && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Utility Field Actions</p>
                      <button
                        onClick={() => handleStartExcavation(selectedPermit.id)}
                        className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Start Excavation
                      </button>
                    </div>
                  )}

                  {/* Action Controls for Utility marking excavation complete */}
                  {user && user.role === 'UTILITY' && selectedPermit.status === 'IN_PROGRESS' && selectedPermit.agency_name === user.agency_name && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Utility Field Actions</p>
                      {actionError && (
                        <p className="text-[10px] text-[#DC2626] font-bold">{actionError}</p>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Excavation Notes</label>
                        <textarea
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="Record completed trench dimensions, backfilling completion, etc."
                          className="w-full rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0F766E] min-h-[50px]"
                        />
                      </div>
                      <button
                        onClick={() => handleCompleteExcavation(selectedPermit.id)}
                        disabled={actionLoading || !completionNotes.trim()}
                        className={`w-full rounded-lg py-2.5 text-xs font-semibold transition duration-200 flex items-center justify-center gap-1.5 ${
                          completionNotes.trim()
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                            : 'bg-slate-100 border border-[#E2E8F0] text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Excavation Complete
                      </button>
                    </div>
                  )}

                  {/* Action Controls for Admin Verification and Rework (Admin only) */}
                  {user && user.role === 'ADMIN' && selectedPermit.status === 'EXCAVATION_COMPLETED' && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Administrative Actions</p>
                      {actionError && (
                        <p className="text-[10px] text-[#DC2626] font-bold">{actionError}</p>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Verification Remarks</label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Provide details about road quality, restoration finish, or reason for rework..."
                          className="w-full rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] placeholder-slate-450 focus:outline-none focus:border-[#0F766E] min-h-[50px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVerifyRestoration(selectedPermit.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-green-600 hover:bg-green-700 py-2 text-xs font-semibold text-white transition duration-200 flex items-center justify-center gap-1 shadow-sm"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleRequestRework(selectedPermit.id)}
                          disabled={actionLoading || !remarks.trim()}
                          className={`rounded-lg py-2 text-xs font-semibold transition duration-200 flex items-center justify-center gap-1 ${
                            remarks.trim() 
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                              : 'bg-slate-100 border border-[#E2E8F0] text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Request Rework
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Controls for Admin Project Closure (Admin only) */}
                  {user && user.role === 'ADMIN' && selectedPermit.status === 'ROAD_RESTORED' && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">Administrative Actions</p>
                      {actionError && (
                        <p className="text-[10px] text-[#DC2626] font-bold">{actionError}</p>
                      )}
                      <button
                        onClick={() => handleCloseProject(selectedPermit.id)}
                        disabled={actionLoading}
                        className="w-full rounded-lg bg-green-600 hover:bg-green-700 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Close Project
                      </button>
                    </div>
                  )}
                </div>

                {/* Map panel */}
                <div className="md:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4.5 w-4.5 text-[#0F766E]" />
                      <span>Focus Excavation Segment Map</span>
                    </div>
                    <span className="text-[9px] font-bold text-[#64748B]">ZOOM TO COORDINATE NODES</span>
                  </div>

                  <div className="h-[310px] rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm">
                    <HyderabadMap
                      permits={[selectedPermit]}
                      complaints={linkedComplaints}
                    />
                  </div>
                </div>
              </div>

              {/* Conflict warnings, citizen hazards, and chronological audit trail */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Clash panel if present */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-[#DC2626]" />
                    Spatial Conflict Analyzer
                  </h3>

                  {selectedPermit.clashes && selectedPermit.clashes.length > 0 ? (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {selectedPermit.clashes.map((clash, idx) => {
                        const isRoadLock = clash.conflicting_permit_id < 0;
                        return (
                          <div 
                            key={idx} 
                            className={`rounded-xl border p-4 space-y-2 bg-white shadow-sm ${
                              isRoadLock 
                                ? 'border-red-200' 
                                : 'border-amber-200'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                              <span className={isRoadLock ? 'text-[#DC2626]' : 'text-[#D97706]'}>
                                {isRoadLock ? 'GHMC RESURFACING PROTECTION LOCK' : 'JOINT COLLISION DETECTED'}
                              </span>
                              {!isRoadLock && (
                                <span className="text-[#64748B] font-mono">Overlap: {clash.overlap_percentage}%</span>
                              )}
                            </div>
                            
                            <h4 className="text-xs font-bold text-[#0F172A]">{clash.conflicting_title}</h4>
                            <p className="text-[11px] text-[#64748B] leading-normal font-medium">{clash.recommendation_text}</p>

                            {!isRoadLock && clash.estimated_savings > 0 && (
                              <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg p-2.5 mt-1.5 text-[10px]">
                                <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                                <span className="text-[#64748B] font-medium">
                                  Estimated cost-sharing savings: <span className="font-bold text-green-700 font-mono">₹{clash.estimated_savings.toLocaleString()} INR</span>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center justify-center space-y-2 bg-green-50/50 rounded-xl border border-green-100 p-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <p className="text-xs text-green-700 font-bold">No Spatial Conflicts Registered</p>
                      <p className="text-[10px] text-[#64748B] max-w-[200px]">Geospatial check passed. Excavation path is clear of direct utility clashes.</p>
                    </div>
                  )}
                </div>

                {/* Citizen complaints logged panel */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-550" />
                    Associated Citizen Hazards
                  </h3>

                  {linkedComplaints.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <p className="text-xs text-[#64748B] font-bold">No Open Hazards Registered</p>
                      <p className="text-[10px] text-slate-400">Citizen complaints linked to this permit will be logged here in real-time.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                      {linkedComplaints.map((complaint) => (
                        <div key={complaint.id} className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between text-[9px] font-bold">
                            <span className="uppercase text-[#DC2626] font-mono">#{complaint.complaint_type.replace('_', ' ')}</span>
                            <span className={`px-2 py-0.5 rounded-full border ${
                              complaint.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-[#DC2626] border-red-100'
                            }`}>
                              {complaint.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#0F172A] leading-normal font-medium">{complaint.description}</p>
                          
                          <div className="flex justify-between items-center text-[9px] text-[#64748B] font-semibold">
                            <span>Reporter: {complaint.citizen_name}</span>
                            <span>Logged: {new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chronological Activity Log Panel */}
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4.5 w-4.5 text-purple-700" />
                    Permit Activity Ledger
                  </h3>

                  {!selectedPermit.audit_logs || selectedPermit.audit_logs.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center space-y-2 bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <Clock className="h-8 w-8 text-[#94A3B8] mx-auto" />
                      <p className="text-xs text-[#64748B] font-bold">No Activity Logs Found</p>
                      <p className="text-[10px] text-slate-400">Historical state changes and audit events will render here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                      <div className="relative pl-4 border-l border-slate-100 space-y-4">
                        {selectedPermit.audit_logs.map((log) => (
                          <div key={log.id} className="relative space-y-1">
                            {/* Dot */}
                            <span className="absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple-600 border-2 border-white" />
                            
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="font-bold text-purple-700 uppercase tracking-wider">{log.event_type}</span>
                              <span className="text-[#64748B] font-semibold">{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <p className="text-[10.5px] text-[#0F172A] leading-normal font-medium">{log.description}</p>
                            
                            {log.username && (
                              <p className="text-[8px] text-[#64748B] font-bold uppercase">Actor: {log.username}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PermitTracker;
