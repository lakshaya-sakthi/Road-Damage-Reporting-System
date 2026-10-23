import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCloudUploadAlt,
  FaMapMarkerAlt,
  FaRoad,
  FaBrain,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import GoogleMapContainer from '../components/maps/GoogleMapContainer';

const DISTRICTS = [
  'Central District',
  'North Highway Corridor',
  'Downtown Metro',
  'East Industrial Belt'
];

const NewReportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [surfaceType, setSurfaceType] = useState('Asphalt');
  const [address, setAddress] = useState('Mount Road & 4th Cross Ave');
  const [serviceArea, setServiceArea] = useState(user?.serviceArea || 'Central District');
  const [lat, setLat] = useState('13.0827');
  const [lng, setLng] = useState('80.2707');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingStep, setProcessingStep] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or WebP photo.');
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setError('');
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleLocationPick = (coords) => {
    setLat(coords.lat.toFixed(6));
    setLng(coords.lng.toFixed(6));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please attach photographic evidence of the road damage.');
      return;
    }

    setError('');
    setLoading(true);
    setProcessingStep('Uploading image to secure storage...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('surfaceType', surfaceType);
      formData.append('address', address);
      formData.append('serviceArea', serviceArea);
      formData.append('lat', lat);
      formData.append('lng', lng);

      setProcessingStep('Executing YOLO AI damage detection & severity scoring...');
      const res = await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setProcessingStep('Analysis complete! Dispatched.');
        navigate(`/reports/${res.data.data._id}`);
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(err.response?.data?.message || err.message || 'Report ingestion failed.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 pb-2 border-bottom">
        <h4 className="fw-bold mb-1">Log Road Damage & AI Surface Assessment</h4>
        <p className="text-muted small mb-0">
          Upload optical photo evidence, confirm GPS coordinates, and invoke the automated YOLO pavement inference engine.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rg-card text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: 44, height: 44 }} />
          <h5 className="fw-bold text-dark">{processingStep}</h5>
          <p className="text-muted small max-w-md mx-auto">
            Please wait while the image is verified and processed through the Python YOLO detection microservice.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Left Column: Image Upload & Preview */}
            <div className="col-lg-5">
              <div className="rg-card h-100">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaCloudUploadAlt className="text-primary" /> Photographic Evidence
                </h6>

                {!previewUrl ? (
                  <label
                    className="border-2 border-dashed rounded-3 p-4 text-center d-flex flex-column align-items-center justify-content-center w-100"
                    style={{
                      borderColor: '#cbd5e1',
                      backgroundColor: '#f8fafc',
                      minHeight: '260px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaCloudUploadAlt style={{ fontSize: '3rem', color: '#94a3b8' }} className="mb-2" />
                    <span className="fw-semibold text-primary mb-1">Click to select photo or drag & drop</span>
                    <small className="text-muted">JPEG, PNG, or WebP up to 10MB</small>
                    <input
                      type="file"
                      className="d-none"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="position-relative rounded-3 overflow-hidden border mb-3">
                    <img
                      src={previewUrl}
                      alt="Upload Preview"
                      className="img-fluid w-100"
                      style={{ maxHeight: '280px', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle p-1"
                      style={{ width: 28, height: 28 }}
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      title="Remove image"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}

                <div className="p-3 bg-light rounded border mt-3 small text-muted">
                  <div className="fw-bold text-dark mb-1">AI Ingest Protocol:</div>
                  The uploaded photo is decoded and passed directly to the YOLO detection pipeline to extract damage classes, confidence scores, and determine dispatch urgency.
                </div>
              </div>
            </div>

            {/* Right Column: Location & Attributes */}
            <div className="col-lg-7">
              <div className="rg-card mb-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaRoad className="text-primary" /> Damage Attributes
                </h6>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Damage Headline / Report Title
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Deep Pothole in Bus Lane / Structural Alligatoring"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Surface Pavement Material
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={surfaceType}
                      onChange={(e) => setSurfaceType(e.target.value)}
                    >
                      <option value="Asphalt">Asphalt (Flexible Pavement)</option>
                      <option value="Concrete">Concrete (Rigid Pavement)</option>
                      <option value="Composite">Composite Roadway</option>
                      <option value="Gravel">Gravel / Unpaved Shoulder</option>
                      <option value="Brick/Paver">Interlocking Pavers</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Jurisdictional Service Area
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                    >
                      {DISTRICTS.map((d, i) => (
                        <option key={i} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Field Inspector Notes / Surrounding Context
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="Mention road conditions, traffic disruption, water ponding, or immediate hazards..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Geographic Coordinates Picker */}
              <div className="rg-card">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <FaMapMarkerAlt className="text-primary" /> Geolocation & Street Address
                </h6>

                <div className="row g-3 mb-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Street Address or Highway Marker
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control form-control-sm"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control form-control-sm"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Location Picker Map */}
                <div className="mb-3">
                  <span className="small text-muted d-block mb-1">
                    Click on the map grid to adjust or pin exact road coordinates:
                  </span>
                  <GoogleMapContainer
                    center={{ lat: Number(lat) || 13.0827, lng: Number(lng) || 80.2707 }}
                    zoom={14}
                    selectedLocation={{ lat: Number(lat), lng: Number(lng) }}
                    onLocationSelect={handleLocationPick}
                    height="220px"
                    interactive={true}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-rg-primary w-100 py-2 fw-semibold shadow-sm"
                >
                  Submit Road Damage & Run AI Inference
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewReportPage;
