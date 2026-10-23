import React, { useEffect, useState } from 'react';
import { FaHardHat, FaTools, FaTruck, FaMapMarkerAlt, FaCheckCircle, FaUserClock } from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const WorkersPage = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/users/workers?${params.toString()}`);
      if (res.data.success) {
        setWorkers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load worker fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="badge bg-success-subtle text-success border border-success-subtle">Available for Dispatch</span>;
      case 'busy':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">On Active Job</span>;
      case 'on_duty':
        return <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">On Standby Duty</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border">Off Duty</span>;
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Maintenance Worker Fleet Management</h4>
          <p className="text-muted small mb-0">
            Monitor real-time crew capacity, equipment allocation, certified skills, and dispatched job loads.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <select
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Crew Statuses</option>
            <option value="available">Available Only</option>
            <option value="busy">Busy / Dispatched</option>
            <option value="on_duty">On Standby</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">Loading worker fleet data...</p>
        </div>
      ) : workers.length === 0 ? (
        <div className="rg-card text-center py-5">
          <FaHardHat className="text-muted mb-3" style={{ fontSize: '3rem' }} />
          <h6>No Maintenance Crews Found</h6>
          <p className="text-muted small">No workers match the selected criteria or service area.</p>
        </div>
      ) : (
        <div className="row g-4">
          {workers.map((w) => {
            const profile = w.workerProfile || {};
            const activeJobs = profile.currentActiveJobs || 0;
            const maxJobs = profile.maxConcurrentJobs || 3;
            const capacityPct = Math.round((activeJobs / maxJobs) * 100);

            return (
              <div key={w._id} className="col-lg-4 col-md-6">
                <div className="rg-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Header */}
                    <div className="d-flex align-items-start justify-content-between mb-3 pb-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 42, height: 42 }}
                        >
                          <FaHardHat style={{ fontSize: '1.2rem' }} />
                        </div>
                        <div>
                          <strong className="d-block text-dark mb-0">{w.name}</strong>
                          <small className="text-muted">{w.serviceArea}</small>
                        </div>
                      </div>
                      <div>{getStatusBadge(profile.availabilityStatus)}</div>
                    </div>

                    {/* Workload Progress */}
                    <div className="p-3 bg-light rounded border mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Workload Capacity</span>
                        <strong className="text-dark">
                          {activeJobs} / {maxJobs} Active Jobs
                        </strong>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className={`progress-bar ${capacityPct >= 100 ? 'bg-danger' : capacityPct >= 60 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-3">
                      <span className="small text-muted d-block mb-1 d-flex align-items-center gap-1">
                        <FaTools className="text-primary" /> Certified Repair Skills
                      </span>
                      <div className="d-flex flex-wrap gap-1">
                        {profile.skills?.length > 0 ? (
                          profile.skills.map((s, i) => (
                            <span key={i} className="badge bg-light text-primary border" style={{ fontSize: '0.72rem' }}>
                              {s.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted small">Standard Pavement Repair</span>
                        )}
                      </div>
                    </div>

                    {/* Equipment */}
                    <div className="mb-3">
                      <span className="small text-muted d-block mb-1 d-flex align-items-center gap-1">
                        <FaTruck className="text-secondary" /> Allocated Equipment & Machinery
                      </span>
                      <div className="d-flex flex-wrap gap-1">
                        {profile.equipment?.length > 0 ? (
                          profile.equipment.map((eq, i) => (
                            <span key={i} className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                              {eq.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted small">Hand tools</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer / Location */}
                  <div className="pt-2 border-top small text-muted d-flex align-items-center justify-content-between">
                    <span>
                      <FaMapMarkerAlt className="text-primary me-1" />
                      {profile.currentCoordinates?.lat?.toFixed(4)}, {profile.currentCoordinates?.lng?.toFixed(4)}
                    </span>
                    <span>{w.phone || 'Radio Active'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkersPage;
