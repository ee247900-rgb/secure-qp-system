import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardShell from './components/layout/DashboardShell';
import AdminDashboard from './pages/AdminDashboard';
import SetterDashboard from './pages/SetterDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import CompilerDashboard from './pages/CompilerDashboard';
import KeyHolderPortal from './pages/KeyHolderPortal';
import CentrePortal from './pages/CentrePortal';
import QuestionBanksPage from './pages/QuestionBanksPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      
      {/* Protected Routes wrapped in DashboardShell */}
      <Route path="/" element={user ? <DashboardShell /> : <Navigate to="/login" />}>
        <Route index element={
          user?.role === 'admin' ? <Navigate to="/admin" /> :
          user?.role === 'setter' ? <Navigate to="/setter" /> :
          user?.role === 'reviewer' ? <Navigate to="/reviewer" /> :
          user?.role === 'compiler' ? <Navigate to="/compiler" /> :
          user?.role === 'keyholder' ? <Navigate to="/keyholder" /> :
          user?.role === 'centre' ? <Navigate to="/centre" /> :
          <Navigate to="/login" />
        } />
        
        <Route path="admin/*" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="setter/*" element={user?.role === 'setter' ? <SetterDashboard /> : <Navigate to="/" />} />
        <Route path="reviewer/*" element={user?.role === 'reviewer' ? <ReviewerDashboard /> : <Navigate to="/" />} />
        <Route path="compiler/*" element={user?.role === 'compiler' ? <CompilerDashboard /> : <Navigate to="/" />} />
        <Route path="keyholder/*" element={user?.role === 'keyholder' ? <KeyHolderPortal /> : <Navigate to="/" />} />
        <Route path="centre/*" element={user?.role === 'centre' ? <CentrePortal /> : <Navigate to="/" />} />
        <Route path="banks/*" element={<QuestionBanksPage />} />
      </Route>

      <Route path="*" element={<div className="content-wrapper"><h2>404 Not Found</h2></div>} />
    </Routes>
  );
}

export default App;
