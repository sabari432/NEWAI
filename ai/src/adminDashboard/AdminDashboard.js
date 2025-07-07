import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import StudentsTable from './StudentsTable';
import UsersTable from './UsersTable';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome />;
      case 'students':
        return <StudentsTable />;
      case 'users':
        return <UsersTable />;
      case 'content':
        return <div className="content-management">Content Management Coming Soon</div>;
      case 'analytics':
        return <div className="analytics">Analytics Coming Soon</div>;
      default:
        return <DashboardHome />;
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">ReadSmart</span>
          </div>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
          <div className="admin-badge">Admin</div>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
        />

        {/* Main Content */}
        <main className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
          <div className="content-header">
            <div className="breadcrumb">
              <button 
                className="back-btn"
                onClick={() => setActiveTab('dashboard')}
              >
                ← Back
              </button>
              <h1>Admin Panel</h1>
            </div>
            <button className="logout-btn-mobile" onClick={handleLogout}>
              Logout
            </button>
          </div>
          
          <div className="dashboard-content">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;