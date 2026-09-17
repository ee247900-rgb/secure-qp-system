import React, { useState } from 'react';
import { 
  Database, Plus, Users, Key, Copy, Check, Lock, Globe, 
  Send, FilePlus, ChevronRight, Filter, ShieldCheck 
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

const QuestionBanksPage = () => {
  const [banks, setBanks] = useState([
    {
      id: 'b1',
      name: 'Computer Science Department Bank',
      description: 'Shared question bank for Data Structures, Algorithms, and Operating Systems.',
      code: 'BANK-CS-8812',
      is_public: false,
      members_count: 5,
      questions_count: 34,
      role: 'OWNER'
    },
    {
      id: 'b2',
      name: 'National Physics Experts Network',
      description: 'Collaborative network for Quantum Physics & Applied Electromagnetics.',
      code: 'BANK-PHY-9941',
      is_public: true,
      members_count: 12,
      questions_count: 88,
      role: 'CONTRIBUTOR'
    }
  ]);

  const [selectedBank, setSelectedBank] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // New Bank Form State
  const [newBankName, setNewBankName] = useState('');
  const [newBankDesc, setNewBankDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Join Code Input State
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Questions in Selected Network
  const [networkQuestions, setNetworkQuestions] = useState([
    { id: 'q1', author: 'Dr. A. Sharma', content: 'What is the time complexity of QuickSort in the worst-case scenario?', subject: 'Algorithms', difficulty: 'MEDIUM', marks: 2 },
    { id: 'q2', author: 'Prof. R. Kumar', content: 'Explain Dijkstra\'s Shortest Path Algorithm with a step-by-step example graph.', subject: 'Data Structures', difficulty: 'HARD', marks: 10 },
    { id: 'q3', author: 'Controller of Exams', content: 'Define Virtual Memory and Page Fault handling in modern Operating Systems.', subject: 'OS', difficulty: 'EASY', marks: 5 }
  ]);

  // New Question Form State inside Network
  const [newQText, setNewQText] = useState('');
  const [newQMarks, setNewQMarks] = useState(2);
  const [newQDiff, setNewQDiff] = useState('MEDIUM');

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleCreateBank = (e) => {
    e.preventDefault();
    if (!newBankName) return;
    const randomCode = `BANK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newBank = {
      id: `b-${Date.now()}`,
      name: newBankName,
      description: newBankDesc,
      code: randomCode,
      is_public: isPublic,
      members_count: 1,
      questions_count: 0,
      role: 'OWNER'
    };
    setBanks([newBank, ...banks]);
    setNewBankName('');
    setNewBankDesc('');
    setIsCreateOpen(false);
  };

  const handleJoinBank = (e) => {
    e.preventDefault();
    if (!joinCodeInput) return;
    alert(`Successfully connected to Question Bank Network: ${joinCodeInput.toUpperCase()}`);
    setJoinCodeInput('');
    setIsJoinOpen(false);
  };

  const handleAddQuestionToBank = (e) => {
    e.preventDefault();
    if (!newQText) return;
    const newQ = {
      id: `q-${Date.now()}`,
      author: 'You (Current User)',
      content: newQText,
      subject: 'General',
      difficulty: newQDiff,
      marks: parseInt(newQMarks)
    };
    setNetworkQuestions([newQ, ...networkQuestions]);
    setNewQText('');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Question Bank Networks</h1>
          <p className="text-secondary text-sm">Collaborative multi-person question authoring and sharing network.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setIsJoinOpen(true)}>
            <Key size={16} /> Join Network with Code
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} /> Create New Bank Network
          </button>
        </div>
      </div>

      {!selectedBank ? (
        // Grid View of Banks
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {banks.map(bank => (
            <div key={bank.id} className="card card-glass flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="badge badge-info flex items-center gap-1">
                    {bank.is_public ? <Globe size={12} /> : <Lock size={12} />}
                    {bank.is_public ? 'Public Network' : 'Private Bank'}
                  </span>
                  <StatusBadge status={bank.role} variant={bank.role === 'OWNER' ? 'success' : 'neutral'} />
                </div>

                <h3 className="font-semibold text-lg mb-2">{bank.name}</h3>
                <p className="text-secondary text-sm mb-4" style={{ minHeight: '40px' }}>{bank.description}</p>
              </div>

              <div>
                <div className="flex justify-between items-center p-3 mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <div className="flex items-center gap-2">
                    <Key size={14} className="text-gold" />
                    <span className="text-mono font-bold text-gold text-sm">{bank.code}</span>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm text-xs p-1"
                    onClick={() => handleCopyCode(bank.code)}
                  >
                    {copiedCode === bank.code ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-secondary mb-4">
                  <span className="flex items-center gap-1"><Users size={14} /> {bank.members_count} Members</span>
                  <span className="flex items-center gap-1"><Database size={14} /> {bank.questions_count} Questions</span>
                </div>

                <button 
                  className="btn btn-outline w-full justify-center"
                  onClick={() => setSelectedBank(bank)}
                >
                  Open Network Feed <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Selected Bank Feed View
        <div>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedBank(null)}>
              ← Back to Networks
            </button>
            <span className="text-secondary">/</span>
            <span className="font-semibold text-gold">{selectedBank.name}</span>
          </div>

          <div className="card mb-6 flex justify-between items-center" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="text-gold" size={24} /> {selectedBank.name}
              </h2>
              <p className="text-secondary text-sm mt-1">{selectedBank.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-secondary">Invite Code</div>
                <div className="text-mono font-bold text-gold">{selectedBank.code}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleCopyCode(selectedBank.code)}>
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Feed of Contributed Questions */}
            <div className="card">
              <h3 className="card-title mb-4">Collaborative Question Feed</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {networkQuestions.map(q => (
                  <div key={q.id} className="p-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-info text-xs">{q.subject}</span>
                        <StatusBadge status={q.difficulty} />
                        <span className="text-secondary text-xs">{q.marks} Marks</span>
                      </div>
                      <span className="text-xs text-gold flex items-center gap-1 font-medium">
                        <ShieldCheck size={14} /> Contributed by: {q.author}
                      </span>
                    </div>

                    <p className="text-primary font-medium mb-3">{q.content}</p>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary">Status: Approved in Network</span>
                      <button className="btn btn-ghost btn-sm text-xs">
                        <FilePlus size={14} /> Import to Active Exam
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contribute Question Form */}
            <div className="card">
              <h3 className="card-title mb-4 flex items-center gap-2">
                <Send size={18} className="text-gold" /> Contribute to Bank
              </h3>

              <form onSubmit={handleAddQuestionToBank}>
                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea 
                    className="textarea" 
                    placeholder="Enter question text to share with network..."
                    value={newQText}
                    onChange={e => setNewQText(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Marks</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={newQMarks}
                    onChange={e => setNewQMarks(e.target.value)}
                    min="1" max="20"
                  />
                </div>

                <div className="form-group mb-6">
                  <label className="form-label">Difficulty</label>
                  <select 
                    className="select" 
                    value={newQDiff}
                    onChange={e => setNewQDiff(e.target.value)}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary w-full justify-center">
                  Publish to Network
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Bank Network */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Question Bank Network">
        <form onSubmit={handleCreateBank}>
          <div className="form-group">
            <label className="form-label">Network Name</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g., Computer Science Faculty Pool"
              value={newBankName}
              onChange={e => setNewBankName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="textarea" 
              placeholder="Describe the subjects and purpose of this bank network..."
              value={newBankDesc}
              onChange={e => setNewBankDesc(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={e => setIsPublic(e.target.checked)} 
              />
              <span className="text-sm">Allow any authenticated educator to discover & join</span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Network</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Join Bank Network */}
      <Modal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} title="Join Question Bank Network">
        <form onSubmit={handleJoinBank}>
          <div className="form-group mb-6">
            <label className="form-label">Enter Invite Code</label>
            <input 
              type="text" 
              className="input text-mono text-center uppercase" 
              placeholder="e.g., BANK-CS-8812"
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value)}
              style={{ fontSize: '1.25rem', letterSpacing: '0.1em' }}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setIsJoinOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Connect to Network</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QuestionBanksPage;
