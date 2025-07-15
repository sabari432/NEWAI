import React, { useState, useEffect } from 'react';
import DailyTaskManager from './DailyTaskManager';

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
  CheckCircle
} from 'lucide-react';
import './AdminDashboard.css';
import { API_BASE_URL } from '../config';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showEditBatch, setShowEditBatch] = useState(false);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [dailyTasks, setDailyTasks] = useState([]);
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dynamic data states
  const [currentUser, setCurrentUser] = useState(null);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchStudents, setBatchStudents] = useState([]);

  // Form states
  const [newStudent, setNewStudent] = useState({
    name: '',
    class_id: '',
    avatar: '👧',
    school: ''
  });

  const [newBatch, setNewBatch] = useState({
    name: '',
    section: ''
  });

  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);

  const avatarOptions = ['👧', '👦', '🧒', '😊', '🤓', '😄', '👨‍🎓'];

  // API Configuration
  
  // API Helper Functions
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
// Add this function after loadAllStudents function
const loadDailyTasks = async () => {
  try {
    const response = await apiRequest('get_daily_task.php');
    setDailyTasks(response.tasks || []);
  } catch (error) {
    setError('Failed to load daily tasks');
  }
};
  // Load initial data
 // Replace the existing useEffect with this:
useEffect(() => {
  loadCurrentUser();
  loadBatches();
  loadDailyTasks();
}, []);

  const loadCurrentUser = async () => {
    try {
      const response = await apiRequest('get_current_user.php');
      setCurrentUser(response.user);
    } catch (error) {
      setError('Failed to load user information');
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('get_classes.php');
      setBatches(response.classes || []);
    } catch (error) {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsForBatch = async (classId) => {
    try {
      setLoading(true);
      const response = await apiRequest(`get_students.php?class_id=${classId}`);
      setBatchStudents(response.students || []);
    } catch (error) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadAllStudents = async () => {
    try {
      setLoading(true);
      const allStudents = [];
      
      for (const batch of batches) {
        const response = await apiRequest(`get_students.php?class_id=${batch.id}`);
        const batchStudents = response.students?.map(student => ({
          ...student,
          batch: `${batch.name} - ${batch.section}`
        })) || [];
        allStudents.push(...batchStudents);
      }
      
      setStudents(allStudents);
    } catch (error) {
      setError('Failed to load all students');
    } finally {
      setLoading(false);
    }
  };

  // Load all students when batches change
  useEffect(() => {
    if (batches.length > 0) {
      loadAllStudents();
    }
  }, [batches]);

  const addBatch = async () => {
    try {
      setLoading(true);
      await apiRequest('add_class.php', {
        method: 'POST',
        body: JSON.stringify({
          name: newBatch.name,
          section: newBatch.section
        })
      });
      
      setSuccess('Class added successfully!');
      setShowAddBatch(false);
      setNewBatch({ name: '', section: '' });
      loadBatches();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async () => {
    try {
      setLoading(true);
      await apiRequest('add_student.php', {
        method: 'POST',
        body: JSON.stringify({
          name: newStudent.name,
          class_id: parseInt(newStudent.class_id),
          avatar: newStudent.avatar,
          school: newStudent.school
        })
      });
      
      setSuccess('Student added successfully!');
      setShowAddStudent(false);
      setNewStudent({ name: '', class_id: '', avatar: '👧', school: '' });
      loadAllStudents();
      
      if (selectedBatch) {
        loadStudentsForBatch(selectedBatch.id);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId) => {
if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      setLoading(true);
      // You'll need to create delete_student.php
      await apiRequest('delete_student.php', {
        method: 'POST',
        body: JSON.stringify({ id: studentId })
      });
      
      setSuccess('Student deleted successfully!');
      loadAllStudents();
      
      if (selectedBatch) {
        loadStudentsForBatch(selectedBatch.id);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this class? This will also delete all students in this class.')) return;
    
    try {
      setLoading(true);
      // You'll need to create delete_class.php
      await apiRequest('delete_class.php', {
        method: 'POST',
        body: JSON.stringify({ id: batchId })
      });
      
      setSuccess('Class deleted successfully!');
      loadBatches();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditStudent = (student) => {
    setEditingStudent({
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      school: student.school || ''
    });
    setShowEditStudent(true);
  };

  const updateStudent = async () => {
    try {
      setLoading(true);
      // You'll need to create update_student.php
      await apiRequest('update_student.php', {
        method: 'POST',
        body: JSON.stringify(editingStudent)
      });
      
      setSuccess('Student updated successfully!');
      setShowEditStudent(false);
      setEditingStudent(null);
      loadAllStudents();
      
      if (selectedBatch) {
        loadStudentsForBatch(selectedBatch.id);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditBatch = (batch) => {
    setEditingBatch({
      id: batch.id,
      name: batch.name,
      section: batch.section
    });
    setShowEditBatch(true);
  };

  const updateBatch = async () => {
    try {
      setLoading(true);
      // You'll need to create update_class.php
      await apiRequest('update_class.php', {
        method: 'POST',
        body: JSON.stringify(editingBatch)
      });
      
      setSuccess('Class updated successfully!');
      setShowEditBatch(false);
      setEditingBatch(null);
      loadBatches();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.dayStreak > 0).length;
  const totalBatches = batches.length;

  // Updated Overview Tab
 // Replace the existing OverviewTab function with this:
const OverviewTab = () => (
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
  // Updated Students Tab
  const StudentsTab = () => (
    <div className="students-container">
      <div className="tab-header">
        <h2>Students Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddStudent(true)}
          disabled={loading}
        >
          <UserPlus className="small-icon" />
          Add Student
        </button>
      </div>

      {loading && <div className="loading">Loading students...</div>}

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
                onClick={() => startEditStudent(student)}
                disabled={loading}
              >
                <Edit className="small-icon" />
                Edit
              </button>
              <button 
                className="delete-btn"
                onClick={() => deleteStudent(student.id)}
                disabled={loading}
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

  // Updated Batches Tab
  const BatchesTab = () => (
    <div className="batches-container">
      <div className="tab-header">
        <h2>Classes Management</h2>
        <button 
          className="add-btn"
          onClick={() => setShowAddBatch(true)}
          disabled={loading}
        >
          <Plus className="small-icon" />
          Add Class
        </button>
      </div>

      {loading && <div className="loading">Loading classes...</div>}

      <div className="batches-grid">
        {batches.map(batch => (
          <div key={batch.id} className="batch-card">
            <div className="batch-header">
              <h3>{batch.name} - {batch.section}</h3>
              <div className="batch-actions">
                <button 
                  className="edit-btn"
                  onClick={() => startEditBatch(batch)}
                  disabled={loading}
                >
                  <Edit className="small-icon" />
                  Edit
                </button>
                <button 
                  className="view-btn"
                  onClick={() => {
                    setSelectedBatch(batch);
                    loadStudentsForBatch(batch.id);
                  }}
                  disabled={loading}
                >
                  <Eye className="small-icon" />
                  View
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteBatch(batch.id)}
                  disabled={loading}
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

  // Updated Add Student Modal
  const AddStudentModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Student</h3>
        <div className="form-group">
          <label>Student Name</label>
          <input
            type="text"
            value={newStudent.name}
            onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
            placeholder="Enter student name"
            required
          />
        </div>
        <div className="form-group">
          <label>School</label>
          <input
            type="text"
            value={newStudent.school}
            onChange={(e) => setNewStudent({...newStudent, school: e.target.value})}
            placeholder="Enter school name"
          />
        </div>
        <div className="form-group">
          <label>Assign to Class</label>
          <select
            value={newStudent.class_id}
            onChange={(e) => setNewStudent({...newStudent, class_id: e.target.value})}
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
            {avatarOptions.map((avatar, index) => (
              <button
                key={index}
                type="button"
                className={`avatar-option ${newStudent.avatar === avatar ? 'selected' : ''}`}
                onClick={() => setNewStudent({...newStudent, avatar})}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-btn"
            onClick={() => setShowAddStudent(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="add-btn"
            onClick={addStudent}
            disabled={loading || !newStudent.name || !newStudent.class_id}
          >
            {loading ? 'Adding...' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  );

  // Updated Add Batch Modal
  const AddBatchModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Class</h3>
        <div className="form-group">
          <label>Class Name</label>
          <input
            type="text"
            value={newBatch.name}
            onChange={(e) => setNewBatch({...newBatch, name: e.target.value})}
            placeholder="e.g., Grade 1"
            required
          />
        </div>
        <div className="form-group">
          <label>Section</label>
          <input
            type="text"
            value={newBatch.section}
            onChange={(e) => setNewBatch({...newBatch, section: e.target.value})}
            placeholder="e.g., A"
            required
          />
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-btn"
            onClick={() => setShowAddBatch(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="add-btn"
            onClick={addBatch}
            disabled={loading || !newBatch.name || !newBatch.section}
          >
            {loading ? 'Adding...' : 'Add Class'}
          </button>
        </div>
      </div>
    </div>
  );

  // Edit Student Modal
  const EditStudentModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Student</h3>
        <div className="form-group">
          <label>Student Name</label>
          <input
            type="text"
            value={editingStudent?.name || ''}
            onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
            placeholder="Enter student name"
            required
          />
        </div>
        <div className="form-group">
          <label>School</label>
          <input
            type="text"
            value={editingStudent?.school || ''}
            onChange={(e) => setEditingStudent({...editingStudent, school: e.target.value})}
            placeholder="Enter school name"
          />
        </div>
        <div className="form-group">
          <label>Avatar</label>
          <div className="avatar-options">
            {avatarOptions.map((avatar, index) => (
              <button
                key={index}
                type="button"
                className={`avatar-option ${editingStudent?.avatar === avatar ? 'selected' : ''}`}
                onClick={() => setEditingStudent({...editingStudent, avatar})}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-btn"
            onClick={() => setShowEditStudent(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="add-btn"
            onClick={updateStudent}
            disabled={loading || !editingStudent?.name}
          >
            {loading ? 'Updating...' : 'Update Student'}
          </button>
        </div>
      </div>
    </div>
  );

  // Edit Batch Modal
  const EditBatchModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Class</h3>
        <div className="form-group">
          <label>Class Name</label>
          <input
            type="text"
            value={editingBatch?.name || ''}
            onChange={(e) => setEditingBatch({...editingBatch, name: e.target.value})}
            placeholder="e.g., Grade 1"
            required
          />
        </div>
        <div className="form-group">
          <label>Section</label>
          <input
            type="text"
            value={editingBatch?.section || ''}
            onChange={(e) => setEditingBatch({...editingBatch, section: e.target.value})}
            placeholder="e.g., A"
            required
          />
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-btn"
            onClick={() => setShowEditBatch(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="add-btn"
            onClick={updateBatch}
            disabled={loading || !editingBatch?.name || !editingBatch?.section}
          >
            {loading ? 'Updating...' : 'Update Class'}
          </button>
        </div>
      </div>
    </div>
  );

  // Updated Batch Detail View
  const BatchDetailView = () => (
    <div className="detail-view">
      <div className="detail-header">
        <button 
          className="back-btn"
          onClick={() => setSelectedBatch(null)}
        >
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
          <div className="class-stat-card">
            <TrendingUp className="stat-icon" />
            <div>
              <h3>{batchStudents.filter(s => s.dayStreak > 0).length}</h3>
              <p>Active Students</p>
            </div>
          </div>
          <div className="class-stat-card">
            <Star className="stat-icon" />
            <div>
              <h3>{batchStudents.reduce((sum, s) => sum + s.stars, 0)}</h3>
              <p>Total Stars</p>
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
                    onClick={() => startEditStudent(student)}
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

  // Message Alert Component
  const MessageAlert = () => (
    <>
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
    </>
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>📚 ReadingPal Teacher Dashboard</h1>
          <div className="admin-info">
            <span>Welcome, {currentUser?.name || 'Teacher'}</span>
            <span className="school-info">{currentUser?.school}</span>
          </div>
        </div>
      </header>

      <MessageAlert />

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
      onTasksUpdate={loadDailyTasks}
      apiRequest={apiRequest}
      setError={setError}
      setSuccess={setSuccess}
    />
  )}
</main>
        </>
      )}

      {showAddStudent && <AddStudentModal />}
      {showAddBatch && <AddBatchModal />}
      {showEditStudent && <EditStudentModal />}
      {showEditBatch && <EditBatchModal />}
    </div>
  );
};

export default AdminDashboard;