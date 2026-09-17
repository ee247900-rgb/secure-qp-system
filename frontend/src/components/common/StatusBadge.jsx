import React from 'react';

const StatusBadge = ({ status, variant }) => {
  let mappedVariant = variant;
  
  if (!mappedVariant) {
    const s = status?.toLowerCase() || '';
    if (['approved', 'secure', 'verified', 'completed'].includes(s)) {
      mappedVariant = 'success';
    } else if (['rejected', 'alert', 'lockdown', 'failed'].includes(s)) {
      mappedVariant = 'danger';
    } else if (['pending', 'review', 'in progress'].includes(s)) {
      mappedVariant = 'warning';
    } else if (['info', 'active'].includes(s)) {
      mappedVariant = 'info';
    } else {
      mappedVariant = 'neutral';
    }
  }

  return (
    <span className={`badge badge-${mappedVariant}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
