import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './teacherDirectory.css';

function TeacherDirectory() {
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    class_handled: '',
    sections: '',
    password: '',
    phone: '',
    school_name: ''
  });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/get_teachers.php', {
        withCredentials: true
      });
      console.log('Fetched teachers:', response.data);
      
      // Handle different response formats
      let teachersData = response.data;
      if (response.data.data) {
        teachersData = response.data.data;
      }
      
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setError('');
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setError('Failed to load teachers. Please try again.');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTeacher(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTeacher(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/add_teacher.php', newTeacher, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        alert("Teacher registered successfully!");
        await fetchTeachers(); // Refresh the list
        setNewTeacher({
          name: '',
          email: '',
          class_handled: '',
          sections: '',
          password: '',
          phone: '',
          school_name: ''
        });
        setShowModal(false);
        setError('');
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering teacher:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error registering teacher. Please try again.";
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher) => {
    // Set the editing teacher with current data
    setEditingTeacher({
      id: teacher.id,
      name: teacher.name || teacher.teacher_name || '',
      email: teacher.email || '',
      class_handled: teacher.class_handled || teacher.grade_level || '',
      sections: teacher.sections || teacher.subject || '',
      phone: teacher.phone || '',
      school_name: teacher.school_name || '',
      new_password: '' // Password field for optional update
    });
    setShowEditModal(true);
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/update_teacher.php', editingTeacher, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        alert("Teacher updated successfully!");
        await fetchTeachers(); // Refresh the list
        setShowEditModal(false);
        setEditingTeacher(null);
        setError('');
      } else {
        throw new Error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error updating teacher. Please try again.";
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this teacher?");
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/delete_teacher.php', 
        { id }, 
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setTeachers(prev => prev.filter(teacher => teacher.id !== id));
        alert("Teacher deleted successfully!");
        setError('');
      } else {
        throw new Error(response.data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error deleting teacher. Please try again.";
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTeacher(null);
  };

  return (
    <div className="teacher-directory-container">
      <h2 className="teacher-directory-title">Teacher Directory</h2>

      {error && (
        <div className="error-message" style={{
          background: '#fee', 
          color: '#c33', 
          padding: '10px', 
          marginBottom: '10px', 
          borderRadius: '4px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {/* Add Teacher Button */}
      <div className="add-teacher-button-container">
        <button 
          className="add-teacher-button" 
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Add Teacher'}
        </button>
      </div>

      {/* Modal for Register Form */}
      {showModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-content">
            <form onSubmit={handleRegister}>
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Register Teacher</h5>
                <button 
                  type="button" 
                  className="custom-modal-close-button" 
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  &times;
                </button>
              </div>
              <div className="custom-modal-body">
                <div className="form-grid">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Teacher Name *" 
                    className="form-input"
                    value={newTeacher.name} 
                    onChange={handleInputChange} 
                    required 
                    disabled={loading}
                  />
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Email *" 
                    className="form-input"
                    value={newTeacher.email} 
                    onChange={handleInputChange} 
                    required 
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="class_handled" 
                    placeholder="Grade Level (e.g., Grade 5)" 
                    className="form-input"
                    value={newTeacher.class_handled} 
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="sections" 
                    placeholder="Subject (e.g., Mathematics)" 
                    className="form-input"
                    value={newTeacher.sections} 
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="phone" 
                    placeholder="Phone Number" 
                    className="form-input"
                    value={newTeacher.phone} 
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="school_name" 
                    placeholder="School Name" 
                    className="form-input"
                    value={newTeacher.school_name} 
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Password *" 
                    className="form-input"
                    value={newTeacher.password} 
                    onChange={handleInputChange} 
                    required 
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="custom-modal-footer">
                <button 
                  type="submit" 
                  className="custom-button primary-button"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register Teacher'}
                </button>
                <button 
                  type="button" 
                  className="custom-button secondary-button" 
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Edit Form */}
      {showEditModal && editingTeacher && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-content">
            <form onSubmit={handleUpdateTeacher}>
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Edit Teacher</h5>
                <button 
                  type="button" 
                  className="custom-modal-close-button" 
                  onClick={closeEditModal}
                  disabled={loading}
                >
                  &times;
                </button>
              </div>
              <div className="custom-modal-body">
                <div className="form-grid">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Teacher Name *" 
                    className="form-input"
                    value={editingTeacher.name} 
                    onChange={handleEditInputChange} 
                    required 
                    disabled={loading}
                  />
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Email *" 
                    className="form-input"
                    value={editingTeacher.email} 
                    onChange={handleEditInputChange} 
                    required 
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="class_handled" 
                    placeholder="Grade Level (e.g., Grade 5)" 
                    className="form-input"
                    value={editingTeacher.class_handled} 
                    onChange={handleEditInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="sections" 
                    placeholder="Subject (e.g., Mathematics)" 
                    className="form-input"
                    value={editingTeacher.sections} 
                    onChange={handleEditInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="phone" 
                    placeholder="Phone Number" 
                    className="form-input"
                    value={editingTeacher.phone} 
                    onChange={handleEditInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="text" 
                    name="school_name" 
                    placeholder="School Name" 
                    className="form-input"
                    value={editingTeacher.school_name} 
                    onChange={handleEditInputChange}
                    disabled={loading}
                  />
                  <input 
                    type="password" 
                    name="new_password" 
                    placeholder="New Password (leave blank to keep current)" 
                    className="form-input"
                    value={editingTeacher.new_password} 
                    onChange={handleEditInputChange}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="custom-modal-footer">
                <button 
                  type="submit" 
                  className="custom-button primary-button"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Teacher'}
                </button>
                <button 
                  type="button" 
                  className="custom-button secondary-button" 
                  onClick={closeEditModal}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Table */}
      <div className="table-container">
        {loading && !showModal && !showEditModal && (
          <div className="loading-message">Loading teachers...</div>
        )}
        
        <table className="teacher-table">
          <thead className="table-header">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Grade Level</th>
              <th>Subject</th>
              <th>Phone</th>
              <th>School</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length > 0 ? teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.name || teacher.teacher_name || 'N/A'}</td>
                <td>{teacher.email || 'N/A'}</td>
                <td>{teacher.class_handled || teacher.grade_level || 'N/A'}</td>
                <td>{teacher.sections || teacher.subject || 'N/A'}</td>
                <td>{teacher.phone || 'N/A'}</td>
                <td>{teacher.school_name || 'N/A'}</td>
                <td>
                  <button 
                    className="action-button edit-button" 
                    onClick={() => handleEdit(teacher)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-button delete-button" 
                    onClick={() => handleDelete(teacher.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="no-data-message">
                  {loading ? 'Loading...' : 'No teachers found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherDirectory;