import React from 'react';

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div className={`spinner spinner-${size} ${className}`} />
  );
};

export default Spinner;
