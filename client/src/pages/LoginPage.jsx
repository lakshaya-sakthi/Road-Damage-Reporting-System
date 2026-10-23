import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRoad, FaLock, FaEnvelope, FaShieldAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@roadguard.io', pass: 'Admin@12345', badge: 'bg-danger', desc: 'Full System Control' },
  { role: 'Supervisor', email: 'supervisor@roadguard.io', pass: 'Supervisor@12345', badge: 'bg-primary', desc: 'District Dispatch & Verification' },
  { role: 'Field Inspector', email: 'inspector@roadguard.io', pass: 'Inspector@12345', badge: 'bg-info text-dark', desc: 'Damage Photo & GPS Upload' },
  { role: 'Maint. Worker', email: 'worker@roadguard.io', pass: 'Worker@12345', badge: 'bg-warning text-dark', desc: 'Job Acceptance & Repair Evidence' },
  { role: 'Auditor', email: 'auditor@roadguard.io', pass: 'Auditor@12345', badge: 'bg-secondary', desc: 'Read-only Oversight & Logs' }
];

const LoginPage = () => {
  const [email, setEmail] = useState('admin@roadguard.io');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCreds = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: '#f0f4f8' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="row g-0">
            {/* Left Brand Showcase */}
            <div
              className="col-lg-5 p-5 d-flex flex-column justify-content-between text-white"
              style={{
                background: 'linear-gradient(135deg, #0f4c81 0%, #0369a1 100%)'
              }}
            >
              <div>
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="bg-white text-primary p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                    <FaRoad style={{ fontSize: '1.4rem' }} />
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0 text-white" style={{ letterSpacing: '-0.3px' }}>
                      RoadGuard AI
                    </h4>
                    <small className="text-white-50">Enterprise Infrastructure</small>
                  </div>
                </div>

                <h3 className="fw-bold mb-3" style={{ lineHeight: '1.25' }}>
                  AI Road Damage Reporting & Maintenance Tracking System
                </h3>
                <p className="text-white-50 small mb-4">
                  Autonomous computer vision pavement assessment, intelligent algorithmic worker allocation, and full-lifecycle civil infrastructure maintenance tracking.
                </p>

                <div className="p-3 rounded-3 bg-white bg-opacity-10 mb-3 border border-white border-opacity-10 small">
                  <div className="fw-semibold text-white mb-1 d-flex align-items-center gap-2">
                    <FaShieldAlt /> Backend Enforced Security
                  </div>
                  <div className="text-white-50">
                    Strict RBAC authorization across Admin, District Supervisor, Field Inspector, Maintenance Worker, and Auditor roles.
                  </div>
                </div>
              </div>

              <div className="small text-white-50 pt-4 border-top border-white border-opacity-10">
                &copy; {new Date().getFullYear()} Municipal Infrastructure AI System.
              </div>
            </div>

            {/* Right Authentication Form */}
            <div className="col-lg-7 p-4 p-md-5 bg-white">
              <div className="mb-4">
                <h4 className="fw-bold text-dark mb-1">Account Sign In</h4>
                <p className="text-muted small">
                  Authenticate with your enterprise credentials to access assigned municipal tools.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      className="form-control bg-light border-start-0"
                      placeholder="name@roadguard.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0 border-end-0"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-rg-primary w-100 py-2 mb-4 fw-semibold shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>
              </form>

              {/* Demo Accounts Quick-Fill Section */}
              <div className="pt-3 border-top">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.6px' }}>
                    Quick-Fill Demo Credentials (5 Roles)
                  </span>
                  <span className="badge bg-light text-muted border">Instant Switch</span>
                </div>

                <div className="d-grid gap-2">
                  {DEMO_ACCOUNTS.map((demo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-sm btn-outline-light text-dark text-start border p-2 d-flex align-items-center justify-content-between"
                      onClick={() => setDemoCreds(demo.email, demo.pass)}
                    >
                      <div>
                        <span className={`badge ${demo.badge} me-2`} style={{ fontSize: '0.7rem' }}>
                          {demo.role}
                        </span>
                        <span className="small text-muted">{demo.email}</span>
                      </div>
                      <small className="text-muted fst-italic d-none d-sm-inline" style={{ fontSize: '0.7rem' }}>
                        {demo.desc}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
