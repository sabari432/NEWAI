import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  User, 
  Star, 
  Zap, 
  Target,
  Eye,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { PlayCircle } from 'lucide-react';

const Practice = ({ onBack, apiRequest, setError, setSuccess }) => {
  const [currentView, setCurrentView] = useState('classes'); // classes, students
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);

  // API Helper (if not passed as prop)
  const makeApiRequest = apiRequest || (async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  });

  // Load teacher's classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await makeApiRequest('get_classes.php');
      setClasses(response.classes || []);
    } catch (error) {
      if (setError) setError('Failed to load classes: ' + error.message);
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    try {
      setLoading(true);
      const response = await makeApiRequest(`get_students.php?class_id=${classId}`);
      setStudents(response.students || []);
    } catch (error) {
      if (setError) setError('Failed to load students: ' + error.message);
      console.error('Failed to load students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = async (classItem) => {
    setSelectedClass(classItem);
    await loadStudents(classItem.id);
    setCurrentView('students');
  };

  const handleStudentClick = (student) => {
    // Store student info in localStorage for the sub dashboard
    localStorage.setItem('selected_student_id', student.id);
    localStorage.setItem('selected_student_name', student.name);
    localStorage.setItem('selected_student_avatar', student.avatar);
    localStorage.setItem('selected_student_class', `${selectedClass.name} - ${selectedClass.section}`);
    
    // Create clean URL-friendly name
    const urlFriendlyName = student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Redirect to dynamic dashboard/sub route
    window.location.href = `/dashboard/sub?student=${urlFriendlyName}&id=${student.id}&class=${selectedClass.id}`;
  };

  const handleBackToClasses = () => {
    setCurrentView('classes');
    setSelectedClass(null);
    setStudents([]);
  };

  const handleBackToStudents = () => {
    setCurrentView('students');
  };

  // Classes View
  const ClassesView = () => (
    <div className="practice-container">
      <div className="practice-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft className="small-icon" />
          Back to Dashboard
        </button>
        <h2>📚 Practice - Select Class</h2>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading">Loading classes...</div>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="empty-icon" />
              <h3>No Classes Found</h3>
              <p>You haven't created any classes yet.</p>
            </div>
          ) : (
            classes.map(classItem => (
              <div 
                key={classItem.id} 
                className="class-practice-card"
                onClick={() => handleClassClick(classItem)}
              >
                <div className="class-card-header">
                  <BookOpen className="class-icon" />
                  <div className="class-info">
                    <h3>{classItem.name}</h3>
                    <p>Section: {classItem.section}</p>
                  </div>
                </div>
                <div className="class-stats">
                  <div className="stat-item">
                    <Users className="small-icon" />
                    <span>{classItem.student_count || 0} students</span>
                  </div>
                  <div className="stat-item">
                    <BookOpen className="small-icon" />
                    <span>Section {classItem.section}</span>
                  </div>
                </div>
                <div className="class-card-footer">
                  <button className="view-students-btn">
                    <Eye className="small-icon" />
                    View Students
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Students View
  const StudentsView = () => (
    <div className="practice-container">
      <div className="practice-header">
        <button className="back-btn" onClick={handleBackToClasses}>
          <ArrowLeft className="small-icon" />
          Back to Classes
        </button>
        <h2>👥 {selectedClass?.name} - {selectedClass?.section}</h2>
        <p>Select a student to start practice session</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading">Loading students...</div>
        </div>
      ) : (
        <div className="students-practice-grid">
          {students.length === 0 ? (
            <div className="empty-state">
              <Users className="empty-icon" />
              <h3>No Students Found</h3>
              <p>This class doesn't have any students yet.</p>
            </div>
          ) : (
            students.map(student => (
              <div 
                key={student.id} 
                className="student-practice-card"
                onClick={() => handleStudentClick(student)}
              >
                <div className="student-card-header">
                  <div className="student-avatar-large">
                    {student.avatar || '👧'}
                  </div>
                  <div className="student-details">
                    <h3>{student.name}</h3>
                    <p className="student-school">{student.school || 'No school info'}</p>
                    <p className="student-level">Level: {student.level || 1}</p>
                  </div>
                </div>
                
                <div className="student-practice-stats">
                  <div className="practice-stat">
                    <Star className="stat-icon stars" />
                    <div className="stat-info">
                      <span className="stat-value">{student.stars || 0}</span>
                      <span className="stat-label">Stars</span>
                    </div>
                  </div>
                  <div className="practice-stat">
                    <Zap className="stat-icon streak" />
                    <div className="stat-info">
                      <span className="stat-value">{student.dayStreak || 0}</span>
                      <span className="stat-label">Streak</span>
                    </div>
                  </div>
                  <div className="practice-stat">
                    <Target className="stat-icon accuracy" />
                    <div className="stat-info">
                      <span className="stat-value">{student.accuracy || 0}%</span>
                      <span className="stat-label">Accuracy</span>
                    </div>
                  </div>
                  <div className="practice-stat">
                    <span className="stat-icon wpm-icon">⚡</span>
                    <div className="stat-info">
                      <span className="stat-value">{student.wpm || 0}</span>
                      <span className="stat-label">WPM</span>
                    </div>
                  </div>
                </div>

                <div className="practice-card-footer">
                  <button className="start-practice-btn">
                    <PlayCircle className="small-icon" />

                    Start Practice
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Render based on current view
  return (
    <div className="practice-page">
      {currentView === 'classes' && <ClassesView />}
      {currentView === 'students' && <StudentsView />}
    </div>
  );
};

export default Practice;