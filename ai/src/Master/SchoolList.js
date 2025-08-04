import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SchoolList = ({ onSchoolSelect }) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    principal: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/get_schools.php`);
      setSchools(response.data.schools || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/create_school.php`, newSchool);
      if (response.data.success) {
        alert('School created successfully!');
        setNewSchool({ name: '', address: '', phone: '', email: '', principal: '' });
        setShowCreateForm(false);
        fetchSchools(); // Refresh the list
      } else {
        alert('Error creating school: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error creating school:', err);
      alert('Failed to create school');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading schools...</p>
      </div>
    );
  }

  return (
    <div className="schools-container">
      <div className="section-header">
        <h2>📚 All Schools</h2>
        <button 
          className="create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          ➕ Create New School
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSchools}>🔄 Retry</button>
        </div>
      )}

      {schools.length === 0 && !loading && !error && (
        <div className="empty-state">
          <p>No schools found. Create your first school!</p>
        </div>
      )}

      <div className="schools-grid">
        {schools.map((school) => (
          <div key={school.id} className="school-card">
            <div className="school-card-header">
              <h3>{school.name}</h3>
              <span className="school-id">ID: {school.id}</span>
            </div>
            <div className="school-details">
              <p><strong>Address:</strong> {school.address || 'Not provided'}</p>
              <p><strong>Phone:</strong> {school.phone || 'Not provided'}</p>
              <p><strong>Email:</strong> {school.email || 'Not provided'}</p>
              <p><strong>Principal:</strong> {school.principal || 'Not assigned'}</p>
            </div>
            <div className="school-stats">
              <span>👥 {school.total_students || 0} Students</span>
              <span>👨‍🏫 {school.total_teachers || 0} Teachers</span>
              <span>📚 {school.total_classes || 0} Classes</span>
            </div>
            <button 
              className="view-school-btn"
              onClick={() => onSchoolSelect(school)}
            >
              View School Dashboard →
            </button>
          </div>
        ))}
      </div>

      {/* Create School Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New School</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSchool} className="create-form">
              <div className="form-group">
                <label>School Name *</label>
                <input
                  type="text"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                  required
                  placeholder="Enter school name"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                  placeholder="Enter school address"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newSchool.phone}
                    onChange={(e) => setNewSchool({...newSchool, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newSchool.email}
                    onChange={(e) => setNewSchool({...newSchool, email: e.target.value})}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Principal Name</label>
                <input
                  type="text"
                  value={newSchool.principal}
                  onChange={(e) => setNewSchool({...newSchool, principal: e.target.value})}
                  placeholder="Principal name"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit">Create School</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolList;