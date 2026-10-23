import React from 'react';

const STATUS_CONFIG = {
  detected: { label: 'Detected', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  review_required: { label: 'Review Required', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  pending_assignment: { label: 'Pending Assignment', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  assigned: { label: 'Assigned', bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
  accepted: { label: 'Accepted', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
  in_progress: { label: 'In Progress', bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  verified: { label: 'Verified & Closed', bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' },
  unassigned: { label: 'Unassigned', bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  rejected: { label: 'Rejected', bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  overdue: { label: 'Overdue SLA', bg: '#ffe4e6', color: '#be123c', border: '#fecdd3' },
  reopened: { label: 'Reopened', bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' }
};

const StatusBadge = ({ status = 'detected', className = '' }) => {
  const norm = (status || 'detected').toLowerCase().replace(/\s+/g, '_');
  const cfg = STATUS_CONFIG[norm] || STATUS_CONFIG.detected;

  return (
    <span
      className={`rg-status-pill ${className}`}
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: cfg.color
        }}
      />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
