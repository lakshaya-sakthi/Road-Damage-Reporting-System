import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaRoad,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaTasks,
  FaHistory,
  FaCheckCircle,
  FaRedo,
  FaExclamationTriangle,
  FaClipboardCheck
} from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';
import AIAnalysisCard from '../components/reports/AIAnalysisCard';
import GoogleMapContainer from '../components/maps/GoogleMapContainer';
import RepairEvidenceModal from '../components/assignments/RepairEvidenceModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const ReportDetailPage = () => {
  const { id } = useParams();
  const { user, canVerify, canAssign } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Supervisor Review form state
  const [confirmedSeverity, setConfirmedSeverity] = useState('Medium');
  const [confirmedDamageType, setConfirmedDamageType] = useState('Pothole');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Evidence inspection modal state
  const [evidenceData, setEvidenceData] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${id}`);
      if (res.data.success) {
        setReport(res.data.data);
        setConfirmedSeverity(res.data.data.priority || 'Medium');
        setConfirmedDamageType(res.data.data.aiAnalysis?.primaryDamageType || 'Pothole');

        // Check if report has assignment evidence
        if (res.data.data.currentAssignment?._id) {
          try {
            const assignRes = await api.get(`/assignments/${res.data.data.currentAssignment._id}`);
            if (assignRes.data.success && assignRes.data.evidence) {
              setEvidenceData(assignRes.data.evidence);
            }
          } catch (e) {
            console.warn('Could not fetch assignment evidence:', e.message);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleReanalyze = async () => {
    try {
      setIsReanalyzing(true);
      await api.post(`/reports/${id}/reanalyze`);
      await fetchReport();
    } catch (err) {
      alert('Reanalysis failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleSupervisorReview = async (action) => {
    try {
      setReviewing(true);
      await api.post(`/reports/${id}/review`, {
        action,
        confirmedSeverity,
        confirmedDamageType,
        reviewNotes
      });
      await fetchReport();
    } catch (err) {
      alert('Review action failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setReviewing(false);
    }
  };

  const handleTriggerAutoAssign = async () => {
    try {
      const res = await api.post(`/reports/${id}/auto-assign`);
      alert(res.data.message || 'Worker allocated successfully.');
      await fetchReport();
    } catch (err) {
      alert('Allocation error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVerifyEvidence = async (action, feedback) => {
    if (!report?.currentAssignment?._id) return;
    await api.post(`/assignments/${report.currentAssignment._id}/verify`, {
      action,
      feedback
    });
    await fetchReport();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2">Loading road damage audit record...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="alert alert-danger py-4 text-center">
        <h5>Failed to load report</h5>
        <p className="small mb-3">{error || 'Report not found.'}</p>
        <Link to="/reports" className="btn btn-sm btn-secondary">
          &larr; Return to Reports Registry
        </Link>
      </div>
    );
  }

  const getFullImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div>
      {/* Top Banner & Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-light text-primary border font-monospace px-2 py-1">
              {report.reportNumber}
            </span>
            <SeverityBadge severity={report.priority} />
            <StatusBadge status={report.status} />
          </div>
          <h4 className="fw-bold mb-0 text-dark">{report.title}</h4>
          <small className="text-muted">
            <FaMapMarkerAlt className="me-1 text-primary" /> {report.location?.address} • District:{' '}
            <strong>{report.location?.serviceArea}</strong>
          </small>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          {evidenceData && (
            <button
              className="btn btn-sm btn-success d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowEvidenceModal(true)}
            >
              <FaClipboardCheck /> Inspect Repair Evidence
            </button>
          )}

          {canAssign && (report.status === 'pending_assignment' || report.status === 'unassigned') && (
            <button
              className="btn btn-sm btn-rg-primary d-flex align-items-center gap-1 shadow-sm"
              onClick={handleTriggerAutoAssign}
            >
              <FaTasks /> Run Auto-Allocation Engine
            </button>
          )}
        </div>
      </div>

      {/* Supervisor Review Action Panel (Shown only when Review Required) */}
      {canVerify && report.status === 'review_required' && (
        <div className="rg-card border-warning border-2 p-3 mb-4 bg-warning bg-opacity-10">
          <div className="d-flex align-items-center gap-2 mb-2 text-warning-emphasis">
            <FaExclamationTriangle style={{ fontSize: '1.2rem' }} />
            <h6 className="fw-bold mb-0">Supervisor Engineering Review Panel</h6>
          </div>
          <p className="small text-muted mb-3">
            The AI model flagged this report as low-confidence ({Math.round((report.aiAnalysis?.overallConfidence || 0) * 100)}%) or unconfirmed surface parameters. Please confirm the severity rating and classification before maintenance dispatch.
          </p>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">
                Confirmed Priority / Severity
              </label>
              <select
                className="form-select form-select-sm"
                value={confirmedSeverity}
                onChange={(e) => setConfirmedSeverity(e.target.value)}
              >
                <option value="Critical">Critical (Emergency 24h SLA)</option>
                <option value="High">High (Urgent 48h SLA)</option>
                <option value="Medium">Medium (Routine 7d SLA)</option>
                <option value="Low">Low (Minor 14d SLA)</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">
                Confirmed Damage Classification
              </label>
              <select
                className="form-select form-select-sm"
                value={confirmedDamageType}
                onChange={(e) => setConfirmedDamageType(e.target.value)}
              >
                <option value="Pothole">Pothole (Structural Cavity)</option>
                <option value="Alligator Crack">Alligator Crack (Fatigue)</option>
                <option value="Transverse Crack">Transverse Crack</option>
                <option value="Longitudinal Crack">Longitudinal Crack</option>
                <option value="Wheel Rutting">Wheel Rutting / Depression</option>
                <option value="Surface Ravelling">Surface Ravelling</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">
                Review Verification Notes
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Notes for dispatch audit trail..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              className="btn btn-sm btn-outline-danger"
              disabled={reviewing}
              onClick={() => handleSupervisorReview('reject')}
            >
              Reject as Non-Hazard
            </button>
            <button
              className="btn btn-sm btn-success"
              disabled={reviewing}
              onClick={() => handleSupervisorReview('approve')}
            >
              Confirm Parameters & Dispatch to Crew
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="row g-4">
        {/* Left Column: Photographic Evidence & AI Breakdown */}
        <div className="col-lg-7">
          {/* Photographic Evidence Card with Bounding Box Overlay */}
          <div className="rg-card p-3 mb-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0">High-Resolution Pavement Evidence</h6>
              <span className="badge bg-light text-muted border">
                Surface: {report.surfaceType}
              </span>
            </div>

            <div
              className="rounded overflow-hidden bg-dark position-relative d-flex align-items-center justify-content-center"
              style={{ minHeight: '340px' }}
            >
              <img
                src={getFullImgUrl(report.imageUrl)}
                alt="Pavement Defect"
                className="img-fluid"
                style={{ maxHeight: '420px', objectFit: 'contain' }}
              />
            </div>

            {report.description && (
              <div className="p-3 bg-light rounded border mt-3 small text-muted">
                <strong>Inspector Observations:</strong> {report.description}
              </div>
            )}
          </div>

          {/* AI Analysis Component */}
          <AIAnalysisCard
            analysis={report.aiAnalysis}
            priority={report.priority}
            canReanalyze={canVerify}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
          />
        </div>

        {/* Right Column: Location, Current Assignment, and Status Timeline */}
        <div className="col-lg-5">
          {/* Geolocation Card */}
          <div className="rg-card mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaMapMarkerAlt className="text-primary" /> Geolocation Coordinates
            </h6>

            <div className="small text-muted mb-2">
              <strong>Address:</strong> {report.location?.address}
            </div>
            <div className="small text-muted mb-3 font-monospace">
              GPS: {report.location?.coordinates?.lat}, {report.location?.coordinates?.lng}
            </div>

            <GoogleMapContainer
              center={report.location?.coordinates || { lat: 13.0827, lng: 80.2707 }}
              zoom={15}
              markers={[report]}
              height="200px"
              interactive={false}
            />
          </div>

          {/* Current Assignment Card */}
          <div className="rg-card mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaTasks className="text-primary" /> Maintenance Allocation
            </h6>

            {report.currentAssignment ? (
              <div className="p-3 bg-light rounded border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <strong className="text-dark">
                    {report.currentAssignment.workerId?.name || 'Allocated Crew'}
                  </strong>
                  <StatusBadge status={report.currentAssignment.status} />
                </div>
                <div className="small text-muted mb-1">
                  Contact: {report.currentAssignment.workerId?.phone || 'On Field Radio'}
                </div>
                <div className="small text-muted mb-2">
                  Target SLA:{' '}
                  <strong>
                    {new Date(report.currentAssignment.targetCompletionDate).toLocaleDateString()}
                  </strong>
                </div>

                {report.currentAssignment.scoreBreakdown && (
                  <div className="pt-2 border-top small text-muted">
                    <div className="fw-semibold text-dark mb-1">Allocation Score Breakdown:</div>
                    <div>Proximity Score (50%): {report.currentAssignment.scoreBreakdown.proximityScore} pts ({report.currentAssignment.scoreBreakdown.distanceKm} km)</div>
                    <div>Capacity Score (30%): {report.currentAssignment.scoreBreakdown.capacityScore} pts</div>
                    <div>Skill Match (20%): {report.currentAssignment.scoreBreakdown.skillScore} pts</div>
                    <div className="fw-bold text-primary mt-1">
                      Composite Score: {report.currentAssignment.scoreBreakdown.totalScore} / 100
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-light rounded border text-muted small text-center">
                No maintenance crew currently dispatched.
                {report.status === 'unassigned' && (
                  <div className="text-danger fw-semibold mt-1">
                    Worker capacity saturated in this district. Manual dispatch required.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="rg-card">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaHistory className="text-primary" /> Lifecycle Status Timeline
            </h6>

            <div className="timeline small">
              {report.statusHistory?.map((entry, idx) => (
                <div key={idx} className="pb-3 border-start ps-3 position-relative mb-1">
                  <div
                    className="position-absolute top-0 start-0 translate-middle rounded-circle bg-primary"
                    style={{ width: 8, height: 8 }}
                  />
                  <div className="d-flex align-items-center justify-content-between">
                    <strong className="text-dark text-capitalize">{entry.status.replace('_', ' ')}</strong>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="text-muted mt-1">{entry.note}</div>
                  <small className="text-secondary d-block fst-italic">
                    Actor: {entry.changedByName || 'System Auto-Engine'}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Repair Evidence Modal */}
      {evidenceData && (
        <RepairEvidenceModal
          evidence={evidenceData}
          assignment={report.currentAssignment}
          isOpen={showEvidenceModal}
          onClose={() => setShowEvidenceModal(false)}
          onVerify={handleVerifyEvidence}
          canVerify={canVerify}
        />
      )}
    </div>
  );
};

export default ReportDetailPage;
