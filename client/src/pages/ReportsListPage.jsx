import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaPlusCircle, FaRoad, FaFileDownload } from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const ReportsListPage = () => {
  const { canUpload, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [surfaceType, setSurfaceType] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  const fetchReports = useCallback(async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 15
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (surfaceType) params.append('surfaceType', surfaceType);
      if (serviceArea) params.append('serviceArea', serviceArea);

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.data.success) {
        setReports(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, surfaceType, serviceArea]);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports(1);
  };

  const getFullImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Road Damage Reports Registry</h4>
          <p className="text-muted small mb-0">
            Comprehensive audit inventory of surface pavement hazards, classifications, and status workflows.
          </p>
        </div>

        {canUpload && (
          <Link to="/reports/new" className="btn btn-rg-primary btn-sm d-flex align-items-center gap-1 shadow-sm mt-3 mt-sm-0">
            <FaPlusCircle /> Report New Damage
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="rg-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-lg-4 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search report #, street name, damage type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="detected">Detected</option>
                <option value="review_required">Review Required</option>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified & Closed</option>
                <option value="unassigned">Unassigned</option>
                <option value="reopened">Reopened</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select form-select-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Surface Type */}
            <div className="col-lg-2 col-md-4 col-6">
              <select
                className="form-select form-select-sm"
                value={surfaceType}
                onChange={(e) => setSurfaceType(e.target.value)}
              >
                <option value="">All Surfaces</option>
                <option value="Asphalt">Asphalt</option>
                <option value="Concrete">Concrete</option>
                <option value="Composite">Composite</option>
                <option value="Gravel">Gravel</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="col-lg-2 col-md-4 col-6 text-end">
              <button type="submit" className="btn btn-sm btn-rg-outline w-100">
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Reports Table Card */}
      <div className="rg-card p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <span className="ms-2 small text-muted">Retrieving reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="rg-empty-state">
            <FaRoad className="rg-empty-icon" />
            <h6>No Damage Reports Found</h6>
            <p className="small">No records match the current search filters or criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="rg-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Report #</th>
                  <th>Location & District</th>
                  <th>Damage Classification</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned Crew</th>
                  <th>Logged Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td style={{ width: 60 }}>
                      <div
                        className="rounded overflow-hidden bg-light border d-flex align-items-center justify-content-center"
                        style={{ width: 44, height: 44 }}
                      >
                        <img
                          src={getFullImgUrl(r.imageUrl)}
                          alt="Thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <Link to={`/reports/${r._id}`} className="fw-bold text-primary text-decoration-none">
                        {r.reportNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: 220 }}>
                        {r.location?.address}
                      </div>
                      <small className="text-muted">{r.location?.serviceArea}</small>
                    </td>
                    <td>
                      <span className="small text-dark fw-medium d-block">
                        {r.aiAnalysis?.primaryDamageType || 'Surface Anomaly'}
                      </span>
                      <small className="text-muted">{r.surfaceType}</small>
                    </td>
                    <td>
                      <SeverityBadge severity={r.priority} />
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      {r.currentAssignment?.workerId ? (
                        <span className="small text-dark fw-medium">
                          {r.currentAssignment.workerId.name}
                        </span>
                      ) : (
                        <span className="small text-muted fst-italic">Unassigned</span>
                      )}
                    </td>
                    <td className="small text-muted">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/reports/${r._id}`} className="btn btn-sm btn-light border p-1 px-2">
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-3 border-top d-flex align-items-center justify-content-between bg-light">
            <small className="text-muted">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total reports)
            </small>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchReports(pagination.page - 1)}
              >
                &larr; Prev
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchReports(pagination.page + 1)}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsListPage;
