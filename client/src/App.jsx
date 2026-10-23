import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportsListPage from './pages/ReportsListPage';
import NewReportPage from './pages/NewReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import DamageMapPage from './pages/DamageMapPage';
import WorkersPage from './pages/WorkersPage';
import AssignmentQueuePage from './pages/AssignmentQueuePage';
import MyTasksPage from './pages/MyTasksPage';
import RepairProgressPage from './pages/RepairProgressPage';
import SupervisorVerificationPage from './pages/SupervisorVerificationPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UsersManagementPage from './pages/UsersManagementPage';
import AuditHistoryPage from './pages/AuditHistoryPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected App Routes inside Master Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsListPage />} />
              <Route
                path="reports/new"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor', 'field_inspector']}>
                    <NewReportPage />
                  </ProtectedRoute>
                }
              />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="map" element={<DamageMapPage />} />

              {/* Maintenance Crew Routes */}
              <Route
                path="my-tasks"
                element={
                  <ProtectedRoute allowedRoles={['worker', 'admin']}>
                    <MyTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="tasks/:id/progress"
                element={
                  <ProtectedRoute allowedRoles={['worker', 'admin']}>
                    <RepairProgressPage />
                  </ProtectedRoute>
                }
              />

              {/* Operational & Dispatch Routes */}
              <Route
                path="workers"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <WorkersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assignments"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <AssignmentQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="verification"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <SupervisorVerificationPage />
                  </ProtectedRoute>
                }
              />

              {/* Analytics & Compliance Routes */}
              <Route
                path="analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'auditor']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'auditor']}>
                    <AuditHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin-Only Management */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UsersManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* Personal Routes */}
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
