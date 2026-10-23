import React, { useState } from 'react';
import {
  FaUserCog,
  FaKey,
  FaShieldAlt,
  FaHardHat,
  FaCheckCircle,
  FaExclamationTriangle,
  FaServer
} from 'react-icons/fa';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const ProfileSettingsPage = () => {
  const { user, isWorker, updateProfile } = useAuth();

  // Profile Edit
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [availability, setAvailability] = useState(
    user?.workerProfile?.availabilityStatus || 'available'
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      setProfileSaving(true);
      await updateProfile({
        name,
        phone,
        availabilityStatus: isWorker ? availability : undefined
      });
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    try {
      setPasswordSaving(true);
      const res = await api.put('/auth/password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setPasswordMsg('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPasswordErr(err.response?.data?.message || err.message || 'Password update failed.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 pb-2 border-bottom">
        <h4 className="fw-bold mb-1">User Profile & Operational Settings</h4>
        <p className="text-muted small mb-0">
          Manage your enterprise identity, credentials, worker availability, and platform configuration.
        </p>
      </div>

      <div className="row g-4">
        {/* Left Column: Profile & Work Status */}
        <div className="col-lg-7">
          <div className="rg-card mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaUserCog className="text-primary" /> Profile Information
            </h6>

            {profileMsg && (
              <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <FaCheckCircle /> {profileMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Full Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-sm bg-light"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Contact Telephone</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">Assigned District</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light"
                    value={user?.serviceArea || 'Central District'}
                    disabled
                  />
                </div>

                {isWorker && (
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">
                      Current Operational Availability
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    >
                      <option value="available">Available for Automated Dispatch</option>
                      <option value="on_duty">On Standby Duty</option>
                      <option value="busy">Busy / Active On Job</option>
                      <option value="off_duty">Off Duty</option>
                      <option value="on_leave">On Scheduled Leave</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-rg-primary btn-sm px-3"
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Security Card */}
          <div className="rg-card">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaKey className="text-primary" /> Security & Password
            </h6>

            {passwordMsg && (
              <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <FaCheckCircle /> {passwordMsg}
              </div>
            )}

            {passwordErr && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                <FaExclamationTriangle /> {passwordErr}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-outline-danger btn-sm px-3"
                disabled={passwordSaving}
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: System Diagnostics & Role Meta */}
        <div className="col-lg-5">
          <div className="rg-card mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaShieldAlt className="text-primary" /> Active Security Credentials
            </h6>

            <div className="d-flex align-items-center justify-content-between p-2 px-3 bg-light rounded border mb-2 small">
              <span className="text-muted">Security Role</span>
              <strong className="text-capitalize text-dark">{user?.role?.replace('_', ' ')}</strong>
            </div>

            <div className="d-flex align-items-center justify-content-between p-2 px-3 bg-light rounded border mb-2 small">
              <span className="text-muted">Department</span>
              <strong className="text-dark">{user?.department}</strong>
            </div>

            <div className="d-flex align-items-center justify-content-between p-2 px-3 bg-light rounded border mb-2 small">
              <span className="text-muted">Account State</span>
              <span className="badge bg-success">Active & Verified</span>
            </div>
          </div>

          <div className="rg-card">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FaServer className="text-primary" /> System Node Metadata
            </h6>

            <div className="small text-muted mb-2">
              <strong>Backend Node API:</strong> <code>http://localhost:5000/api</code>
            </div>
            <div className="small text-muted mb-2">
              <strong>YOLO AI Microservice:</strong> <code>http://127.0.0.1:8000</code>
            </div>
            <div className="small text-muted mb-2">
              <strong>Database:</strong> MongoDB 7.0 Enterprise with Mongoose ORM
            </div>
            <div className="small text-muted">
              <strong>Maps Driver:</strong> Google Maps JavaScript API (with offline Vector Fallback)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
