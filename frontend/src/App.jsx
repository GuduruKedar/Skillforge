import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamIDE from './pages/ExamIDE';
import CollegeDashboard from './pages/CollegeDashboard';
import TutorDashboard from './pages/TutorDashboard';

import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={handleSetUser} />} />
        <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user && user.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/tutor" element={user && user.role === 'tutor' ? <TutorDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/college" element={user && user.role === 'college' ? <CollegeDashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/exam/:accessCode" element={user && user.role === 'student' ? <ExamIDE /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
