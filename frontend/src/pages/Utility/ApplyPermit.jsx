import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HyderabadMap from '../../components/HyderabadMap';
import { permitsAPI } from '../../utils/api';
import { MapPin, Calendar, ShieldAlert, CheckCircle, Info, Award, HelpCircle, Check } from 'lucide-react';

const ApplyPermit = () => {
  const navigate = useNavigate();
  
  // Form Steps: 1 = Details, 2 = Map Route, 3 = Schedule, 4 = Clash Precheck
  const [step, setStep] = useState(1);
  
  // Data States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState('POWER');
  const [depth, setDepth] = useState(0.8);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Precheck results
  const [precheckClashes, setPrecheckClashes] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [createdPermit, setCreatedPermit] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Convert Drawn Points array into WKT LINESTRING string format: LINESTRING(lng lat, lng lat)
  const getWKTString = () => {
    if (drawingPoints.length < 2) return '';
    const pointsStr = drawingPoints.map(p => `${p[1]} ${p[0]}`).join(', ');
    return `LINESTRING(${pointsStr})`;
  };

  const handleNextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!title || !depth) {
        setError('Please enter a project title and target excavation depth.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (drawingPoints.length < 2) {
        setError('CRITICAL: Minimum of 2 coordinate nodes are required to form an excavation route.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!startDate || !endDate) {
        setError('Please select scheduled Start and End dates.');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError('Start date cannot be after the completion date.');
        return;
      }
      setStep(4);
      // Automatically trigger precheck when entering step 4
      runClashPrecheck();
    }
  };

  const runClashPrecheck = async () => {
    setChecking(true);
    setHasChecked(false);
    setError('');
    try {
      const wkt = getWKTString();
      const response = await permitsAPI.precheck({
        wkt_geometry: wkt,
        depth_meters: parseFloat(depth),
        work_type: workType,
        start_date: startDate,
        end_date: endDate
      });
      setPrecheckClashes(response);
      setHasChecked(true);
    } catch (err) {
      setError('Clash engine precheck failed. Ensure backend service is online.');
    } finally {
      setChecking(false);
    }
  };

  const handlePrintReceipt = (permit) => {
    if (!permit) return;
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    const agencyPrefix = permit.agency_name ? permit.agency_name.toUpperCase().substring(0, 3) : 'UTI';
    const permitCode = `DA-${agencyPrefix}-${String(permit.id).padStart(5, '0')}`;
    
    const html = `
      <html>
        <head>
          <title>Permit Receipt - ${permitCode}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .border-box { border: 2px solid #0f766e; padding: 30px; border-radius: 8px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 20px; font-weight: bold; color: #0f766e; }
            .code { font-size: 24px; font-weight: bold; font-family: monospace; color: #0f172a; margin: 15px 0; background: #f1f5f9; padding: 10px; border-radius: 4px; display: inline-block; }
            h1 { font-size: 22px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            td { padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; }
            .title-td { font-weight: bold; width: 150px; background: #f8fafc; }
            .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="border-box">
            <div class="header">
              <span class="logo">DIGALERT INTEL</span>
              <span style="font-weight: bold; color: #16a34a;">SUBMITTED</span>
            </div>
            <h1>Excavation Permit Receipt</h1>
            <p>Your excavation permit application has been registered successfully. Use the permit reference code below to track administrative review and spatial clash statuses.</p>
            
            <div style="text-align: center;">
              <div class="code">${permitCode}</div>
            </div>

            <table>
              <tr>
                <td class="title-td">Permit ID</td>
                <td>#${permit.id}</td>
              </tr>
              <tr>
                <td class="title-td">Project Title</td>
                <td><strong>${permit.title}</strong></td>
              </tr>
              <tr>
                <td class="title-td">Agency Name</td>
                <td>${permit.agency_name}</td>
              </tr>
              <tr>
                <td class="title-td">Category</td>
                <td>${permit.work_type}</td>
              </tr>
              <tr>
                <td class="title-td">Schedule</td>
                <td>${permit.start_date} to ${permit.end_date}</td>
              </tr>
              <tr>
                <td class="title-td">Depth</td>
                <td>${permit.depth_meters} meters</td>
              </tr>
            </table>

            <div class="footer">
              <p>Hyderabad Municipal Corporation (GHMC) • DigAlert Smart City Grid</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleFinalSubmit = async () => {
    setSubmitLoading(true);
    setError('');
    try {
      const wkt = getWKTString();
      const response = await permitsAPI.create({
        title,
        description,
        wkt_geometry: wkt,
        depth_meters: parseFloat(depth),
        work_type: workType,
        start_date: startDate,
        end_date: endDate
      });
      setCreatedPermit(response);
    } catch (err) {
      setError('Permit creation failed. Please verify submission data.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wizard Step Timeline */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 flex justify-between items-center gap-4">
        {[
          { num: 1, label: 'Specifics' },
          { num: 2, label: 'Plot Path' },
          { num: 3, label: 'Schedule' },
          { num: 4, label: 'Clash Precheck' }
        ].map((s) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-2 flex-1 justify-center md:last:flex-none">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-xs sm:text-[10px] font-extrabold transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#E0FDFA] text-[#0F766E] border border-[#0F766E]' 
                    : isCompleted
                      ? 'bg-green-50 text-green-600 border border-green-200 shadow-sm shadow-green-500/10'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {isCompleted ? <Check className="h-4 w-4 sm:h-3 sm:w-3 stroke-[3px]" /> : s.num}
                </span>
                <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider hidden sm:inline transition-colors duration-300 ${
                  isActive ? 'text-[#0F766E]' : 'text-[#64748B]'
                }`}>
                  {s.label}
                </span>
              </div>
              {s.num < 4 && (
                <div className={`hidden md:block flex-1 h-[2px] ml-4 ${
                  isCompleted ? 'bg-[#0F766E]' : 'bg-slate-100'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-[#DC2626]">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: Details */}
      {step === 1 && (
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Step 1: Enter Project Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Permit Title / Work Name</label>
              <input
                type="text"
                placeholder="e.g. Laying 11KV power cables along Gachibowli Ring Road Link"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Description (Optional)</label>
              <textarea
                placeholder="Outline details, target utility buildings, or specific road margins..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200 placeholder-slate-400 leading-normal"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Excavation Depth (Meters)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Work Category</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200 font-semibold"
                >
                  <option value="POWER">Power Grid Lines (Electricity)</option>
                  <option value="WATER">Water Pipelines (Sewerage/Water)</option>
                  <option value="TELECOM">Telecom Fiber Conduit</option>
                  <option value="GAS">Gas Supply Pipeline</option>
                  <option value="ROAD_REPAIR">GHMC Road Repair Work</option>
                  <option value="EMERGENCY">Emergency Maintenance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNextStep}
              className="rounded-lg bg-[#0F766E] hover:bg-[#115E59] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200"
            >
              Continue to Plotting Route
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Map Route Drawing */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-[#0F766E]" />
              <p className="text-xs text-[#64748B] font-medium">
                Instructions: <span className="font-semibold text-[#0F172A]">Click along the road path</span> on the Hyderabad map to plot your excavation segment nodes.
              </p>
            </div>
            <button
              onClick={() => setDrawingPoints([])}
              className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 text-[10px] font-semibold text-[#DC2626] transition duration-200"
            >
              Clear Route
            </button>
          </div>

          <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <HyderabadMap
              isDrawing={true}
              drawingPoints={drawingPoints}
              setDrawingPoints={setDrawingPoints}
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 px-6 py-2.5 text-xs font-semibold text-[#64748B] transition duration-200"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="rounded-lg bg-[#0F766E] hover:bg-[#115E59] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200"
            >
              Confirm Excavation Segment
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Dates */}
      {step === 3 && (
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Step 3: Schedule Project Window</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Planned Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-[#94A3B8]" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#E2E8F0] px-4 py-2.5 pl-10 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Estimated Completion Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4.5 w-4.5 text-[#94A3B8]" />
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg bg-white border border-[#E2E8F0] px-4 py-2.5 pl-10 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F766E] transition duration-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 px-6 py-2.5 text-xs font-semibold text-[#64748B] transition duration-200"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="rounded-lg bg-[#0F766E] hover:bg-[#115E59] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition duration-200"
            >
              Initialize Clash Scan
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Real-time Clash detection screen */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Clash check loader */}
          {checking && (
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-10 flex flex-col items-center justify-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0F766E]"></div>
              <h4 className="text-[#0F172A] font-bold">Scanning GHMC Geospatial Registry...</h4>
              <p className="text-xs text-[#64748B] text-center">Checking spatial buffers, temporal overlaps, depths, and resurfaced locked segments.</p>
            </div>
          )}

          {/* Clash scan completed */}
          {hasChecked && (
            <div className="space-y-6">
              {precheckClashes.length === 0 ? (
                /* 4A: NO CLASHES FOUND */
                <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-8 text-center space-y-4 border-l-4 border-l-[#16A34A]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Geospatial Conflict Check Passed</h3>
                    <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto leading-normal">
                      GHMC lock-in check verified. No overlapping utility permits, depth collisions, or recently resurfaced roads are registered on this segment.
                    </p>
                  </div>
                </div>
              ) : (
                /* 4B: CLASHES DETECTED */
                <div className="space-y-4">
                  <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-6 border-l-4 border-l-[#DC2626] flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-[#DC2626] border border-red-100 shrink-0">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Spatial Conflicts Flagged ({precheckClashes.length})</h3>
                      <p className="text-xs text-[#64748B] mt-1 leading-normal">
                        Our spatial algorithms detected overlapping works or policy violations on this segment. Review conflict details below.
                      </p>
                    </div>
                  </div>

                  {/* Clash items lists */}
                  <div className="space-y-3">
                    {precheckClashes.map((clash, idx) => {
                      const isRoadLock = clash.conflicting_permit_id < 0;
                      return (
                        <div key={idx} className={`rounded-xl border p-5 space-y-3 bg-white shadow-sm ${
                          isRoadLock 
                            ? 'border-red-200' 
                            : 'border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isRoadLock ? 'bg-red-50 text-[#DC2626] border-red-100' : 'bg-amber-50 text-[#D97706] border-amber-100'
                            }`}>
                              {isRoadLock ? 'GHMC Policy Lockout' : 'Utility Clash Flagged'}
                            </span>
                            {!isRoadLock && (
                              <span className="text-[10px] text-[#64748B] font-semibold font-mono">
                                Overlap Ratio: {clash.overlap_percentage}%
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-[#0F172A]">{clash.conflicting_title}</h4>
                          <p className="text-xs text-[#64748B] leading-normal font-medium">{clash.recommendation_text}</p>

                          {!isRoadLock && clash.estimated_savings > 0 && (
                            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg p-3 mt-2 text-xs">
                              <Award className="h-5 w-5 text-green-600 shrink-0" />
                              <p className="text-[#64748B] leading-normal">
                                Joint excavation Coordination (Co-digging) splits restoration costs. Estimated savings: <span className="font-bold text-green-700 font-mono">₹{clash.estimated_savings.toLocaleString()} INR</span>.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 px-6 py-2.5 text-xs font-semibold text-[#64748B] transition duration-200"
                >
                  Back (Modify Schedule / Path)
                </button>
                
                {/* Allow submission if emergency or if user understands conflict (status will go to CLASH_DETECTED or pending review) */}
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitLoading}
                  className={`rounded-lg px-6 py-2.5 text-xs font-semibold transition duration-200 shadow-sm flex items-center gap-2 ${
                    precheckClashes.some(c => c.conflicting_permit_id < 0)
                      ? 'bg-red-500 opacity-60 cursor-not-allowed text-white' // completely block resurfaced lock
                      : 'bg-[#0F766E] hover:bg-[#115E59] text-white'
                  }`}
                >
                  {submitLoading ? 'Registering...' : 'Register Excavation Permit'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* SUCCESS MODAL FOR GENERATED CODE */}
      {createdPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[#E2E8F0] rounded-2xl shadow-xl space-y-6 text-center animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">Permit Application Submitted</h3>
              <p className="text-xs text-[#64748B] leading-normal">
                Your permit request has been registered in the GHMC central grid. Your unique identification permit code is generated below:
              </p>
            </div>

            {/* Generated Permit Code */}
            <div className="bg-slate-50 px-4 py-3 rounded-lg border border-[#E2E8F0] text-lg font-bold tracking-widest text-[#0F766E] font-mono select-all">
              {`DA-${createdPermit.agency_name ? createdPermit.agency_name.toUpperCase().substring(0,3) : 'UTI'}-${String(createdPermit.id).padStart(5, '0')}`}
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 space-y-2 text-xs text-left text-[#64748B]">
              <div className="flex justify-between">
                <span className="font-semibold">Project Title:</span>
                <span className="text-[#0F172A] font-semibold truncate max-w-[200px]">{createdPermit.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Work Category:</span>
                <span className="text-[#0F172A] font-semibold uppercase">{createdPermit.work_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Status Code:</span>
                <span className="text-green-700 font-bold uppercase">{createdPermit.status}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => handlePrintReceipt(createdPermit)}
                className="w-full rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 py-2.5 text-xs font-semibold text-[#0F766E] transition duration-200 shadow-sm"
              >
                Print Registration Receipt
              </button>
              <button
                onClick={() => navigate('/utility')}
                className="w-full rounded-lg bg-[#0F766E] hover:bg-[#115E59] py-2.5 text-xs font-semibold text-white transition duration-200 shadow-sm"
              >
                Go to Utility Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyPermit;
