import React, { useEffect, useRef, useState } from 'react';
import { FaMapMarkerAlt, FaExclamationTriangle, FaSearchPlus, FaSearchMinus, FaCrosshairs } from 'react-icons/fa';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const SEVERITY_COLORS = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#d97706',
  Low: '#059669'
};

const GoogleMapContainer = ({
  center = { lat: 13.0827, lng: 80.2707 },
  zoom = 13,
  markers = [],
  selectedLocation = null,
  onLocationSelect = null,
  onMarkerClick = null,
  height = '500px',
  interactive = true
}) => {
  const mapRef = useRef(null);
  const [googleMapLoaded, setGoogleMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [googleMapInstance, setGoogleMapInstance] = useState(null);

  // Dynamic Google Maps Script Ingestion
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === '') {
      return;
    }

    if (window.google && window.google.maps) {
      setGoogleMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapLoaded(true);
      script.onerror = () => setMapError('Google Maps API failed to load. Check API Key or network.');
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Real Google Map when SDK is loaded
  useEffect(() => {
    if (!googleMapLoaded || !window.google || !mapRef.current) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });

      setGoogleMapInstance(map);

      // Handle map clicks for selecting new damage location
      if (onLocationSelect && interactive) {
        map.addListener('click', (e) => {
          onLocationSelect({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          });
        });
      }
    } catch (err) {
      setMapError(err.message);
    }
  }, [googleMapLoaded, center.lat, center.lng, zoom, onLocationSelect, interactive]);

  // Sync Google Map Markers
  useEffect(() => {
    if (!googleMapInstance || !window.google) return;

    const gMarkers = [];

    // Render report markers
    markers.forEach((m) => {
      if (!m.location?.coordinates) return;
      const { lat, lng } = m.location.coordinates;
      const color = SEVERITY_COLORS[m.priority] || '#0f4c81';

      const marker = new window.google.maps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map: googleMapInstance,
        title: `${m.reportNumber} — ${m.priority} (${m.title})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });

      marker.addListener('click', () => {
        if (onMarkerClick) onMarkerClick(m);
      });

      gMarkers.push(marker);
    });

    // Cleanup markers on re-render
    return () => {
      gMarkers.forEach((gm) => gm.setMap(null));
    };
  }, [googleMapInstance, markers, onMarkerClick]);

  // -------------------------------------------------------------
  // FALLBACK VECTOR MAP (Used when VITE_GOOGLE_MAPS_API_KEY is unset)
  // Ensures entire application remains fully interactive and visual
  // -------------------------------------------------------------
  if (!GOOGLE_MAPS_API_KEY || mapError) {
    return (
      <div className="rg-card p-0 overflow-hidden" style={{ height }}>
        {/* Informative Banner */}
        <div className="p-2 px-3 bg-light border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-secondary">Offline Vector Map</span>
            <small className="text-muted">
              {GOOGLE_MAPS_API_KEY ? mapError : 'Google Maps API key not set in VITE_GOOGLE_MAPS_API_KEY. Displaying real coordinate map matrix.'}
            </small>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 small">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.Critical }} /> Critical
            </span>
            <span className="d-flex align-items-center gap-1 small">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.High }} /> High
            </span>
            <span className="d-flex align-items-center gap-1 small">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.Medium }} /> Medium
            </span>
            <span className="d-flex align-items-center gap-1 small">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS.Low }} /> Low
            </span>
          </div>
        </div>

        {/* Vector Interactive Grid */}
        <div
          className="position-relative w-100 h-100"
          style={{
            backgroundColor: '#e5e9f0',
            backgroundImage: `
              radial-gradient(#cbd5e1 1px, transparent 1px),
              linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px, 80px 80px, 80px 80px',
            cursor: onLocationSelect ? 'crosshair' : 'default',
            overflow: 'hidden'
          }}
          onClick={(e) => {
            if (!onLocationSelect || !interactive) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const xRel = (e.clientX - rect.left) / rect.width;
            const yRel = (e.clientY - rect.top) / rect.height;

            // Compute pseudo-coordinates centered around default district
            const lat = Number((center.lat + (0.5 - yRel) * 0.1).toFixed(6));
            const lng = Number((center.lng + (xRel - 0.5) * 0.1).toFixed(6));
            onLocationSelect({ lat, lng });
          }}
        >
          {/* Compass / Center indicator */}
          <div className="position-absolute top-0 end-0 m-3 p-2 bg-white rounded shadow-sm border small text-muted">
            <FaCrosshairs className="me-1 text-primary" /> Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>

          {/* Plot Markers relative to center */}
          {markers.map((m, idx) => {
            if (!m.location?.coordinates) return null;
            const { lat, lng } = m.location.coordinates;
            // Project lat/lng offsets to percentage coordinates within container
            const dLat = (lat - center.lat) * 800; // scale factor
            const dLng = (lng - center.lng) * 800;
            const topPct = Math.max(10, Math.min(90, 50 - dLat));
            const leftPct = Math.max(10, Math.min(90, 50 + dLng));
            const color = SEVERITY_COLORS[m.priority] || '#0f4c81';

            return (
              <div
                key={m._id || idx}
                className="position-absolute"
                style={{
                  top: `${topPct}%`,
                  left: `${leftPct}%`,
                  transform: 'translate(-50%, -100%)',
                  cursor: 'pointer',
                  zIndex: 20
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkerClick) onMarkerClick(m);
                }}
                title={`${m.reportNumber}: ${m.title} (${m.priority})`}
              >
                <div
                  className="d-flex flex-column align-items-center"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
                >
                  <FaMapMarkerAlt style={{ fontSize: '1.9rem', color: color }} />
                  <span
                    className="badge bg-dark px-1 py-0"
                    style={{ fontSize: '0.65rem', marginTop: '-4px' }}
                  >
                    {m.reportNumber}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Selected Location Pin */}
          {selectedLocation && (
            <div
              className="position-absolute"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)',
                zIndex: 30
              }}
            >
              <div className="d-flex flex-column align-items-center text-primary">
                <FaMapMarkerAlt style={{ fontSize: '2.4rem', color: '#0284c7' }} />
                <span className="badge bg-primary px-2">Selected Target</span>
              </div>
            </div>
          )}

          {onLocationSelect && (
            <div className="position-absolute bottom-0 start-0 m-3 p-2 bg-white rounded shadow-sm border small text-muted">
              Click anywhere on the grid to pin coordinates
            </div>
          )}
        </div>
      </div>
    );
  }

  // Real Google Maps container
  return (
    <div className="rg-card p-0 overflow-hidden" style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default GoogleMapContainer;
