import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaCamera,
  FaClipboardCheck,
  FaRoad,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import api from '../api/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:5000';

const COMMON_MATERIALS = [
  'Hot-mix asphalt patch',
  'Cold-mix asphalt',
  'Polymer modified bitumen sealant',
  'Tack coat emulsified asphalt',
  'Aggregates / Base gravel',
  'Mineral fine topping'
];

const RepairProgressPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [afterImage, setAfterImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [repairNotes, setRepairNotes] = useState('');
  const [laborHours, setLaborHours] = useState('2.5');
  const [selectedMaterials, setSelectedMaterials] = useState([
    'Hot-mix asphalt patch',
    'Tack coat emulsified asphalt'
  ]);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assignments/${id}`);
        if (res.data.success) {
          setAssignment(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load assignment:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch assignment.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or WebP photo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image exceeds 10MB limit.');
      return;
    }

    setError('');
    setAfterImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleMaterialToggle = (material) => {
    if (selectedMaterials.includes(material)) {
      setSelectedMaterials(selectedMaterials.filter((m) => m !== material));
    } else {
      setSelectedMaterials([...selectedMaterials, material]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!afterImage) {
      setError('After-repair completion photograph is mandatory.');
      return;
    }

    if (!repairNotes.trim() || repairNotes.trim().length < 10) {
      setError('Please provide detailed repair notes (minimum 10 characters).');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('afterImage', afterImage);
      formData.append('repairNotes', repairNotes);
      formData.append('laborHours', laborHours);
      formData.append('materialsUsed', selectedMaterials.join(','));

      const res = await api.post(`/assignments/${id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('Repair evidence uploaded successfully! Task moved to supervisor verification queue.');
        navigate('/my-tasks');
      }
    } catch (err) {
      console.error('Evidence submission failed:', err);
      setError(err.response?.data?.message || err.message || 'Evidence submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2">Loading work order...</p>
      </div>
    );
  }

  const report = assignment?.reportId || {};
  const getFullImgUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div>
      <div className="mb-4 pb-2 border-bottom">
        <h4 className="fw-bold mb-1">Submit Repair Completion & After-Photo Evidence</h4>
        <p className="text-muted small mb-0">
          Work Order #{assignment?._id?.slice(-6)?.toUpperCase()} • Report {report.reportNumber}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left Column: Before Photo and Evidence Upload */}
          <div className="col-lg-5">
            {/* Before Photo (Reference) */}
            <div className="rg-card mb-4 p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-danger">BEFORE REPAIR (REFERENCE)</span>
                <small className="text-muted">Original Hazard</small>
              </div>
              <div
                className="rounded overflow-hidden bg-dark d-flex align-items-center justify-content-center"
                style={{ height: '220px' }}
              >
                <img
                  src={getFullImgUrl(report.imageUrl)}
                  alt="Original Damage"
                  className="img-fluid"
                  style={{ maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
              <div className="small text-muted mt-2">
                <strong>Location:</strong> {report.location?.address}
              </div>
            </div>

            {/* After Photo Upload Box */}
            <div className="rg-card p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-success">AFTER REPAIR (COMPLETION PHOTO)</span>
                <span className="small text-danger">* Mandatory</span>
              </div>

              {!previewUrl ? (
                <label
                  className="border-2 border-dashed rounded-3 p-4 text-center d-flex flex-column align-items-center justify-content-center w-100"
                  style={{
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f8fafc',
                    minHeight: '220px',
                    cursor: 'pointer'
                  }}
                >
                  <FaCamera style={{ fontSize: '2.5rem', color: '#059669' }} className="mb-2" />
                  <span className="fw-semibold text-success mb-1">Upload clear photo of completed pavement repair</span>
                  <small className="text-muted">JPEG, PNG, WebP up to 10MB</small>
                  <input
                    type="file"
                    className="d-none"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </label>
              ) : (
                <div className="position-relative rounded-3 overflow-hidden border">
                  <img
                    src={previewUrl}
                    alt="After Repair Preview"
                    className="img-fluid w-100"
                    style={{ maxHeight: '220px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle p-1"
                    style={{ width: 26, height: 26 }}
                    onClick={() => {
                      setAfterImage(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Repair Details */}
          <div className="col-lg-7">
            <div className="rg-card mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaClipboardCheck className="text-primary" /> Maintenance Execution Log
              </h6>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  Detailed Repair Notes & Work Performed <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows="4"
                  placeholder="Describe excavation depth, debris cleaning, tack coat application, asphalt compaction technique, and surface leveling..."
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Total Crew Labor Hours <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="form-control form-control-sm"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary d-block">
                  Materials & Consumables Utilized
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {COMMON_MATERIALS.map((mat, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn btn-sm ${selectedMaterials.includes(mat) ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleMaterialToggle(mat)}
                    >
                      {selectedMaterials.includes(mat) && <FaCheckCircle className="me-1" />}
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                <Link to="/my-tasks" className="btn btn-sm btn-outline-secondary">
                  &larr; Back to Task Board
                </Link>

                <button
                  type="submit"
                  className="btn btn-success btn-sm px-4 fw-semibold shadow-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Evidence...' : 'Submit Evidence & Complete Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RepairProgressPage;
