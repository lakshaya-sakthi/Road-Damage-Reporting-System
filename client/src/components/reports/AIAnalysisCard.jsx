import React from 'react';
import { FaBrain, FaExclamationTriangle, FaCheckCircle, FaTools, FaWrench } from 'react-icons/fa';
import SeverityBadge from '../common/SeverityBadge';

const AIAnalysisCard = ({ analysis, priority, onReanalyze = null, isReanalyzing = false, canReanalyze = false }) => {
  if (!analysis) {
    return (
      <div className="rg-card">
        <div className="text-muted text-center py-3">No AI analysis data available</div>
      </div>
    );
  }

  const confidencePct = Math.round((analysis.overallConfidence || 0) * 100);
  const isLowConfidence = analysis.reviewRequired || confidencePct < 60;
  const detections = analysis.detections || [];

  return (
    <div className="rg-card border-top border-4" style={{ borderColor: isLowConfidence ? '#d97706' : '#0f4c81' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded p-2 text-white"
            style={{ backgroundColor: isLowConfidence ? '#d97706' : '#0f4c81' }}
          >
            <FaBrain />
          </div>
          <div>
            <h6 className="mb-0 fw-bold">YOLO AI Structural Pavement Analysis</h6>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
              Engine: {analysis.modelVersion || 'YOLOv8-RDD'} • Source: {analysis.inferenceSource || 'Inference Microservice'}
            </small>
          </div>
        </div>

        {canReanalyze && onReanalyze && (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={onReanalyze}
            disabled={isReanalyzing}
          >
            {isReanalyzing ? 'Analyzing...' : 'Re-run Inference'}
          </button>
        )}
      </div>

      {/* Low-confidence / Review banner */}
      {isLowConfidence && (
        <div className="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 small mb-3">
          <FaExclamationTriangle className="mt-1 flex-shrink-0 text-warning" />
          <div>
            <strong>Supervisor Review Required:</strong>{' '}
            {analysis.reviewReason ||
              'Detection confidence score is below the operational 60% threshold. Human engineering confirmation is needed before field dispatch.'}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="row g-3 mb-3">
        <div className="col-sm-4">
          <div className="p-3 bg-light rounded border">
            <span className="text-muted small d-block mb-1">Primary Damage Type</span>
            <strong className="h6 text-dark mb-0 d-block text-truncate">
              {analysis.primaryDamageType || 'Surface Anomaly'}
            </strong>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="p-3 bg-light rounded border">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-muted small">Confidence Score</span>
              <strong className={confidencePct >= 60 ? 'text-success' : 'text-danger'}>
                {confidencePct}%
              </strong>
            </div>
            <div className="progress" style={{ height: '6px' }}>
              <div
                className={`progress-bar ${confidencePct >= 75 ? 'bg-success' : confidencePct >= 50 ? 'bg-warning' : 'bg-danger'}`}
                style={{ width: `${Math.max(5, confidencePct)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="col-sm-4">
          <div className="p-3 bg-light rounded border">
            <span className="text-muted small d-block mb-1">Assessed Severity</span>
            <SeverityBadge severity={analysis.calculatedSeverity || priority || 'Medium'} />
          </div>
        </div>
      </div>

      {/* Detected Bounding Boxes & Categories */}
      <div className="mb-3">
        <h6 className="small fw-bold text-muted text-uppercase mb-2">
          Detected Surface Anomalies ({detections.length})
        </h6>
        {detections.length === 0 ? (
          <div className="p-2 px-3 bg-light rounded text-muted small">
            No discrete bounding box clusters localized above the 0.35 confidence threshold.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th>Class Code</th>
                  <th>Damage Classification</th>
                  <th>Confidence</th>
                  <th>Coordinates (Bounding Box)</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((det, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge bg-secondary font-monospace">{det.class_code}</span>
                    </td>
                    <td className="fw-semibold">{det.class_name}</td>
                    <td>
                      <span className="badge bg-info text-dark">
                        {Math.round((det.confidence || 0) * 100)}%
                      </span>
                    </td>
                    <td className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                      [{det.box?.xmin?.toFixed(0)}, {det.box?.ymin?.toFixed(0)}, {det.box?.xmax?.toFixed(0)}, {det.box?.ymax?.toFixed(0)}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Technical Disclaimer Note */}
      <div className="p-2 px-3 bg-light rounded border small text-muted">
        <small>
          <strong>Engineering Notice:</strong>{' '}
          {analysis.technicalDisclaimer ||
            'AI optical evaluation is restricted to surface pavement defects visible in photographic imagery. Base course integrity, voids, and exact cavity depths cannot be determined without physical depth gauges or ground penetrating radar.'}
        </small>
      </div>
    </div>
  );
};

export default AIAnalysisCard;
