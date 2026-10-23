import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaClipboardCheck,
  FaCheckCircle,
  FaRedo,
  FaRoad,
  FaMapMarkerAlt,
  FaEye
} from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/common/SeverityBadge';
import StatusBadge from '../components/common/StatusBadge';
import RepairEvidenceModal from '../components/assignments/RepairEvidenceModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const SupervisorVerificationPage = () => {
  const { canVerify, user } = useAuth();
  const [completedReports, setCompletedReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal inspection
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCompletedReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports?status=completed&limit=50');
      if (res.data.success) {
        setCompletedReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedReports();
  }, []);

  const handleInspect = async (report) => {
    if (!report.currentAssignment?._id) return;
    try {
      const res = await api.get(`/assignments/${report.currentAssignment._id}`);
      if (res.data.success) {
        setSelectedAssignment(res.data.data);
        setSelectedEvidence(res.data.evidence);
        setShowModal(true);
      }
    } catch (err) {
      alert('Failed to load evidence: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVerify = async (action, feedback) => {
    if (!selectedAssignment?._id) return;
    try {
      await api.post(`/assignments/${selectedAssignment._id}/verify`, {
        action,
        feedback
      });
      alert(action === 'approve' ? 'Repair verified and closed.' : 'Repair reopened.');
      await fetchCompletedReports();
    } catch (err) {
      alert('Verification error: ' + (err.response?.data?.message || err.message));
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
          <h4 className="fw-bold mb-1">Supervisor Quality Assurance & Verification Queue</h4>
          <p className="text-muted small mb-0">
            Inspect photographic completion evidence, review crew field logs, and approve closures or reopen for rework.
          </p>
        </div>

        <div className="mt-3 mt-md-0">
          <span className="badge bg-success px-3 py-2">
            {completedReports.length} Repairs Ready for Quality Verification
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Loading verification queue...</p>
        </div>
      ) : completedReports.length === 0 ? (
        <div className="rg-card text-center py-5">
          <FaClipboardCheck className="text-success mb-3" style={{ fontSize: '3rem' }} />
          <h6>Verification Queue Up-To-Date</h6>
          <p className="text-muted small">No completed road repair tickets are currently awaiting supervisor sign-off.</p>
        </div>
      ) : (
        <div className="row g-4">
          {completedReports.map((r) => (
            <div key={r._id} className="col-lg-6">
              <div className="rg-card h-100 d-flex flex-column justify-content-between p-3">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-primary border font-monospace">
                        {r.reportNumber}
                      </span>
                      <SeverityBadge severity={r.priority} />
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <h6 className="fw-bold text-dark mb-1">{r.title}</h6>
                  <small className="text-muted d-block mb-3">
                    <FaMapMarkerAlt className="text-primary me-1" />
                    {r.location?.address} • District: {r.location?.serviceArea}
                  </small>

                  <div className="d-flex gap-3 mb-3">
                    <div
                      className="rounded overflow-hidden bg-light border flex-shrink-0 position-relative"
                      style={{ width: 120, height: 90 }}
                    >
                      <img
                        src={getFullImgUrl(r.imageUrl)}
                        alt="Before"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        className="badge bg-danger position-absolute top-0 start-0 m-1"
                        style={{ fontSize: '0.6rem' }}
                      >
                        BEFORE
                      </span>
                    </div>

                    <div className="flex-grow-1 p-2 bg-light rounded border small">
                      <div className="text-muted">
                        Assigned Crew:{' '}
                        <strong className="text-dark">
                          {r.currentAssignment?.workerId?.name || 'Field Crew'}
                        </strong>
                      </div>
                      <div className="text-muted">
                        Classification:{' '}
                        <strong className="text-dark">
                          {r.aiAnalysis?.primaryDamageType}
                        </strong>
                      </div>
                      <div className="text-muted">
                        Surface: <strong>{r.surfaceType}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                  <Link to={`/reports/${r._id}`} className="btn btn-sm btn-light border">
                    View Full Audit
                  </Link>

                  <button
                    className="btn btn-sm btn-success d-flex align-items-center gap-1 shadow-sm px-3"
                    onClick={() => handleInspect(r)}
                  >
                    <FaClipboardCheck /> Inspect Evidence & Verify
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Evidence Inspection Modal */}
      {selectedEvidence && (
        <RepairEvidenceModal
          evidence={selectedEvidence}
          assignment={selectedAssignment}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onVerify={handleVerify}
          canVerify={canVerify}
        />
      )}
    </div>
  );
};

export default SupervisorVerificationPage;
