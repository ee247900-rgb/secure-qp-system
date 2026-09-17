import React, { useState } from 'react';
import CountdownTimer from '../components/common/CountdownTimer';
import { Key, ShieldAlert } from 'lucide-react';
import Modal from '../components/common/Modal';

const KeyHolderPortal = () => {
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');

  // Target time: 2 hours from now
  const targetTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const handleAuthorize = (e) => {
    e.preventDefault();
    if (password) {
      setSubmitted(true);
      setShowModal(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="text-center mb-8">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Key Holder Portal</h1>
        <p className="text-secondary">Secure Exfiltration Quorum Participation</p>
      </div>

      <div className="card mb-6" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div className="text-secondary mb-4 uppercase tracking-widest text-sm font-semibold">Time to Exam Release</div>
        <CountdownTimer targetTime={targetTime} />
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title"><Key size={20} className="text-gold" /> Your Key Share</h2>
          <div className={`badge ${submitted ? 'badge-success' : 'badge-warning'}`}>
            {submitted ? 'Submitted' : 'Pending Authorization'}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Quorum Progress</span>
            <span className="text-gold font-mono">2 of 3 Required</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: submitted ? '100%' : '66%' }}></div>
          </div>
          <p className="text-secondary text-sm">
            You hold Share #4 of 5 for Exam ID: CS-101. A minimum quorum of 3 shares is required to reconstruct the AES decryption key.
          </p>
        </div>

        <div className="alert alert-info">
          <ShieldAlert size={20} />
          <span className="text-sm">Submitting your share authorizes the automatic decryption of the exam paper at the designated release time. You cannot view the contents of the paper.</span>
        </div>

        {!submitted && (
          <button 
            className="btn btn-primary w-full justify-center mt-4" 
            style={{ padding: '1rem', fontSize: '1.125rem' }}
            onClick={() => setShowModal(true)}
          >
            Authorize Decryption Share
          </button>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Re-authenticate to Authorize">
        <form onSubmit={handleAuthorize}>
          <p className="mb-4 text-sm text-secondary">Please enter your password to cryptographically sign and submit your key share.</p>
          <div className="form-group mb-6">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Sign & Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KeyHolderPortal;
