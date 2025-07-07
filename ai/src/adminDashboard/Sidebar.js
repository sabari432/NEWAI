import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview & Stats'
    },
    {
      id: 'students',
      label: 'Students',
      icon: '👥',
      description: 'Student Management'
    },
    {
      id: 'users',
      label: 'Users',
      icon: '👤',
      description: 'User Management'
    },
    {
      id: 'content',
      label: 'Content',
      icon: '📚',
      description: 'Reading Materials'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Performance Reports'
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>Main Menu</h3>
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="sidebar-stats">
          <h3>Quick Stats</h3>
          <div className="quick-stat">
            <span className="stat-icon">👥</span>
            <div>
              <div className="stat-number">156</div>
              <div className="stat-label">Active Students</div>
            </div>
          </div>
          <div className="quick-stat">
            <span className="stat-icon">📖</span>
            <div>
              <div className="stat-number">1,247</div>
              <div className="stat-label">Reading Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="admin-info">
          <div className="admin-avatar">A</div>
          <div className="admin-details">
            <div className="admin-name">Admin User</div>
            <div className="admin-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;