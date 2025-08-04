import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MasterDashboard.css';
import { API_BASE_URL } from '../config';

import SchoolList from './SchoolList';
import SchoolDashboard from './SchoolDashboard';
import TeacherClasses from './TeacherClasses';
import ClassStudents from './ClassStudents';

const MasterDashboard = () => {
  const [currentView, setCurrentView] = useState('schools'); // schools, school-dashboard, teacher-classes, class-students
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState(['Schools']);

  // Navigation functions
  const navigateToSchool = (school) => {
    setSelectedSchool(school);
    setCurrentView('school-dashboard');
    setBreadcrumb(['Schools', school.name]);
  };

  const navigateToTeacherClasses = (teacher) => {
    setSelectedTeacher(teacher);
    setCurrentView('teacher-classes');
    setBreadcrumb(['Schools', selectedSchool.name, `${teacher.name}'s Classes`]);
  };

  const navigateToClassStudents = (classData) => {
    setSelectedClass(classData);
    setCurrentView('class-students');
    setBreadcrumb(['Schools', selectedSchool.name, `${selectedTeacher.name}'s Classes`, classData.name]);
  };

  const navigateBack = (level) => {
    if (level === 0) {
      setCurrentView('schools');
      setSelectedSchool(null);
      setSelectedTeacher(null);
      setSelectedClass(null);
      setBreadcrumb(['Schools']);
    } else if (level === 1) {
      setCurrentView('school-dashboard');
      setSelectedTeacher(null);
      setSelectedClass(null);
      setBreadcrumb(['Schools', selectedSchool.name]);
    } else if (level === 2) {
      setCurrentView('teacher-classes');
      setSelectedClass(null);
      setBreadcrumb(['Schools', selectedSchool.name, `${selectedTeacher.name}'s Classes`]);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'schools':
        return <SchoolList onSchoolSelect={navigateToSchool} />;
      case 'school-dashboard':
        return (
          <SchoolDashboard 
            school={selectedSchool} 
            onTeacherSelect={navigateToTeacherClasses}
          />
        );
      case 'teacher-classes':
        return (
          <TeacherClasses 
            teacher={selectedTeacher}
            school={selectedSchool}
            onClassSelect={navigateToClassStudents}
          />
        );
      case 'class-students':
        return (
          <ClassStudents 
            classData={selectedClass}
            teacher={selectedTeacher}
            school={selectedSchool}
          />
        );
      default:
        return <SchoolList onSchoolSelect={navigateToSchool} />;
    }
  };

  return (
    <div className="master-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🏫 Master Admin Dashboard</h1>
        
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={index}>
              {index > 0 && <span className="separator"> / </span>}
              <button 
                className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}
                onClick={() => navigateBack(index)}
                disabled={index === breadcrumb.length - 1}
              >
                {item}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default MasterDashboard;