import React, { useEffect, useState } from 'react';
import { FaHistory, FaSearch, FaShieldAlt, FaEye } from 'react-icons/fa';
import api from '../api/client';

const AuditHistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageToLoad,
        limit: 25
      });
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entityType', entityFilter);

      const res = await api.get(`/audit?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">System Compliance & Audit History</h4>
          <p className="text-muted small mb-0">
            Immutable, timestamped compliance log of authentication, severity modifications, automated allocations, and supervisor verifications.
          </p>
        </div>

        <div className="mt-3 mt-md-0">
          <span className="badge bg-secondary px-3 py-2">
            {pagination.total} Logged System Events
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rg-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by action keyword (e.g. ALLOCATION, LOGIN, REVIEW)..."
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="">All Entity Types</option>
                <option value="Report">Report</option>
                <option value="Assignment">Assignment</option>
                <option value="Evidence">Evidence</option>
                <option value="User">User</option>
                <option value="System">System</option>
              </select>
            </div>

            <div className="col-md-2 text-end">
              <button type="submit" className="btn btn-sm btn-rg-outline w-100">
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rg-card p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">Loading audit events...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="rg-empty-state">
            <FaShieldAlt className="rg-empty-icon" />
            <h6>No Audit Records Found</h6>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="rg-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Trigger</th>
                  <th>Entity Type</th>
                  <th>Entity Reference</th>
                  <th>Actor Identity</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="small text-muted font-monospace" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="font-monospace small text-muted">
                      {log.entityId}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark small">{log.performedByName}</div>
                      <small className="text-muted text-capitalize">{log.performedByRole}</small>
                    </td>
                    <td className="small font-monospace text-muted">{log.ipAddress || '127.0.0.1'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-light border p-1 px-2"
                        onClick={() => setSelectedLog(log)}
                        title="View Event Metadata"
                      >
                        <FaEye />
                      </button>
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
              Page {pagination.page} of {pagination.pages}
            </small>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                &larr; Prev
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1200 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom">
                <h6 className="modal-title fw-bold">Event Audit Detail: {selectedLog.action}</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedLog(null)} />
              </div>
              <div className="modal-body p-3">
                <div className="small text-muted mb-2">
                  <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}
                </div>
                <div className="small text-muted mb-3">
                  <strong>Actor:</strong> {selectedLog.performedByName} ({selectedLog.performedByRole})
                </div>
                <h6 className="small fw-bold text-dark mb-1">Payload Metadata:</h6>
                <pre
                  className="bg-dark text-light p-3 rounded font-monospace small mb-0"
                  style={{ maxHeight: '250px', overflowY: 'auto' }}
                >
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHistoryPage;
