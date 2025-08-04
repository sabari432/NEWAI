import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const TeacherClasses = ({ teacher, school, onClassSelect }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (teacher && school) {
      fetchTeacherClasses();
    }
  }, [teacher, school]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/get_teacher_classes.php?teacher_id=${teacher.id}&school_id=${school.id}`
      );
      
      if (response.data.success) {
        setClasses(response.data.classes || []);
      } else {
        setClasses([]);
        setError(response.data.message || 'Failed to load classes');
      }
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
      setError('Failed to load teacher classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading {teacher.name}'s classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchTeacherClasses}>🔄 Retry</button>
      </div>
    );
  }

  return (
    <div className="teacher-classes">
      {/* Teacher Header */}
      <div className="teacher-header-detailed">
        <div className="teacher-avatar-large">
          {teacher.name.charAt(0).toUpperCase()}
        </div>
        <div className="teacher-info-detailed">
          <h2>{teacher.name}</h2>
          <p className="teacher-school">🏫 {school.name}</p>
          <div className="teacher-contact">
            {teacher.email && <span>✉️ {teacher.email}</span>}
            {teacher.phone && <span>📞 {teacher.phone}</span>}
            {teacher.subject && <span>📚 {teacher.subject}</span>}
          </div>
        </div>
      </div>

      {/* Classes Section */}
      <div className="classes-section">
        <div className="section-header">
          <h3>📚 Classes Taught by {teacher.name}</h3>
          <p>Click on any class to view student list</p>
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h4>No Classes Found</h4>
            <p>{teacher.name} is not assigned to any classes yet.</p>
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map((classItem) => (
              <div key={classItem.id} className="class-card">
                <div className="class-header">
                  <div className="class-icon">
                    🎓
                  </div>
                  <div className="class-info">
                    <h4>{classItem.name || classItem.class_name}</h4>
                    <p className="class-code">Class ID: {classItem.id}</p>
                  </div>
                </div>

                <div className="class-details">
                  <div className="detail-row">
                    <span className="label">📚 Subject:</span>
                    <span className="value">{classItem.subject || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🕐 Schedule:</span>
                    <span className="value">{classItem.schedule || 'Not set'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Room:</span>
                    <span className="value">{classItem.room || 'Not assigned'}</span>
                  </div>
                </div>

                <div className="class-stats">
                  <div className="stat-item">
                    <span className="stat-number">{classItem.student_count || 0}</span>
                    <span className="stat-label">Students</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{classItem.attendance_rate || '0%'}</span>
                    <span className="stat-label">Attendance</span>
                  </div>
                </div>

                <div className="class-actions">
                  <button 
                    className="view-students-btn"
                    onClick={() => onClassSelect({
                      ...classItem,
                      name: classItem.name || classItem.class_name
                    })}
                  >
                    👥 View Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="teacher-summary">
        <div className="summary-card">
          <h4>📊 Teaching Summary</h4>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-number">{classes.length}</span>
              <span className="summary-label">Total Classes</span>
            </div>
            <div className="summary-item">
              <span className="summary-number">
                {classes.reduce((total, cls) => total + (parseInt(cls.student_count) || 0), 0)}
              </span>
              <span className="summary-label">Total Students</span>
            </div>
            <div className="summary-item">
              <span className="summary-number">
                {classes.length > 0 ? Math.round(
                  classes.reduce((total, cls) => {
                    const rate = parseInt(cls.attendance_rate) || 0;
                    return total + rate;
                  }, 0) / classes.length
                ) : 0}%
              </span>
              <span className="summary-label">Avg. Attendance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;