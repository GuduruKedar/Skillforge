import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const SIDEBAR_MENU = [
  { id: 'Dashboard', icon: '📊' },
  { id: 'My Students', icon: '👨‍🎓' },
  { id: 'My Batches', icon: '👥' },
  { id: 'Mock Tests', icon: '📝' },
  { id: 'Coding Assignments', icon: '💻' },
  { id: 'Attendance', icon: '📅' },
  { id: 'Announcements', icon: '📢' },
  { id: 'Reports', icon: '📑' },
  { id: 'Settings', icon: '⚙️' }
];

export default function TutorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Forms
  const [newTest, setNewTest] = useState({ access_code: '', title: '', start_time: '', duration_minutes: 60 });
  const [newQuestion, setNewQuestion] = useState({ test_id: '', title: '', difficulty: 'Easy', description: '', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', examples: [{input: '', output: ''}], defaultCode: { python: '', java: '', javascript: '', cpp: '', csharp: '' } });
  const [newMcq, setNewMcq] = useState({ test_id: '', category: 'Quants', question_text: '', options: { 1: '', 2: '', 3: '', 4: '' }, correct_option: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const testsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests`); // Assuming tutor can see tests
      setTests(testsRes.data);
      const subRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tutor/submissions`);
      setSubmissions(subRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const createTest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests`, newTest);
      alert('Mock Test created successfully!');
      setNewTest({ access_code: '', title: '', start_time: '', duration_minutes: 60 });
      fetchData();
    } catch (err) { alert('Failed to create test'); }
  };

  const addQuestion = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/questions`, newQuestion);
      alert('Question added to test!');
      setNewQuestion({ test_id: '', title: '', difficulty: 'Easy', description: '', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', examples: [{input: '', output: ''}], defaultCode: { python: '', java: '', javascript: '', cpp: '', csharp: '' } });
    } catch (err) { alert('Failed to add question'); }
  };

  const addMcq = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/mcq`, {
        ...newMcq,
        options: [newMcq.options[1], newMcq.options[2], newMcq.options[3], newMcq.options[4]]
      });
      alert('MCQ added successfully!');
      setNewMcq({ test_id: '', category: 'Quants', question_text: '', options: { 1: '', 2: '', 3: '', 4: '' }, correct_option: 1 });
    } catch (err) { alert('Failed to add MCQ'); }
  };

  if (!user || user.role !== 'tutor') return <div style={{padding: '2rem'}}>Access Denied. Tutors only.</div>;

  return (
    <div className="super-admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><span>👨‍🏫</span> Educator</div>
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
            <input type="text" placeholder="Search your students or batches..." />
          </div>
          <div className="topbar-actions">
            <span className="action-icon">🔔</span>
            <span className="action-icon">✉️</span>
            <div className="profile-snippet">
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{user.username}</div>
                <div style={{color: '#a3aed1', fontSize: '0.75rem'}}>Senior Tutor</div>
              </div>
              <div className="profile-avatar">
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

          {/* 1. DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <>
              <div className="dashboard-grid">
                {[
                  { title: 'Assigned Students', value: '142', icon: '👨‍🎓', bg: 'rgba(67, 24, 255, 0.1)', color: '#4318ff' },
                  { title: 'Assigned Batches', value: '4', icon: '👥', bg: 'rgba(255, 153, 0, 0.1)', color: '#ff9900' },
                  { title: 'Active Courses', value: '2', icon: '📚', bg: 'rgba(0, 204, 153, 0.1)', color: '#00cc99' },
                  { title: 'Pending Evaluations', value: submissions.length, icon: '⏱️', bg: 'rgba(255, 51, 102, 0.1)', color: '#ff3366' },
                  { title: 'Upcoming Classes', value: '3', icon: '📅', bg: 'rgba(51, 204, 255, 0.1)', color: '#33ccff' },
                ].map((stat, idx) => (
                  <div key={idx} className="dash-card">
                    <div className="dash-card-icon" style={{background: stat.bg, color: stat.color}}>
                      {stat.icon}
                    </div>
                    <div className="dash-card-info">
                      <h4>{stat.title}</h4>
                      <h2>{stat.value}</h2>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="super-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Recent Submissions to Evaluate</h3>
                </div>
                <div className="data-list">
                  {submissions.slice(0, 5).map(sub => (
                    <div key={sub.id} className="data-item">
                      <div>
                        <strong>{sub.student_name}</strong> submitted <strong>{sub.test_title}</strong>
                        <div style={{fontSize: '0.85rem', color: '#a3aed1'}}>{new Date(sub.submitted_at).toLocaleString()}</div>
                      </div>
                      <span className="badge badge-warning">Needs Review</span>
                    </div>
                  ))}
                  {submissions.length === 0 && <p style={{color: '#888'}}>No recent submissions.</p>}
                </div>
              </div>
            </>
          )}

          {/* 2. MY STUDENTS */}
          {activeTab === 'My Students' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Assigned Students</h3>
                <button className="super-btn super-btn-secondary">Download Report</button>
              </div>
              <p style={{color: '#888', marginBottom: '2rem'}}>View progress and scores for students assigned to your batches.</p>
              
              <div className="data-list">
                {[
                  { name: 'John Doe', email: 'john@example.com', score: '85%' },
                  { name: 'Jane Smith', email: 'jane@example.com', score: '92%' },
                  { name: 'Alex Johnson', email: 'alex@example.com', score: '78%' }
                ].map((s, idx) => (
                  <div key={idx} className="data-item">
                    <div>
                      <strong>{s.name}</strong>
                      <div style={{fontSize: '0.85rem', color: '#a3aed1'}}>{s.email}</div>
                    </div>
                    <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                      <span style={{fontWeight: 600, color: '#4318ff'}}>Score: {s.score}</span>
                      <button className="super-btn super-btn-secondary">Send Feedback</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MOCK TESTS */}
          {activeTab === 'Mock Tests' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Create & Manage Mock Tests</h3>
              </div>
              <form onSubmit={createTest} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" className="super-input" placeholder="Access Code (e.g. MOCK1)" value={newTest.access_code} onChange={e => setNewTest({...newTest, access_code: e.target.value})} required />
                <input type="text" className="super-input" placeholder="Test Title" value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})} required />
                <input type="datetime-local" className="super-input" value={newTest.start_time} onChange={e => setNewTest({...newTest, start_time: e.target.value})} required />
                <div style={{display: 'flex', gap: '1rem'}}>
                  <input type="number" className="super-input" placeholder="Duration (min)" value={newTest.duration_minutes} onChange={e => setNewTest({...newTest, duration_minutes: e.target.value})} required />
                  <button type="submit" className="super-btn super-btn-primary">Create Test</button>
                </div>
              </form>

              <hr style={{border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0'}} />

              <div className="panel-header">
                <h3 className="panel-title">Add Coding Question</h3>
                <button className="super-btn super-btn-secondary">Import MCQs</button>
              </div>
              <form onSubmit={addQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <select className="super-input" value={newQuestion.test_id} onChange={e => setNewQuestion({...newQuestion, test_id: e.target.value})} required>
                  <option value="" disabled>Link to Mock Test...</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.access_code})</option>)}
                </select>
                <input type="text" className="super-input" placeholder="Question Title" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} required />
                <textarea className="super-input" placeholder="Problem Description" value={newQuestion.description} onChange={e => setNewQuestion({...newQuestion, description: e.target.value})} required rows={4} />
                <div style={{display: 'flex', gap: '1rem'}}>
                  <input type="text" className="super-input" placeholder="Time Complexity (e.g. O(N))" value={newQuestion.timeComplexity} onChange={e => setNewQuestion({...newQuestion, timeComplexity: e.target.value})} />
                  <input type="text" className="super-input" placeholder="Space Complexity (e.g. O(1))" value={newQuestion.spaceComplexity} onChange={e => setNewQuestion({...newQuestion, spaceComplexity: e.target.value})} />
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <textarea className="super-input" placeholder="Example 1 Input" value={newQuestion.examples[0].input} onChange={e => setNewQuestion({...newQuestion, examples: [{...newQuestion.examples[0], input: e.target.value}]})} required rows={2} />
                  <textarea className="super-input" placeholder="Example 1 Output" value={newQuestion.examples[0].output} onChange={e => setNewQuestion({...newQuestion, examples: [{...newQuestion.examples[0], output: e.target.value}]})} required rows={2} />
                </div>
                <button type="submit" className="super-btn super-btn-primary" style={{width: 'max-content'}}>Add Question to Test</button>
              </form>

              <hr style={{border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0'}} />

              <div className="panel-header">
                <h3 className="panel-title">Add Multiple Choice Question (MCQ)</h3>
              </div>
              <form onSubmit={addMcq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <select className="super-input" value={newMcq.test_id} onChange={e => setNewMcq({...newMcq, test_id: e.target.value})} required>
                  <option value="" disabled>Link to Mock Test...</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.access_code})</option>)}
                </select>
                <select className="super-input" value={newMcq.category} onChange={e => setNewMcq({...newMcq, category: e.target.value})} required>
                  <option value="Quants">Quantitative Aptitude</option>
                  <option value="Aptitude">Logical Aptitude</option>
                  <option value="Verbal">Verbal Ability</option>
                  <option value="Technical">Technical MCQ</option>
                </select>
                <textarea className="super-input" placeholder="MCQ Question Text" value={newMcq.question_text} onChange={e => setNewMcq({...newMcq, question_text: e.target.value})} required rows={3} />
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <input type="text" className="super-input" placeholder="Option 1" value={newMcq.options[1]} onChange={e => setNewMcq({...newMcq, options: {...newMcq.options, 1: e.target.value}})} required />
                  <input type="text" className="super-input" placeholder="Option 2" value={newMcq.options[2]} onChange={e => setNewMcq({...newMcq, options: {...newMcq.options, 2: e.target.value}})} required />
                  <input type="text" className="super-input" placeholder="Option 3" value={newMcq.options[3]} onChange={e => setNewMcq({...newMcq, options: {...newMcq.options, 3: e.target.value}})} required />
                  <input type="text" className="super-input" placeholder="Option 4" value={newMcq.options[4]} onChange={e => setNewMcq({...newMcq, options: {...newMcq.options, 4: e.target.value}})} required />
                </div>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <strong style={{color: '#1b2559'}}>Correct Option:</strong>
                  <select className="super-input" value={newMcq.correct_option} onChange={e => setNewMcq({...newMcq, correct_option: parseInt(e.target.value)})} style={{width: '200px'}}>
                    <option value={1}>Option 1</option>
                    <option value={2}>Option 2</option>
                    <option value={3}>Option 3</option>
                    <option value={4}>Option 4</option>
                  </select>
                </div>
                <button type="submit" className="super-btn super-btn-primary" style={{width: 'max-content', background: '#ff3366'}}>Add MCQ</button>
              </form>
            </div>
          )}

          {/* 4. CODING ASSIGNMENTS (Submissions) */}
          {activeTab === 'Coding Assignments' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Evaluate Submissions</h3>
                <button className="super-btn super-btn-secondary">Publish Results</button>
              </div>
              <div className="data-list">
                {submissions.map(sub => (
                  <div key={sub.id} className="data-item">
                    <div>
                      <strong>{sub.student_name}</strong> <span style={{color: '#a3aed1'}}>({sub.student_email})</span>
                      <div style={{fontSize: '0.85rem', marginTop: '0.25rem'}}>Test: <strong>{sub.test_title}</strong> | Status: {sub.status}</div>
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button className="super-btn super-btn-secondary">Auto Grade</button>
                      <button className="super-btn super-btn-primary">Evaluate</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PLACEHOLDERS FOR ADVANCED MODULES */}
          {['My Batches', 'Attendance', 'Announcements', 'Reports', 'Settings'].includes(activeTab) && (
            <div className="super-panel" style={{textAlign: 'center', padding: '4rem 2rem'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🚧</div>
              <h2>{activeTab} Module</h2>
              <p style={{color: '#888', maxWidth: '500px', margin: '0 auto'}}>
                This advanced educator module has its high-fidelity UI mounted successfully. Real-time backend integration for {activeTab.toLowerCase()} is scheduled for Phase 2.
              </p>
              
              {activeTab === 'Attendance' && (
                <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem'}}>
                  <button className="super-btn super-btn-primary">Mark Attendance</button>
                  <button className="super-btn super-btn-secondary">Download Excel</button>
                </div>
              )}

              {activeTab === 'Announcements' && (
                <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem'}}>
                  <button className="super-btn super-btn-primary">Send Notice</button>
                  <button className="super-btn super-btn-secondary">Chat with Batch</button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
