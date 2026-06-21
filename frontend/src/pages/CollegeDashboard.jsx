import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const SIDEBAR_MENU = [
  { id: 'Overview', icon: '📊' },
  { id: 'My Students', icon: '👨‍🎓' },
  { id: 'Results', icon: '🏆' }
];

export default function CollegeDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [students, setStudents] = useState([]);
  const [allTests, setAllTests] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const stuRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/college/students?college_id=${user.id}`);
      setStudents(stuRes.data);
      const testRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests`);
      setAllTests(testRes.data);
    } catch (err) {
      console.error('Error fetching college data', err);
    }
  };

  if (!user || user.role !== 'college') return <div style={{padding: '2rem'}}>Access Denied. Colleges only.</div>;

  return (
    <div className="super-admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><span>⚡</span> SkillForge</div>
        </div>
        <div className="sidebar-menu">
          {SIDEBAR_MENU.map(menu => (
            <div 
              key={menu.id} 
              className={`menu-item ${activeTab === menu.id ? 'active' : ''}`}
              onClick={() => setActiveTab(menu.id)}
            >
              <span className="menu-icon">{menu.icon}</span>
              {menu.id}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-search">
            <span>🔍</span>
            <input type="text" placeholder="Search students..." />
          </div>
          <div className="topbar-actions">
            <span className="action-icon">🔔</span>
            <div className="profile-snippet">
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{user.username}</div>
                <div style={{color: '#a3aed1', fontSize: '0.75rem'}}>College Portal</div>
              </div>
              <div className="profile-avatar" style={{background: '#ff9a9e'}}>
                {user.username.charAt(0).toUpperCase()}
              </div>
              <button onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/login';
              }} style={{background: 'transparent', border: '1px solid #e2e8f0', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', color: '#64748b', fontWeight: 500, marginLeft: '1rem'}}>Logout</button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="content-area">
          <h1 className="page-title">{activeTab}</h1>

          {activeTab === 'Overview' && (
            <div className="dashboard-grid">
              <div className="dash-card">
                <div className="dash-card-icon" style={{background: 'rgba(67, 24, 255, 0.1)', color: '#4318ff'}}>👨‍🎓</div>
                <div className="dash-card-info">
                  <h4>Total Students</h4>
                  <h2>{students.length}</h2>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-icon" style={{background: 'rgba(0, 204, 153, 0.1)', color: '#00cc99'}}>📄</div>
                <div className="dash-card-info">
                  <h4>Active Exams Available</h4>
                  <h2>{allTests.length}</h2>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'My Students' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Enrolled Students</h3>
              </div>
              <div className="data-list">
                {students.length === 0 ? <p style={{color: '#888'}}>No students assigned to your college yet.</p> : students.map(s => (
                  <div key={s.id} className="data-item">
                    <div>
                      <strong style={{fontSize: '1.1rem'}}>{s.username}</strong>
                      <div style={{fontSize: '0.85rem', color: '#a3aed1', marginTop: '0.25rem'}}>{s.email} | Reg: {s.registration_no || 'N/A'}</div>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Results' && (
            <div className="super-panel" style={{textAlign: 'center', padding: '4rem 2rem'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📊</div>
              <h2>Student Analytics</h2>
              <p style={{color: '#888', maxWidth: '500px', margin: '0 auto'}}>
                Detailed results and advanced analytics for your students will appear here in the next update.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
