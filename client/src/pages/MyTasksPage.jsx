import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHardHat,
  FaCheck,
  FaTimes,
  FaPlay,
  FaCamera,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import api from '../api/client';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Reject Modal
  const [rejectTask, setRejectTask] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments/my');
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleAccept = async (assignmentId) => {
    try {
      setActionInProgress(true);
      await api.post(`/assignments/${assignmentId}/accept`);
      await fetchMyTasks();
    } catch (err) {
      alert('Accept failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionInProgress(false);
    }
  };

  const handleStartWork = async (assignmentId) => {
    try {
      setActionInProgress(true);
      await api.post(`/assignments/${assignmentId}/status`, {
        status: 'in_progress',
        note: 'Worker arrived on site with materials and initiated pavement repair.'
      });
      await fetchMyTasks();
    } catch (err) {
      alert('Start repair failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectTask || !rejectionReason.trim()) return;

    try {
      setActionInProgress(true);
      await api.post(`/assignments/${rejectTask._id}/reject`, {
        reason: rejectionReason
      });
      setRejectTask(null);
      setRejectionReason('');
      await fetchMyTasks();
    } catch (err) {
      alert('Reject failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionInProgress(false);
    }
  };

  const getFullImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">My Assigned Maintenance Jobs</h4>
          <p className="text-muted small mb-0">
            Field work orders allocated to your maintenance unit. Accept assignments, initiate on-site repairs, and upload completion photos.
          </p>
        </div>

        <div className="mt-3 mt-md-0">
          <span className="badge bg-warning text-dark px-3 py-2 fw-semibold">
            {tasks.filter((t) => ['assigned', 'accepted', 'in_progress', 'reopened'].includes(t.status)).length} Active Work Orders
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Loading assigned jobs...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rg-card text-center py-5">
          <FaHardHat className="text-muted mb-3" style={{ fontSize: '3rem' }} />
          <h6>No Jobs Currently Allocated</h6>
          <p className="text-muted small">You have no pending or active repair orders assigned to your crew.</p>
        </div>
      ) : (
        <div className="row g-4">
          {tasks.map((t) => {
            const report = t.reportId || {};
            const isAssigned = t.status === 'assigned';
            const isAccepted = t.status === 'accepted';
            const isInProgress = t.status === 'in_progress';
            const isReopened = t.status === 'reopened';
            const isCompleted = t.status === 'completed' || t.status === 'verified';

            return (
              <div key={t._id} className="col-lg-6">
                <div className="rg-card h-100 d-flex flex-column justify-content-between p-3">
                  <div>
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-primary border font-monospace">
                          {report.reportNumber}
                        </span>
                        <SeverityBadge severity={report.priority} />
                      </div>
                      <StatusBadge status={t.status} />
                    </div>

                    {/* Content & Photo */}
                    <div className="d-flex gap-3 mb-3">
                      <div
                        className="rounded overflow-hidden bg-light border flex-shrink-0"
                        style={{ width: 100, height: 100 }}
                      >
                        <img
                          src={getFullImgUrl(report.imageUrl)}
                          alt="Pavement Damage"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">{report.title}</h6>
                        <small className="text-muted d-block mb-1">
                          <FaMapMarkerAlt className="text-primary me-1" />
                          {report.location?.address}
                        </small>
                        <div className="small text-secondary">
                          Surface: <strong>{report.surfaceType}</strong> • Type:{' '}
                          <strong>{report.aiAnalysis?.primaryDamageType}</strong>
                        </div>
                      </div>
                    </div>

                    {/* SLA and Allocation info */}
                    <div className="p-2 px-3 bg-light rounded border mb-3 small d-flex align-items-center justify-content-between text-muted">
                      <span>
                        <FaClock className="me-1 text-primary" /> Target SLA:
                      </span>
                      <strong className="text-dark">
                        {new Date(t.targetCompletionDate).toLocaleDateString()}
                      </strong>
                    </div>

                    {isReopened && (
                      <div className="alert alert-danger py-2 px-3 small mb-3">
                        <strong>Supervisor Feedback:</strong> Ticket was reopened. Additional compaction or surface flush finish needed.
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                    <Link to={`/reports/${report._id}`} className="btn btn-sm btn-light border">
                      View Details
                    </Link>

                    <div className="d-flex gap-2">
                      {isAssigned && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => {
                              setRejectTask(t);
                              setRejectionReason('');
                            }}
                            disabled={actionInProgress}
                          >
                            <FaTimes /> Reject
                          </button>
                          <button
                            className="btn btn-sm btn-success d-flex align-items-center gap-1"
                            onClick={() => handleAccept(t._id)}
                            disabled={actionInProgress}
                          >
                            <FaCheck /> Accept Job
                          </button>
                        </>
                      )}

                      {(isAccepted || isReopened) && (
                        <button
                          className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
                          onClick={() => handleStartWork(t._id)}
                          disabled={actionInProgress}
                        >
                          <FaPlay /> Start On-Site Repair
                        </button>
                      )}

                      {isInProgress && (
                        <Link
                          to={`/tasks/${t._id}/progress`}
                          className="btn btn-sm btn-warning text-dark fw-semibold d-flex align-items-center gap-1 shadow-sm"
                        >
                          <FaCamera /> Submit After-Repair Evidence
                        </Link>
                      )}

                      {isCompleted && (
                        <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                          <FaCheck /> Awaiting Supervisor Sign-off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Assignment Modal */}
      {rejectTask && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1200 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleRejectSubmit}>
                <div className="modal-header bg-light border-bottom">
                  <h6 className="modal-title fw-bold">Reject Assignment #{rejectTask.reportId?.reportNumber}</h6>
                  <button type="button" className="btn-close" onClick={() => setRejectTask(null)} />
                </div>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Rejecting this job will decrement your active workload and return the report to the Unassigned Queue for immediate supervisor reassignment.
                  </p>
                  <label className="form-label small fw-semibold text-secondary">
                    Reason for Job Rejection (Mandatory)
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="e.g. Missing specialized heavy machinery, inaccessible roadway due to flooding, outside crew expertise..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setRejectTask(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-danger"
                    disabled={actionInProgress || !rejectionReason.trim()}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
