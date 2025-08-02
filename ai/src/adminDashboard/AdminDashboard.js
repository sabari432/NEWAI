import React, { useState, useEffect } from 'react';
import DailyTaskManager from './DailyTaskManager';
import './AdminDashboard.css';
import { FaPlay } from 'react-icons/fa';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Target, 
  BookOpen, 
  Star, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  ArrowLeft,
  Clock,
  Award,
  Zap,
  AlertCircle,
  LogOut,
  CheckCircle
} from 'lucide-react';
import './AdminDashboard.css';
import Practice from './Practice';
import { API_BASE_URL } from '../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showEditBatch, setShowEditBatch] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showPractice, setShowPractice] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchStudents, setBatchStudents] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [newStudentName, setNewStudentName] = useState('');

  const avatarOptions = ['👧', '👦', '🧒', '😊', '🤓', '😄', '👨‍🎓'];

  // API Helper
  const apiRequest = async (endpoint, options = {}) => {
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
  };

  // Load all data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user
        const userResponse = await apiRequest('get_current_user.php');
        setCurrentUser(userResponse.user);
        
        // Load tasks
        const tasksResponse = await apiRequest('get_daily_task.php');
        setDailyTasks(tasksResponse.tasks || []);
        
        // Load batches
        const batchResponse = await apiRequest('get_classes.php');
        const batchData = batchResponse.classes || [];
        setBatches(batchData);
        
        // Load all students
        const allStudents = [];
        for (const batch of batchData) {
          const studentsResponse = await apiRequest(`get_students.php?class_id=${batch.id}`);
          const batchStudents = studentsResponse.students?.map(student => ({
            ...student,
            batch: `${batch.name} - ${batch.section}`
          })) || [];
          allStudents.push(...batchStudents);
        }
        setStudents(allStudents);
        
      } catch (error) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Reload data after operations
  const reloadData = async () => {
    try {
      const batchResponse = await apiRequest('get_classes.php');
      const batchData = batchResponse.classes || [];
      setBatches(batchData);
      
      const allStudents = [];
      for (const batch of batchData) {
        const studentsResponse = await apiRequest(`get_students.php?class_id=${batch.id}`);
        const batchStudents = studentsResponse.students?.map(student => ({
          ...student,
          batch: `${batch.name} - ${batch.section}`
        })) || [];
        allStudents.push(...batchStudents);
      }
      setStudents(allStudents);
    } catch (error) {
      setError('Failed to reload data');
    }
  };

  // Clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Add Student
  const addStudent = async (formData) => {
    try {
      const response = await apiRequest('add_student.php', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          class_id: parseInt(formData.class_id),
          avatar: formData.avatar,
          school: formData.school
        })
      });
      
      setNewStudentName(formData.name);
      setShowAddStudent(false);
      setShowCredentialsModal(true);
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Add Credentials
  const addCredentials = async (credentials) => {
    try {
      await apiRequest('add_student_credentials.php', {
        method: 'POST',
        body: JSON.stringify({
          student_name: newStudentName,
          email: credentials.email,
          password: credentials.password
        })
      });
      
      setSuccess('Student added successfully!');
      setShowCredentialsModal(false);
      setNewStudentName('');
      await reloadData();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Add Batch
  const addBatch = async (formData) => {
    try {
      await apiRequest('add_class.php', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          section: formData.section
        })
      });
      
      setSuccess('Class added successfully!');
      setShowAddBatch(false);
      await reloadData();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Delete Student
  const deleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure?')) return;
    
    try {
      await apiRequest('delete_student.php', {
        method: 'POST',
        body: JSON.stringify({ id: studentId })
      });
      
      setSuccess('Student deleted successfully!');
      await reloadData();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Delete Batch
  const deleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure? This will delete all students in this class.')) return;
    
    try {
      await apiRequest('delete_class.php', {
        method: 'POST',
        body: JSON.stringify({ id: batchId })
      });
      
      setSuccess('Class deleted successfully!');
      await reloadData();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Update Student
  const updateStudent = async (formData) => {
    try {
      await apiRequest('update_student.php', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setSuccess('Student updated successfully!');
      setShowEditStudent(false);
      setEditingStudent(null);
      await reloadData();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Update Batch
  const updateBatch = async (formData) => {
    try {
      await apiRequest('update_class.php', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setSuccess('Class updated successfully!');
      setShowEditBatch(false);
      setEditingBatch(null);
      await reloadData();
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Load batch students
  const loadBatchStudents = async (classId) => {
    try {
      const response = await apiRequest(`get_students.php?class_id=${classId}`);
      setBatchStudents(response.students || []);
    } catch (error) {
      setError('Failed to load students');
    }
  };

  // Simple Add Student Form
  const AddStudentForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      class_id: '',
      avatar: '👧',
      school: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.name && formData.class_id) {
        addStudent(formData);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Add New Student</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>School</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({...formData, school: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Class</label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                required
              >
                <option value="">Select class</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} - {batch.section}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Avatar</label>
              <div className="avatar-options">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    className={`avatar-option ${formData.avatar === avatar ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, avatar})}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowAddStudent(false)}>Cancel</button>
              <button type="submit">Add Student</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Simple Credentials Form
  const CredentialsForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.email && formData.password) {
        addCredentials(formData);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Setup Login for {newStudentName}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowCredentialsModal(false)}>Skip</button>
              <button type="submit">Setup</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Simple Add Batch Form
  const AddBatchForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      section: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.name && formData.section) {
        addBatch(formData);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Add New Class</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Class Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Section</label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({...formData, section: e.target.value})}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowAddBatch(false)}>Cancel</button>
              <button type="submit">Add Class</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Simple Edit Student Form
  const EditStudentForm = () => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (editingStudent.name) {
        updateStudent(editingStudent);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Edit Student</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>School</label>
              <input
                type="text"
                value={editingStudent.school || ''}
                onChange={(e) => setEditingStudent({...editingStudent, school: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Avatar</label>
              <div className="avatar-options">
                {avatarOptions.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    className={`avatar-option ${editingStudent.avatar === avatar ? 'selected' : ''}`}
                    onClick={() => setEditingStudent({...editingStudent, avatar})}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowEditStudent(false)}>Cancel</button>
              <button type="submit">Update</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Simple Edit Batch Form
  const EditBatchForm = () => {
    const handleSubmit = (e) => {
      e.preventDefault();
      if (editingBatch.name && editingBatch.section) {
        updateBatch(editingBatch);
      }
    };
      {activeTab === 'practice' && (
        <Practice 
          onBack={() => setActiveTab('overview')}
          apiRequest={apiRequest}
          setError={setError}
        />
      )}
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Edit Class</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Class Name</label>
              <input
                type="text"
                value={editingBatch.name}
                onChange={(e) => setEditingBatch({...editingBatch, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Section</label>
              <input
                type="text"
                value={editingBatch.section}
                onChange={(e) => setEditingBatch({...editingBatch, section: e.target.value})}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowEditBatch(false)}>Cancel</button>
              <button type="submit">Update</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Overview Tab
  const OverviewTab = () => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.dayStreak > 0).length;
    const totalBatches = batches.length;

    return (
      <div className="overview-container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users className="icon" />
            </div>
            <div className="stat-content">
              <h3>{totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <BookOpen className="icon" />
            </div>
            <div className="stat-content">
              <h3>{totalBatches}</h3>
              <p>Active Classes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Target className="icon" />
            </div>
            <div className="stat-content">
              <h3>{dailyTasks.length}</h3>
              <p>Daily Tasks</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp className="icon" />
            </div>
            <div className="stat-content">
              <h3>{activeStudents}</h3>
              <p>Active Students</p>
            </div>
          </div>
        </div>

        <div className="overview-sections">
          <div className="section">
            <h3>Recent Students</h3>
            <div className="activity-list">
              {students.slice(0, 5).map(student => (
                <div key={student.id} className="activity-item">
                  <div className="activity-avatar">{student.avatar}</div>
                  <div className="activity-info">
                    <p><strong>{student.name}</strong> from {student.batch}</p>
                    <span className="activity-time">{student.school}</span>
                  </div>
                  <div className="activity-stats">
                    <span className="stars">⭐ {student.stars}</span>
                    <span className="streak">🔥 {student.dayStreak}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Daily Tasks</h3>
            <div className="challenge-list">
              {dailyTasks.slice(0, 5).map(task => (
                <div key={task.id} className="challenge-item">
                  <div className="challenge-info">
                    <h4>{task.title}</h4>
                    <span className="challenge-batch">{task.level} level</span>
                  </div>
                  <div className="challenge-stats">
                    <div className="completion-rate">
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Students Tab
  const StudentsTab = () => (
    <div className="students-container">
      <div className="tab-header">
        <h2>Students Management</h2>
        <button className="add-btn" onClick={() => setShowAddStudent(true)}>
          <UserPlus className="small-icon" />
          Add Student
        </button>
      </div>

      <div className="students-grid">
        {students.map(student => (
          <div key={student.id} className="student-card">
            <div className="student-avatar">{student.avatar}</div>
            <div className="student-info">
              <h3>{student.name}</h3>
              <p className="student-batch">{student.batch}</p>
              <p className="student-school">{student.school}</p>
              <div className="student-stats">
                <div className="stat">
                  <Star className="small-icon" />
                  <span>{student.stars}</span>
                </div>
                <div className="stat">
                  <Zap className="small-icon" />
                  <span>{student.dayStreak}</span>
                </div>
              </div>
              <p className="student-level">Level: {student.level}</p>
            </div>
            <div className="student-actions">
              <button 
                className="edit-btn"
                onClick={() => {
                  setEditingStudent({
                    id: student.id,
                    name: student.name,
                    avatar: student.avatar,
                    school: student.school || ''
                  });
                  setShowEditStudent(true);
                }}
              >
                <Edit className="small-icon" />
                Edit
              </button>
              <button 
                className="delete-btn"
                onClick={() => deleteStudent(student.id)}
              >
                <Trash2 className="small-icon" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Batches Tab
  const BatchesTab = () => (
    <div className="batches-container">
      <div className="tab-header">
        <h2>Classes Management</h2>
        <button className="add-btn" onClick={() => setShowAddBatch(true)}>
          <Plus className="small-icon" />
          Add Class
        </button>
      </div>

      <div className="batches-grid">
        {batches.map(batch => (
          <div key={batch.id} className="batch-card">
            <div className="batch-header">
              <h3>{batch.name} - {batch.section}</h3>
              <div className="batch-actions">
                <button 
                  className="edit-btn"
                  onClick={() => {
                    setEditingBatch({
                      id: batch.id,
                      name: batch.name,
                      section: batch.section
                    });
                    setShowEditBatch(true);
                  }}
                >
                  <Edit className="small-icon" />
                  Edit
                </button>
                <button 
                  className="view-btn"
                  onClick={() => {
                    setSelectedBatch(batch);
                    loadBatchStudents(batch.id);
                  }}
                >
                  <Eye className="small-icon" />
                  View
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteBatch(batch.id)}
                >
                  <Trash2 className="small-icon" />
                  Delete
                </button>
              </div>
            </div>
            <div className="batch-stats">
              <div className="batch-stat">
                <Users className="small-icon" />
                <span>{batch.student_count} students</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Batch Detail View
  const BatchDetailView = () => (
    <div className="detail-view">
      <div className="detail-header">
        <button className="back-btn" onClick={() => setSelectedBatch(null)}>
          <ArrowLeft className="small-icon" />
          Back to Classes
        </button>
        <h2>{selectedBatch.name} - {selectedBatch.section}</h2>
      </div>

      <div className="batch-detail-content">
        <div className="class-stats">
          <div className="class-stat-card">
            <Users className="stat-icon" />
            <div>
              <h3>{batchStudents.length}</h3>
              <p>Total Students</p>
            </div>
          </div>
        </div>

        <div className="class-students">
          <h3>Students in this Class</h3>
          <div className="students-list">
            {batchStudents.map(student => (
              <div key={student.id} className="student-row">
                <div className="student-avatar">{student.avatar}</div>
                <div className="student-info">
                  <h4>{student.name}</h4>
                  <p>{student.school}</p>
                  <p>Level: {student.level}</p>
                </div>
                <div className="student-stats">
                  <span className="stars">⭐ {student.stars}</span>
                  <span className="streak">🔥 {student.dayStreak}</span>
                  <span className="wpm">⚡ {student.wpm} WPM</span>
                </div>
                <div className="student-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      setEditingStudent({
                        id: student.id,
                        name: student.name,
                        avatar: student.avatar,
                        school: student.school || ''
                      });
                      setShowEditStudent(true);
                    }}
                  >
                    <Edit className="small-icon" />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteStudent(student.id)}
                  >
                    <Trash2 className="small-icon" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      await apiRequest('logout.php', {
        method: 'POST'
      });
      window.location.href = '/login';
    } catch (error) {
      setError('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>📚 ReadingPal Teacher Dashboard</h1>
          <div className="admin-info">
            <span>Welcome, {currentUser?.name || 'Teacher'}</span>
            <span className="school-info">{currentUser?.school}</span>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut className="small-icon" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="small-icon" />
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle className="small-icon" />
          {success}
        </div>
      )}

      {selectedBatch ? (
        <BatchDetailView />
      ) : (
        <>
          <nav className="admin-nav">
            <button 
              className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BookOpen className="small-icon" />
              Overview
            </button>
            <button 
              className={`nav-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <Users className="small-icon" />
              Students
            </button>
            <button 
              className={`nav-btn ${activeTab === 'batches' ? 'active' : ''}`}
              onClick={() => setActiveTab('batches')}
            >
              <BookOpen className="small-icon" />
              Classes
            </button>
            <button 
              className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <Target className="small-icon" />
              Daily Tasks
            </button>
           
            <button 
              className={`nav-btn ${activeTab === 'practice' ? 'active' : ''}`}
              onClick={() => setActiveTab('Practice')}
            >
              <FaPlay className="small-icon" />

              Practice
            </button>
          </nav>

          <main className="admin-content">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'students' && <StudentsTab />}
            {activeTab === 'batches' && <BatchesTab />}
            {activeTab === 'tasks' && (
              <DailyTaskManager 
                dailyTasks={dailyTasks}
                batches={batches}
                students={students}
                onTasksUpdate={async () => {
                  const response = await apiRequest('get_daily_task.php');
                  setDailyTasks(response.tasks || []);
                }}
                apiRequest={apiRequest}
                setError={setError}
                setSuccess={setSuccess}
              />
            )}
            {activeTab === 'Practice' && <Practice />}
          </main>
        </>
      )}

      {showAddStudent && <AddStudentForm />}
      {showAddBatch && <AddBatchForm />}
      {showEditStudent && editingStudent && <EditStudentForm />}
      {showEditBatch && editingBatch && <EditBatchForm />}
      {showCredentialsModal && <CredentialsForm />}
      

    </div>
  );
};

export default AdminDashboard;