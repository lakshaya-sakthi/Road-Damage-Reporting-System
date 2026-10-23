import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTasks,
  FaClipboardCheck,
  FaInfoCircle
} from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const navigate = useNavigate();

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <FaTasks className="text-primary" />;
      case 'review_required':
      case 'unassigned_alert':
        return <FaExclamationTriangle className="text-warning" />;
      case 'repair_completed':
        return <FaClipboardCheck className="text-info" />;
      case 'repair_verified':
        return <FaCheckCircle className="text-success" />;
      default:
        return <FaInfoCircle className="text-secondary" />;
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Alerts & System Notifications</h4>
          <p className="text-muted small mb-0">
            Real-time automated operational alerts, assignment notifications, and verification events.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button className="btn btn-sm btn-outline-primary" onClick={markAllAsRead}>
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="rg-card p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">Loading notification feed...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rg-empty-state">
            <FaBell className="rg-empty-icon" />
            <h6>No Notifications</h6>
            <p className="small">Your operational alert inbox is clean and up to date.</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {filtered.map((n) => (
              <div
                key={n._id}
                className={`list-group-item list-group-item-action p-3 d-flex align-items-start justify-content-between ${!n.isRead ? 'bg-light' : ''}`}
                onClick={() => {
                  markAsRead(n._id);
                  if (n.relatedReportId) {
                    navigate(`/reports/${n.relatedReportId}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className="p-2 rounded bg-white border mt-1">
                    {getTypeIcon(n.type)}
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <strong className="text-dark">{n.title}</strong>
                      {!n.isRead && (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.65rem' }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-secondary small">{n.message}</p>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    className="btn btn-sm btn-link text-decoration-none small"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n._id);
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
