import React, { useState } from 'react';
import CountdownTimer from '../components/common/CountdownTimer';
import { Download, Lock, FileText, AlertCircle } from 'lucide-react';
const CentrePortal = () => {
  const targetTime = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
  const [downloaded, setDownloaded] = useState(false);
  const isAvailable = true; 
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-8">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Examination Centre Portal</h1>
        <p className="text-secondary">Centre Code: DEL-402 | Node: 192.168.1.105</p>
      </div>

      <div className="card mb-6" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div className="text-secondary mb-4 uppercase tracking-widest text-sm font-semibold">Next Exam: CS-101 Data Structures</div>
        {isAvailable ? (
          <div className="text-success font-mono text-xl mb-4">Paper is Available</div>
        ) : (
          <CountdownTimer targetTime={targetTime} />
        )}
        <div className="mt-8">
          {isAvailable ? (
            <button 
              className={`btn ${downloaded ? 'btn-success' : 'btn-primary'} w-full max-w-md mx-auto justify-center`}
              style={{ padding: '1.25rem', fontSize: '1.25rem' }}
              onClick={() => setDownloaded(true)}
            >
              <Download size={24} className="mr-2" />
              {downloaded ? 'Re-Download Exam Paper' : 'Download Exam Paper'}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-warning">
              <Lock size={20} />
              <span>Paper is time-locked and encrypted</span>
            </div>
          )}
        </div>
      </div>
      {downloaded && (
        <div className="alert alert-info animate-fadeIn">
          <AlertCircle size={24} />
          <div>
            <strong className="block mb-1">Traceability Notice</strong>
            <span className="text-sm">This downloaded paper has been uniquely watermarked with your Centre Code (DEL-402), Timestamp, and IP Address. Unauthorized distribution is traceable.</span>
          </div>
        </div>
      )}
      <div className="card">
        <h3 className="card-title mb-4"><FileText size={18} /> Today's Schedule</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Exam Code</th>
              <th>Subject</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CS-101</td>
              <td>Data Structures</td>
              <td>14:00 - 17:00</td>
              <td><span className="text-success">Available</span></td>
            </tr>
            <tr>
              <td>PH-201</td>
              <td>Quantum Mechanics</td>
              <td>09:00 - 12:00</td>
              <td><span className="text-secondary">Completed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CentrePortal;
