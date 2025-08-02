import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './teachersCards.css';

function TeacherCards() {
  const [teacherCardsData, setTeacherCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacherCards = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/getTeacherCardsData.php', { withCredentials: true });
        
        // Debug: Log the response to see what we're getting
        console.log("API Response:", response.data);
        
        // Handle different response formats
        let data = response.data;
        
        // If the response is an object with a data property that contains the array
        if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
          data = data.data;
        }
        // If the response is an object with a teachers property that contains the array
        else if (data && typeof data === 'object' && data.teachers && Array.isArray(data.teachers)) {
          data = data.teachers;
        }
        // If the response is not an array, convert it to an empty array
        else if (!Array.isArray(data)) {
          console.warn("API response is not an array:", data);
          data = [];
        }
        
        setTeacherCardsData(data);
      } catch (err) {
        console.error("Error fetching teacher cards data:", err);
        setError("Failed to load teacher data. Please try again.");
        setTeacherCardsData([]); // Ensure it's always an array
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherCards();
  }, []);

  if (loading) {
    return <div className="teacher-cards-message">Loading teacher cards...</div>;
  }

  if (error) {
    return <div className="teacher-cards-message error">{error}</div>;
  }

  if (!Array.isArray(teacherCardsData) || teacherCardsData.length === 0) {
    return <div className="teacher-cards-message">No teacher data available.</div>;
  }

  return (
    <div className="teacher-cards-container">
      {teacherCardsData.map((teacher) => (
        <div key={teacher.id || Math.random()} className="teacher-card">
          <div className="teacher-card-content">
            <h4 className="teacher-name">{teacher.name || 'Unknown Teacher'}</h4>
            {/* Only show class and sections if they exist in the data */}
            {teacher.class_handled && (
              <p className="teacher-info">Class: {teacher.class_handled}</p>
            )}
            {teacher.sections && (
              <p className="teacher-info">Sections: {teacher.sections}</p>
            )}
            <div className="teacher-count-badge">
              <span className="count-label">Students:</span>
              <span className="count-value">{teacher.count || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TeacherCards;