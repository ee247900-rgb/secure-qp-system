import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, Users, FileText, Activity, AlertTriangle, 
  PenTool, CheckSquare, Layers, Key, Download, LayoutDashboard, Database,
  Bell, UserPlus
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  
  const getLinks = () => {
    switch(user?.role) {
      case 'admin':
        return [
          { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
          { to: '/admin/submissions', icon: FileText, label: 'Question Submissions' },
          { to: '/admin/review', icon: CheckSquare, label: 'Question Review' },
          { to: '/admin/compiler', icon: Layers, label: 'Paper Compiler' },
          { to: '/admin/vault', icon: Shield, label: 'Encrypted Vault' },
          { to: '/admin/schedule', icon: Activity, label: 'Release Schedule' },
          { to: '/admin/centres', icon: Download, label: 'Exam Centres' },
          { to: '/admin/users', icon: Users, label: 'User Management' },
          { to: '/admin/requests', icon: UserPlus, label: 'Access Requests' },
          { to: '/admin/audit', icon: Activity, label: 'Audit Ledger' },
          { to: '/admin/alerts', icon: AlertTriangle, label: 'Security Alerts' },
        ];
      case 'setter':
        return [
          { to: '/setter', icon: LayoutDashboard, label: 'Maker Dashboard' },
          { to: '/setter/create', icon: PenTool, label: 'Create Question' },
          { to: '/setter/my-questions', icon: FileText, label: 'My Questions' },
          { to: '/setter/status', icon: CheckSquare, label: 'Question Status' },
          { to: '/setter/notifications', icon: Bell, label: 'Notifications' },
          { to: '/setter/profile', icon: Users, label: 'My Profile' },
        ];
      case 'reviewer':
        return [
          { to: '/reviewer', icon: LayoutDashboard, label: 'Review Queue' },
          { to: '/reviewer/history', icon: CheckSquare, label: 'My Reviews' },
        ];
      case 'compiler':
        return [
          { to: '/compiler', icon: Layers, label: 'Compile Paper' },
          { to: '/admin/vault', icon: Shield, label: 'Encrypted Vault' },
        ];
      case 'keyholder':
        return [
          { to: '/keyholder', icon: Key, label: 'My Key Shares' },
        ];
      case 'centre':
        return [
          { to: '/centre', icon: Download, label: 'Download Paper' },
        ];
      default:
        return [
          { to: '/setter', icon: LayoutDashboard, label: 'Maker Dashboard' },
        ];
    }
  };

  const links = getLinks();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Shield size={28} className="text-gold" />
        <span className="sidebar-logo-text">SecureQP</span>
      </div>
      
      <nav className="sidebar-nav">
        {links.map((link, idx) => (
          <NavLink 
            key={idx} 
            to={link.to} 
            className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={link.to.split('/').length <= 2}
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile-mini">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="text-primary truncate" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {user?.email}
            </div>
            <div className="text-secondary uppercase" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              {user?.role}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
