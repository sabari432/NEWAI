import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

// ✅ CORRECTED IMPORT for admin.js: Just './' because TeacherDirectory is in the same folder
import TeacherDirectory from './TeacherDirectory'; 
import TeacherCards from './Teachercards'; // Ensure casing matches the actual filename
// import TeacherCards from './teachersCards'; // Assuming this file also exists in the same directory

function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    TotalClass: 0,
  });

  useEffect(() => {
    axios.get('http://localhost:8000/api/getTeacherStats.php', { withCredentials: true })
      .then((response) => {
        setStats(response.data);
      })
      .catch((error) => {
        console.error('Error fetching dashboard data:', error);
        setStats({ totalStudents: 'N/A', totalTeachers: 'N/A', TotalClass: 'N/A' });
      });
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Teacher Dashboard</h2>

      <div className="card-container">
        <div className="card">
          <div className="card-title">Total Students</div>
          <div className="card-text">{stats.totalStudents}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Teachers</div>
          <div className="card-text">{stats.totalTeachers}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Classes</div>
          <div className="card-text">{stats.TotalClass}</div>
        </div>
      </div>

      {/* ✅ Render the TeacherDirectory component below the stats */}
      <div style={{ marginTop: '40px' }}>
        <TeacherDirectory />
      </div>

      {/* If you also have TeacherCards to render */}
      <div style={{ marginTop: '40px' }}>
        <TeacherCards/>
      </div>
    </div>
  );
}

export default TeacherDashboard;