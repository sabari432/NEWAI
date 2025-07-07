// src/adminDashboard/ClassList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Dummy data for now
    setClasses([
      { id: 'class1', name: 'Class A' },
      { id: 'class2', name: 'Class B' }
    ]);

    // TODO: Replace with API call: fetch('/api/getClasses.php')
  }, []);

  const handleClassClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  return (
    <div>
      <h3>All Classes</h3>
      <ul>
        {classes.map((cls) => (
          <li key={cls.id}>
            <button onClick={() => handleClassClick(cls.id)}>{cls.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClassList;
