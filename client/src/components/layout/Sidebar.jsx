import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaChartPie,
  FaRoad,
  FaPlusCircle,
  FaMapMarkedAlt,
  FaUsersCog,
  FaTasks,
  FaClipboardCheck,
  FaHardHat,
  FaHistory,
  FaChartBar,
  FaUserShield,
  FaBell,
  FaCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isSupervisor, isInspector, isWorker, isAuditor, canUpload, canVerify, canAssign } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <aside className={`rg-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <div
            className="bg-primary text-white rounded d-flex align-items-center justify-content-center"
            style={{ width: 34, height: 34 }}
          >
            <FaRoad style={{ fontSize: '1.1rem' }} />
          </div>
          <div>
            <div className="fw-bold text-primary" style={{ fontSize: '0.98rem', lineHeight: '1.2' }}>
              RoadGuard AI
            </div>
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>
              Civil Works Platform
            </small>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="py-2 flex-grow-1 overflow-auto">
        {/* Core Navigation */}
        <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
          Overview
        </div>
        <NavLink to="/dashboard" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FaChartPie className="rg-icon" /> Dashboard
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FaRoad className="rg-icon" /> Damage Reports
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FaMapMarkedAlt className="rg-icon" /> Interactive Map
        </NavLink>

        {/* Inspection & Ingest */}
        {canUpload && (
          <>
            <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
              Inspection
            </div>
            <NavLink to="/reports/new" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaPlusCircle className="rg-icon text-primary" /> Log New Damage
            </NavLink>
          </>
        )}

        {/* Maintenance Worker Section */}
        {isWorker && (
          <>
            <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
              Field Operations
            </div>
            <NavLink to="/my-tasks" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaHardHat className="rg-icon text-warning" /> My Assigned Tasks
            </NavLink>
          </>
        )}

        {/* Operations & Dispatch */}
        {(isAdmin || isSupervisor) && (
          <>
            <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
              Dispatch & Quality
            </div>
            <NavLink to="/assignments" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaTasks className="rg-icon" /> Assignment Queue
            </NavLink>
            <NavLink to="/workers" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaUsersCog className="rg-icon" /> Worker Management
            </NavLink>
            <NavLink to="/verification" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaClipboardCheck className="rg-icon text-success" /> Supervisor Verification
            </NavLink>
          </>
        )}

        {/* Analytics & Compliance */}
        {(isAdmin || isAuditor) && (
          <>
            <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
              Intelligence
            </div>
            <NavLink to="/analytics" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaChartBar className="rg-icon" /> Analytics & Reports
            </NavLink>
            <NavLink to="/audit" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaHistory className="rg-icon" /> Audit History
            </NavLink>
          </>
        )}

        {/* Administration */}
        {isAdmin && (
          <>
            <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
              Administration
            </div>
            <NavLink to="/users" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FaUserShield className="rg-icon" /> User & Role Management
            </NavLink>
          </>
        )}

        {/* User Preferences */}
        <div className="px-3 pt-3 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.8px' }}>
          Personal
        </div>
        <NavLink to="/notifications" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FaBell className="rg-icon" /> Notifications
          {unreadCount > 0 && (
            <span className="badge bg-danger rounded-pill ms-auto" style={{ fontSize: '0.7rem' }}>
              {unreadCount}
            </span>
          )}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `rg-nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
          <FaCog className="rg-icon" /> Profile & Settings
        </NavLink>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-top bg-light">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
            style={{ width: 32, height: 32, fontSize: '0.85rem' }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="fw-semibold text-truncate small">{user?.name}</div>
            <small className="text-muted d-block text-truncate" style={{ fontSize: '0.7rem' }}>
              {user?.department}
            </small>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
