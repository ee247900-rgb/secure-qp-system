import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Bell, LogOut, ShieldCheck, Sun, Moon, Globe, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const { user, logout, currentNetwork } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left flex items-center gap-3">
        {currentNetwork && (
          <div 
            className="badge badge-info flex items-center gap-1.5"
            style={{ 
              fontSize: '0.8rem', 
              padding: '6px 12px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <Globe size={14} className="text-blue-400" />
            <span>Network: <strong>{currentNetwork.name || 'Active Network'}</strong></span>
            {currentNetwork.code && <span className="text-mono text-xs opacity-75">({currentNetwork.code})</span>}
          </div>
        )}
      </div>
      
      <div className="topbar-right flex items-center gap-3">
        <div className="security-indicator">
          <div className="security-dot"></div>
          Zero-Trust Channel
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button 
          onClick={toggleTheme} 
          className="btn btn-ghost" 
          style={{ padding: '0.5rem', borderRadius: '8px' }} 
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={18} className="text-gold" /> : <Moon size={18} />}
        </button>
        
        {/* User Info & Role Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid var(--border-color)' }}>
            <div className="flex flex-col text-right">
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.email}</span>
              <span className="text-secondary text-xs uppercase font-mono">{user.role}</span>
            </div>
            <span className={`badge badge-${user.role === 'admin' ? 'danger' : 'info'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
              {user.role}
            </span>
          </div>
        )}
        
        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.5rem' }} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
