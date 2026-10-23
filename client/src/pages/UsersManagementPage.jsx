import React, { useEffect, useState } from 'react';
import {
  FaUserShield,
  FaUserPlus,
  FaEdit,
  FaCheck,
  FaTimes,
  FaSearch,
  FaKey
} from 'react-icons/fa';
import api from '../api/client';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'field_inspector', label: 'Field Inspector' },
  { value: 'worker', label: 'Maintenance Worker' },
  { value: 'auditor', label: 'Auditor' }
];

const DISTRICTS = [
  'Central District',
  'North Highway Corridor',
  'Downtown Metro',
  'East Industrial Belt'
];

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Welcome@12345');
  const [newRole, setNewRole] = useState('field_inspector');
  const [newDepartment, setNewDepartment] = useState('Road Infrastructure');
  const [newServiceArea, setNewServiceArea] = useState('Central District');
  const [newPhone, setNewPhone] = useState('+1 (555) 000-0000');
  const [creating, setCreating] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post('/users', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDepartment,
        serviceArea: newServiceArea,
        phone: newPhone
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setNewName('');
        setNewEmail('');
        await fetchUsers();
      }
    } catch (err) {
      alert('Failed to create user: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (targetUser) => {
    try {
      const updatedActive = !targetUser.active;
      await api.put(`/users/${targetUser._id}`, { active: updatedActive });
      setUsers((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, active: updatedActive } : u))
      );
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge bg-danger">Admin</span>;
      case 'supervisor':
        return <span className="badge bg-primary">Supervisor</span>;
      case 'field_inspector':
        return <span className="badge bg-info text-dark">Field Inspector</span>;
      case 'worker':
        return <span className="badge bg-warning text-dark">Worker</span>;
      case 'auditor':
        return <span className="badge bg-secondary">Auditor</span>;
      default:
        return <span className="badge bg-light text-dark">{role}</span>;
    }
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">User & Role Administration</h4>
          <p className="text-muted small mb-0">
            Control organizational user accounts, configure role permissions, and assign service district boundaries.
          </p>
        </div>

        <button
          className="btn btn-rg-primary btn-sm d-flex align-items-center gap-1 shadow-sm mt-3 mt-md-0"
          onClick={() => setShowCreateModal(true)}
        >
          <FaUserPlus /> Provision New User
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rg-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by user name or corporate email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Security Roles</option>
                {ROLES.map((r, i) => (
                  <option key={i} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 text-end">
              <button type="submit" className="btn btn-sm btn-rg-outline w-100">
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="rg-card p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-2">Loading user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rg-empty-state">
            <FaUserShield className="rg-empty-icon" />
            <h6>No User Accounts Found</h6>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="rg-table">
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Assigned Role</th>
                  <th>Department</th>
                  <th>District Service Area</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="fw-bold text-dark">{u.name}</div>
                      <small className="text-muted">{u.email}</small>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td className="small text-muted">{u.department}</td>
                    <td className="small fw-medium text-dark">{u.serviceArea}</td>
                    <td>
                      {u.active ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline-success'} p-1 px-2`}
                        onClick={() => handleToggleActive(u)}
                        title={u.active ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision User Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1200 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header bg-light border-bottom">
                  <h6 className="modal-title fw-bold">Provision Municipal User Account</h6>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Corporate Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Initial Password</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Role</label>
                      <select
                        className="form-select form-select-sm"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      >
                        {ROLES.map((r, i) => (
                          <option key={i} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Service Area</label>
                      <select
                        className="form-select form-select-sm"
                        value={newServiceArea}
                        onChange={(e) => setNewServiceArea(e.target.value)}
                      >
                        {DISTRICTS.map((d, i) => (
                          <option key={i} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Department Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={creating}>
                    {creating ? 'Provisioning...' : 'Provision User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;
