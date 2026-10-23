import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShieldAlt,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaCheckCircle,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'supervisor':
        return 'bg-primary';
      case 'field_inspector':
        return 'bg-info text-dark';
      case 'worker':
        return 'bg-warning text-dark';
      case 'auditor':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  return (
    <nav className="rg-navbar">
      {/* Left: Mobile Toggle & Brand Indicator */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-light d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <FaBars />
        </button>
        <div className="d-flex align-items-center gap-2">
          <FaShieldAlt className="text-primary" style={{ fontSize: '1.4rem' }} />
          <span className="fw-bold d-none d-sm-inline" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
            RoadGuard AI
          </span>
          <span className="badge bg-light text-muted border ms-2 d-none d-md-inline">
            v1.0 • Enterprise
          </span>
        </div>
      </div>

      {/* Middle: Service Area Indicator */}
      <div className="d-none d-md-flex align-items-center gap-2 text-muted small bg-light px-3 py-1 rounded-pill border">
        <FaMapMarkerAlt className="text-primary" />
        <span>District:</span>
        <strong className="text-dark">{user?.serviceArea || 'Central District'}</strong>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-light position-relative rounded-circle p-2"
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
          >
            <FaBell style={{ fontSize: '1.1rem', color: '#475569' }} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border p-0"
              style={{ width: '340px', zIndex: 1100, maxHeight: '420px', overflowY: 'auto' }}
            >
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                <span className="fw-semibold small">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-link btn-sm p-0 text-decoration-none small"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="list-group list-group-flush">
                {notifications.length === 0 ? (
                  <div className="p-3 text-center text-muted small">No notifications</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n._id}
                      className={`list-group-item list-group-item-action p-2 px-3 small ${!n.isRead ? 'bg-light' : ''}`}
                      onClick={() => {
                        markAsRead(n._id);
                        if (n.relatedReportId) {
                          navigate(`/reports/${n.relatedReportId}`);
                          setShowNotifs(false);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start justify-content-between">
                        <strong className="text-dark">{n.title}</strong>
                        {!n.isRead && (
                          <span className="badge bg-primary rounded-pill" style={{ width: 6, height: 6, padding: 0 }} />
                        )}
                      </div>
                      <div className="text-muted text-truncate">{n.message}</div>
                      <small className="text-light" style={{ fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-top text-center bg-light">
                <Link
                  to="/notifications"
                  className="small text-decoration-none text-primary fw-medium"
                  onClick={() => setShowNotifs(false)}
                >
                  View all notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Role Badge */}
        <div className="d-flex align-items-center gap-2 ps-2 border-start">
          <div className="text-end d-none d-sm-block">
            <div className="fw-bold text-dark" style={{ fontSize: '0.86rem', lineHeight: '1.2' }}>
              {user?.name || 'Authorized User'}
            </div>
            <span
              className={`badge ${getRoleBadgeClass(user?.role)} text-uppercase`}
              style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}
            >
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <button
            className="btn btn-outline-danger btn-sm p-1 px-2 ms-2"
            onClick={handleLogout}
            title="Sign out"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
