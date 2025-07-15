import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Target, 
  Plus, 
  Edit2, 
  Eye,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  User
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [newBatch, setNewBatch] = useState({
    name: '',
    grade: '',
    description: ''
  });
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    batchId: '',
    avatar: '👧'
  });
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    batchId: '',
    scheduledTime: '',
    duration: 10
  });

  const avatarOptions = ['👧', '👦', '🧒', '😊', '🤓', '😄', '👨‍🎓', '👩‍🎓'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all data
      await Promise.all([
        fetchBatches(),
        fetchStudents(),
        fetchChallenges()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/admin/batches', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/admin/challenges', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  const handleAddBatch = async () => {
    try {
      const response = await fetch('/api/admin/add-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newBatch)
      });
      const data = await response.json();
      if (data.success) {
        setBatches([...batches, data.batch]);
        setShowAddBatch(false);
        setNewBatch({ name: '', grade: '', description: '' });
      }
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };

  const handleAddStudent = async () => {
    try {
      const response = await fetch('/api/admin/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStudent)
      });
      const data = await response.json();
      if (data.success) {
        setStudents([...students, data.student]);
        setShowAddStudent(false);
        setNewStudent({ name: '', email: '', batchId: '', avatar: '👧' });
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleAddChallenge = async () => {
    try {
      const response = await fetch('/api/admin/add-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newChallenge)
      });
      const data = await response.json();
      if (data.success) {
        setChallenges([...challenges, data.challenge]);
        setShowAddChallenge(false);
        setNewChallenge({
          title: '',
          description: '',
          difficulty: 'medium',
          batchId: '',
          scheduledTime: '',
          duration: 10
        });
      }
    } catch (error) {
      console.error('Error adding challenge:', error);
    }
  };

  const OverviewTab = () => (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <h3>{students.length}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen />
          </div>
          <div className="stat-content">
            <h3>{batches.length}</h3>
            <p>Active Batches</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Target />
          </div>
          <div className="stat-content">
            <h3>{challenges.length}</h3>
            <p>Challenges Created</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <h3>85%</h3>
            <p>Avg. Completion Rate</p>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h3>Recent Activities</h3>
        <div className="activity-list">
          <div className="activity-item">
            <CheckCircle className="activity-icon success" />
            <div className="activity-content">
              <p><strong>Sarah Johnson</strong> completed daily challenge</p>
              <span className="activity-time">5 minutes ago</span>
            </div>
          </div>
          <div className="activity-item">
            <User className="activity-icon info" />
            <div className="activity-content">
              <p>New student <strong>Mike Chen</strong> joined Grade 3A</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BatchesTab = () => (
    <div className="batches-tab">
      <div className="tab-header">
        <h2>Manage Batches</h2>
        <button className="add-btn" onClick={() => setShowAddBatch(true)}>
          <Plus size={16} />
          Add Batch
        </button>
      </div>
      
      <div className="batches-grid">
        {batches.map(batch => (
          <div key={batch.id} className="batch-card">
            <div className="batch-header">
              <h3>{batch.name}</h3>
              <span className="batch-grade">Grade {batch.grade}</span>
            </div>
            <p className="batch-description">{batch.description}</p>
            <div className="batch-stats">
              <div className="stat">
                <Users size={16} />
                <span>{batch.studentCount || 0} students</span>
              </div>
              <div className="stat">
                <Target size={16} />
                <span>{batch.challengeCount || 0} challenges</span>
              </div>
            </div>
            <div className="batch-actions">
              <button onClick={() => setSelectedBatch(batch)}>
                <Eye size={16} />
                View Details
              </button>
              <button>
                <Edit2 size={16} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StudentsTab = () => (
    <div className="students-tab">
      <div className="tab-header">
        <h2>Manage Students</h2>
        <button className="add-btn" onClick={() => setShowAddStudent(true)}>
          <Plus size={16} />
          Add Student
        </button>
      </div>
      
      <div className="students-list">
        {students.map(student => (
          <div key={student.id} className="student-card">
            <div className="student-avatar">
              {student.avatar}
            </div>
            <div className="student-info">
              <h3>{student.name}</h3>
              <p>{student.email}</p>
              <span className="student-batch">{student.batchName}</span>
            </div>
            <div className="student-stats">
              <div className="stat">
                <Star size={16} />
                <span>{student.stars || 0}</span>
              </div>
              <div className="stat">
                <Clock size={16} />
                <span>{student.streak || 0} days</span>
              </div>
            </div>
            <div className="student-actions">
              <button onClick={() => setSelectedStudent(student)}>
                <Eye size={16} />
                View Progress
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChallengesTab = () => (
    <div className="challenges-tab">
      <div className="tab-header">
        <h2>Daily Challenges</h2>
        <button className="add-btn" onClick={() => setShowAddChallenge(true)}>
          <Plus size={16} />
          Create Challenge
        </button>
      </div>
      
      <div className="challenges-list">
        {challenges.map(challenge => (
          <div key={challenge.id} className="challenge-card">
            <div className="challenge-header">
              <h3>{challenge.title}</h3>
              <span className={`difficulty ${challenge.difficulty}`}>
                {challenge.difficulty}
              </span>
            </div>
            <p className="challenge-description">{challenge.description}</p>
            <div className="challenge-info">
              <div className="info-item">
                <Calendar size={16} />
                <span>{challenge.scheduledTime}</span>
              </div>
              <div className="info-item">
                <Clock size={16} />
                <span>{challenge.duration} min</span>
              </div>
            </div>
            <div className="challenge-stats">
              <span>Batch: {challenge.batchName}</span>
              <span>Completion: {challenge.completionRate || 0}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <button className="notification-btn">
            <AlertCircle size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'batches' ? 'active' : ''}
          onClick={() => setActiveTab('batches')}
        >
          Batches
        </button>
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button 
          className={activeTab === 'challenges' ? 'active' : ''}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'batches' && <BatchesTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
      </div>

      {/* Add Batch Modal */}
      {showAddBatch && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Batch</h3>
            <div className="form-group">
              <label>Batch Name</label>
              <input
                type="text"
                value={newBatch.name}
                onChange={(e) => setNewBatch({...newBatch, name: e.target.value})}
                placeholder="e.g., Grade 3A"
              />
            </div>
            <div className="form-group">
              <label>Grade Level</label>
              <input
                type="text"
                value={newBatch.grade}
                onChange={(e) => setNewBatch({...newBatch, grade: e.target.value})}
                placeholder="e.g., 3"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newBatch.description}
                onChange={(e) => setNewBatch({...newBatch, description: e.target.value})}
                placeholder="Brief description of the batch"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddBatch(false)}>Cancel</button>
              <button onClick={handleAddBatch}>Add Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
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
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            <div className="form-group">
              <label>Batch</label>
              <select
                value={newStudent.batchId}
                onChange={(e) => setNewStudent({...newStudent, batchId: e.target.value})}
              >
                <option value="">Select a batch</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} - Grade {batch.grade}
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
                    className={`avatar-option ${newStudent.avatar === avatar ? 'selected' : ''}`}
                    onClick={() => setNewStudent({...newStudent, avatar})}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddStudent(false)}>Cancel</button>
              <button onClick={handleAddStudent}>Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Challenge Modal */}
      {showAddChallenge && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Daily Challenge</h3>
            <div className="form-group">
              <label>Challenge Title</label>
              <input
                type="text"
                value={newChallenge.title}
                onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                placeholder="Enter challenge title"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newChallenge.description}
                onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                placeholder="Describe the challenge"
              />
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={newChallenge.difficulty}
                onChange={(e) => setNewChallenge({...newChallenge, difficulty: e.target.value})}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Batch</label>
              <select
                value={newChallenge.batchId}
                onChange={(e) => setNewChallenge({...newChallenge, batchId: e.target.value})}
              >
                <option value="">Select a batch</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} - Grade {batch.grade}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Scheduled Time</label>
              <input
                type="datetime-local"
                value={newChallenge.scheduledTime}
                onChange={(e) => setNewChallenge({...newChallenge, scheduledTime: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                value={newChallenge.duration}
                onChange={(e) => setNewChallenge({...newChallenge, duration: parseInt(e.target.value)})}
                min="1"
                max="60"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddChallenge(false)}>Cancel</button>
              <button onClick={handleAddChallenge}>Create Challenge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;