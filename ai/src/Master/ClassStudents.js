import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ClassStudents = ({ classData, teacher, school }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (classData && teacher && school) {
      fetchClassStudents();
    }
  }, [classData, teacher, school]);

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/get_class_students.php?class_id=${classData.id}&teacher_id=${teacher.id}&school_id=${school.id}`
      );
      
      if (response.data.success) {
        setStudents(response.data.students || []);
      } else {
        setStudents([]);
        setError(response.data.message || 'Failed to load students');
      }
    } catch (err) {
      console.error('Error fetching class students:', err);
      setError('Failed to load class students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toString().includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy] || '';
      let bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchClassStudents}>🔄 Retry</button>
      </div>
    );
  }

  return (
    <div className="class-students">
      {/* Class Header */}
      <div className="class-header-detailed">
        <div className="class-icon-large">🎓</div>
        <div className="class-info-detailed">
          <h2>{classData.name}</h2>
          <div className="class-meta">
            <span>🏫 {school.name}</span>
            <span>👨‍🏫 {teacher.name}</span>
            <span>📚 {classData.subject || 'Not specified'}</span>
          </div>
          {classData.schedule && (
            <p className="class-schedule">🕐 {classData.schedule}</p>
          )}
          {classData.room && (
            <p className="class-room">📍 Room: {classData.room}</p>
          )}
        </div>
      </div>

      {/* Students Section */}
      <div className="students-section">
        <div className="section-header">
          <div className="header-left">
            <h3>👥 Students in {classData.name}</h3>
            <span className="student-count">
              {filteredAndSortedStudents.length} of {students.length} students
            </span>
          </div>
          
          {/* Search and Sort Controls */}
          <div className="controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="sort-container">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Name</option>
                <option value="student_id">Student ID</option>
                <option value="email">Email</option>
                <option value="attendance_rate">Attendance</option>
              </select>
              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-btn"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h4>No Students Found</h4>
            <p>This class doesn't have any students enrolled yet.</p>
          </div>
        ) : (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('student_id')} className="sortable">
                    Student ID {sortBy === 'student_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable">
                    Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Phone</th>
                  <th>Parent Contact</th>
                  <th onClick={() => handleSort('attendance_rate')} className="sortable">
                    Attendance {sortBy === 'attendance_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStudents.map((student, index) => (
                  <tr key={student.id || index} className="student-row">
                    <td className="student-id">{student.student_id || student.id}</td>
                    <td className="student-name">
                      <div className="name-cell">
                        <div className="student-avatar">
                          {(student.name || 'N').charAt(0).toUpperCase()}
                        </div>
                        <span>{student.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="student-email">{student.email || 'Not provided'}</td>
                    <td className="student-phone">{student.phone || 'Not provided'}</td>
                    <td className="parent-contact">{student.parent_phone || 'Not provided'}</td>
                    <td className="attendance-rate">
                      <div className="attendance-container">
                        <span className={`attendance-badge ${
                          (student.attendance_rate || 0) >= 90 ? 'excellent' :
                          (student.attendance_rate || 0) >= 75 ? 'good' :
                          (student.attendance_rate || 0) >= 60 ? 'average' : 'poor'
                        }`}>
                          {student.attendance_rate || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="student-status">
                      <span className={`status-badge ${student.status || 'active'}`}>
                        {student.status || 'Active'}
                      </span>
                    </td>
                    <td className="student-actions">
                      <button className="action-btn view-btn" title="View Details">
                        👁️
                      </button>
                      <button className="action-btn edit-btn" title="Edit Student">
                        ✏️
                      </button>
                      <button className="action-btn contact-btn" title="Contact">
                        📞
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Statistics */}
      {students.length > 0 && (
        <div className="class-statistics">
          <h4>📊 Class Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <span className="stat-number">{students.length}</span>
                <span className="stat-label">Total Students</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-number">
                  {students.length > 0 ? Math.round(
                    students.reduce((total, student) => total + (parseInt(student.attendance_rate) || 0), 0) / students.length
                  ) : 0}%
                </span>
                <span className="stat-label">Avg. Attendance</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <span className="stat-number">
                  {students.filter(s => (parseInt(s.attendance_rate) || 0) >= 90).length}
                </span>
                <span className="stat-label">Excellent Attendance</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <span className="stat-number">
                  {students.filter(s => (parseInt(s.attendance_rate) || 0) < 60).length}
                </span>
                <span className="stat-label">Need Attention</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassStudents;
