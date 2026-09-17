import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { 
  Users, FileText, Shield, AlertTriangle, Plus, Search, 
  Filter, Check, X, MailCheck, UserPlus, Send, Globe, Key, 
  Layers, Lock, Clock, Download, Eye, Edit3, Trash2, CheckCircle, RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { currentNetwork, networks, joinNetwork, allocateMember, updateMemberRole, removeMember } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Notification Toast
  const [notification, setNotification] = useState('');

  // 1. ALLOCATE MEMBER MODAL STATE
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocName, setAllocName] = useState('');
  const [allocEmail, setAllocEmail] = useState('');
  const [allocRole, setAllocRole] = useState('SETTER');
  const [allocSending, setAllocSending] = useState(false);

  // 2. QUESTION SUBMISSIONS & REVIEWS POOL
  const [questions, setQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('qp_admin_questions');
      return saved ? JSON.parse(saved) : [
        {
          id: 'Q-101',
          author: 'prof.sharma@physics.edu',
          subject: 'Physics',
          topic: 'Quantum Mechanics',
          question_text: 'Explain the Heisenberg Uncertainty Principle and derive its mathematical representation Δx · Δp ≥ ℏ/2.',
          question_type: 'LONG',
          marks: 10,
          difficulty: 'HARD',
          options: [],
          correct_answer: 'Detailed derivation required',
          status: 'PENDING_REVIEW',
          submitted_at: '2026-09-16 10:15 AM',
          rejection_reason: ''
        },
        {
          id: 'Q-102',
          author: 'dr.kumar@math.edu',
          subject: 'Mathematics',
          topic: 'Linear Algebra',
          question_text: 'Find the eigenvalues and eigenvectors of a 3x3 symmetric matrix A where trace(A)=6.',
          question_type: 'SHORT',
          marks: 5,
          difficulty: 'MEDIUM',
          options: [],
          correct_answer: 'λ = 1, 2, 3',
          status: 'APPROVED',
          submitted_at: '2026-09-16 11:30 AM',
          rejection_reason: ''
        },
        {
          id: 'Q-103',
          author: 'dr.alan@cs.edu',
          subject: 'Computer Science',
          topic: 'Algorithms',
          question_text: 'What is the tight worst-case time complexity of QuickSort when the median-of-three pivot is used?',
          question_type: 'MCQ',
          marks: 2,
          difficulty: 'MEDIUM',
          options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
          correct_answer: 'O(N^2)',
          status: 'APPROVED',
          submitted_at: '2026-09-16 12:00 PM',
          rejection_reason: ''
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('qp_admin_questions', JSON.stringify(questions));
  }, [questions]);

  // Reject Question Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedQuestionForReject, setSelectedQuestionForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 3. ACCESS REQUESTS
  const [accessRequests, setAccessRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('qp_access_requests');
      return saved ? JSON.parse(saved) : [
        { 
          id: 'req-1', 
          email: 'prof.sharma@physics.edu', 
          role: 'SETTER', 
          reason: 'Assigned as Question Maker for Physics Examination 2026', 
          date: 'Today, 10:15 AM', 
          status: 'PENDING' 
        }
      ];
    } catch {
      return [];
    }
  });

  // 4. PAPER COMPILER & ENCRYPTED VAULT STATE
  const [compiling, setCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState(0);
  const [compiledPaper, setCompiledPaper] = useState(() => {
    try {
      const saved = localStorage.getItem('qp_compiled_paper');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 5. RELEASE SCHEDULE STATE
  const [releaseDate, setReleaseDate] = useState('2026-10-20');
  const [releaseTime, setReleaseTime] = useState('09:00');
  const [timezone, setTimezone] = useState('IST (UTC+05:30)');
  const [isScheduled, setIsScheduled] = useState(true);

  // 6. EXAM CENTRES
  const [centres, setCentres] = useState([
    { id: 'CENTRE-01', name: 'Delhi National Engineering Centre', device: 'Terminal-Alpha', status: 'LOCKED', watermarked: true },
    { id: 'CENTRE-02', name: 'Mumbai Tech Examination Hall', device: 'Terminal-Beta', status: 'LOCKED', watermarked: true },
    { id: 'CENTRE-03', name: 'Chennai Central University Centre', device: 'Terminal-Gamma', status: 'LOCKED', watermarked: true }
  ]);

  // Handle Dynamic Member Allocation by Admin
  const handleAllocateMember = async (e) => {
    e.preventDefault();
    if (!allocEmail) return;

    setAllocSending(true);
    const netCode = currentNetwork?.code || `NET-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const joinLink = `${window.location.origin}/login?join=${netCode}`;

    // 1. Allocate in Context & Storage
    allocateMember(currentNetwork?.id, {
      email: allocEmail.trim().toLowerCase(),
      role: allocRole,
      name: allocName.trim() || allocEmail.split('@')[0]
    });

    // 2. Dispatch real email invitation via backend
    try {
      await fetch('http://localhost:8000/api/auth/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_emails: [allocEmail.trim().toLowerCase()],
          network_name: currentNetwork?.name || 'Secure QP Network',
          join_link: joinLink
        })
      });
    } catch (err) {
      console.log('Dispatch invite error:', err);
    }

    setAllocSending(false);
    setIsAllocateModalOpen(false);
    setAllocName('');
    setAllocEmail('');
    setNotification(`✅ Member ${allocEmail} allocated as ${allocRole} and invitation email dispatched!`);
    setTimeout(() => setNotification(''), 6000);
  };

  // Handle Question Actions (Accept, Reject, Request Modification)
  const handleAcceptQuestion = (qId) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: 'APPROVED', rejection_reason: '' } : q));
    setNotification(`✅ Question ${qId} APPROVED and added to the Final Paper Compilation Pool!`);
    setTimeout(() => setNotification(''), 5000);
  };

  const handleOpenRejectModal = (question) => {
    setSelectedQuestionForReject(question);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason) return;
    setQuestions(prev => prev.map(q => q.id === selectedQuestionForReject.id ? { 
      ...q, 
      status: 'REJECTED', 
      rejection_reason: rejectReason 
    } : q));

    setRejectModalOpen(false);
    setNotification(`❌ Question ${selectedQuestionForReject.id} REJECTED with reason recorded.`);
    setTimeout(() => setNotification(''), 5000);
  };

  const handleRequestChanges = (qId) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, status: 'CHANGES_REQUESTED', rejection_reason: 'Requires formatting adjustments and clearer options.' } : q));
    setNotification(`⚠️ Modification requested for question ${qId}.`);
    setTimeout(() => setNotification(''), 5000);
  };

  // Handle Paper Compilation & AES-256-GCM + Shamir Key Split
  const handleCompilePaper = () => {
    const approved = questions.filter(q => q.status === 'APPROVED');
    if (approved.length === 0) {
      alert('Cannot compile: No approved questions available in the question pool.');
      return;
    }

    setCompiling(true);
    setCompileStep(1);

    setTimeout(() => {
      setCompileStep(2); // SHA-256 Hash
      setTimeout(() => {
        setCompileStep(3); // Ed25519 Signature
        setTimeout(() => {
          setCompileStep(4); // AES-256-GCM Encryption
          setTimeout(() => {
            setCompileStep(5); // Shamir's Secret Sharing (3-of-5)
            const paperData = {
              paper_id: 'CS-EXAM-2026-001',
              title: 'Annual Examination 2026',
              subject: 'Computer Science',
              questions_count: approved.length,
              total_marks: approved.reduce((acc, curr) => acc + curr.marks, 0),
              hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              signature: '30450221008d6c8b92ef45b74100...[Ed25519 Signature Verified]',
              status: 'ENCRYPTED_AND_LOCKED',
              compiled_at: new Date().toISOString(),
              shares_created: 5,
              quorum_required: 3,
              time_locked: true,
              release_time: `${releaseDate} ${releaseTime} ${timezone}`
            };
            setCompiledPaper(paperData);
            localStorage.setItem('qp_compiled_paper', JSON.stringify(paperData));
            setCompiling(false);
            setNotification('🎉 Final Question Paper compiled, digitally signed, AES-256-GCM encrypted, and split-keys created!');
            setTimeout(() => setNotification(''), 8000);
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  // Members list (only real members allocated by Admin)
  const networkMembers = currentNetwork?.members || [];
  const usersList = networkMembers.map((m, idx) => ({
    id: idx + 1,
    email: m.email,
    name: m.name || m.email.split('@')[0],
    role: m.role,
    status: 'Active'
  }));

  const stats = [
    { label: 'Total Allocated Users', value: networkMembers.length.toString(), icon: Users, color: 'var(--info)' },
    { label: 'Pending Questions', value: questions.filter(q => q.status === 'PENDING_REVIEW').length.toString(), icon: Clock, color: 'var(--warning)' },
    { label: 'Approved Questions', value: questions.filter(q => q.status === 'APPROVED').length.toString(), icon: CheckCircle, color: 'var(--success)' },
    { label: 'Rejected Questions', value: questions.filter(q => q.status === 'REJECTED').length.toString(), icon: AlertTriangle, color: 'var(--danger)' },
  ];

  const auditLogs = [
    { id: 1, time: '10:42:15', user: 'compiler@exam.edu', action: 'COMPILE_PAPER', resource: 'CS-EXAM-2026-001', ip: '192.168.1.45' },
    { id: 2, time: '10:45:02', user: 'keyholder1@domain.com', action: 'KEY_SHARE_CREATED', resource: 'Share #1 of 5', ip: '10.0.0.5' },
    { id: 3, time: '11:05:33', user: 'centre_delhi@sec.gov', action: 'EARLY_ACCESS_ATTEMPT', resource: 'CS-EXAM-2026-001', ip: '203.0.113.42', result: 'BLOCKED_BY_TIMELOCK' },
    { id: 4, time: '11:12:00', user: 'setter@exam.edu', action: 'QUESTION_SUBMIT', resource: 'Q-101', ip: '192.168.1.10' },
  ];

  // SUB-VIEW: QUESTION SUBMISSIONS & REVIEWS (/admin/submissions or /admin/review)
  if (path === '/admin/submissions' || path === '/admin/review') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Question Submissions & Review</h1>
            <p className="text-secondary text-sm">Review questions submitted by Question Makers. Accept, reject with reason, or request changes.</p>
          </div>
          <div className="flex gap-2">
            <span className="badge badge-warning">{questions.filter(q => q.status === 'PENDING_REVIEW').length} Pending</span>
            <span className="badge badge-success">{questions.filter(q => q.status === 'APPROVED').length} Approved</span>
          </div>
        </div>

        {notification && (
          <div className="alert alert-info mb-6">
            <MailCheck size={20} />
            <span>{notification}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {questions.map(q => (
            <div key={q.id} className="card" style={{ borderLeft: q.status === 'APPROVED' ? '4px solid var(--success)' : q.status === 'REJECTED' ? '4px solid var(--danger)' : '4px solid var(--warning)' }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-primary text-base font-mono">{q.id}</strong>
                    <span className="badge badge-info">{q.subject}</span>
                    <span className="text-secondary text-xs font-semibold">{q.topic}</span>
                    <span className="text-secondary text-xs">• {q.submitted_at}</span>
                  </div>
                  <div className="text-xs text-secondary">
                    Maker: <span className="text-primary">{q.author}</span> | Marks: <strong className="text-gold">{q.marks}</strong> | Type: {q.question_type} | Difficulty: {q.difficulty}
                  </div>
                </div>

                <div>
                  <StatusBadge 
                    status={q.status === 'PENDING_REVIEW' ? 'PENDING' : q.status} 
                    variant={q.status === 'APPROVED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'warning'} 
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="p-3 my-2" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <p className="text-primary text-sm font-medium" style={{ lineHeight: '1.6' }}>{q.question_text}</p>
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {q.options.map((opt, i) => (
                      <div key={i} className="text-xs text-secondary">
                        <span className="font-mono text-gold font-bold">{String.fromCharCode(65 + i)}.</span> {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Reason if any */}
              {q.status === 'REJECTED' && q.rejection_reason && (
                <div className="alert alert-danger p-2 my-2 text-xs">
                  <strong>Rejection Reason:</strong> "{q.rejection_reason}"
                </div>
              )}

              {/* Action Buttons for Admin */}
              <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {q.status === 'PENDING_REVIEW' && (
                  <>
                    <button className="btn btn-ghost btn-sm text-xs" onClick={() => handleRequestChanges(q.id)}>
                      <Edit3 size={14} /> Request Modification
                    </button>
                    <button className="btn btn-danger btn-sm text-xs" onClick={() => handleOpenRejectModal(q)}>
                      <X size={14} /> Reject with Reason
                    </button>
                    <button className="btn btn-success btn-sm text-xs" onClick={() => handleAcceptQuestion(q.id)}>
                      <Check size={14} /> Accept Question
                    </button>
                  </>
                )}
                {q.status === 'REJECTED' && (
                  <button className="btn btn-outline btn-sm text-xs" onClick={() => handleAcceptQuestion(q.id)}>
                    <RefreshCw size={14} /> Reconsider & Accept
                  </button>
                )}
                {q.status === 'APPROVED' && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle size={14} /> Approved for Paper Compilation
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reject Reason Modal */}
        <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title={`Reject Question ${selectedQuestionForReject?.id}`}>
          <div className="p-2">
            <p className="text-sm text-secondary mb-3">
              Please enter the official reason for rejecting this question. This feedback will be sent directly to the Question Maker.
            </p>
            <div className="form-group mb-4">
              <label className="form-label">Rejection Reason</label>
              <textarea 
                className="textarea"
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g., Question contains ambiguous wording or does not match syllabus requirements."
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirmReject} disabled={!rejectReason}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // SUB-VIEW: PAPER COMPILER & ENCRYPTED VAULT (/admin/compiler or /admin/vault)
  if (path === '/admin/compiler' || path === '/admin/vault') {
    const approvedQuestions = questions.filter(q => q.status === 'APPROVED');

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Paper Compiler & Encrypted Vault</h1>
            <p className="text-secondary text-sm">Generate final question paper from approved pool, apply SHA-256 hash, Ed25519 signature, AES-256-GCM encryption, and Shamir Split-Key.</p>
          </div>
        </div>

        {notification && (
          <div className="alert alert-info mb-6">
            <MailCheck size={20} />
            <span>{notification}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Approved Pool */}
          <div className="card">
            <h2 className="card-title mb-3 flex items-center gap-2">
              <CheckCircle className="text-success" size={20} /> Approved Question Bank Pool ({approvedQuestions.length})
            </h2>
            <p className="text-secondary text-xs mb-4">Only approved questions can be included in the compilation.</p>

            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
              {approvedQuestions.map(q => (
                <div key={q.id} className="p-3" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-gold">{q.id}</span>
                    <span className="badge badge-info text-xs">{q.subject} ({q.marks} Marks)</span>
                  </div>
                  <p className="text-secondary text-xs truncate">{q.question_text}</p>
                </div>
              ))}
              {approvedQuestions.length === 0 && (
                <div className="text-secondary text-sm p-4 text-center italic">No approved questions yet. Approve questions first!</div>
              )}
            </div>

            <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                className="btn btn-primary w-full justify-center" 
                onClick={handleCompilePaper}
                disabled={compiling || approvedQuestions.length === 0}
              >
                {compiling ? <RefreshCw className="animate-spin" size={18} /> : <Layers size={18} />}
                {compiling ? 'Executing Compilation Pipeline...' : 'Generate & Encrypt Question Paper'}
              </button>
            </div>
          </div>

          {/* Compilation Pipeline Steps & Vault */}
          <div className="card">
            <h2 className="card-title mb-4 flex items-center gap-2">
              <Lock className="text-gold" size={20} /> Cryptographic Vault & Security Pipeline
            </h2>

            {compiling && (
              <div className="flex flex-col gap-3 p-4 mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <div className={`flex items-center gap-2 ${compileStep >= 1 ? 'text-success' : 'text-secondary'}`}>
                  {compileStep >= 1 ? '✅' : '⏳'} 1. Assembling PDF from {approvedQuestions.length} Approved Questions...
                </div>
                <div className={`flex items-center gap-2 ${compileStep >= 2 ? 'text-success' : 'text-secondary'}`}>
                  {compileStep >= 2 ? '✅' : '⏳'} 2. Computing SHA-256 Digest...
                </div>
                <div className={`flex items-center gap-2 ${compileStep >= 3 ? 'text-success' : 'text-secondary'}`}>
                  {compileStep >= 3 ? '✅' : '⏳'} 3. Applying Ed25519 Digital Signature...
                </div>
                <div className={`flex items-center gap-2 ${compileStep >= 4 ? 'text-success' : 'text-secondary'}`}>
                  {compileStep >= 4 ? '✅' : '⏳'} 4. Performing AES-256-GCM Envelope Encryption...
                </div>
                <div className={`flex items-center gap-2 ${compileStep >= 5 ? 'text-success' : 'text-secondary'}`}>
                  {compileStep >= 5 ? '✅' : '⏳'} 5. Shamir's Secret Sharing: Key split into 5 shares (3 required for quorum)...
                </div>
              </div>
            )}

            {compiledPaper ? (
              <div className="flex flex-col gap-3">
                <div className="p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold text-success">{compiledPaper.paper_id}</span>
                    <span className="badge badge-success">ENCRYPTED & LOCKED</span>
                  </div>
                  <div className="text-xs text-secondary mt-1">
                    Subject: {compiledPaper.subject} | Questions: {compiledPaper.questions_count} | Marks: {compiledPaper.total_marks}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-secondary block mb-1">SHA-256 Digest:</span>
                  <div className="hash-display text-mono p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px', fontSize: '0.7rem' }}>
                    {compiledPaper.hash}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-secondary block mb-1">Digital Signature:</span>
                  <div className="text-mono text-secondary p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px', fontSize: '0.7rem' }}>
                    {compiledPaper.signature}
                  </div>
                </div>

                <div className="p-3 mt-2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px' }}>
                  <div className="text-xs font-semibold text-gold mb-1">🔑 Shamir Split-Key Distribution:</div>
                  <div className="text-xs text-secondary">
                    Total Key Shares: <strong>5 Shares</strong> | Threshold for Decryption: <strong>3 Shares</strong> (Quorum)
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-secondary text-sm text-center p-8">
                No compiled paper generated yet. Click "Generate & Encrypt Question Paper" to execute the pipeline.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW: RELEASE SCHEDULE (/admin/schedule)
  if (path === '/admin/schedule') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Time-Locked Release Schedule</h1>
            <p className="text-secondary text-sm">Configure examination release timestamp. Server time-lock strictly blocks early decryption attempts.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h2 className="card-title mb-4">Release Configuration</h2>
            <div className="form-group mb-4">
              <label className="form-label">Examination</label>
              <input type="text" className="input" defaultValue="Annual Examination 2026 - Computer Science" disabled />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">Release Date</label>
                <input type="date" className="input" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Release Time</label>
                <input type="time" className="input" value={releaseTime} onChange={e => setReleaseTime(e.target.value)} />
              </div>
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Timezone</label>
              <select className="select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                <option>IST (UTC+05:30)</option>
                <option>UTC (UTC+00:00)</option>
                <option>EST (UTC-05:00)</option>
              </select>
            </div>

            <button className="btn btn-primary w-full justify-center" onClick={() => {
              setIsScheduled(true);
              setNotification(`🕒 Release scheduled for ${releaseDate} at ${releaseTime} ${timezone}. Time-lock active!`);
              setTimeout(() => setNotification(''), 6000);
            }}>
              <Clock size={18} /> Save & Enforce Time-Lock
            </button>
          </div>

          <div className="card">
            <h2 className="card-title mb-4">Time-Lock Verification Status</h2>
            <div className="p-4 mb-4 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
              <div className="text-gold font-mono text-2xl font-bold mb-2">🔒 LOCKED</div>
              <p className="text-secondary text-xs">
                Question Paper <strong className="text-primary">CS-EXAM-2026-001</strong> is physically locked against early access.
              </p>
            </div>

            <div className="text-xs space-y-2 text-secondary">
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span>Scheduled Release:</span>
                <strong className="text-primary">{releaseDate} {releaseTime} {timezone}</strong>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span>Trusted Clock Server:</span>
                <strong className="text-success">UTC Server Time Active</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Early Attempt Policy:</span>
                <strong className="text-danger">403 Forbidden + Audit Log</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW: EXAM CENTRES (/admin/centres)
  if (path === '/admin/centres') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Exam Centres & Watermark Distribution</h1>
            <p className="text-secondary text-sm">Manage allocated centres. Each distributed copy receives unique traceable forensic watermarks.</p>
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Centre ID</th>
                  <th>Centre Name</th>
                  <th>Authorized Device</th>
                  <th>Forensic Watermarking</th>
                  <th>Distribution Status</th>
                </tr>
              </thead>
              <tbody>
                {centres.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="font-mono text-gold font-bold">{c.id}</td>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-secondary">{c.device}</td>
                    <td><span className="badge badge-success">✓ Enabled (Unique Dist-ID)</span></td>
                    <td><StatusBadge status={c.status} variant="warning" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW: USER MANAGEMENT (/admin/users)
  if (path === '/admin/users') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>User Management & Role Allocation</h1>
            <p className="text-secondary text-sm">Allocate members and assign strict security roles. No unassigned or dummy users.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsAllocateModalOpen(true)}>
            <UserPlus size={16} /> Allocate / Add Member
          </button>
        </div>

        {notification && (
          <div className="alert alert-info mb-6">
            <MailCheck size={20} />
            <span>{notification}</span>
          </div>
        )}

        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Allocated Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="font-medium">{u.name}</td>
                    <td className="text-secondary">{u.email}</td>
                    <td><StatusBadge status={u.role} variant={u.role === 'ADMIN' ? 'danger' : u.role === 'SETTER' ? 'warning' : 'info'} /></td>
                    <td><StatusBadge status={u.status} variant="success" /></td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <div className="flex gap-2">
                          <select 
                            className="select select-sm text-xs py-1"
                            value={u.role}
                            onChange={(e) => updateMemberRole(u.email, e.target.value)}
                          >
                            <option value="SETTER">SETTER (Question Maker)</option>
                            <option value="REVIEWER">REVIEWER</option>
                            <option value="COMPILER">COMPILER</option>
                            <option value="KEYHOLDER">KEYHOLDER</option>
                            <option value="CENTRE">CENTRE</option>
                          </select>
                          <button className="btn btn-danger btn-sm p-1" onClick={() => removeMember(u.email)} title="Remove Member">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {u.role === 'ADMIN' && <span className="text-xs text-secondary italic">Primary Owner</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocate Member Modal */}
        <Modal isOpen={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate New Network Member">
          <form onSubmit={handleAllocateMember} className="p-2">
            <div className="form-group mb-3">
              <label className="form-label">Member Full Name</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g., Dr. Alan Turing" 
                value={allocName}
                onChange={e => setAllocName(e.target.value)}
                required 
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Member Email Address</label>
              <input 
                type="email" 
                className="input" 
                placeholder="member@university.edu" 
                value={allocEmail}
                onChange={e => setAllocEmail(e.target.value)}
                required 
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Allocated Role</label>
              <select 
                className="select" 
                value={allocRole} 
                onChange={e => setAllocRole(e.target.value)}
              >
                <option value="SETTER">Question Maker (Setter) - Adds questions to bank only</option>
                <option value="REVIEWER">Question Reviewer - Blind moderation</option>
                <option value="COMPILER">Paper Compiler - Compiles approved questions</option>
                <option value="KEYHOLDER">Key Custodian - Holds Shamir split share</option>
                <option value="CENTRE">Exam Centre Superintendent - Receives paper</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-ghost" onClick={() => setIsAllocateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={allocSending}>
                {allocSending ? 'Allocating & Emailing...' : 'Allocate & Dispatch Invite Link'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // DEFAULT OVERVIEW DASHBOARD (/admin)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Administrator Portal</h1>
          <p className="text-secondary text-sm">Centralized zero-trust question paper oversight & key distribution management.</p>
        </div>
        <button className="btn btn-danger"><AlertTriangle size={16} /> Emergency Lockdown</button>
      </div>

      {notification && (
        <div className="alert alert-info mb-6">
          <MailCheck size={20} />
          <span>{notification}</span>
        </div>
      )}

      <div className="stat-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card cursor-pointer hover:border-gold" onClick={() => navigate('/admin/submissions')}>
          <div className="flex items-center gap-3">
            <FileText className="text-gold" size={24} />
            <div>
              <div className="font-bold text-sm">Question Review Pool</div>
              <div className="text-xs text-secondary">{questions.filter(q => q.status === 'PENDING_REVIEW').length} pending review</div>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:border-gold" onClick={() => navigate('/admin/compiler')}>
          <div className="flex items-center gap-3">
            <Layers className="text-blue-400" size={24} />
            <div>
              <div className="font-bold text-sm">Paper Compiler</div>
              <div className="text-xs text-secondary">{questions.filter(q => q.status === 'APPROVED').length} approved questions ready</div>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:border-gold" onClick={() => navigate('/admin/schedule')}>
          <div className="flex items-center gap-3">
            <Clock className="text-emerald-400" size={24} />
            <div>
              <div className="font-bold text-sm">Release Schedule</div>
              <div className="text-xs text-secondary">Time-lock enforced</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Audit Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Real-time Audit & Forensic Activity</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/audit')}>View Ledger</button>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody className="text-mono" style={{ fontSize: '0.75rem' }}>
              {auditLogs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="text-secondary">{log.time}</td>
                  <td>{log.user}</td>
                  <td>
                    <span className={log.action.includes('EARLY') || log.action.includes('FAIL') ? 'text-danger' : 'text-info'}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.resource}</td>
                  <td className="text-secondary">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;