import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './teacherDirectory.css';

function TeacherDirectory() {
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({
    id: '',
    name: '',
    email: '',
    class_handled: '',
    sections: '',
    new_password: '',
    confirm_password: '',
    phone: '',
    school_name: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/get_teachers.php', { withCredentials: true });
      let teachersData = response.data.data || response.data;
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setError('');
    } catch (error) {
      setError('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setTeacherForm({ id: '', name: '', email: '', class_handled: '', sections: '', new_password: '', confirm_password: '', phone: '', school_name: '' });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (teacher) => {
    setTeacherForm({
      id: teacher.id,
      name: teacher.name || teacher.teacher_name || '',
      email: teacher.email || '',
      class_handled: teacher.class_handled || teacher.grade_level || '',
      sections: teacher.sections || teacher.subject || '',
      new_password: '',
      confirm_password: '',
      phone: teacher.phone || '',
      school_name: teacher.school_name || ''
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Password Validation
    if (!isEdit && teacherForm.new_password === '') {
      alert('Password is required for new teacher!');
      return;
    }
    if (teacherForm.new_password !== teacherForm.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    const apiUrl = isEdit
      ? 'http://localhost:8000/api/update_teacher.php'
      : 'http://localhost:8000/api/add_teacher.php';

    try {
      const payload = { ...teacherForm };
      if (isEdit && payload.new_password === '') delete payload.new_password; // Don't send empty password in edit

      const response = await axios.post(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        alert(isEdit ? 'Teacher updated successfully!' : 'Teacher added successfully!');
        fetchTeachers();
        setShowModal(false);
      } else {
        throw new Error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/delete_teacher.php', { id }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      if (response.data.success) {
        setTeachers(prev => prev.filter(t => t.id !== id));
        alert('Teacher deleted successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      alert('Error deleting teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-directory-container">
      <h2 className="teacher-directory-title">Teacher Directory</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="add-teacher-button-container">
        <button className="add-teacher-button" onClick={openAddModal}>Add Teacher</button>
      </div>

      {/* ✅ Modal */}
      {showModal && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-content">
            <form onSubmit={handleSubmit}>
              <div className="custom-modal-header">
                <h5>{isEdit ? 'Edit Teacher' : 'Add Teacher'}</h5>
                <button type="button" className="custom-modal-close-button" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <div className="custom-modal-body">
                <div className="form-grid">
                  <input className="form-input" name="name" placeholder="Teacher Name" value={teacherForm.name} onChange={handleInputChange} required />
                  <input className="form-input" type="email" name="email" placeholder="Email" value={teacherForm.email} onChange={handleInputChange} required />
                  <input className="form-input" name="class_handled" placeholder="Grade Level" value={teacherForm.class_handled} onChange={handleInputChange} />
                  <input className="form-input" name="sections" placeholder="Subject" value={teacherForm.sections} onChange={handleInputChange} />
                  <input className="form-input" name="phone" placeholder="Phone" value={teacherForm.phone} onChange={handleInputChange} />
                  <input className="form-input" name="school_name" placeholder="School Name" value={teacherForm.school_name} onChange={handleInputChange} />
                  <input className="form-input" type="password" name="new_password" placeholder={isEdit ? 'New Password (Optional)' : 'Password'} value={teacherForm.new_password} onChange={handleInputChange} />
                  <input className="form-input" type="password" name="confirm_password" placeholder="Confirm Password" value={teacherForm.confirm_password} onChange={handleInputChange} />
                </div>
              </div>
              <div className="custom-modal-footer">
                <button type="submit" className="custom-button primary-button">
                  {loading ? 'Saving...' : (isEdit ? 'Update Teacher' : 'Add Teacher')}
                </button>
                <button type="button" className="custom-button secondary-button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Teacher Table */}
      <div className="table-container">
        <table className="teacher-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Grade Level</th><th>Subject</th><th>Phone</th><th>School</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length > 0 ? teachers.map(t => (
              <tr key={t.id}>
                <td>{t.name || t.teacher_name}</td>
                <td>{t.email}</td>
                <td>{t.class_handled || t.grade_level}</td>
                <td>{t.sections || t.subject}</td>
                <td>{t.phone}</td>
                <td>{t.school_name}</td>
                <td>
                  <button className="action-button edit-button" onClick={() => openEditModal(t)}>Edit</button>
                  <button className="action-button delete-button" onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7">No teachers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherDirectory;
