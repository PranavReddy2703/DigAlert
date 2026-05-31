import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom styling icons for different complaint types
const getComplaintIcon = (type) => {
  let color = '#DC2626'; // Red default
  if (type === 'WATER_LEAKAGE') color = '#0284C7';
  if (type === 'TRAFFIC_OBSTRUCTION') color = '#D97706';
  
  return L.divIcon({
    html: `<span style="background-color: ${color}; width: 12px; height: 12px; display: block; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3)"></span>`,
    className: 'custom-complaint-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

// WKT String Parsers (WKT coordinate lists are "lng lat", Leaflet expects "[lat, lng]")
export const parseWKTToCoordinates = (wktStr) => {
  if (!wktStr) return [];
  try {
    if (wktStr.toUpperCase().startsWith('LINESTRING')) {
      const coordSection = wktStr.substring(wktStr.indexOf('(') + 1, wktStr.indexOf(')'));
      const points = coordSection.split(',');
      return points.map(p => {
        const parts = p.trim().split(/\s+/).map(Number);
        return [parts[1], parts[0]]; // [lat, lng]
      });
    }
    if (wktStr.toUpperCase().startsWith('POINT')) {
      const coordSection = wktStr.substring(wktStr.indexOf('(') + 1, wktStr.indexOf(')'));
      const parts = coordSection.trim().split(/\s+/).map(Number);
      return [parts[1], parts[0]]; // [lat, lng]
    }
  } catch (e) {
    console.error("WKT Parsing Error:", e);
  }
  return [];
};

// Leaflet event handler to support drawing polylines (click-to-plot segment)
const MapDrawingEvents = ({ isDrawing, points, onChangePoints }) => {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      const { lat, lng } = e.latlng;
      const newPoints = [...points, [lat, lng]];
      onChangePoints(newPoints);
    },
  });
  return null;
};

// Leaflet event handler to support placing a complaint marker by clicking
const MapComplaintClickEvents = ({ isPlacing, onPlaceCoordinate }) => {
  useMapEvents({
    click(e) {
      if (!isPlacing) return;
      const { lat, lng } = e.latlng;
      onPlaceCoordinate(lat, lng);
    }
  });
  return null;
};

const HyderabadMap = ({
  permits = [],
  complaints = [],
  isDrawing = false,
  drawingPoints = [],
  setDrawingPoints = () => {},
  isPlacingComplaint = false,
  complaintCoordinate = null,
  setComplaintCoordinate = () => {},
  onSelectPermit = () => {},
  onSelectComplaint = () => {}
}) => {
  const hyderabadCenter = [17.3850, 78.4867];
  
  // Professional status color mapper
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return '#16A34A';
      case 'IN_PROGRESS': return '#0284C7';
      case 'CLASH_DETECTED': return '#DC2626';
      case 'PENDING_REVIEW': return '#D97706';
      case 'EMERGENCY': return '#EA580C';
      case 'COMPLETED': return '#64748B';
      default: return '#3B82F6';
    }
  };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-card border border-[#E2E8F0]">
      <MapContainer
        center={hyderabadCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map Click Drawing Listeners */}
        <MapDrawingEvents 
          isDrawing={isDrawing} 
          points={drawingPoints} 
          onChangePoints={setDrawingPoints} 
        />
        <MapComplaintClickEvents 
          isPlacing={isPlacingComplaint} 
          onPlaceCoordinate={setComplaintCoordinate} 
        />

        {/* Draw active/completed Permits (Polylines) */}
        {permits.map((permit) => {
          const coords = parseWKTToCoordinates(permit.wkt_geometry);
          if (coords.length < 2) return null;
          
          const color = getStatusColor(permit.status);
          
          return (
            <Polyline
              key={permit.id}
              positions={coords}
              pathOptions={{
                color: color,
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                dashArray: permit.status === 'CLASH_DETECTED' ? '12 8' : undefined
              }}
              eventHandlers={{
                click: () => onSelectPermit(permit)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full mb-2" style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}30` }}>
                    {permit.status}
                  </span>
                  <h3 className="font-bold text-sm text-[#0F172A] mb-1">{permit.title}</h3>
                  <p className="text-xs text-[#64748B] mb-1">Utility: {permit.agency_name}</p>
                  <p className="text-[10px] text-[#94A3B8]">Dates: {permit.start_date} to {permit.end_date}</p>
                  <p className="text-[10px] text-[#94A3B8]">Excavation Depth: {permit.depth_meters}m</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Current User Drawing Polyline Feedback */}
        {isDrawing && drawingPoints.length > 0 && (
          <>
            <Polyline
              positions={drawingPoints}
              pathOptions={{
                color: '#0F766E',
                weight: 4,
                opacity: 0.9,
                dashArray: '5 5'
              }}
            />
            {drawingPoints.map((pt, idx) => (
              <Marker key={idx} position={pt} />
            ))}
          </>
        )}

        {/* Citizens Complaints Markers */}
        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[complaint.latitude, complaint.longitude]}
            icon={getComplaintIcon(complaint.complaint_type)}
            eventHandlers={{
              click: () => onSelectComplaint(complaint)
            }}
          >
            <Popup>
              <div className="p-1 min-w-[180px]">
                <span className="inline-block text-[9px] uppercase tracking-wider font-extrabold bg-[#FEF2F2] text-[#DC2626] px-2 py-0.5 rounded-full mb-2 border border-[#FECACA]">
                  {complaint.complaint_type.replace('_', ' ')}
                </span>
                <h4 className="font-bold text-xs text-[#0F172A]">{complaint.citizen_name}</h4>
                <p className="text-xs text-[#64748B] my-1">{complaint.description}</p>
                <p className="text-[10px] text-[#94A3B8]">Status: <span className="font-semibold text-[#0F766E]">{complaint.status}</span></p>
                {complaint.agency_assigned && (
                  <p className="text-[10px] text-[#94A3B8]">Assigned To: <span className="font-semibold text-[#115E59]">{complaint.agency_assigned}</span></p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Placement Marker for citizen complaint */}
        {isPlacingComplaint && complaintCoordinate && (
          <Marker position={[complaintCoordinate.lat, complaintCoordinate.lng]}>
            <Popup>
              <span className="text-xs font-semibold text-[#0F172A]">Selected Location to report</span>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default HyderabadMap;
