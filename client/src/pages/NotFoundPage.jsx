import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaRoad } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="text-center p-5 bg-white rounded-4 shadow border" style={{ maxWidth: 480 }}>
        <div
          className="rounded-circle bg-warning bg-opacity-10 text-warning mx-auto d-flex align-items-center justify-content-center mb-3"
          style={{ width: 72, height: 72 }}
        >
          <FaExclamationTriangle style={{ fontSize: '2.2rem' }} />
        </div>
        <h2 className="fw-bold text-dark mb-2">404: Road Not Found</h2>
        <p className="text-muted small mb-4">
          The requested municipal page or route does not exist or may have been relocated during system maintenance.
        </p>
        <Link to="/dashboard" className="btn btn-rg-primary px-4 py-2 d-inline-flex align-items-center gap-2">
          <FaHome /> Return to Operations Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
