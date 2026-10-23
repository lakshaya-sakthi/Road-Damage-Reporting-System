import React, { useState } from 'react';
import { FaCheckCircle, FaRedo, FaTimes, FaCamera, FaClipboardList, FaUserClock } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const RepairEvidenceModal = ({
  evidence,
  assignment,
  isOpen,
  onClose,
  onVerify,
  canVerify = false
}) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !evidence) return null;

  const handleAction = async (action) => {
    try {
      setIsSubmitting(true);
      await onVerify(action, feedback);
      onClose();
    } catch (err) {
      console.error('Failed to submit verification:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFullImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1200 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg">
          {/* Header */}
          <div className="modal-header bg-light border-bottom">
            <div>
              <h5 className="modal-title fw-bold">Repair Verification & Evidence Inspection</h5>
              <small className="text-muted">
                Task #{assignment?._id?.slice(-6)?.toUpperCase()} • Worker: {assignment?.workerId?.name}
              </small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Side-by-Side Photographic Evidence */}
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="rg-card p-2 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                    <span className="badge bg-danger">BEFORE REPAIR</span>
                    <small className="text-muted">Original Report Ingest</small>
                  </div>
                  <div
                    className="rounded overflow-hidden bg-dark d-flex align-items-center justify-content-center"
                    style={{ height: '300px' }}
                  >
                    <img
                      src={getFullImgUrl(evidence.beforeImageUrl)}
                      alt="Before Repair"
                      className="img-fluid"
                      style={{ maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="rg-card p-2 h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                    <span className="badge bg-success">AFTER REPAIR (EVIDENCE)</span>
                    <small className="text-muted">Submitted by Maintenance Crew</small>
                  </div>
                  <div
                    className="rounded overflow-hidden bg-dark d-flex align-items-center justify-content-center"
                    style={{ height: '300px' }}
                  >
                    <img
                      src={getFullImgUrl(evidence.afterImageUrl)}
                      alt="After Repair Evidence"
                      className="img-fluid"
                      style={{ maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Field Report Details */}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <div className="p-3 bg-light rounded border">
                  <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                    <FaClipboardList className="text-primary" /> Maintenance Execution Notes
                  </h6>
                  <p className="text-dark mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
                    {evidence.repairNotes}
                  </p>
                </div>
              </div>

              <div className="col-md-4">
                <div className="p-3 bg-light rounded border h-100">
                  <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
                    <FaUserClock className="text-primary" /> Logistics & Materials
                  </h6>
                  <div className="small mb-2">
                    <span className="text-muted">Labor Duration:</span>{' '}
                    <strong>{evidence.laborHours} Hours</strong>
                  </div>
                  <div className="small">
                    <span className="text-muted d-block mb-1">Materials Used:</span>
                    <div className="d-flex flex-wrap gap-1">
                      {evidence.materialsUsed?.map((mat, i) => (
                        <span key={i} className="badge bg-secondary-subtle text-dark border">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor Sign-Off / Verification Form */}
            {canVerify && (
              <div className="p-3 bg-light rounded border mt-3">
                <h6 className="fw-bold mb-2">Supervisor Quality Sign-off</h6>
                <div className="mb-3">
                  <label className="form-label small text-muted">
                    Engineering Remarks / Rework Feedback
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Provide inspection feedback, compaction quality notes, or rework instructions..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <button
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                    onClick={() => handleAction('reopen')}
                    disabled={isSubmitting}
                  >
                    <FaRedo /> Reopen / Request Additional Work
                  </button>
                  <button
                    className="btn btn-success btn-sm d-flex align-items-center gap-1"
                    onClick={() => handleAction('approve')}
                    disabled={isSubmitting}
                  >
                    <FaCheckCircle /> Approve & Mark Verified
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairEvidenceModal;
