import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './AdminDashboard.css';

const SIDEBAR_MENU = [
  { id: 'Dashboard', icon: '📊' },
  { id: 'Colleges', icon: '🏫' },
  { id: 'Tutors', icon: '👨‍🏫' },
  { id: 'Students', icon: '👨‍🎓' },
  { id: 'Mock Tests', icon: '📝' },
  { id: 'Question Bank', icon: '📚' },
  { id: 'Online Compiler', icon: '💻' },
  { id: 'Exam Monitoring', icon: '👁️' },
  { id: 'Analytics', icon: '📈' },
  { id: 'Placements', icon: '🎓' },
  { id: 'Announcements', icon: '📢' },
  { id: 'Reports', icon: '📑' },
  { id: 'Settings', icon: '⚙️' },
  { id: 'Audit Logs', icon: '🔒' }
];

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tests, setTests] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]); // Mock state for now
  
  // Forms
  const [newCollege, setNewCollege] = useState({ name: '', email: '' });
  const [newTutor, setNewTutor] = useState({ name: '', email: '', college_id: '' });
  const [newStudent, setNewStudent] = useState({ name: '', email: '', registration_no: '', phone: '', college_id: '' });
  const [newTest, setNewTest] = useState({ access_code: '', title: '', start_time: '', duration_minutes: 60 });
  const [newQuestion, setNewQuestion] = useState({ test_id: '', title: '', difficulty: 'Easy', description: '', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', examples: [{input: '', output: ''}], defaultCode: { python: '', java: '', javascript: '', cpp: '', csharp: '' } });
  const [newMcq, setNewMcq] = useState({ test_id: '', category: 'Quants', question_text: '', options: { 1: '', 2: '', 3: '', 4: '' }, correct_option: 1 });
  
  // Modal states
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedCollegeForStudent, setSelectedCollegeForStudent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const testsRes = await axios.get('http://localhost:5000/api/admin/tests');
      setTests(testsRes.data);
      const usersRes = await axios.get('http://localhost:5000/api/admin/users');
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const createCollege = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/users', { email: newCollege.email, username: newCollege.name, role: 'college' });
      alert('College created successfully!');
      setNewCollege({ name: '', email: '' });
      fetchData();
    } catch (err) { alert('Failed to create college'); }
  };

  const createTutor = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/users', { email: newTutor.email, username: newTutor.name, role: 'tutor', college_id: newTutor.college_id });
      alert('Tutor created successfully!');
      setNewTutor({ name: '', email: '', college_id: '' });
      fetchData();
    } catch (err) { alert('Failed to create tutor'); }
  };

  const createTest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/tests', newTest);
      alert('Test created successfully!');
      setNewTest({ access_code: '', title: '', start_time: '', duration_minutes: 60 });
      fetchData();
    } catch (err) { alert('Failed to create test'); }
  };

  const addQuestion = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/questions', newQuestion);
      alert('Question added successfully!');
      setNewQuestion({ test_id: '', title: '', difficulty: 'Easy', description: '', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', examples: [{input: '', output: ''}], defaultCode: { python: '', java: '', javascript: '', cpp: '', csharp: '' } });
    } catch (err) { alert('Failed to add question'); }
  };

  const addMcq = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/mcq', {
        ...newMcq,
        options: [newMcq.options[1], newMcq.options[2], newMcq.options[3], newMcq.options[4]]
      });
      alert('MCQ added successfully!');
      setNewMcq({ test_id: '', category: 'Quants', question_text: '', options: { 1: '', 2: '', 3: '', 4: '' }, correct_option: 1 });
    } catch (err) { alert('Failed to add MCQ'); }
  };

  if (!user || user.role !== 'admin') return <div style={{padding: '2rem'}}>Access Denied. Super Admins only.</div>;

  const colleges = users.filter(u => u.role === 'college');
  const tutors = users.filter(u => u.role === 'tutor');
  const students = users.filter(u => u.role === 'student');

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
            <input type="text" placeholder="Search globally..." />
          </div>
          <div className="topbar-actions">
            <span className="action-icon">🔔</span>
            <span className="action-icon">⚙️</span>
            <div className="profile-snippet">
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 600, fontSize: '0.875rem'}}>{user.username}</div>
                <div style={{color: '#a3aed1', fontSize: '0.75rem'}}>Super Admin</div>
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
                  { title: 'Total Colleges', value: colleges.length, icon: '🏫', bg: 'rgba(67, 24, 255, 0.1)', color: '#4318ff' },
                  { title: 'Total Tutors', value: tutors.length, icon: '👨‍🏫', bg: 'rgba(255, 153, 0, 0.1)', color: '#ff9900' },
                  { title: 'Total Students', value: students.length, icon: '👨‍🎓', bg: 'rgba(0, 204, 153, 0.1)', color: '#00cc99' },
                  { title: 'Active Mock Tests', value: tests.length, icon: '📝', bg: 'rgba(255, 51, 102, 0.1)', color: '#ff3366' },
                  { title: 'Live Exams', value: '0', icon: '⚡', bg: 'rgba(51, 204, 255, 0.1)', color: '#33ccff' },
                  { title: 'Total Questions', value: '1,248', icon: '📚', bg: 'rgba(153, 51, 255, 0.1)', color: '#9933ff' },
                  { title: 'Placement Stat', value: '84%', icon: '💼', bg: 'rgba(51, 204, 51, 0.1)', color: '#33cc33' },
                  { title: 'System Health', value: '99.9%', icon: '🟢', bg: 'rgba(0, 255, 153, 0.1)', color: '#00ff99' }
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
                  <h3 className="panel-title">Recent System Activities</h3>
                </div>
                <p style={{color: '#888'}}>Tracking global platform events...</p>
              </div>
            </>
          )}

          {/* 2. COLLEGES */}
          {activeTab === 'Colleges' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">College Management</h3>
                <button className="super-btn super-btn-secondary">Bulk Import</button>
              </div>
              <form onSubmit={createCollege} style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
                <input type="text" className="super-input" placeholder="College Name" value={newCollege.name} onChange={e => setNewCollege({...newCollege, name: e.target.value})} required />
                <input type="email" className="super-input" placeholder="College Admin Email" value={newCollege.email} onChange={e => setNewCollege({...newCollege, email: e.target.value})} required />
                <button type="submit" className="super-btn super-btn-primary">+ Add College</button>
              </form>

              <div className="data-list">
                {colleges.map(c => (
                  <div key={c.id} className="data-item">
                    <div>
                      <strong>{c.username}</strong>
                      <div style={{fontSize: '0.85rem', color: '#a3aed1'}}>{c.email}</div>
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button className="super-btn super-btn-secondary" onClick={() => {
                        setSelectedCollegeForStudent(c.id);
                        setIsAddStudentModalOpen(true);
                      }}>+ Add Students</button>
                      <button className="super-btn super-btn-secondary" style={{color: 'red'}}>Suspend</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. TUTORS */}
          {activeTab === 'Tutors' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Tutor Management</h3>
              </div>
              <form onSubmit={createTutor} style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
                <input type="text" className="super-input" placeholder="Tutor Name" value={newTutor.name} onChange={e => setNewTutor({...newTutor, name: e.target.value})} required />
                <input type="email" className="super-input" placeholder="Tutor Email" value={newTutor.email} onChange={e => setNewTutor({...newTutor, email: e.target.value})} required />
                <select className="super-input" value={newTutor.college_id} onChange={e => setNewTutor({...newTutor, college_id: e.target.value})} required>
                  <option value="" disabled>Assign to College...</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                </select>
                <button type="submit" className="super-btn super-btn-primary">+ Add Tutor</button>
              </form>

              <div className="data-list">
                {tutors.map(t => {
                  const coll = colleges.find(c => c.id == t.college_id);
                  return (
                    <div key={t.id} className="data-item">
                      <div>
                        <strong>{t.username}</strong>
                        <div style={{fontSize: '0.85rem', color: '#a3aed1'}}>{t.email} | College: {coll ? coll.username : 'N/A'}</div>
                      </div>
                      <button className="super-btn super-btn-secondary" style={{color: 'red'}}>Revoke Access</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. STUDENTS */}
          {activeTab === 'Students' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Global Student Directory</h3>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button className="super-btn super-btn-secondary" onClick={() => alert("Select a college to bulk upload.")}>Bulk Upload Excel</button>
                </div>
              </div>
              
              <div className="data-list">
                {students.length === 0 ? <p style={{color: '#888'}}>No students in system.</p> : students.map(s => {
                  const coll = colleges.find(c => c.id == s.college_id);
                  return (
                    <div key={s.id} className="data-item">
                      <div>
                        <strong>{s.username}</strong>
                        <div style={{fontSize: '0.85rem', color: '#a3aed1'}}>{s.email} | Reg: {s.registration_no} | College: {coll ? coll.username : 'N/A'}</div>
                      </div>
                      <span className="badge badge-success">Active</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. MOCK TESTS */}
          {activeTab === 'Mock Tests' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Test Management</h3>
              </div>
              <form onSubmit={createTest} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <input type="text" className="super-input" placeholder="Access Code (e.g. MOCK1)" value={newTest.access_code} onChange={e => setNewTest({...newTest, access_code: e.target.value})} required />
                <input type="text" className="super-input" placeholder="Test Title" value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})} required />
                <input type="datetime-local" className="super-input" value={newTest.start_time} onChange={e => setNewTest({...newTest, start_time: e.target.value})} required />
                <div style={{display: 'flex', gap: '1rem'}}>
                  <input type="number" className="super-input" placeholder="Duration (min)" value={newTest.duration_minutes} onChange={e => setNewTest({...newTest, duration_minutes: e.target.value})} required />
                  <button type="submit" className="super-btn super-btn-primary">Create</button>
                </div>
              </form>

              <div className="data-list">
                {tests.map(t => (
                  <div key={t.id} className="data-item">
                    <div>
                      <strong>{t.title}</strong>
                      <div style={{fontSize: '0.85rem', color: '#a3aed1'}}>Code: {t.access_code} | Duration: {t.duration_minutes}m</div>
                    </div>
                    <button className="super-btn super-btn-secondary">Edit / Assign</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. QUESTION BANK */}
          {activeTab === 'Question Bank' && (
            <div className="super-panel">
              <div className="panel-header">
                <h3 className="panel-title">Central Question Repository</h3>
                <button className="super-btn super-btn-primary" style={{background: '#9933ff'}}>✨ AI Generate</button>
              </div>
              <form onSubmit={addQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <select className="super-input" value={newQuestion.test_id} onChange={e => setNewQuestion({...newQuestion, test_id: e.target.value})} required>
                  <option value="" disabled>Link to Mock Test...</option>
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title} ({t.access_code})</option>)}
                </select>
                <input type="text" className="super-input" placeholder="Question Title" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} required />
                <textarea className="super-input" placeholder="Problem Description" value={newQuestion.description} onChange={e => setNewQuestion({...newQuestion, description: e.target.value})} required rows={4} />
                <div style={{display: 'flex', gap: '1rem'}}>
                  <input type="text" className="super-input" placeholder="Time Complexity" value={newQuestion.timeComplexity} onChange={e => setNewQuestion({...newQuestion, timeComplexity: e.target.value})} />
                  <input type="text" className="super-input" placeholder="Space Complexity" value={newQuestion.spaceComplexity} onChange={e => setNewQuestion({...newQuestion, spaceComplexity: e.target.value})} />
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <textarea className="super-input" placeholder="Example 1 Input" value={newQuestion.examples[0].input} onChange={e => setNewQuestion({...newQuestion, examples: [{...newQuestion.examples[0], input: e.target.value}]})} required rows={2} />
                  <textarea className="super-input" placeholder="Example 1 Output" value={newQuestion.examples[0].output} onChange={e => setNewQuestion({...newQuestion, examples: [{...newQuestion.examples[0], output: e.target.value}]})} required rows={2} />
                </div>
                <button type="submit" className="super-btn super-btn-primary" style={{alignSelf: 'flex-start'}}>Add to Bank</button>
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
                <button type="submit" className="super-btn super-btn-primary" style={{alignSelf: 'flex-start', background: '#ff3366'}}>Add MCQ</button>
              </form>
            </div>
          )}

          {/* PLACEHOLDERS FOR ADVANCED MODULES */}
          {['Online Compiler', 'Exam Monitoring', 'Analytics', 'Placements', 'Announcements', 'Reports', 'Settings', 'Audit Logs'].includes(activeTab) && (
            <div className="super-panel" style={{textAlign: 'center', padding: '4rem 2rem'}}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🚧</div>
              <h2>{activeTab} Module</h2>
              <p style={{color: '#888', maxWidth: '500px', margin: '0 auto'}}>
                This premium module is part of the Super Admin architecture. The high-fidelity UI is mounted, and backend integration is scheduled for the next phase.
              </p>
              {activeTab === 'Settings' && (
                <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem'}}>
                  <button className="super-btn super-btn-secondary">SMTP Setup</button>
                  <button className="super-btn super-btn-secondary">Google Auth</button>
                  <button className="super-btn super-btn-secondary">API Keys</button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MODALS */}
      {isAddStudentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="super-panel" style={{ width: '500px', position: 'relative' }}>
            <button onClick={() => setIsAddStudentModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✖</button>
            <h3 style={{ marginBottom: '1.5rem' }}>Add Students to {colleges.find(c => c.id === selectedCollegeForStudent)?.username}</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await axios.post('http://localhost:5000/api/admin/users', { ...newStudent, college_id: selectedCollegeForStudent, role: 'student', username: newStudent.name });
                alert('Student added!');
                fetchData();
                setNewStudent({ name: '', email: '', registration_no: '', phone: '', college_id: '' });
              } catch(err) { alert('Failed'); }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <input type="text" className="super-input" placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
              <input type="text" className="super-input" placeholder="Registration No." value={newStudent.registration_no} onChange={e => setNewStudent({...newStudent, registration_no: e.target.value})} required />
              <input type="email" className="super-input" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} required />
              <input type="text" className="super-input" placeholder="Phone" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} required />
              <button type="submit" className="super-btn super-btn-primary">Add Single Student</button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4>Bulk Upload Students</h4>
              <label style={{ display: 'block', textAlign: 'center', padding: '2rem', border: '2px dashed var(--accent-color)', borderRadius: '12px', color: 'var(--accent-color)', cursor: 'pointer', marginTop: '1rem', background: 'rgba(67, 24, 255, 0.05)' }}>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    
                    const mappedUsers = data.map(row => ({
                      username: row['Name'] || row['name'],
                      registration_no: String(row['Registration Number'] || row['registration_no'] || ''),
                      email: row['Email'] || row['email'],
                      phone: String(row['Phone'] || row['phone'] || ''),
                      role: 'student',
                      college_id: selectedCollegeForStudent
                    }));

                    try {
                      await axios.post('http://localhost:5000/api/admin/users/bulk', { users: mappedUsers });
                      alert(`Successfully uploaded ${mappedUsers.length} students!`);
                      fetchData();
                      setIsAddStudentModalOpen(false);
                    } catch (err) { alert('Failed to bulk upload students.'); }
                  };
                  reader.readAsBinaryString(file);
                }} style={{ display: 'none' }} />
                <strong>↑ Drop Excel File Here</strong>
                <div style={{fontSize: '0.8rem', color: '#888', marginTop: '0.5rem'}}>Supports .xlsx, .csv</div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
