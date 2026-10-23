import React, { useEffect, useState } from 'react';
import {
  FaChartBar,
  FaFileDownload,
  FaRoad,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaUsers
} from 'react-icons/fa';
import api from '../api/client';

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadguard-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-2">Aggregating database analytics...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const severity = data?.severityBreakdown || { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const totalReports = summary.totalReports || 1;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Infrastructure Analytics & Intelligence</h4>
          <p className="text-muted small mb-0">
            Real-time statistical synthesis of road damage prevalence, repair efficiency, and municipal district compliance.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={handleExportJSON}>
            <FaFileDownload /> Export JSON Report
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-primary-subtle text-primary">
              <FaRoad />
            </div>
            <div>
              <div className="rg-stat-val">{summary.totalReports || 0}</div>
              <div className="rg-stat-label">Total Logged</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-success-subtle text-success">
              <FaCheckCircle />
            </div>
            <div>
              <div className="rg-stat-val">{summary.verifiedReports || 0}</div>
              <div className="rg-stat-label">Verified & Closed</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-warning-subtle text-warning">
              <FaClock />
            </div>
            <div>
              <div className="rg-stat-val">{summary.averageResolutionHours || 0}h</div>
              <div className="rg-stat-label">Avg Repair Time</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="rg-card rg-stat-card mb-0">
            <div className="rg-stat-icon-wrapper bg-info-subtle text-info">
              <FaUsers />
            </div>
            <div>
              <div className="rg-stat-val">{summary.fleetUtilizationRate || 0}%</div>
              <div className="rg-stat-label">Fleet Utilization</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Details */}
      <div className="row g-4 mb-4">
        {/* Severity Spectrum Bars */}
        <div className="col-lg-6">
          <div className="rg-card h-100">
            <h6 className="fw-bold mb-3">Severity Spectrum Distribution</h6>

            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold text-danger">Critical Hazards</span>
                <span>{severity.Critical || 0} ({Math.round(((severity.Critical || 0) / totalReports) * 100)}%)</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-danger"
                  style={{ width: `${((severity.Critical || 0) / totalReports) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold text-warning">High Priority</span>
                <span>{severity.High || 0} ({Math.round(((severity.High || 0) / totalReports) * 100)}%)</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-warning"
                  style={{ width: `${((severity.High || 0) / totalReports) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold text-primary">Medium Severity</span>
                <span>{severity.Medium || 0} ({Math.round(((severity.Medium || 0) / totalReports) * 100)}%)</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-primary"
                  style={{ width: `${((severity.Medium || 0) / totalReports) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold text-success">Low Severity</span>
                <span>{severity.Low || 0} ({Math.round(((severity.Low || 0) / totalReports) * 100)}%)</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${((severity.Low || 0) / totalReports) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Anomaly Categories */}
        <div className="col-lg-6">
          <div className="rg-card h-100">
            <h6 className="fw-bold mb-3">AI Defect Classification Frequency</h6>
            <div className="table-responsive">
              <table className="table table-sm table-borderless align-middle mb-0">
                <thead>
                  <tr className="border-bottom small text-muted">
                    <th>Defect Type</th>
                    <th>Count</th>
                    <th className="text-end">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.damageTypeBreakdown?.map((dt, i) => (
                    <tr key={i} className="border-bottom">
                      <td className="fw-semibold">{dt.type}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{dt.count}</span>
                      </td>
                      <td className="text-end text-muted small">
                        {Math.round((dt.count / totalReports) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* District / Service Area Heat Table */}
      <div className="rg-card p-0">
        <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0">Municipal District Performance & Hazard Density</h6>
          <span className="badge bg-light text-muted border">Territory Heatmap</span>
        </div>

        <div className="table-responsive">
          <table className="rg-table">
            <thead>
              <tr>
                <th>District / Service Area</th>
                <th>Total Reports</th>
                <th>Critical Hazards</th>
                <th>Verified Repairs</th>
                <th>Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {data?.serviceAreaBreakdown?.map((sa, i) => {
                const resRate = sa.total > 0 ? Math.round((sa.verified / sa.total) * 100) : 0;
                return (
                  <tr key={i}>
                    <td className="fw-semibold text-dark">{sa.serviceArea}</td>
                    <td>{sa.total}</td>
                    <td>
                      <span className={`badge ${sa.critical > 0 ? 'bg-danger' : 'bg-light text-muted'}`}>
                        {sa.critical}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success">{sa.verified}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: 6, minWidth: 60 }}>
                          <div className="progress-bar bg-success" style={{ width: `${resRate}%` }} />
                        </div>
                        <span className="small text-muted">{resRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
