import React, { useState, useEffect } from 'react';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalStudents: 156,
    readingSessions: 1247,
    avgWPM: 78,
    avgAccuracy: 87
  });

  const [contentItems, setContentItems] = useState([
    {
      id: 1,
      title: 'Daily Challenge - Animals',
      description: 'The elephant is the largest land animal...',
      grade: '3rd Grade',
      level: 'L2',
      type: 'daily-challenge'
    },
    {
      id: 2,
      title: 'Reading Module - Adventure',
      description: 'Once upon a time in a magical forest...',
      grade: '2nd Grade',
      level: 'L1',
      type: 'reading-module'
    }
  ]);

  const [newContent, setNewContent] = useState({
    title: '',
    type: 'Daily Challenge',
    grade: '',
    level: '',
    content: ''
  });

  const handleAddContent = (e) => {
    e.preventDefault();
    if (newContent.title && newContent.content) {
      const newItem = {
        id: Date.now(),
        title: newContent.title,
        description: newContent.content.substring(0, 50) + '...',
        grade: newContent.grade,
        level: newContent.level,
        type: newContent.type.toLowerCase().replace(' ', '-')
      };
      setContentItems([...contentItems, newItem]);
      setNewContent({
        title: '',
        type: 'Daily Challenge',
        grade: '',
        level: '',
        content: ''
      });
    }
  };

  const handleDeleteContent = (id) => {
    setContentItems(contentItems.filter(item => item.id !== id));
  };

  return (
    <div className="dashboard-home">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <div className="stat-label">Reading Sessions</div>
            <div className="stat-value">{stats.readingSessions}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <div className="stat-label">Avg WPM</div>
            <div className="stat-value">{stats.avgWPM}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-label">Avg Accuracy</div>
            <div className="stat-value">{stats.avgAccuracy}%</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button className="tab-btn active">Content Management</button>
        <button className="tab-btn">Student Monitoring</button>
        <button className="tab-btn">Analytics</button>
      </div>

      {/* Add New Content Section */}
      <div className="content-section">
        <div className="section-header">
          <h2>+ Add New Content</h2>
        </div>
        
        <form className="add-content-form" onSubmit={handleAddContent}>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Content title"
                value={newContent.title}
                onChange={(e) => setNewContent({...newContent, title: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={newContent.type}
                onChange={(e) => setNewContent({...newContent, type: e.target.value})}
              >
                <option value="Daily Challenge">Daily Challenge</option>
                <option value="Reading Module">Reading Module</option>
                <option value="Assessment">Assessment</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Grade</label>
              <select
                value={newContent.grade}
                onChange={(e) => setNewContent({...newContent, grade: e.target.value})}
              >
                <option value="">Select grade</option>
                <option value="1st Grade">1st Grade</option>
                <option value="2nd Grade">2nd Grade</option>
                <option value="3rd Grade">3rd Grade</option>
                <option value="4th Grade">4th Grade</option>
                <option value="5th Grade">5th Grade</option>
              </select>
            </div>
            <div className="form-group">
              <label>Level</label>
              <select
                value={newContent.level}
                onChange={(e) => setNewContent({...newContent, level: e.target.value})}
              >
                <option value="">Select level</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="L4">L4</option>
                <option value="L5">L5</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              placeholder="Enter the reading content..."
              rows="4"
              value={newContent.content}
              onChange={(e) => setNewContent({...newContent, content: e.target.value})}
            />
          </div>

          <button type="submit" className="add-content-btn">
            ⬇ Add Content
          </button>
        </form>
      </div>

      {/* Existing Content Section */}
      <div className="content-section">
        <div className="section-header">
          <h2>Existing Content</h2>
          <p>Manage your uploaded reading content</p>
        </div>

        <div className="content-list">
          {contentItems.map((item) => (
            <div key={item.id} className="content-item">
              <div className="content-info">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="content-meta">
                  <span className="grade-badge">{item.grade}</span>
                  <span className="level-badge">{item.level}</span>
                  <span className="type-badge">{item.type}</span>
                </div>
              </div>
              <div className="content-actions">
                <button className="edit-btn">✏️</button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteContent(item.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;