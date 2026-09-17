import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const HashDisplay = ({ hash, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4">
      {label && <label className="form-label">{label}</label>}
      <div className="hash-display">
        <span className="truncate">{hash}</span>
        <button 
          onClick={handleCopy} 
          className="btn btn-ghost" 
          style={{ padding: '0.25rem' }}
          title="Copy to clipboard"
        >
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
};

export default HashDisplay;
