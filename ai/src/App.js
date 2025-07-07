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
import AdminDashboard from './adminDashboard/AdminDashboard'; // ✅ Add this import

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/add" element={<DashboardAdd />} />
        <Route path="/dashboard/sub" element={<DashboardSub />} />
        <Route path="/readMyBook" element={<ReadMyBook />} />
        <Route path="/warmup" element={<Warmup />} />
        <Route path="/incorrect" element={<IncorrectWordsHandler />} />
        <Route path="/upload" element={<ImageUpload />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} /> {/* ✅ Add this route */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
