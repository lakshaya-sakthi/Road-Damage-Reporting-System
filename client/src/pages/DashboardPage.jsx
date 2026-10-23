import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRoad,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTasks,
  FaUsers,
  FaPlusCircle,
  FaBrain,
  FaHardHat,
  FaClock,
  FaMapMarkedAlt,
  FaArrowRight
} from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';

const DashboardPage = () => {
  const { user, isAdmin, isSupervisor, isInspector, isWorker, isAuditor } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load Analytics from real DB
        const analyticsRes = await api.get('/analytics');
        if (analyticsRes.data.success) {
          setMetrics(analyticsRes.data.data);
        }

        // Load recent reports
        const reportsRes = await api.get('/reports?limit=6');
        if (reportsRes.data.success) {
          setRecentReports(reportsRes.data.data);
        }

        // If worker, load their specific assignments
        if (isWorker) {
          const tasksRes = await api.get('/assignments/my');
          if (tasksRes.data.success) {
            setMyTasks(tasksRes.data.data);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isWorker]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2">Loading municipal operations dashboard...</p>
      </div>
    );
  }

  const summary = metrics?.summary || {};
  const severityBreakdown = metrics?.severityBreakdown || { Critical: 0, High: 0, Medium: 0, Low: 0 };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">
            {isAdmin && 'Command Center Overview'}
            {isSupervisor && `District Maintenance Command — ${user?.serviceArea}`}
            {isInspector && 'Field Inspection Operations'}
            {isWorker && 'Maintenance Crew Dispatch Board'}
            {isAuditor && 'System Compliance & Infrastructure Oversight'}
          </h4>
          <p className="text-muted small mb-0">
            Welcome back, <strong>{user?.name}</strong>. Real-time telemetry from municipal database.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          {(isAdmin || isSupervisor || isInspector) && (
            <Link to="/reports/new" className="btn btn-rg-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
              <FaPlusCircle /> Report Road Damage
            </Link>
          )}
          <Link to="/map" className="btn btn-rg-outline btn-sm d-flex align-items-center gap-1">
            <FaMapMarkedAlt /> Live Damage Map
          </Link>
        </div>
      </div>

      {/* Supervisor Review Required Alert */}
      {(isAdmin || isSupervisor) && summary.pendingReview > 0 && (
        <div className="alert alert-warning border d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-warning text-dark p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
              <FaExclamationTriangle />
            </div>
            <div>
              <strong className="d-block text-dark">
                {summary.pendingReview} Damage Report{summary.pendingReview > 1 ? 's' : ''} Awaiting Engineering Review
              </strong>
              <small className="text-muted">
                AI flagged low confidence or ambiguous surface characteristics requiring human validation before automated dispatch.
              </small>
            </div>
          </div>
          <Link to="/reports?status=review_required" className="btn btn-sm btn-warning text-dark fw-semibold">
            Review Queue &rarr;
          </Link>
        </div>
      )}

      {/* Primary Stat Cards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-primary-subtle text-primary">
              <FaRoad />
            </div>
            <div>
              <div className="rg-stat-val">{summary.totalReports || 0}</div>
              <div className="rg-stat-label">Total Reported</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-danger-subtle text-danger">
              <FaExclamationTriangle />
            </div>
            <div>
              <div className="rg-stat-val">{severityBreakdown.Critical || 0}</div>
              <div className="rg-stat-label">Critical Hazards</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-warning-subtle text-warning">
              <FaTasks />
            </div>
            <div>
              <div className="rg-stat-val">{summary.activeRepairs || 0}</div>
              <div className="rg-stat-label">In Progress</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-success-subtle text-success">
              <FaCheckCircle />
            </div>
            <div>
              <div className="rg-stat-val">{summary.verifiedReports || 0}</div>
              <div className="rg-stat-label">Verified & Closed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Secondary Row */}
      {isWorker ? (
        /* Maintenance Worker Specific Section */
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="rg-card">
              <div className="rg-card-header">
                <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                  <FaHardHat className="text-warning" /> My Current Allocated Tasks ({myTasks.length})
                </h6>
                <Link to="/my-tasks" className="small text-decoration-none">
                  View Full Board &rarr;
                </Link>
              </div>

              {myTasks.length === 0 ? (
                <div className="rg-empty-state">
                  <FaCheckCircle className="rg-empty-icon text-success" />
                  <h6>No Pending Work Allocated</h6>
                  <p className="small">You currently have no active or pending repair tickets assigned.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {myTasks.slice(0, 5).map((t) => (
                    <div key={t._id} className="list-group-item d-flex align-items-center justify-content-between px-0 py-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-dark">{t.reportId?.reportNumber}</strong>
                          <SeverityBadge severity={t.reportId?.priority} />
                          <StatusBadge status={t.status} />
                        </div>
                        <div className="small text-muted">{t.reportId?.location?.address}</div>
                        <small className="text-muted">
                          Target SLA:{' '}
                          <span className="text-dark fw-medium">
                            {new Date(t.targetCompletionDate).toLocaleDateString()}
                          </span>
                        </small>
                      </div>
                      <Link to={`/my-tasks`} className="btn btn-sm btn-outline-primary">
                        Manage Job &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="rg-card">
              <h6 className="fw-bold mb-3">Worker Dispatch Status</h6>
              <div className="p-3 bg-light rounded border mb-3">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Current Active Jobs</span>
                  <strong>{user?.workerProfile?.currentActiveJobs || 0} / {user?.workerProfile?.maxConcurrentJobs || 3}</strong>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{
                      width: `${((user?.workerProfile?.currentActiveJobs || 0) / (user?.workerProfile?.maxConcurrentJobs || 3)) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="small text-muted mb-2">Registered Equipment:</div>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {user?.workerProfile?.equipment?.map((eq, i) => (
                  <span key={i} className="badge bg-light text-dark border">
                    {eq}
                  </span>
                ))}
              </div>

              <div className="small text-muted mb-2">Certified Skills:</div>
              <div className="d-flex flex-wrap gap-1">
                {user?.workerProfile?.skills?.map((sk, i) => (
                  <span key={i} className="badge bg-light text-primary border">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Management / Inspector / Auditor View */
        <div className="row g-4 mb-4">
          {/* Operations Fleet Utilization Card */}
          <div className="col-lg-4">
            <div className="rg-card h-100">
              <h6 className="fw-bold mb-3">Fleet Capacity & Performance</h6>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Maintenance Fleet Utilization</span>
                  <strong className="text-dark">{summary.fleetUtilizationRate || 0}%</strong>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${summary.fleetUtilizationRate > 80 ? 'bg-danger' : summary.fleetUtilizationRate > 50 ? 'bg-primary' : 'bg-success'}`}
                    style={{ width: `${summary.fleetUtilizationRate || 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-light rounded border mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="small text-muted d-block">Average Resolution Time</span>
                    <strong className="h5 mb-0 text-dark">
                      {summary.averageResolutionHours || 0} Hours
                    </strong>
                  </div>
                  <FaClock className="text-muted" style={{ fontSize: '1.5rem' }} />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                <span className="text-muted">Active Workers in Territory</span>
                <strong className="text-dark">{summary.totalWorkers || 0} Crews</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                <span className="text-muted">Unassigned Backlog</span>
                <strong className={summary.unassignedCount > 0 ? 'text-danger' : 'text-success'}>
                  {summary.unassignedCount || 0} Reports
                </strong>
              </div>
              <div className="d-flex justify-content-between align-items-center py-2 small">
                <span className="text-muted">Awaiting Supervisor Verification</span>
                <strong className="text-dark">{summary.pendingVerification || 0} Repaired</strong>
              </div>
            </div>
          </div>

          {/* Severity Breakdown & Distribution */}
          <div className="col-lg-8">
            <div className="rg-card h-100">
              <div className="rg-card-header">
                <h6 className="mb-0 fw-bold">Active Damage Severity Spectrum</h6>
                <span className="badge bg-light text-muted border">Live Assessment</span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-3 text-center p-2 rounded bg-light border">
                  <div className="h4 fw-bold text-danger mb-0">{severityBreakdown.Critical || 0}</div>
                  <span className="small text-muted" style={{ fontSize: '0.72rem' }}>CRITICAL</span>
                </div>
                <div className="col-3 text-center p-2 rounded bg-light border">
                  <div className="h4 fw-bold text-warning mb-0">{severityBreakdown.High || 0}</div>
                  <span className="small text-muted" style={{ fontSize: '0.72rem' }}>HIGH</span>
                </div>
                <div className="col-3 text-center p-2 rounded bg-light border">
                  <div className="h4 fw-bold text-primary mb-0">{severityBreakdown.Medium || 0}</div>
                  <span className="small text-muted" style={{ fontSize: '0.72rem' }}>MEDIUM</span>
                </div>
                <div className="col-3 text-center p-2 rounded bg-light border">
                  <div className="h4 fw-bold text-success mb-0">{severityBreakdown.Low || 0}</div>
                  <span className="small text-muted" style={{ fontSize: '0.72rem' }}>LOW</span>
                </div>
              </div>

              <div className="small fw-bold text-muted text-uppercase mb-2">
                Top Classified Surface Anomaly Types
              </div>
              <div className="d-flex flex-wrap gap-2">
                {metrics?.damageTypeBreakdown?.map((dt, i) => (
                  <div key={i} className="p-2 px-3 bg-light rounded border d-flex align-items-center gap-2 small">
                    <span className="fw-semibold text-dark">{dt.type}</span>
                    <span className="badge bg-secondary rounded-pill">{dt.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Damage Reports Table */}
      <div className="rg-card">
        <div className="rg-card-header">
          <h6 className="mb-0 fw-bold">Recent Road Damage Reports</h6>
          <Link to="/reports" className="small text-decoration-none fw-medium">
            View All Reports &rarr;
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="rg-empty-state">
            <FaRoad className="rg-empty-icon" />
            <h6>No Damage Reports Found</h6>
            <p className="small">Reports logged via field inspection or uploads will populate here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="rg-table">
              <thead>
                <tr>
                  <th>Report #</th>
                  <th>Title & Location</th>
                  <th>Damage Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assigned Worker</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Link to={`/reports/${r._id}`} className="fw-bold text-primary text-decoration-none">
                        {r.reportNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: 220 }}>
                        {r.title}
                      </div>
                      <small className="text-muted text-truncate d-block" style={{ maxWidth: 220 }}>
                        {r.location?.address}
                      </small>
                    </td>
                    <td>
                      <span className="small text-dark fw-medium">
                        {r.aiAnalysis?.primaryDamageType || 'Surface Defect'}
                      </span>
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
                        <span className="text-muted small fst-italic">Unassigned</span>
                      )}
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
      </div>
    </div>
  );
};

export default DashboardPage;
