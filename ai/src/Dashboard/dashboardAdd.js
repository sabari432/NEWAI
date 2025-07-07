import React, { useState, useEffect } from 'react';
import { Settings, User, LogOut, Star, TrendingUp, Plus, X } from 'lucide-react';
import './ReadingPalApp.css';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

const ReadingPalApp = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', section: '' });
  const [newStudent, setNewStudent] = useState({
    name: '',
    avatar: '👧',
    class: '',
    section: '',
    school: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const avatarOptions = ['👧', '👦', '🧒', '😊', '🤓', '😄', '👨‍🎓'];

  // Handle authentication errors
  const handleAuthError = () => {
    console.log('Authentication error detected, redirecting to login');
    // Clear all cookies
    setCookie('selectedClass', '', -1);
    setCookie('selectedStudent', '', -1);
    // Redirect to login
    window.location.href = "/login";
  };

  // Restore state from cookies on component mount
  useEffect(() => {
    const savedSelectedClass = getCookie('selectedClass');
    if (savedSelectedClass && savedSelectedClass !== '') {
      try {
        const parsedClass = JSON.parse(savedSelectedClass);
        setSelectedClass(parsedClass);
      } catch (error) {
        console.error('Error parsing saved class:', error);
      }
    }

    // Get current user info
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get_current_user.php`, {
          method: "GET",
          credentials: "include",
        });
        const result = await res.json();
        if (result.success) {
          setCurrentUser(result.user);
        } else if (result.message === 'Not logged in') {
          handleAuthError();
          return;
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/get_classes.php`, {
          method: "GET",
          credentials: "include",
        });
        const result = await res.json();
        
        // Check for authentication error
        if (!result.success && result.message === 'Not logged in') {
          handleAuthError();
          return;
        }
        
        if (result.success && Array.isArray(result.classes)) {
          setClasses(result.classes);
          
          // If we have a saved selected class, fetch its students
          const savedSelectedClass = getCookie('selectedClass');
          if (savedSelectedClass && savedSelectedClass !== '') {
            try {
              const parsedClass = JSON.parse(savedSelectedClass);
              // Find the class in the fetched classes to get updated info
              const foundClass = result.classes.find(c => c.id === parsedClass.id);
              if (foundClass) {
                setSelectedClass(foundClass);
                fetchStudents(foundClass.id);
              }
            } catch (error) {
              console.error('Error parsing saved class:', error);
            }
          }
        } else {
          console.error("Invalid response structure:", result);
          setClasses([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const fetchStudents = async (classId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/get_students.php?class_id=${classId}`, {
        method: "GET",
        credentials: "include",
      });
      const result = await res.json();
      
      // Check for authentication error
      if (!result.success && result.message === 'Not logged in') {
        handleAuthError();
        return;
      }
      
      if (result.success && Array.isArray(result.students)) {
        setStudents(result.students);
      } else {
        console.error("Invalid response structure:", result);
        setStudents([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setStudents([]);
    }
  };

  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    setCookie('selectedClass', JSON.stringify(classItem));
    fetchStudents(classItem.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setStudents([]);
    setCookie('selectedClass', '');
  };

  const handleStudentSelect = (student) => {
    setCookie("selectedStudent", JSON.stringify(student));
    navigate('/dashboard/sub');
  };

  const handleAddNewClass = () => {
    setShowAddClass(true);
  };

  const handleCloseAddClass = () => {
    setShowAddClass(false);
    setNewClass({ name: '', section: '' });
  };

  const handleSubmitNewClass = async () => {
    if (newClass.name.trim()) {
      try {
        const res = await fetch(`${API_BASE_URL}/add_class.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...newClass,
            teacher_id: currentUser?.id // Include teacher_id to make classes teacher-specific
          }),
        });

        const result = await res.json();
        
        // Check for authentication error
        if (!result.success && result.message === 'Not logged in') {
          handleAuthError();
          return;
        }
        
        if (result.success) {
          const newClassData = {
            ...newClass,
            id: result.class_id,
            student_count: 0,
            teacher_id: currentUser?.id
          };
          setClasses([...classes, newClassData]);
          handleCloseAddClass();
        } else {
          alert(result.message || "Error adding class");
        }
      } catch (error) {
        console.error("Error adding class:", error);
        alert("Error adding class");
      }
    }
  };

  const handleAddNewStudent = () => {
    setShowAddStudent(true);
    setNewStudent({
      ...newStudent,
      class: selectedClass.name,
      section: selectedClass.section
    });
  };

  const handleCloseAddStudent = () => {
    setShowAddStudent(false);
    setNewStudent({
      name: '',
      avatar: '👧',
      class: '',
      section: '',
      school: ''
    });
  };

  const handleSubmitNewStudent = async () => {
    if (newStudent.name.trim()) {
      try {
        const res = await fetch(`${API_BASE_URL}/add_student.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...newStudent,
            class_id: selectedClass.id
          }),
        });

        const result = await res.json();
        
        // Check for authentication error
        if (!result.success && result.message === 'Not logged in') {
          handleAuthError();
          return;
        }
        
        if (result.success) {
          const newStudentData = {
            ...newStudent,
            id: result.student_id,
            stars: 0,
            dayStreak: 0,
            level: "Level 1",
            wpm: 0,
            accuracy: 0
          };
          setStudents([...students, newStudentData]);
          
          // Update class student count
          setClasses(classes.map(cls => 
            cls.id === selectedClass.id 
              ? { ...cls, student_count: (cls.student_count || 0) + 1 }
              : cls
          ));
          
          handleCloseAddStudent();
        } else {
          alert(result.message || "Error adding student");
        }
      } catch (error) {
        console.error("Error adding student:", error);
        alert("Error adding student");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout.php`, { credentials: "include" });
      // Clear all cookies
      setCookie('selectedClass', '', -1);
      setCookie('selectedStudent', '', -1);
      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="header-nav">
            <div className="logo-section">
              <div className="logo-icon">
                <span className="logo-text">RP</span>
              </div>
              <span className="app-title">ReadingPal</span>
            </div>

            <div className="header-right">
              <button className="settings-btn">
                <Settings className="icon-size" />
              </button>

              <button
                className="settings-btn"
                onClick={() => setShowAdminLogin(true)}
              >
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Admin</span>
              </button>

              <div className="user-info">
                <User className="icon-size user-icon" />
                <span className="user-email">
                  {currentUser?.email || 'Loading...'}
                </span>
              </div>

              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                <LogOut className="logout-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {!selectedClass ? (
          <>
            <div className="title-section">
              <h1 className="main-title">Select Class</h1>
              <p className="subtitle">Choose a class to manage students</p>
              {currentUser && (
                <p className="current-teacher">
                  Welcome, {currentUser.name || currentUser.email}
                </p>
              )}
            </div>

            <div className="cards-container-horizontal">
              {Array.isArray(classes) && classes.map((classItem) => (
                <div
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem)}
                  className="class-card"
                >
                  <div className="class-info">
                    <h3 className="class-name">{classItem.name}</h3>
                    <p className="class-section">Section: {classItem.section}</p>
                    <p className="student-count">{classItem.student_count || 0} Students</p>
                  </div>
                </div>
              ))}

              <div
                onClick={handleAddNewClass}
                className="add-class-card"
              >
                <div className="add-class-icon">
                  <Plus className="plus-icon" />
                </div>
                <h3 className="add-class-title">Add New Class</h3>
                <p className="add-class-subtitle">Create a new class</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="title-section">
              <button onClick={handleBackToClasses} className="back-btn">
                ← Back to Classes
              </button>
              <h1 className="main-title">{selectedClass.name} - Section {selectedClass.section}</h1>
              <p className="subtitle">Select a student profile to continue reading practice</p>
            </div>

            <div className="cards-container-horizontal">
              {Array.isArray(students) && students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className="student-card"
                >
                  <div className="avatar-container">
                    <div className="avatar-circle">
                      {student.avatar}
                    </div>
                  </div>

                  <div className="student-info">
                    <h3 className="student-name">{student.name}</h3>
                    <p className="student-details">{student.class} • {student.school}</p>
                  </div>

                  <div className="stats-row">
                    <div className="stat-item">
                      <Star className="star-icon" />
                      <span className="stat-value">{student.stars || 0}</span>
                    </div>
                    <div className="stat-item">
                      <TrendingUp className="trending-icon" />
                      <span className="stat-value">{student.dayStreak || 0}</span>
                    </div>
                  </div>

                  <div className="stats-labels">
                    <span>Stars</span>
                    <span className="label-spacing">Day Streak</span>
                  </div>

                  <div className="level-section">
                    <span className="level-text">{student.level || "Level 1"}</span>
                  </div>

                  <div className="performance-stats">
                    <span>WPM: {student.wpm || 0}</span>
                    <span className="performance-spacing">Accuracy: {student.accuracy || 0}%</span>
                  </div>

                  <div className="badges-container">
                    <div className="badge badge-yellow">
                      <Star className="badge-icon" />
                    </div>
                    <div className="badge badge-orange">
                      <TrendingUp className="badge-icon" />
                    </div>
                  </div>
                </div>
              ))}

              <div
                onClick={handleAddNewStudent}
                className="add-student-card"
              >
                <div className="add-student-icon">
                  <Plus className="plus-icon" />
                </div>
                <h3 className="add-student-title">Add New Student</h3>
                <p className="add-student-subtitle">Create a profile for another child</p>
              </div>
            </div>
          </>
        )}
      </main>

      {showAddClass && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={handleCloseAddClass}
              className="modal-close-btn"
            >
              <X className="close-icon" />
            </button>

            <div className="modal-header">
              <h2 className="modal-title">Add New Class</h2>
              <p className="modal-subtitle">Create a new class for your students.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                placeholder="e.g., 1st Standard"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Section</label>
              <input
                type="text"
                value={newClass.section}
                onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                placeholder="e.g., A"
                className="form-input"
              />
            </div>

            <button
              onClick={handleSubmitNewClass}
              disabled={!newClass.name.trim()}
              className="submit-btn"
            >
              Add Class
            </button>
          </div>
        </div>
      )}

      {showAddStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={handleCloseAddStudent}
              className="modal-close-btn"
            >
              <X className="close-icon" />
            </button>

            <div className="modal-header">
              <h2 className="modal-title">Add New Student</h2>
              <p className="modal-subtitle">Create a new student profile for reading practice.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Student Name</label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                placeholder="Enter student name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div className="avatar-options">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => setNewStudent({...newStudent, avatar})}
                    className={`avatar-option ${newStudent.avatar === avatar ? 'avatar-selected' : ''}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">School</label>
              <input
                type="text"
                value={newStudent.school}
                onChange={(e) => setNewStudent({...newStudent, school: e.target.value})}
                placeholder="Enter school name"
                className="form-input"
              />
            </div>

            <button
              onClick={handleSubmitNewStudent}
              disabled={!newStudent.name.trim()}
              className="submit-btn"
            >
              Add Student
            </button>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setShowAdminLogin(false)}>
              <X className="close-icon" />
            </button>
            <div className="modal-header">
              <h2 className="modal-title">Admin Login</h2>
              <p className="modal-subtitle">Enter admin credentials to proceed</p>
            </div>
            {adminError && <p style={{ color: 'red', marginBottom: '10px' }}>{adminError}</p>}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="form-input"
              />
            </div>
            <button
              className="submit-btn"
              onClick={() => {
                if (adminUsername === "admin" && adminPassword === "1234") {
                  navigate("/admin");
                } else {
                  setAdminError("Invalid credentials. Try again.");
                }
              }}
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPalApp;