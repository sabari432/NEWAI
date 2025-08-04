// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './security/login';
import DashboardAdd from './Dashboard/dashboardAdd';
import ImageUpload from './Dashboard/image';
import ReadMyBook from './Dashboard/readbook';
import Warmup from './Dashboard/warmup';
import IncorrectWordsHandler from './Dashboard/incorrect';
import Register from './security/register';
import DashboardSub from './Dashboard/dashboardsub';
import DailyChallenge from './Dashboard/DailyChallenge';
import AdminDashboard from './adminDashboard/AdminDashboard';
import DailyTaskManager from './adminDashboard/DailyTaskManager';
import TeacherDashboard from './Master/MasterDashboard'; // Imports the component from admin.js

import SchoolList from './Master/SchoolList';
import SchoolDashboard from './Master/SchoolDashboard';
import TeacherClasses from './Master/TeacherClasses';
import ClassStudents from './Master/ClassStudents';
// ✅ CORRECTED IMPORT for App.js: Starts with './' to go into the 'Master' folder
import TeacherDirectory from './Master/TeacherDirectory';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/Register" element={<Register />} />

        {/* Student Dashboard Routes */}
        <Route path="/dashboard/sub" element={<DashboardSub />} />
        <Route path="/readMyBook" element={<ReadMyBook />} />
        <Route path="/warmup" element={<Warmup />} />
        <Route path="/DailyChallenge" element={<DailyChallenge />} />
        <Route path="/incorrect" element={<IncorrectWordsHandler />} />
        <Route path="/upload" element={<ImageUpload />} />

        {/* Teacher Dashboard Routes */}
        <Route path="/dashboard/add" element={<DashboardAdd />} />

        {/* Admin Dashboard Routes */}
        {/* This route points to the TeacherDashboard component (from admin.js) */}
        <Route path="/Master/admin" element={<TeacherDashboard />} /> 
        
        {/* This route points to the TeacherDirectory component */}
        <Route path="/Master/teachertable" element={<TeacherDirectory />} /> 
        
        {/* Other Admin-related routes */}
        <Route path="/admin" element={<AdminDashboard />} />

         <Route path="./Master/SchoolList" element={<SchoolList />} />
         <Route path="./Master/SchoolDashboard" element={<SchoolDashboard />} />
         <Route path="/Master/TeacherClasses" element={<TeacherClasses />} />
         <Route path="./Master/ClassStudents" element={<ClassStudents />} />


        <Route path="/DailyTaskManager" element={<TeacherClasses />} />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;