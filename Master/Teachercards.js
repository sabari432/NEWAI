import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './teachersCards.css';

// Modal component for showing raw teacher data
const TeacherRawDataModal = ({ teacher, onClose }) => (
  <div className="raw-data-overlay">
    <div className="raw-data-modal">
      <div className="modal-header">
        <h3 style={{ color: '#000000' }}>👨‍🏫 Teacher Details - {teacher.name || 'Unknown Teacher'}</h3>
        <button className="close-button" onClick={onClose} style={{ color: '#000000' }}>&times;</button>
      </div>
      <div className="modal-content">
        <div className="teacher-raw-data">
          <table className="raw-data-table">
            <tbody>
              <tr>
                <td><strong style={{ color: '#000000' }}>👤 Name:</strong></td>
                <td style={{ color: '#000000' }}>{teacher.name || 'N/A'}</td>
              </tr>
              <tr>
                <td><strong style={{ color: '#000000' }}>🆔 ID:</strong></td>
                <td style={{ color: '#000000' }}>{teacher.id || 'N/A'}</td>
              </tr>
              {teacher.email && (
                <tr>
                  <td><strong style={{ color: '#000000' }}>📧 Email:</strong></td>
                  <td style={{ color: '#000000' }}>{teacher.email}</td>
                </tr>
              )}
              {teacher.phone && (
                <tr>
                  <td><strong style={{ color: '#000000' }}>📱 Phone:</strong></td>
                  <td style={{ color: '#000000' }}>{teacher.phone}</td>
                </tr>
              )}
              {teacher.class_handled && (
                <tr>
                  <td><strong style={{ color: '#000000' }}>🎓 Class Handled:</strong></td>
                  <td style={{ color: '#000000' }}>{teacher.class_handled}</td>
                </tr>
              )}
              {teacher.sections && (
                <tr>
                  <td><strong style={{ color: '#000000' }}>📚 Sections:</strong></td>
                  <td style={{ color: '#000000' }}>{teacher.sections}</td>
                </tr>
              )}
              <tr>
                <td><strong style={{ color: '#000000' }}>👥 Student Count:</strong></td>
                <td><span className="student-count-highlight" style={{ color: '#000000' }}>{teacher.count || 0}</span></td>
              </tr>
              {teacher.subject && (
                <tr>
                  <td><strong style={{ color: '#000000' }}>📖 Subject:</strong></td>
                  <td style={{ color: '#000000' }}>{teacher.subject}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Mini Pie Chart Component for Teacher Cards
const TeacherPieChart = ({ teacher, colors }) => {
  // Generate English subject-focused data
  const generateChartData = (teacher) => {
    const totalStudents = teacher.count || 0;
    if (totalStudents === 0) {
      return [{ name: 'No Students', value: 1, color: '#e2e8f0' }];
    }

    // English subject categories
    const data = [
      { 
        name: 'Reading Skills', 
        value: 4, 
        color: colors[0] 
      },
      { 
        name: 'Writing Skills', 
        value: 3, 
        color: colors[1] 
      },
      { 
        name: 'Speaking Skills', 
        value: 2, 
        color: colors[2] 
      }
    ];

    return data;
  };

  const chartData = generateChartData(teacher);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          color: '#000000'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#000000' }}>
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="teacher-pie-chart">
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={25}
            outerRadius={45}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-center-text">
        <div className="center-number" style={{ color: '#000000' }}>{teacher.count || 0}</div>
        <div className="center-label" style={{ color: '#000000' }}>Total</div>
      </div>
    </div>
  );
};

function TeacherCards() {
  const [teacherCardsData, setTeacherCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    const fetchTeacherCards = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/getTeacherCardsData.php', { 
          withCredentials: true 
        });
        
        console.log("API Response:", response.data);
        
        let data = response.data;
        
        if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
          data = data.data;
        }
        else if (data && typeof data === 'object' && data.teachers && Array.isArray(data.teachers)) {
          data = data.teachers;
        }
        else if (!Array.isArray(data)) {
          console.warn("API response is not an array:", data);
          data = [];
        }
        
        setTeacherCardsData(data);
      } catch (err) {
        console.error("Error fetching teacher cards data:", err);
        setError("Failed to load teacher data. Please try again.");
        setTeacherCardsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherCards();
  }, []);

  const handleCardClick = (teacher) => {
    setSelectedTeacher(teacher);
  };

  const closeModal = () => {
    setSelectedTeacher(null);
  };

  // Get random gradient and colors for each card
  const getRandomGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    return gradients[index % gradients.length];
  };

  const getChartColors = (index) => {
    const colorSets = [
      ['#667eea', '#764ba2', '#9f7aea'],
      ['#f093fb', '#f5576c', '#ff8a80'],
      ['#4facfe', '#00f2fe', '#64b5f6'],
      ['#43e97b', '#38f9d7', '#66bb6a'],
      ['#fa709a', '#fee140', '#ffab40'],
      ['#a8edea', '#fed6e3', '#f8bbd9'],
      ['#ff9a9e', '#fecfef', '#f48fb1'],
      ['#a18cd1', '#fbc2eb', '#ce93d8'],
    ];
    return colorSets[index % colorSets.length];
  };

  if (loading) {
    return (
      <div className="teacher-cards-loading">
        <div className="loading-spinner"></div>
        <p style={{ color: '#000000' }}>✨ Loading amazing teachers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-cards-error">
        <div className="error-icon">😔</div>
        <p style={{ color: '#000000' }}>{error}</p>
      </div>
    );
  }

  if (!Array.isArray(teacherCardsData) || teacherCardsData.length === 0) {
    return (
      <div className="teacher-cards-empty">
        <div className="empty-icon">👨‍🏫</div>
        <p style={{ color: '#000000' }}>No teacher data available</p>
      </div>
    );
  }

  return (
    <div className="teacher-cards-section">
      <div className="section-header">
        <h2 className="section-title" style={{ color: '#000000' }}>
          <span className="title-icon">👨‍🏫</span>
          Our Amazing Teachers
          <span className="title-icon">👩‍🏫</span>
        </h2>
        <p className="section-subtitle" style={{ color: '#000000' }}>Meet the incredible educators shaping young minds</p>
      </div>
      
      <div className="teacher-cards-grid">
        {teacherCardsData.map((teacher, index) => (
          <div 
            key={teacher.id || Math.random()} 
            className="modern-teacher-card"
            onClick={() => handleCardClick(teacher)}
            style={{ '--card-gradient': getRandomGradient(index) }}
          >
            <div className="card-glow"></div>
            <div className="card-background"></div>
            
            <div className="teacher-avatar">
              <div className="avatar-circle">
                <span className="avatar-text" style={{ color: '#000000' }}>
                  {(teacher.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="avatar-glow"></div>
            </div>
            
            <div className="teacher-content">
              <h3 className="teacher-name-modern" style={{ color: '#000000' }}>
                {teacher.name || 'Unknown Teacher'}
              </h3>
              
              <div className="teacher-details">
                {teacher.class_handled && (
                  <div className="detail-item">
                    <span className="detail-icon">🎓</span>
                    <span className="detail-text" style={{ color: '#000000' }}>Class {teacher.class_handled}</span>
                  </div>
                )}
                
                {teacher.sections && (
                  <div className="detail-item">
                    <span className="detail-icon">📚</span>
                    <span className="detail-text" style={{ color: '#000000' }}>{teacher.sections}</span>
                  </div>
                )}
              </div>
              
              {/* Pie Chart Section */}
              <div className="chart-section">
                <TeacherPieChart 
                  teacher={teacher} 
                  colors={getChartColors(index)} 
                />
              </div>
              
              <div className="student-counter">
                <div className="counter-circle">
                  <span className="counter-number" style={{ color: '#000000' }}>{teacher.count || 0}</span>
                </div>
                <span className="counter-label" style={{ color: '#000000' }}>Students</span>
              </div>
              
              <div className="card-footer">
                <span className="click-indicator" style={{ color: '#000000' }}>
                  ✨ Click to explore
                </span>
              </div>
            </div>
            
            <div className="card-shine"></div>
          </div>
        ))}
      </div>
      
      {selectedTeacher && (
        <TeacherRawDataModal 
          teacher={selectedTeacher} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}

export default TeacherCards;