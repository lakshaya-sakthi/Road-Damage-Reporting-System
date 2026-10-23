import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaFilter, FaExclamationTriangle, FaEye, FaTimes } from 'react-icons/fa';
import api from '../api/client';
import GoogleMapContainer from '../components/maps/GoogleMapContainer';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const DISTRICTS = [
  'Central District',
  'North Highway Corridor',
  'Downtown Metro',
  'East Industrial Belt'
];

const DamageMapPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Filters
  const [serviceArea, setServiceArea] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');

  const fetchMapReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 100 });
      if (serviceArea) params.append('serviceArea', serviceArea);
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapReports();
  }, [serviceArea, priority, status]);

  const getFullImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const criticalCount = reports.filter((r) => r.priority === 'Critical').length;

  return (
    <div>
      {/* Header & Metric Summary */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Geospatial Road Damage & Hazard Map</h4>
          <p className="text-muted small mb-0">
            Real-time GPS telemetry showing localized surface defects, active work crews, and severity distribution.
          </p>
        </div>

        <div className="d-flex align-items-center gap-3 mt-3 mt-md-0">
          <div className="text-end">
            <span className="small text-muted d-block">Active Map Markers</span>
            <strong className="h6 mb-0 text-dark">{reports.length} Hazards Plotted</strong>
          </div>
          <div className="text-end border-start ps-3">
            <span className="small text-muted d-block">Critical SLA Hazards</span>
            <strong className="h6 mb-0 text-danger">{criticalCount} Critical</strong>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rg-card p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <label className="form-label small text-muted mb-1">Service Area / District</label>
            <select
              className="form-select form-select-sm"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
            >
              <option value="">All Municipal Districts</option>
              {DISTRICTS.map((d, i) => (
                <option key={i} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small text-muted mb-1">Severity Filter</label>
            <select
              className="form-select form-select-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">All Severity Tiers</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small text-muted mb-1">Workflow Status</label>
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="review_required">Review Required</option>
              <option value="pending_assignment">Pending Assignment</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>

          <div className="col-md-2 text-end pt-md-3">
            <button
              className="btn btn-sm btn-rg-outline w-100"
              onClick={() => {
                setServiceArea('');
                setPriority('');
                setStatus('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Map & Preview Layout */}
      <div className="position-relative">
        <GoogleMapContainer
          center={{ lat: 13.0827, lng: 80.2707 }}
          zoom={13}
          markers={reports}
          onMarkerClick={(report) => setSelectedReport(report)}
          height="620px"
          interactive={true}
        />

        {/* Selected Marker Detail Drawer */}
        {selectedReport && (
          <div
            className="position-absolute bottom-0 start-0 m-3 bg-white rounded-3 shadow-lg border p-3"
            style={{ width: '380px', maxWidth: '90%', zIndex: 100 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
              <div>
                <span className="badge bg-light text-primary border font-monospace me-2">
                  {selectedReport.reportNumber}
                </span>
                <SeverityBadge severity={selectedReport.priority} />
              </div>
              <button
                className="btn btn-sm btn-light p-1 rounded-circle"
                onClick={() => setSelectedReport(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="d-flex gap-3 mb-3">
              <div
                className="rounded overflow-hidden bg-light border flex-shrink-0"
                style={{ width: 80, height: 80 }}
              >
                <img
                  src={getFullImgUrl(selectedReport.imageUrl)}
                  alt="Hazard"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="overflow-hidden">
                <strong className="d-block text-dark text-truncate small mb-1">
                  {selectedReport.title}
                </strong>
                <small className="text-muted d-block text-truncate mb-1">
                  {selectedReport.location?.address}
                </small>
                <StatusBadge status={selectedReport.status} />
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-2 border-top">
              <small className="text-muted">
                Confidence: {Math.round((selectedReport.aiAnalysis?.overallConfidence || 0) * 100)}%
              </small>
              <Link
                to={`/reports/${selectedReport._id}`}
                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              >
                <FaEye /> Open Report
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageMapPage;
