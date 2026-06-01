import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HyderabadMap from '../../components/HyderabadMap';
import { complaintsAPI, permitsAPI } from '../../utils/api';
import { MapPin, AlertCircle, Camera, CheckCircle, Upload } from 'lucide-react';

const FileComplaint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  
  // States
  const [citizenName, setCitizenName] = useState('');
  const [complaintType, setComplaintType] = useState('WATER');
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
      setError('Please click on the Hyderabad map to pinpoint the exact location of the hazard.');
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
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-card text-center space-y-6 my-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
          <CheckCircle className="h-8 w-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-wide">Complaint Logged Successfully!</h2>
          <p className="text-[#64748B] text-sm">
            Thank you for helping keep Hyderabad safe. Your report has been registered on the central control grid.
          </p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-1">
          <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">Unique Complaint Tracking ID</p>
          <p className="text-2xl font-extrabold text-[#0F766E] tracking-widest font-mono">#{trackingId}</p>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Our Geospatial Proximity Router has scanned active permits around your pin coordinates. If an active utility digging is found within 20m, the complaint has been automatically linked and dispatched directly to their ops manager.
        </p>

        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={() => navigate('/citizen/track', { state: { complaintId: trackingId } })}
            className="rounded-xl bg-[#0F766E] hover:bg-[#115E59] px-5 py-3 text-xs font-bold text-white shadow-sm transition duration-200"
          >
            Track Status Timeline
          </button>
          <button
            onClick={() => navigate('/citizen')}
            className="rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] px-5 py-3 text-xs font-bold text-[#64748B] transition duration-200"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-wide">File Complaint</h2>
        <p className="text-sm text-[#64748B] mt-1">
          Report hazards, road issues, utility complaints, and public safety concerns. DigAlert routes your ticket directly to the responsible utility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Step 1: Map Picker */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0F766E]" />
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">Step 1: Pinpoint Site Location on Map</span>
            </div>
            {latitude ? (
              <span className="text-[10px] bg-[#F0FDF4] text-[#16A34A] px-2 py-0.5 rounded border border-[#BBF7D0] font-semibold font-mono">
                Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
              </span>
            ) : (
              <span className="text-[10px] bg-[#FEF2F2] text-[#DC2626] px-2 py-0.5 rounded border border-[#FECACA] font-semibold uppercase">
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
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-card space-y-4">
          <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-widest">Step 2: Enter Complaint Details</span>
          
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs font-semibold text-[#DC2626]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="Submit Anonymously"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Hazard Type</label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition"
              >
                <option value="WATER">Water Supply & Sewerage Infrastructure</option>
                <option value="TELECOM">Telecommunications & Fiber Optic Grid</option>
                <option value="ELECTRICITY">Power Grid & Electrical Distribution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Hazard Description</label>
              <textarea
                placeholder="Please describe what is unsafe. Mention landmarks if helpful (e.g. In front of metro pillar 15...)"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#E2E8F0] px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1.5">Upload Site Photo (Optional)</label>

              {/* Hidden native input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {/* Styled green button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] active:scale-95 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {photoFile ? 'Change Photo' : 'Upload Site Photo'}
                </button>
                {photoFile && (
                  <span className="text-[11px] text-[#0F766E] font-semibold bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full truncate max-w-[160px]">
                    {photoFile.name}
                  </span>
                )}
              </div>

              {photoPreview && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-[#E2E8F0]">
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
              className="w-full rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] py-3 text-xs font-bold text-white shadow-sm transition duration-200 flex items-center justify-center gap-2"
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
