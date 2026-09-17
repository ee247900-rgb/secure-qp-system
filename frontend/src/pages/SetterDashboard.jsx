import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { 
  PenTool, CheckCircle, XCircle, Clock, FileText, Send, 
  Save, AlertCircle, Bell, User, Check, Trash2, Plus, Sparkles
} from 'lucide-react';

const SetterDashboard = () => {
  const { user, currentNetwork } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Question Maker's Submissions (Scoped to current maker)
  const [makerQuestions, setMakerQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('qp_admin_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter by user's email if available, otherwise show maker's authored questions
        const filtered = parsed.filter(q => q.author === user?.email);
        if (filtered.length > 0) return filtered;
      }
      return [
        {
          id: 'QM-001',
          author: user?.email || 'maker@university.edu',
          exam: 'Annual Examination 2026',
          subject: 'Computer Science',
          topic: 'Data Structures',
          question_text: 'Explain the difference between AVL Tree and Red-Black Tree in terms of height balancing and rotation frequency.',
          question_type: 'LONG',
          marks: 10,
          difficulty: 'HARD',
          options: [],
          correct_answer: 'AVL trees are strictly balanced with height diff <= 1, while Red-Black trees allow color properties.',
          explanation: 'Standard tree data structures syllabus section 3.',
          status: 'APPROVED',
          submitted_at: '2026-09-15 14:20',
          rejection_reason: ''
        },
        {
          id: 'QM-002',
          author: user?.email || 'maker@university.edu',
          exam: 'Annual Examination 2026',
          subject: 'Computer Science',
          topic: 'Operating Systems',
          question_text: 'Which scheduling algorithm can lead to starvation if not modified with aging?',
          question_type: 'MCQ',
          marks: 2,
          difficulty: 'MEDIUM',
          options: ['First-Come, First-Served (FCFS)', 'Round Robin', 'Shortest Job First (SJF)', 'Earliest Deadline First'],
          correct_answer: 'Shortest Job First (SJF)',
          explanation: 'Long processes wait indefinitely if short processes keep arriving.',
          status: 'PENDING_REVIEW',
          submitted_at: '2026-09-16 09:10',
          rejection_reason: ''
        }
      ];
    } catch {
      return [];
    }
  });

  // Form State for Create Question
  const [examName, setExamName] = useState('Annual Examination 2026');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [marks, setMarks] = useState(2);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [explanation, setExplanation] = useState('');

  const [notification, setNotification] = useState('');

  // Handle MCQ Options change
  const handleOptionChange = (index, value) => {
    const updated = [...mcqOptions];
    updated[index] = value;
    setMcqOptions(updated);
  };

  // Submit / Save Draft Question
  const handleSaveQuestion = (isSubmit = true) => {
    if (!topic || !questionText) {
      alert('Please fill in Topic and Question Text');
      return;
    }

    const newQ = {
      id: `QM-${Date.now().toString().slice(-4)}`,
      author: user?.email || 'maker@university.edu',
      exam: examName,
      subject: subject,
      topic: topic,
      question_text: questionText,
      question_type: questionType,
      options: questionType === 'MCQ' ? mcqOptions.filter(Boolean) : [],
      correct_answer: correctAnswer,
      marks: parseInt(marks, 10),
      difficulty: difficulty,
      explanation: explanation,
      status: isSubmit ? 'PENDING_REVIEW' : 'DRAFT',
      submitted_at: new Date().toLocaleString(),
      rejection_reason: ''
    };

    const updated = [newQ, ...makerQuestions];
    setMakerQuestions(updated);

    // Save to shared pool so Admin portal receives it in real-time
    try {
      const allPool = JSON.parse(localStorage.getItem('qp_admin_questions') || '[]');
      localStorage.setItem('qp_admin_questions', JSON.stringify([newQ, ...allPool]));
    } catch (e) {
      console.log('Sync to pool error:', e);
    }

    setNotification(isSubmit ? '🎉 Question submitted for Admin review!' : '💾 Question saved as Draft.');
    setTopic('');
    setQuestionText('');
    setExplanation('');
    setCorrectAnswer('');
    setMcqOptions(['', '', '', '']);
    setTimeout(() => setNotification(''), 6000);

    navigate('/setter/my-questions');
  };

  const stats = [
    { label: 'Total Submitted', value: makerQuestions.length.toString(), icon: PenTool, color: 'var(--info)' },
    { label: 'Pending Review', value: makerQuestions.filter(q => q.status === 'PENDING_REVIEW').length.toString(), icon: Clock, color: 'var(--warning)' },
    { label: 'Accepted Questions', value: makerQuestions.filter(q => q.status === 'APPROVED').length.toString(), icon: CheckCircle, color: 'var(--success)' },
    { label: 'Rejected Questions', value: makerQuestions.filter(q => q.status === 'REJECTED').length.toString(), icon: XCircle, color: 'var(--danger)' },
  ];

  // SUB-VIEW: CREATE QUESTION (/setter/create)
  if (path === '/setter/create') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create Examination Question</h1>
            <p className="text-secondary text-sm">Add questions to the secure question bank. Admin will review before final compilation.</p>
          </div>
        </div>

        {notification && (
          <div className="alert alert-info mb-6">
            <Check size={20} />
            <span>{notification}</span>
          </div>
        )}

        <div className="card">
          <form className="animate-fadeIn">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">Examination</label>
                <select className="select" value={examName} onChange={e => setExamName(e.target.value)}>
                  <option>Annual Examination 2026</option>
                  <option>Midterm Examination 2026</option>
                  <option>National Competitive Exam 2026</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="select" value={subject} onChange={e => setSubject(e.target.value)}>
                  <option>Computer Science</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                </select>
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Topic / Unit</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g., Dynamic Programming & Graph Theory"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Question Text</label>
              <textarea 
                className="textarea" 
                rows={4}
                placeholder="Enter complete question statement here..."
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                required
              />
            </div>

            {/* Question Type, Marks, Difficulty */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label">Question Type</label>
                <select className="select" value={questionType} onChange={e => setQuestionType(e.target.value)}>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="SHORT">Short Answer</option>
                  <option value="LONG">Long Answer / Essay</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marks</label>
                <input 
                  type="number" 
                  className="input" 
                  min="1" 
                  max="20" 
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty Level</label>
                <select className="select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {/* MCQ Options If MCQ */}
            {questionType === 'MCQ' && (
              <div className="p-4 mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <label className="form-label mb-2 block">Multiple Choice Options</label>
                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((optLabel, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-gold font-bold text-sm">{optLabel}.</span>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder={`Option ${optLabel}`}
                        value={mcqOptions[i] || ''}
                        onChange={e => handleOptionChange(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group mb-4">
              <label className="form-label">Correct Answer / Key</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g., Option B / Expected solution outline"
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
              />
            </div>

            <div className="form-group mb-6">
              <label className="form-label">Explanation / Reference (Optional)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Reference textbook section or syllabus chapter"
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-outline" onClick={() => handleSaveQuestion(false)}>
                <Save size={16} /> Save Draft
              </button>
              <button type="button" className="btn btn-primary" onClick={() => handleSaveQuestion(true)}>
                <Send size={16} /> Submit Question for Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // SUB-VIEW: MY QUESTIONS & STATUS (/setter/my-questions or /setter/status)
  if (path === '/setter/my-questions' || path === '/setter/status') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>My Submitted Questions & Status</h1>
            <p className="text-secondary text-sm">Track real-time review decisions by the Administrator. You can only view your own questions.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/setter/create')}>
            <Plus size={16} /> Submit New Question
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {makerQuestions.map(q => (
            <div key={q.id} className="card" style={{ borderLeft: q.status === 'APPROVED' ? '4px solid var(--success)' : q.status === 'REJECTED' ? '4px solid var(--danger)' : '4px solid var(--warning)' }}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gold">{q.id}</span>
                  <span className="badge badge-info">{q.subject}</span>
                  <span className="text-secondary text-xs">{q.topic}</span>
                  <span className="text-secondary text-xs">• {q.submitted_at}</span>
                </div>
                <StatusBadge 
                  status={q.status === 'PENDING_REVIEW' ? 'PENDING' : q.status} 
                  variant={q.status === 'APPROVED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'warning'} 
                />
              </div>

              <p className="text-primary text-sm my-2">{q.question_text}</p>

              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2 my-2 text-xs text-secondary">
                  {q.options.map((opt, i) => (
                    <div key={i}><strong className="text-gold">{String.fromCharCode(65 + i)}.</strong> {opt}</div>
                  ))}
                </div>
              )}

              {/* Admin Feedback / Rejection Reason */}
              {q.status === 'REJECTED' && q.rejection_reason && (
                <div className="alert alert-danger p-2 my-2 text-xs">
                  <strong>Admin Feedback:</strong> "{q.rejection_reason}"
                </div>
              )}

              {q.status === 'APPROVED' && (
                <div className="text-xs text-success flex items-center gap-1 mt-2">
                  <CheckCircle size={14} /> Accepted by Admin for examination compilation.
                </div>
              )}
            </div>
          ))}

          {makerQuestions.length === 0 && (
            <div className="card text-center p-8 text-secondary">
              You have not submitted any questions yet. Click "Submit New Question" to create your first question.
            </div>
          )}
        </div>
      </div>
    );
  }

  // SUB-VIEW: NOTIFICATIONS (/setter/notifications)
  if (path === '/setter/notifications') {
    return (
      <div>
        <h1 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Notifications & Alerts</h1>
        <div className="card">
          <div className="flex flex-col gap-3">
            {makerQuestions.filter(q => q.status === 'APPROVED').map(q => (
              <div key={q.id} className="p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <CheckCircle className="text-success" size={20} />
                <div className="text-xs">
                  <div className="font-semibold text-primary">Question Accepted!</div>
                  <div className="text-secondary">Your question <strong>{q.id}</strong> ({q.topic}) has been approved by the Administrator.</div>
                </div>
              </div>
            ))}

            {makerQuestions.filter(q => q.status === 'REJECTED').map(q => (
              <div key={q.id} className="p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                <XCircle className="text-danger" size={20} />
                <div className="text-xs">
                  <div className="font-semibold text-primary">Question Feedback / Rejection</div>
                  <div className="text-secondary">Question <strong>{q.id}</strong> was rejected. Reason: "{q.rejection_reason || 'Modification required'}"</div>
                </div>
              </div>
            ))}

            <div className="p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
              <Bell className="text-info" size={20} />
              <div className="text-xs">
                <div className="font-semibold text-primary">Zero-Trust Network Active</div>
                <div className="text-secondary">Connected to {currentNetwork?.name || 'Secure Network'}.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW: PROFILE (/setter/profile)
  if (path === '/setter/profile') {
    return (
      <div>
        <h1 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Question Maker Profile</h1>
        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-primary font-bold text-lg">{user?.email}</h2>
              <span className="badge badge-warning">ROLE: QUESTION MAKER (SETTER)</span>
            </div>
          </div>

          <div className="text-xs space-y-3 text-secondary">
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Assigned Network:</span>
              <strong className="text-primary">{currentNetwork?.name || 'Default Examination Network'}</strong>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Network Code:</span>
              <strong className="text-gold font-mono">{currentNetwork?.code || 'NET-SEC01'}</strong>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Permissions:</span>
              <strong className="text-success">Create & Submit Questions Only (Zero Content Leaks)</strong>
            </div>
            <div className="flex justify-between py-2">
              <span>MFA / Two-Factor Auth:</span>
              <strong className="text-success">Verified Active (OTP via Email)</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT DASHBOARD (/setter)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Question Maker Portal</h1>
          <p className="text-secondary text-sm">Secure question authoring workspace. Strict role-based isolation enforced.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/setter/create')}>
          <Plus size={16} /> Create New Question
        </button>
      </div>

      <div className="stat-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Quick Create Card */}
        <div className="card">
          <h2 className="card-title mb-2 flex items-center gap-2">
            <PenTool className="text-gold" size={20} /> Author Question
          </h2>
          <p className="text-secondary text-xs mb-4">Draft individual MCQ, Short, or Essay questions into the central bank.</p>
          <button className="btn btn-primary w-full justify-center" onClick={() => navigate('/setter/create')}>
            Open Question Editor
          </button>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="card-title mb-2 flex items-center gap-2">
            <Clock className="text-blue-400" size={20} /> Recent Submissions
          </h2>
          <div className="flex flex-col gap-2">
            {makerQuestions.slice(0, 3).map(q => (
              <div key={q.id} className="p-2 flex justify-between items-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                <span className="font-mono text-xs text-gold">{q.id}</span>
                <span className="text-secondary text-xs truncate max-w-xs">{q.topic}</span>
                <StatusBadge status={q.status === 'PENDING_REVIEW' ? 'PENDING' : q.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetterDashboard;