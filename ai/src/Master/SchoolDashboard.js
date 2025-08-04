import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SchoolDashboard = ({ school, onTeacherSelect }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (school) {
      fetchSchoolData();
    }
  }, [school]);

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      // Fetch school statistics
      const statsResponse = await axios.get(`${API_BASE_URL}/get_school_stats.php?school_id=${school.id}`);
      setStats(statsResponse.data);

      // Fetch teachers for this school
      const teachersResponse = await axios.get(`${API_BASE_URL}/get_school_teachers.php?school_id=${school.id}`);
      setTeachers(teachersResponse.data.teachers || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching school data:', err);
      setError('Failed to load school data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading school data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchSchoolData}>🔄 Retry</button>
      </div>
    );
  }

  return (
    <div className="school-dashboard">
      {/* School Header */}
      <div className="school-header">
        <div className="school-info">
          <h2>🏫 {school.name}</h2>
          <p className="school-details">
            📍 {school.address} | 📞 {school.phone} | ✉️ {school.email}
          </p>
          {school.principal && (
            <p className="principal-info">👨‍💼 Principal: {school.principal}</p>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>{stats.totalClasses || 0}</h3>
            <p>Total Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>{stats.totalTeachers || 0}</h3>
            <p>Total Teachers</p>
          </div>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="teachers-section">
        <div className="section-header">
          <h3>👨‍🏫 Teachers</h3>
          <p>Click on any teacher to view their classes</p>
        </div>

        {teachers.length === 0 ? (
          <div className="empty-state">
            <p>No teachers found for this school.</p>
          </div>
        ) : (
          <div className="teachers-grid">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-header">
                  <div className="teacher-avatar">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="teacher-info">
                    <h4>{teacher.name}</h4>
                    <p className="teacher-id">ID: {teacher.id}</p>
                  </div>
                </div>
                
                <div className="teacher-details">
                  <p><strong>Email:</strong> {teacher.email || 'Not provided'}</p>
                  <p><strong>Phone:</strong> {teacher.phone || 'Not provided'}</p>
                  <p><strong>Subject:</strong> {teacher.subject || 'Not specified'}</p>
                </div>

                <div className="teacher-stats">
                  <span className="stat-item">
                    📚 {teacher.total_classes || 0} Classes
                  </span>
                  <span className="stat-item">
                    👥 {teacher.total_students || 0} Students
                  </span>
                </div>

                <button 
                  className="view-classes-btn"
                  onClick={() => onTeacherSelect(teacher)}
                >
                  View Classes →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDashboard;