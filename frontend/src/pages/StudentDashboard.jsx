import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css'; // Using the premium Super Admin layout CSS

const SIDEBAR_MENU = [
  { id: 'Overview', icon: '📊' },
  { id: 'My Profile', icon: '🧑‍💻' },
  { id: 'Available Tests', icon: '📝' },
  { id: 'My Results', icon: '🏆' }
];

export default function StudentDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [accessCode, setAccessCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const testsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/tests`);
      setTests(testsRes.data);
      const resultsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/results?user_id=${user.id}`);
      setResults(resultsRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tests/${accessCode}`);
      navigate(`/exam/${accessCode}`, { state: { testData: res.data } });
    } catch (err) {
      alert(err.response?.data?.error || 'Test not found');
    }
  };

  const handleJoinDirectly = async (code) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tests/${code}`);
      navigate(`/exam/${code}`, { state: { testData: res.data } });
    } catch (err) {
      alert(err.response?.data?.error || 'Test not found');
    }
  };

  if (!user || user.role !== 'student') return <div style={{padding: '2rem'}}>Access Denied. Students only.</div>;

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
            <input type="text" placeholder="Search tests..." />
          </div>
          <div className="topbar-actions">
            <span className="action-icon">🔔</span>
            <span className="action-icon">❓</span>
            <div className="profile-snippet">
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{user.username}</div>
                <div style={{color: '#a3aed1', fontSize: '0.75rem'}}>Student Portal</div>
              </div>
              <div className="profile-avatar" style={{background: '#00c6ff'}}>
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
            <>
              <div className="dashboard-grid">
                <div className="dash-card">
                  <div className="dash-card-icon" style={{background: 'rgba(67, 24, 255, 0.1)', color: '#4318ff'}}>📄</div>
                  <div className="dash-card-info">
                    <h4>Available Tests</h4>
                    <h2>{tests.length}</h2>
                  </div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-icon" style={{background: 'rgba(0, 204, 153, 0.1)', color: '#00cc99'}}>✅</div>
                  <div className="dash-card-info">
                    <h4>Tests Completed</h4>
                    <h2>{results.length}</h2>
                  </div>
                </div>
                <div className="dash-card">
                  <div className="dash-card-icon" style={{background: 'rgba(255, 153, 0, 0.1)', color: '#ff9900'}}>🏆</div>
                  <div className="dash-card-info">
                    <h4>Passed</h4>
                    <h2>{results.filter(r => r.status === 'Submitted').length}</h2>
                  </div>
                </div>
              </div>

              <div className="super-panel" style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
                <div style={{flex: 1}}>
                  <h2 style={{marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600}}>Join a Mock Test</h2>
                  <p style={{color: '#64748b', fontSize: '0.9rem'}}>Enter the access code provided by your instructor to begin.</p>
                </div>
                <form onSubmit={handleJoinByCode} style={{display: 'flex', gap: '1rem'}}>
                  <input 
                    type="text" 
                    className="super-input" 
                    placeholder="MOCK CODE" 
                    value={accessCode} 
                    onChange={e => setAccessCode(e.target.value)} 
                    required 
                    style={{textTransform: 'uppercase', width: '200px'}}
                  />
                  <button type="submit" className="super-btn super-btn-primary" style={{whiteSpace: 'nowrap'}}>Join Exam</button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'My Profile' && (
            <div className="super-panel" style={{maxWidth: '600px'}}>
              <h3 className="panel-title" style={{marginBottom: '1.5rem'}}>Student Information</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                <div>
                  <label style={{color: '#a3aed1', fontSize: '0.85rem', fontWeight: 500}}>Full Name</label>
                  <div style={{fontSize: '1.1rem', fontWeight: 600, padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0'}}>{user.username}</div>
                </div>
                <div>
                  <label style={{color: '#a3aed1', fontSize: '0.85rem', fontWeight: 500}}>Email Address</label>
                  <div style={{fontSize: '1.1rem', fontWeight: 600, padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0'}}>{user.email}</div>
                </div>
                <div>
                  <label style={{color: '#a3aed1', fontSize: '0.85rem', fontWeight: 500}}>Registration No.</label>
                  <div style={{fontSize: '1.1rem', fontWeight: 600, padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0'}}>{user.registration_no || 'Not Assigned'}</div>
                </div>
                <div>
                  <label style={{color: '#a3aed1', fontSize: '0.85rem', fontWeight: 500}}>Phone</label>
                  <div style={{fontSize: '1.1rem', fontWeight: 600, padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0'}}>{user.phone || 'Not Assigned'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Available Tests' && (
            <div className="super-panel">
              <h3 className="panel-title" style={{marginBottom: '1.5rem'}}>Active Tests</h3>
              <div className="data-list">
                {tests.length === 0 ? <p style={{color: '#888'}}>No tests currently active.</p> : tests.map(t => (
                  <div key={t.id} className="data-item">
                    <div>
                      <strong style={{fontSize: '1.1rem'}}>{t.title}</strong>
                      <div style={{fontSize: '0.85rem', color: '#a3aed1', marginTop: '0.25rem'}}>Duration: {t.duration_minutes} minutes | Starts: {new Date(t.start_time).toLocaleString()}</div>
                    </div>
                    <button className="super-btn super-btn-primary" onClick={() => handleJoinDirectly(t.access_code)}>Start Test</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'My Results' && (
            <div className="super-panel">
              <h3 className="panel-title" style={{marginBottom: '1.5rem'}}>Submission History</h3>
              <div className="data-list">
                {results.length === 0 ? <p style={{color: '#888'}}>You have not completed any tests yet.</p> : results.map(r => (
                  <div key={r.id} className="data-item">
                    <div>
                      <strong style={{fontSize: '1.1rem'}}>{r.test_title}</strong>
                      <div style={{fontSize: '0.85rem', color: '#a3aed1', marginTop: '0.25rem'}}>Submitted on {new Date(r.submitted_at).toLocaleString()}</div>
                    </div>
                    <div className="badge badge-success" style={{fontSize: '0.9rem', padding: '0.5rem 1rem'}}>
                      {r.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
