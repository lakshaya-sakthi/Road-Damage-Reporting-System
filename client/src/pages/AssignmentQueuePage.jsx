import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTasks,
  FaRobot,
  FaUserCheck,
  FaExclamationCircle,
  FaCheckCircle,
  FaRoad,
  FaMapMarkerAlt
} from 'react-icons/fa';
import api from '../api/client';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';

const AssignmentQueuePage = () => {
  const [queueReports, setQueueReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocatingId, setAllocatingId] = useState(null);

  // Manual Dispatch Modal
  const [manualReport, setManualReport] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      // Fetch reports in pending_assignment or unassigned
      const res = await api.get('/reports?status=pending_assignment&limit=50');
      const unassignedRes = await api.get('/reports?status=unassigned&limit=50');

      let combined = [];
      if (res.data.success) combined = combined.concat(res.data.data);
      if (unassignedRes.data.success) combined = combined.concat(unassignedRes.data.data);
      setQueueReports(combined);

      // Fetch workers for manual override
      const wRes = await api.get('/users/workers');
      if (wRes.data.success) {
        setWorkers(wRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load assignment queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  const handleAutoAssign = async (reportId) => {
    try {
      setAllocatingId(reportId);
      const res = await api.post(`/reports/${reportId}/auto-assign`);
      alert(res.data.message || 'Worker allocated successfully.');
      await fetchQueueData();
    } catch (err) {
      alert('Allocation Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAllocatingId(null);
    }
  };

  const handleManualDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!manualReport || !selectedWorkerId) return;

    try {
      setDispatching(true);
      await api.post(`/reports/${manualReport._id}/manual-assign`, {
        workerId: selectedWorkerId,
        notes: dispatchNotes
      });
      setManualReport(null);
      setSelectedWorkerId('');
      setDispatchNotes('');
      await fetchQueueData();
    } catch (err) {
      alert('Manual Dispatch Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Automatic Worker Allocation Queue</h4>
          <p className="text-muted small mb-0">
            Real-time algorithmic dispatch queue based on 50% Proximity, 30% Workload Capacity, and 20% Skill Match.
          </p>
        </div>

        <div className="mt-3 mt-md-0">
          <span className="badge bg-primary px-3 py-2">
            {queueReports.length} Reports Ready for Dispatch
          </span>
        </div>
      </div>

      {/* Allocation Algorithm Criteria Info */}
      <div className="rg-card bg-light p-3 mb-4">
        <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
          <FaRobot className="text-primary" /> Multi-Factor Dispatch Criteria
        </h6>
        <div className="row g-2 small text-muted">
          <div className="col-md-3">
            <div className="p-2 bg-white rounded border">
              <strong>50% Proximity:</strong> Calculated via Haversine distance between crew GPS and damage coordinates.
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-2 bg-white rounded border">
              <strong>30% Crew Capacity:</strong> Evaluates remaining slots against maximum concurrent limits.
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-2 bg-white rounded border">
              <strong>20% Skill / Equipment:</strong> Matches required tools (e.g. compactor, hotbox) to worker certs.
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-2 bg-white rounded border">
              <strong>Severity Priority:</strong> Critical (24h SLA), High (48h SLA), Medium (7d SLA), Low (14d SLA).
            </div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="rg-card p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">Checking dispatch queue...</p>
          </div>
        ) : queueReports.length === 0 ? (
          <div className="rg-empty-state">
            <FaCheckCircle className="rg-empty-icon text-success" />
            <h6>Dispatch Queue Clear</h6>
            <p className="small">All eligible road damage reports are currently allocated to maintenance crews.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="rg-table">
              <thead>
                <tr>
                  <th>Report #</th>
                  <th>Damage Title & Street Address</th>
                  <th>Damage Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>District</th>
                  <th className="text-end">Dispatch Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueReports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Link to={`/reports/${r._id}`} className="fw-bold text-primary text-decoration-none">
                        {r.reportNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: 260 }}>
                        {r.title}
                      </div>
                      <small className="text-muted">
                        <FaMapMarkerAlt className="me-1 text-primary" /> {r.location?.address}
                      </small>
                    </td>
                    <td>
                      <span className="small text-dark fw-medium">
                        {r.aiAnalysis?.primaryDamageType || 'Surface Anomaly'}
                      </span>
                    </td>
                    <td>
                      <SeverityBadge severity={r.priority} />
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="small text-muted">{r.location?.serviceArea}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-rg-primary d-flex align-items-center gap-1"
                          onClick={() => handleAutoAssign(r._id)}
                          disabled={allocatingId === r._id}
                        >
                          <FaRobot />
                          {allocatingId === r._id ? 'Allocating...' : 'Auto-Allocate'}
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setManualReport(r);
                            setSelectedWorkerId('');
                          }}
                          title="Manual dispatch override"
                        >
                          <FaUserCheck />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Dispatch Override Modal */}
      {manualReport && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1200 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleManualDispatchSubmit}>
                <div className="modal-header bg-light border-bottom">
                  <h6 className="modal-title fw-bold">Manual Worker Dispatch Override</h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setManualReport(null)}
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <span className="text-muted small d-block">Target Road Damage:</span>
                    <strong className="text-dark">
                      {manualReport.reportNumber} — {manualReport.title}
                    </strong>
                    <div className="small text-muted">{manualReport.location?.address}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Select Available Crew Member
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose maintenance worker --</option>
                      {workers.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} ({w.serviceArea}) — Active Jobs:{' '}
                          {w.workerProfile?.currentActiveJobs || 0} / {w.workerProfile?.maxConcurrentJobs || 3}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Supervisor Dispatch Instructions
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Special equipment instructions, traffic control setup notes..."
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setManualReport(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={dispatching || !selectedWorkerId}
                  >
                    {dispatching ? 'Dispatching...' : 'Confirm Manual Dispatch'}
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

export default AssignmentQueuePage;
