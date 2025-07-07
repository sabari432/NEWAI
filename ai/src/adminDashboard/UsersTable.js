import React, { useState } from 'react';

const UsersTable = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Administrator',
      email: 'john.admin@readsmart.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2025-07-01',
      createdAt: '2025-01-15',
      permissions: ['read', 'write', 'delete', 'manage_users']
    },
    {
      id: 2,
      name: 'Sarah Teacher',
      email: 'sarah.teacher@school.edu',
      role: 'teacher',
      status: 'active',
      lastLogin: '2025-06-30',
      createdAt: '2025-02-20',
      permissions: ['read', 'write', 'manage_students']
    },
    {
      id: 3,
      name: 'Mike Moderator',
      email: 'mike.mod@readsmart.com',
      role: 'moderator',
      status: 'active',
      lastLogin: '2025-06-29',
      createdAt: '2025-03-10',
      permissions: ['read', 'write', 'moderate_content']
    },
    {
      id: 4,
      name: 'Lisa Viewer',
      email: 'lisa.viewer@email.com',
      role: 'viewer',
      status: 'inactive',
      lastLogin: '2025-06-25',
      createdAt: '2025-04-05',
      permissions: ['read']
    }
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer',
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'red' },
    { value: 'teacher', label: 'Teacher', color: 'blue' },
    { value: 'moderator', label: 'Moderator', color: 'green' },
    { value: 'viewer', label: 'Viewer', color: 'gray' }
  ];

  const getRoleConfig = (role) => {
    return roles.find(r => r.value === role) || roles[3];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
      const rolePermissions = {
        admin: ['read', 'write', 'delete', 'manage_users'],
        teacher: ['read', 'write', 'manage_students'],
        moderator: ['read', 'write', 'moderate_content'],
        viewer: ['read']
      };

      const userToAdd = {
        id: Date.now(),
        ...newUser,
        lastLogin: 'Never',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: rolePermissions[newUser.role] || ['read']
      };

      setUsers([...users, userToAdd]);
      setNewUser({ name: '', email: '', role: 'viewer', status: 'active' });
      setShowAddUser(false);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleStatusChange = (userId, newStatus) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleRoleChange = (userId, newRole) => {
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users'],
      teacher: ['read', 'write', 'manage_students'],
      moderator: ['read', 'write', 'moderate_content'],
      viewer: ['read']
    };

    setUsers(users.map(user => 
      user.id === userId ? { 
        ...user, 
        role: newRole,
        permissions: rolePermissions[newRole] || ['read']
      } : user
    ));
  };

  return (
    <div className="users-table-container">
      <div className="table-header">
        <h2>User Management</h2>
        <p>Manage system users, roles, and permissions</p>
      </div>

      {/* Controls */}
      <div className="table-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          className="add-user-btn"
          onClick={() => setShowAddUser(!showAddUser)}
        >
          + Add User
        </button>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <div className="add-user-form">
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add User</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowAddUser(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User Statistics */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.status === 'active').length}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Administrators</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.filter(u => u.role === 'teacher').length}</div>
          <div className="stat-label">Teachers</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className={`user-avatar ${user.status}`}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`role-select ${roleConfig.color}`}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`status-select ${user.status}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td>
                    <span className="last-login">
                      {user.lastLogin === 'Never' ? 'Never' : new Date(user.lastLogin).toLocaleDateString()}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="permissions-list">
                      {user.permissions.map((permission, index) => (
                        <span key={index} className="permission-badge">
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" title="Edit User">✏️</button>
                      <button className="reset-btn" title="Reset Password">🔑</button>
                      <button 
                        className="delete-btn" 
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default UsersTable;