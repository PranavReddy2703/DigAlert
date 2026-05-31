import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HyderabadMap from '../../components/HyderabadMap';
import { complaintsAPI, permitsAPI } from '../../utils/api';
import { MapPin, AlertCircle, Camera, CheckCircle } from 'lucide-react';

const FileComplaint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // States
  const [citizenName, setCitizenName] = useState('');
  const [complaintType, setComplaintType] = useState('OPEN_TRENCH');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  const [permits, setPermits] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing permits to show on complaint map
  useEffect(() => {
    const loadPermits = async () => {
      try {
        const data = await permitsAPI.list();
        setPermits(data);
      } catch (err) {
        console.error("Failed to load permits", err);
      }
    };
    loadPermits();

    // Check if redirecting from a specific permit
    if (location.state?.permitId) {
      setDescription(`Reporting issue with excavation project permit #${location.state.permitId}: `);
    }
  }, [location.state]);

  const handlePlaceCoordinate = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setError('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    } else {
      setPhotoPreview('');
    }
  };

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!latitude || !longitude) {
      setError('CRITICAL: Please click on the Hyderabad map to pinpoint the exact location of the hazard.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('citizen_name', citizenName || 'Anonymous');
      formData.append('complaint_type', complaintType);
      formData.append('description', description);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await complaintsAPI.create(formData);
      
      setTrackingId(response.id);
      setIsSuccess(true);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto glass-panel rounded-2xl p-8 border border-gray-800 text-center space-y-6 shadow-glass my-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/40 text-primaryEmerald border border-emerald-900/30 emerald-glow">
          <CheckCircle className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-wide">Complaint Logged Successfully!</h2>
          <p className="text-gray-400 text-sm">
            Thank you for helping keep Hyderabad safe. Your report has been registered on the central control grid.
          </p>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-1">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Unique Complaint Tracking ID</p>
          <p className="text-2xl font-extrabold text-primaryAqua tracking-widest font-mono">#{trackingId}</p>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Our **Geospatial Proximity Router** has scanned active permits around your pin coordinates. If an active utility digging is found within 20m, the complaint has been **automatically linked and dispatched** directly to their ops manager.
        </p>

        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={() => navigate('/citizen/track', { state: { complaintId: trackingId } })}
            className="rounded-xl bg-gradient-to-r from-primaryAqua to-primaryEmerald px-5 py-3 text-xs font-bold text-black hover:opacity-90 shadow-aquaGlow transition duration-300"
          >
            Track Status Timeline
          </button>
          <button
            onClick={() => navigate('/citizen')}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 px-5 py-3 text-xs font-bold text-gray-300 transition duration-300"
          >
            Return to Active Grid
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-wide">Report Excavation Hazard / Complaint</h2>
        <p className="text-sm text-gray-400 mt-1">
          Pinpoint open trenches, unsafe barricades, un-restored roads, or traffic hazards. DigAlert routes your ticket directly to the responsible utility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Step 1: Map Picker */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between glass-panel rounded-xl px-4 py-3 border border-gray-800">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primaryAqua animate-bounce" />
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wide">Step 1: Pinpoint Site Location on Map</span>
            </div>
            {latitude ? (
              <span className="text-[10px] bg-emerald-950/40 text-primaryEmerald px-2 py-0.5 rounded border border-emerald-900/30 font-semibold font-mono">
                Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
              </span>
            ) : (
              <span className="text-[10px] bg-red-950/40 text-alertRed px-2 py-0.5 rounded border border-red-900/30 font-semibold uppercase animate-pulse">
                Click map to select
              </span>
            )}
          </div>

          <HyderabadMap
            permits={permits}
            isPlacingComplaint={true}
            complaintCoordinate={latitude ? { lat: latitude, lng: longitude } : null}
            setComplaintCoordinate={handlePlaceCoordinate}
          />
        </div>

        {/* Step 2: Form submission */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-gray-800 space-y-4">
          <span className="text-[10px] font-bold text-primaryAqua uppercase tracking-widest">Step 2: Enter Complaint Specifications</span>
          
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-xs font-semibold text-alertRed red-glow">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="Submit Anonymously"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hazard Type</label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300"
              >
                <option value="OPEN_TRENCH">Open Trench (No covering)</option>
                <option value="UNSAFE_BARRICADING">Unsafe / Missing Barricading</option>
                <option value="ROAD_NOT_RESTORED">Road Not Restored (Tarring missing)</option>
                <option value="ABANDONED_WORK">Abandoned Digging Debris</option>
                <option value="WATER_LEAKAGE">Water Line Pipeline Leakage</option>
                <option value="TRAFFIC_OBSTRUCTION">Severe Traffic Obstruction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hazard Description</label>
              <textarea
                placeholder="Please describe what is unsafe. Mention landmarks if helpful (e.g. In front of metro pillar 15...)"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300 leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Upload Site Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primaryAqua transition duration-300"
              />
              {photoPreview && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                  <img
                    src={photoPreview}
                    alt="Selected site proof"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-red-600 to-alertRed py-3 text-xs font-bold text-white hover:opacity-90 shadow-redGlow transition duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
              ) : (
                'File Central Safety Complaint'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileComplaint;
