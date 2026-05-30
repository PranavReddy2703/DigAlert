import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HyderabadMap from '../../components/HyderabadMap';
import { permitsAPI } from '../../utils/api';
import { MapPin, Calendar, ShieldAlert, CheckCircle, Info, Award, HelpCircle } from 'lucide-react';

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

  const handleFinalSubmit = async () => {
    setSubmitLoading(true);
    setError('');
    try {
      const wkt = getWKTString();
      await permitsAPI.create({
        title,
        description,
        wkt_geometry: wkt,
        depth_meters: parseFloat(depth),
        work_type: workType,
        start_date: startDate,
        end_date: endDate
      });
      navigate('/utility');
    } catch (err) {
      setError('Permit creation failed. Please verify submission data.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wizard Step Timeline */}
      <div className="glass-panel rounded-2xl p-5 border border-gray-800 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
        <span className={step === 1 ? 'text-primaryAqua border-b border-primaryAqua pb-1' : ''}>1. Specifics</span>
        <span className={step === 2 ? 'text-primaryAqua border-b border-primaryAqua pb-1' : ''}>2. Plot Path</span>
        <span className={step === 3 ? 'text-primaryAqua border-b border-primaryAqua pb-1' : ''}>3. Schedule</span>
        <span className={step === 4 ? 'text-primaryAqua border-b border-primaryAqua pb-1' : ''}>4. Clash Grid Check</span>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs font-semibold text-alertRed red-glow">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: Details */}
      {step === 1 && (
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Step 1: Enter Project Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Permit Title / Work Name</label>
              <input
                type="text"
                placeholder="e.g. Laying 11KV power cables along Gachibowli Ring Road Link"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description (Optional)</label>
              <textarea
                placeholder="Outline details, target utility buildings, or specific road margins..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300 leading-relaxed"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Excavation Depth (Meters)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Work Category</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300 font-bold"
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
              className="rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
            >
              Continue to Plotting Route
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Map Route Drawing */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primaryAqua animate-pulse" />
              <p className="text-xs text-gray-300 font-medium">
                Instructions: **Click along the road path** on the Hyderabad map to plot your excavation segment nodes.
              </p>
            </div>
            <button
              onClick={() => setDrawingPoints([])}
              className="rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 px-3 py-1.5 text-[10px] font-bold text-alertRed transition duration-300"
            >
              Clear Route
            </button>
          </div>

          <HyderabadMap
            isDrawing={true}
            drawingPoints={drawingPoints}
            setDrawingPoints={setDrawingPoints}
          />

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-6 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition duration-300"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
            >
              Confirm Excavation Segment
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Dates */}
      {step === 3 && (
        <div className="glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Step 3: Schedule Project Window</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Planned Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Estimated Completion Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 pl-10 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-6 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition duration-300"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
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
            <div className="glass-panel rounded-2xl p-10 border border-gray-800 flex flex-col items-center justify-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-primaryAqua border-gray-850"></div>
              <h4 className="text-white font-bold">Scanning GHMC Geospatial Registry...</h4>
              <p className="text-xs text-gray-500">Checking spatial buffers, temporal overlaps, depths, and resurfaced locked segments.</p>
            </div>
          )}

          {/* Clash scan completed */}
          {hasChecked && (
            <div className="space-y-6">
              {precheckClashes.length === 0 ? (
                /* 4A: NO CLASHES FOUND */
                <div className="glass-panel rounded-2xl p-8 border border-gray-800 text-center space-y-4 border-l-4 border-l-primaryEmerald">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-primaryEmerald border border-emerald-900/30 emerald-glow">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">Geospatial Conflict Check Passed</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                      GHMC lock-in check verified. No overlapping utility permits, depth collisions, or recently resurfaced roads are registered on this segment.
                    </p>
                  </div>
                </div>
              ) : (
                /* 4B: CLASHES DETECTED */
                <div className="space-y-4">
                  <div className="glass-panel rounded-2xl p-6 border border-gray-800 border-l-4 border-l-alertRed flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/40 text-alertRed border border-red-900/30 shrink-0">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">Spatial Conflicts Flagged ({precheckClashes.length})</h3>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Our spatial algorithms detected overlapping works or policy violations on this segment. Review conflict details below.
                      </p>
                    </div>
                  </div>

                  {/* Clash items lists */}
                  <div className="space-y-3">
                    {precheckClashes.map((clash, idx) => {
                      const isRoadLock = clash.conflicting_permit_id < 0;
                      return (
                        <div key={idx} className={`rounded-xl border p-5 space-y-3 ${
                          isRoadLock 
                            ? 'bg-red-950/10 border-red-900/30' 
                            : 'bg-yellow-950/10 border-yellow-900/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isRoadLock ? 'bg-red-950/60 text-alertRed' : 'bg-yellow-950/60 text-warningYellow'
                            }`}>
                              {isRoadLock ? 'GHMC Policy Lockout' : 'Utility Clash Flagged'}
                            </span>
                            {!isRoadLock && (
                              <span className="text-[10px] text-gray-500 font-semibold font-mono">
                                Overlap Ratio: {clash.overlap_percentage}%
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-white">{clash.conflicting_title}</h4>
                          <p className="text-xs text-gray-300 leading-relaxed font-semibold">{clash.recommendation_text}</p>

                          {!isRoadLock && clash.estimated_savings > 0 && (
                            <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3 mt-2 text-xs">
                              <Award className="h-5 w-5 text-primaryEmerald shrink-0 animate-pulse" />
                              <p className="text-gray-300">
                                Joint excavation Coordination (Co-digging) splits restoration costs. Estimated savings: <span className="font-extrabold text-primaryEmerald font-mono">₹{clash.estimated_savings.toLocaleString()} INR</span>.
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
                  className="rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-6 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition duration-300"
                >
                  Back (Modify Schedule / Path)
                </button>
                
                {/* Allow submission if emergency or if user understands conflict (status will go to CLASH_DETECTED or pending review) */}
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitLoading}
                  className={`rounded-xl px-6 py-2.5 text-xs font-bold text-black hover:opacity-90 transition duration-300 shadow-aquaGlow flex items-center gap-2 ${
                    precheckClashes.some(c => c.conflicting_permit_id < 0)
                      ? 'bg-red-500 opacity-60 cursor-not-allowed hover:opacity-60 text-white' // completely block resurfaced lock
                      : 'bg-gradient-to-r from-primaryAqua to-primaryEmerald'
                  }`}
                >
                  {submitLoading ? 'Registering...' : 'Register Excavation Permit'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplyPermit;
