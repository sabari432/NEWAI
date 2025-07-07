import React, { useState } from 'react';
import axios from 'axios';
import './register.css';
import { API_BASE_URL } from '../config';

const Register = () => {
  const [formData, setFormData] = useState({
    student_name: '', // Changed to match PHP backend
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError(''); // Clear error when user types
    setSuccess(''); // Clear success message when user types
  };

  const validateForm = () => {
    if (!formData.student_name.trim()) {
      setError('Student name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      student_name: formData.student_name, // Changed to match PHP backend
      email: formData.email,
      password: formData.password
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/register.php`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess('Registration successful! You can now log in.');
        setFormData({
          student_name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setError(response.data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Invalid registration data');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <div className="logo">
          <div className="logo-icon">📚</div>
        </div>
        <h1 className="app-title">ReadingPal</h1>
        <p className="app-subtitle">Help your child become a confident reader</p>
      </div>

      <div className="register-form-container">
        <h2 className="form-title">Create Account</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="student_name" className="form-label">Student Name</label>
            <div className="input-container">
              <input
                type="text"
                id="student_name"
                name="student_name"
                value={formData.student_name}
                onChange={handleInputChange}
                placeholder="Enter student's name"
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div className="input-container">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="parent@example.com"
                className="form-input with-icon"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password (min. 6 characters)"
                className="form-input with-toggle"
                required
                disabled={loading}
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div className="input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="form-input with-toggle"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="form-footer">
          <p className="login-link">
            Already have an account? <a href="/login">Sign in here</a>
          </p>
        </div>
      </div>

      <div className="feature-highlight">
        <span className="highlight-icon">⭐</span>
        <span className="highlight-text">Join thousands of families improving reading skills</span>
      </div>
    </div>
  );
};

export default Register;