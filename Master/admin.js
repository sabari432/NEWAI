import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

import TeacherDirectory from './TeacherDirectory';
import TeacherCards from './Teachercards';
import Dashboard from './admingraph';

// ✅ Enhanced Modal with beautiful animations
const RawDataModal = ({ title, data, onClose }) => (
  <div className="raw-data-overlay" onClick={onClose}>
    <div className="raw-data-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>
          <span style={{ marginRight: '10px' }}>📊</span>
          {title}
        </h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="modal-content">
        {data && data.length > 0 ? (
          <>
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))', 
              borderRadius: '12px',
              textAlign: 'center',
              fontWeight: '600',
              color: '#000000'
            }}>
              Total Records: {data.length}
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
              <table className="raw-data-table">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((key, index) => (
                      <th key={key} style={{ 
                        background: index % 2 === 0 ? 
                          'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' : 
                          'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)'
                      }}>
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} style={{ 
                      animationDelay: `${i * 0.05}s`,
                      animation: 'fadeInUp 0.3s ease forwards'
                    }}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={{
                          background: i % 2 === 0 ? 'rgba(248, 249, 250, 0.5)' : 'transparent'
                        }}>
                          {val || 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#000000',
            fontSize: '1.1rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
            <p>No data available for this category.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ✅ Loading Component with modern spinner
const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
    <p style={{ marginTop: '20px', color: '#000000', fontWeight: '600' }}>
      Loading dashboard data...
    </p>
  </div>
);

// ✅ Floating particles for extra wow factor
const FloatingParticles = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <div 
        key={i}
        className="floating-particle"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 6}s`,
          animationDuration: `${4 + Math.random() * 4}s`
        }}
      />
    ))}
  </>
);

function TeacherDashboard() {
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    totalTeachers: 0, 
    totalClasses: 0 
  });
  const [rawData, setRawData] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Enhanced fetch with better error handling
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/api/getTeacherStats.php');
        
        // Simulate network delay for demo (remove in production)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard data');
        setStats({ 
          totalStudents: 'N/A', 
          totalTeachers: 'N/A', 
          totalClasses: 'N/A' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ✅ Enhanced function to fetch raw data with loading states
  const fetchRawData = async (type) => {
    const endpoints = {
      classes: 'get_classes.php',
      teachers: 'get_teachers.php',
      students: 'get_students.php'
    };

    const titles = {
      classes: 'Class Details',
      teachers: 'Teacher Directory',
      students: 'Student Records'
    };

    const icons = {
      classes: '🎓',
      teachers: '👨‍🏫',
      students: '👥'
    };

    try {
      const res = await axios.get(`http://localhost:8000/api/${endpoints[type]}`);
      if (res.data.success) {
        setRawData(res.data.data);
        setModalTitle(`${icons[type]} ${titles[type]}`);
      } else {
        setRawData([]);
        setModalTitle(`${icons[type]} ${titles[type]} - No Data`);
      }
    } catch (err) {
      console.error('Error fetching raw data:', err);
      setRawData([]);
      setModalTitle(`${icons[type]} ${titles[type]} - Error`);
    }
  };

  // ✅ Show loading screen
  if (loading) {
    return (
      <div className="dashboard-container gradient-background">
        <FloatingParticles />
        <LoadingSpinner />
      </div>
    );
  }

  // ✅ Show error screen
  if (error) {
    return (
      <div className="dashboard-container gradient-background">
        <FloatingParticles />
        <div className="error-message">
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ color: '#000000' }}>Oops! Something went wrong</h3>
          <p style={{ color: '#000000' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#000000',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: '600',
              marginTop: '15px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container gradient-background">
      <FloatingParticles />
      
      {/* ✅ Enhanced Title with animated subtitle */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ color: '#000000' }}>
          🚀 Master Dashboard
        </h2>
        <p style={{
          fontSize: '1.2rem',
          color: '#000000',
          fontWeight: '500',
          margin: '0',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Real-time Analytics & Insights
        </p>
      </div>

      {/* ✅ Ultra Modern Combined Summary Cards */}
      <div className="combined-card">
        <div className="card-item" style={{ animationDelay: '0.1s', animation: 'fadeInUp 0.6s ease forwards' }}>
          <div>
            <span style={{ marginRight: '8px' }}>🎓</span>
            Total Classes
          </div>
          <div>{stats.totalClasses || 0}</div>
        </div>
        
        <div className="card-item" style={{ animationDelay: '0.2s', animation: 'fadeInUp 0.6s ease forwards' }}>
          <div>
            <span style={{ marginRight: '8px' }}>👥</span>
            Total Students
          </div>
          <div>{stats.totalStudents || 0}</div>
        </div>
        
        <div className="card-item" style={{ animationDelay: '0.3s', animation: 'fadeInUp 0.6s ease forwards' }}>
          <div>
            <span style={{ marginRight: '8px' }}>👨‍🏫</span>
            Total Teachers
          </div>
          <div>{stats.totalTeachers || 0}</div>
        </div>
      </div>

      {/* ✅ Individual Clickable Cards with enhanced interactions */}
      <div className="card-container">
        <div 
          className="card clickable" 
          onClick={() => fetchRawData('classes')}
          style={{ 
            animationDelay: '0.4s', 
            animation: 'fadeInUp 0.6s ease forwards',
            opacity: 0
          }}
        >
          <div className="card-title">
            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>🎓</span>
            Total Classes
          </div>
          <div className="card-text">{stats.totalClasses}</div>
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '20px',
            color: '#000000',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            Click for details →
          </div>
        </div>

        <div 
          className="card clickable" 
          onClick={() => fetchRawData('students')}
          style={{ 
            animationDelay: '0.5s', 
            animation: 'fadeInUp 0.6s ease forwards',
            opacity: 0
          }}
        >
          <div className="card-title">
            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>👥</span>
            Total Students
          </div>
          <div className="card-text">{stats.totalStudents}</div>
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '20px',
            color: '#000000',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            Click for details →
          </div>
        </div>

        <div 
          className="card clickable" 
          onClick={() => fetchRawData('teachers')}
          style={{ 
            animationDelay: '0.6s', 
            animation: 'fadeInUp 0.6s ease forwards',
            opacity: 0
          }}
        >
          <div className="card-title">
            <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>👨‍🏫</span>
            Total Teachers
          </div>
          <div className="card-text">{stats.totalTeachers}</div>
          <div style={{
            position: 'absolute',
            bottom: '15px',
            right: '20px',
            color: '#000000',
            fontSize: '0.8rem',
            fontWeight: '500'
          }}>
            Click for details →
          </div>
        </div>
      </div>

      {/* ✅ Enhanced Modal with better UX */}
      {rawData && (
        <RawDataModal 
          title={modalTitle} 
          data={rawData} 
          onClose={() => setRawData(null)} 
        />
      )}

      {/* ✅ Other components with staggered animations */}
      <div style={{ 
        marginTop: '80px',
        animationDelay: '0.7s', 
        animation: 'fadeInUp 0.6s ease forwards',
        opacity: 0
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '30px',
          marginBottom: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#000000',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>

          </h3>
          <TeacherDirectory />
        </div>
      </div>

      <div style={{ 
        marginTop: '40px',
        animationDelay: '0.8s', 
        animation: 'fadeInUp 0.6s ease forwards',
        opacity: 0
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '30px',
          marginBottom: '40px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#000000',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
          </h3>
          <TeacherCards />
        </div>
      </div>

      {/* ✅ Footer with additional info */}
      {/* <div style={{
        marginTop: '60px',
        textAlign: 'center',
        color: '#000000',
        fontSize: '0.9rem',
        fontWeight: '500'
      }}>
        <p>Dashboard last updated: {new Date().toLocaleString()}</p>
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ margin: '0', color: '#000000' }}>
            💡 Click on any card above to view detailed information
          </p>
        </div>
      </div> */}
    </div>
  );
}

// ✅ Add keyframe animations to CSS
const additionalStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .card-item:hover {
    animation: pulse 0.6s ease-in-out;
  }
`;

// ✅ Inject additional styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = additionalStyles;
  document.head.appendChild(styleSheet);
}

export default TeacherDashboard;