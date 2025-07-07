// src/components/teacherDashboard/TeacherDashboard.js
import React, { useEffect, useState } from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    // Load all classes for this teacher
    fetch('http://localhost/ai-backend/api/get_teacher_classes.php?teacher_id=1') // Replace with dynamic teacher ID later
      .then(res => res.json())
      .then(data => setClasses(data.classes))
      .catch(err => console.error(err));
  }, []);

  const handleClassClick = (classId) => {
    setSelectedClass(classId);
    setSelectedStudent(null);
    fetch(`http://localhost/ai-backend/api/get_class_students.php?class_id=${classId}`)
      .then(res => res.json())
      .then(data => setStudents(data.students))
      .catch(err => console.error(err));
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    localStorage.setItem('selectedStudentId', student.id); // For student dashboard
  };

  return (
    <div className="teacher-dashboard">
      <h2>📘 Teacher Dashboard</h2>

      <div className="dashboard-sections">
        {/* Class List */}
        <div className="class-list">
          <h3>Classes</h3>
          <ul>
            {classes.map(cls => (
              <li key={cls.id} onClick={() => handleClassClick(cls.id)}>
                {cls.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Student List */}
        {selectedClass && (
          <div className="student-list">
            <h3>Students in Class</h3>
            <ul>
              {students.map(stu => (
                <li key={stu.id} onClick={() => handleStudentClick(stu)}>
                  {stu.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Student Progress */}
        {selectedStudent && (
          <div className="student-progress">
            <h3>📊 Student: {selectedStudent.name}</h3>
            <p>Progress tracking will go here...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
