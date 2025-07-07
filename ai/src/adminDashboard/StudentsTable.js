import React, { useState, useEffect } from 'react';

const StudentsTable = () => {
  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'Emma Johnson',
      email: 'emma.johnson@email.com',
      grade: '3rd Grade',
      readingSessions: 45,
      avgWPM: 85,
      accuracy: 92,
      lastActive: '2025-06-30',
      status: 'active'
    },
    {
      id: 2,
      name: 'Liam Smith',
      email: 'liam.smith@email.com',
      grade: '2nd Grade',
      readingSessions: 32,
      avgWPM: 72,
      accuracy: 88,
      lastActive: '2025-06-29',
      status: 'active'
    },
    {
      id: 3,
      name: 'Sophia Davis',
      email: 'sophia.davis@email.com',
      grade: '4th Grade',
      readingSessions: 58,
      avgWPM: 94,
      accuracy: 95,
      lastActive: '2025-06-28',
      status: 'inactive'
    },
    {
      id: 4,
      name: 'Noah Wilson',
      email: 'noah.wilson@email.com',
      grade: '1st Grade',
      readingSessions: 23,
      avgWPM: 58,
      accuracy: 82,
      lastActive: '2025-06-30',
      status: 'active'
    },
    {
      id: 5,
      name: 'Olivia Brown',
      email: 'olivia.brown@email.com',
      grade: '3rd Grade',
      readingSessions: 41,
      avgWPM: 79,
      accuracy: 89,
      lastActive: '2025-06-27',
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
      const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
      return matchesSearch && matchesGrade && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
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

  const handleStatusChange = (studentId, newStatus) => {
    setStudents(students.map(student => 
      student.id === studentId ? { ...student, status: newStatus } : student
    ));
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(student => student.id !== studentId));
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPerformanceLevel = (wpm, accuracy) => {
    if (wpm >= 80 && accuracy >= 90) return 'excellent';
    if (wpm >= 60 && accuracy >= 80) return 'good';
    if (wpm >= 40 && accuracy >= 70) return 'average';
    return 'needs-improvement';
  };

  return (
    <div className="students-table-container">
      <div className="table-header">
        <h2>Student Management</h2>
        <p>Monitor and manage student progress and performance</p>
      </div>

      {/* Filters and Search */}
      <div className="table-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Grades</option>
            <option value="1st Grade">1st Grade</option>
            <option value="2nd Grade">2nd Grade</option>
            <option value="3rd Grade">3rd Grade</option>
            <option value="4th Grade">4th Grade</option>
            <option value="5th Grade">5th Grade</option>
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
      </div>

      {/* Statistics Cards */}
      <div className="student-stats">
        <div className="stat-card">
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{students.filter(s => s.status === 'active').length}</div>
          <div className="stat-label">Active Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(students.reduce((sum, s) => sum + s.avgWPM, 0) / students.length)}</div>
          <div className="stat-label">Avg WPM</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(students.reduce((sum, s) => sum + s.accuracy, 0) / students.length)}%</div>
          <div className="stat-label">Avg Accuracy</div>
        </div>
      </div>

      {/* Students Table */}
      <div className="table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Student Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('grade')} className="sortable">
                Grade {sortBy === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('readingSessions')} className="sortable">
                Sessions {sortBy === 'readingSessions' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('avgWPM')} className="sortable">
                Avg WPM {sortBy === 'avgWPM' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('accuracy')} className="sortable">
                Accuracy {sortBy === 'accuracy' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('lastActive')} className="sortable">
                Last Active {sortBy === 'lastActive' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className={`performance-${getPerformanceLevel(student.avgWPM, student.accuracy)}`}>
                <td>
                  <div className="student-info">
                    <div className="student-avatar">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="student-name">{student.name}</div>
                      <div className="student-email">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="grade-badge">{student.grade}</span>
                </td>
                <td>{student.readingSessions}</td>
                <td>
                  <span className={`wpm-value ${getPerformanceLevel(student.avgWPM, student.accuracy)}`}>
                    {student.avgWPM}
                  </span>
                </td>
                <td>
                  <span className={`accuracy-value ${getPerformanceLevel(student.avgWPM, student.accuracy)}`}>
                    {student.accuracy}%
                  </span>
                </td>
                <td>{new Date(student.lastActive).toLocaleDateString()}</td>
                <td>
                  <select
                    value={student.status}
                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    className={`status-select ${student.status}`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="view-btn" title="View Details">👁️</button>
                    <button className="edit-btn" title="Edit Student">✏️</button>
                    <button 
                      className="delete-btn" 
                      title="Delete Student"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="no-results">
          <p>No students found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default StudentsTable;