import React, { useState } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import HashDisplay from '../components/common/HashDisplay';
import { Layers, ShieldCheck, FileText, Key } from 'lucide-react';

const CompilerDashboard = () => {
  const [compileState, setCompileState] = useState(0);

  const handleCompile = () => {
    setCompileState(1);
    let step = 1;
    const interval = setInterval(() => {
      step++;
      setCompileState(step);
      if (step >= 6) clearInterval(interval);
    }, 1500);
  };

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Paper Compilation Center</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 className="card-title mb-4"><Layers size={20} /> Select Exam</h2>
          <select className="select mb-4">
            <option>CS-101: Data Structures (Fall 2026)</option>
            <option>PH-201: Quantum Mechanics</option>
          </select>
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-secondary text-sm">
            <span>Pool: 145 Approved Qs</span>
            <span>Target: 100 Marks</span>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title mb-4"><FileText size={20} /> Paper Specifications</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.875rem' }}>MCQ (20x1)</div>
              <div className="font-semibold text-lg">20 Marks</div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Short (10x3)</div>
              <div className="font-semibold text-lg">30 Marks</div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Long (5x10)</div>
              <div className="font-semibold text-lg">50 Marks</div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Total</div>
              <div className="font-semibold text-lg text-gold">100 Marks</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h2 className="card-title mb-4"><ShieldCheck size={20} /> Secure Compilation Process</h2>
        
        {compileState === 0 && (
          <div className="text-center py-8">
            <p className="text-secondary mb-6">Ready to compile and encrypt the question paper. This process is irreversible.</p>
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }} onClick={handleCompile}>
              Compile & Encrypt Paper
            </button>
          </div>
        )}
        {compileState > 0 && (
          <div className="p-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            <div className="flex items-center gap-4 mb-4">
              {compileState > 1 ? <ShieldCheck className="text-success" /> : <div className="spinner spinner-sm"></div>}
              <span className={compileState > 1 ? 'text-success' : 'text-primary'}>Step 1: Assembling PDF and Watermarking</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              {compileState > 2 ? <ShieldCheck className="text-success" /> : compileState === 2 ? <div className="spinner spinner-sm"></div> : <div className="text-secondary">○</div>}
              <span className={compileState > 2 ? 'text-success' : compileState === 2 ? 'text-primary' : 'text-secondary'}>Step 2: Computing SHA-256 Hash</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              {compileState > 3 ? <ShieldCheck className="text-success" /> : compileState === 3 ? <div className="spinner spinner-sm"></div> : <div className="text-secondary">○</div>}
              <span className={compileState > 3 ? 'text-success' : compileState === 3 ? 'text-primary' : 'text-secondary'}>Step 3: Applying Digital Signature</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              {compileState > 4 ? <ShieldCheck className="text-success" /> : compileState === 4 ? <div className="spinner spinner-sm"></div> : <div className="text-secondary">○</div>}
              <span className={compileState > 4 ? 'text-success' : compileState === 4 ? 'text-primary' : 'text-secondary'}>Step 4: AES-256-GCM Encryption</span>
            </div>
            <div className="flex items-center gap-4">
              {compileState > 5 ? <Key className="text-success" /> : compileState === 5 ? <div className="spinner spinner-sm"></div> : <div className="text-secondary">○</div>}
              <span className={compileState > 5 ? 'text-success' : compileState === 5 ? 'text-primary' : 'text-secondary'}>Step 5: Shamir's Secret Sharing (Split Key to 5 Holders)</span>
            </div>
          </div>
        )}

        {compileState === 6 && (
          <div className="mt-6 animate-fadeIn" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div className="alert alert-success">
              <ShieldCheck size={20} />
              <div>
                <strong>Compilation Successful</strong>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>The paper has been encrypted and keys distributed.</div>
              </div>
            </div>
            
            <HashDisplay label="Paper SHA-256 Hash" hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" />
            <HashDisplay label="Digital Signature" hash="304402203f8c8b... [truncated]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompilerDashboard;
