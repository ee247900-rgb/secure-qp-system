import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { Eye, CheckSquare, XSquare, AlertCircle } from 'lucide-react';

const ReviewerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHistoryTab = location.pathname.includes('/history');

  const stats = [
    { label: 'Pending Reviews', value: '15', icon: Eye, color: 'var(--warning)' },
    { label: 'Approved Today', value: '8', icon: CheckSquare, color: 'var(--success)' },
    { label: 'Rejected Today', value: '2', icon: XSquare, color: 'var(--danger)' },
  ];

  const queue = [
    { id: 101, subject: 'Mathematics', marks: 5, difficulty: 'Hard', text: 'Evaluate the integral of e^(x^2) from 0 to infinity.', type: 'LONG' },
    { id: 102, subject: 'Physics', marks: 2, difficulty: 'Medium', text: 'What is the speed of light in a vacuum?', type: 'MCQ' },
  ];

  const history = [
    { id: 98, subject: 'Chemistry', decision: 'Approved', date: 'Today, 10:30 AM' },
    { id: 99, subject: 'Mathematics', decision: 'Rejected', date: 'Today, 11:15 AM' },
  ];

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Blind Review Panel</h1>
      
      <div className="stat-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="card">
        <div className="tabs-container">
          <div 
            className={`tab ${!isHistoryTab ? 'active' : ''}`} 
            onClick={() => navigate('/reviewer')}
          >
            Review Queue
          </div>
          <div 
            className={`tab ${isHistoryTab ? 'active' : ''}`} 
            onClick={() => navigate('/reviewer/history')}
          >
            My Reviews
          </div>
        </div>

        {!isHistoryTab ? (
          <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {queue.map(q => (
              <div key={q.id} className="card-glass" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <StatusBadge status={q.subject} variant="info" />
                    <StatusBadge status={`${q.marks} Marks`} variant="neutral" />
                    <StatusBadge status={q.difficulty} variant="neutral" />
                  </div>
                  <span className="text-secondary text-mono">ID: #{q.id}</span>
                </div>
                
                <div className="mb-6" style={{ fontSize: '1.125rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  {q.text}
                </div>

                <div className="form-group">
                  <label className="form-label">Reviewer Comments (Optional)</label>
                  <textarea className="textarea" placeholder="Provide feedback..." style={{ minHeight: '60px' }}></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-danger"><XSquare size={16} /> Reject</button>
                  <button className="btn btn-outline" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}><AlertCircle size={16} /> Request Changes</button>
                  <button className="btn btn-success"><CheckSquare size={16} /> Approve</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container animate-fadeIn">
            <table className="table">
              <thead>
                <tr>
                  <th>Q.ID</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="table-row">
                    <td className="text-mono">#{h.id}</td>
                    <td>{h.subject}</td>
                    <td className="text-secondary">{h.date}</td>
                    <td><StatusBadge status={h.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerDashboard;
