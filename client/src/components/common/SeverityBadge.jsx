import React from 'react';

const SeverityBadge = ({ severity = 'Low', className = '' }) => {
  const norm = (severity || 'Low').toLowerCase();

  let badgeClass = 'rg-badge-sev-low';
  let label = severity || 'Low';

  if (norm === 'critical') {
    badgeClass = 'rg-badge-sev-critical';
    label = 'Critical Hazard';
  } else if (norm === 'high') {
    badgeClass = 'rg-badge-sev-high';
    label = 'High Priority';
  } else if (norm === 'medium') {
    badgeClass = 'rg-badge-sev-med';
    label = 'Medium Severity';
  } else {
    badgeClass = 'rg-badge-sev-low';
    label = 'Low Severity';
  }

  return (
    <span
      className={`badge ${badgeClass} px-2 py-1 ${className}`}
      style={{ fontSize: '0.78rem', borderRadius: '6px' }}
    >
      {label}
    </span>
  );
};

export default SeverityBadge;
