import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../contexts/AuthContext';

const DashboardShell = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner spinner-lg"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
