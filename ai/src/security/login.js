import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, BookOpen, Mail, Lock, Star } from 'lucide-react';
import './login.css';
import { Link } from 'react-router-dom';
import Register from './register';
import { API_BASE_URL } from '../config';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setFieldError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/login.php`, formData, {
        withCredentials: true,
      });

      if (response.data.success) {
        // Navigate based on user type
        if (response.data.user_type === 'student') {
          navigate('/dashboard/sub');
        } else if (response.data.user_type === 'teacher') {
          navigate('/dashboard/add');
        }
      } else {
        setError('Invalid email or password');
        setFieldError(true);
      }
    } catch (err) {
      setError('Server error. Please try again.');
      setFieldError(true);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo + Header */}
        

        {/* Login Form */}
        <div className="form-container">
          <h2 className="form-title">Login</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Input */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={`form-input ${fieldError ? 'error' : ''}`}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
               
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`form-input password-input ${fieldError ? 'error' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-button">
              Sign In
            </button>

            {/* Footer Message */}
            <div className="signup-link">
              Don't have an account?{' '}
              <span className="signup-text" onClick={() => navigate('/Register')} style={{ cursor: 'pointer' }}>
                Sign up here
              </span>
            </div>
          </form>
        </div>

        {/* Bottom Message */}
        <div className="bottom-message">
          <div className="message-badge">
            <Star className="star-icon" />
            <span className="message-text">
              Join thousands of families and students improving reading skills
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;