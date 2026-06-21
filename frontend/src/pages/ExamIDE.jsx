import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import '../App.css';

// Encryption function: base64 then shift
const encryptPayload = (str) => {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  let encrypted = '';
  for (let i = 0; i < b64.length; i++) {
    encrypted += String.fromCharCode(b64.charCodeAt(i) + 3);
  }
  return encrypted;
};

export default function ExamIDE() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!location.state || !location.state.testData) {
    return <div style={{padding: '2rem'}}>Invalid access. Please login and select a test.</div>;
  }

  const testInfo = location.state.testData.test;
  const QUESTIONS = location.state.testData.questions || [];
  const MCQS = location.state.testData.mcqs || [];

  const [activeTab, setActiveTab] = useState(MCQS.length > 0 ? 'MCQ' : 'Coding'); // 'MCQ' or 'Coding'

  // Coding State
  const [language, setLanguage] = useState('python');
  const [activeQuestion, setActiveQuestion] = useState(QUESTIONS[0] || null);
  const [code, setCode] = useState(QUESTIONS[0] ? QUESTIONS[0].defaultCode['python'] : '');
  const [output, setOutput] = useState('');
  const [metrics, setMetrics] = useState({ time: null, memory: null });
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [toasts, setToasts] = useState([]);

  // MCQ State
  const [mcqAnswers, setMcqAnswers] = useState({}); // { mcq_id: selected_option_number }
  const [activeMcqCategory, setActiveMcqCategory] = useState(MCQS.length > 0 ? MCQS[0].category : '');
  
  const mcqCategories = [...new Set(MCQS.map(m => m.category))];

  // Security State
  const [examLocked, setExamLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  
  // Timer State
  const [timeElapsed, setTimeElapsed] = useState(0);

  const editorRef = useRef(null);

  useEffect(() => {
    if (examLocked) return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [examLocked]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const lockExam = (reason) => {
    if (!examLocked) {
      setExamLocked(true);
      setLockReason(reason);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (activeQuestion) {
      setCode(activeQuestion.defaultCode[newLang]);
    }
    setOutput('');
    setMetrics({ time: null, memory: null });
  };

  const handleQuestionChange = (e) => {
    const questionId = parseInt(e.target.value);
    const q = QUESTIONS.find(q => q.id === questionId);
    setActiveQuestion(q);
    setCode(q.defaultCode[language]);
    setOutput('');
    setMetrics({ time: null, memory: null });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onKeyDown((e) => {
      if ((e.ctrlKey && e.code === 'KeyV') || (e.ctrlKey && e.code === 'KeyC') || (e.ctrlKey && e.code === 'KeyX')) {
        e.preventDefault(); e.stopPropagation();
        showToast("Plagiarism Check: Clipboard actions are disabled!");
      }
    });
    editor.onContextMenu((e) => e.event.preventDefault());
  };

  // Basic Proctoring (Window blur)
  useEffect(() => {
    const handleVisibilityChange = () => { if (document.hidden) lockExam("Tab switched or window minimized."); };
    const handleBlur = () => { lockExam("Exam window lost focus."); };
    
    if (!examLocked) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, [examLocked]);

  const runCode = async () => {
    if (!code.trim() || examLocked) return;
    setIsRunning(true);
    setOutput('Executing...');
    setIsError(false);
    setMetrics({ time: null, memory: null });

    try {
      const encryptedPayload = encryptPayload(code);
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/execute`, {
        language,
        payload: encryptedPayload
      });

      if (response.data.error) {
        setOutput(response.data.error + (response.data.stdout ? `\n\nOutput before error:\n${response.data.stdout}` : ''));
        setIsError(true);
      } else {
        setOutput(response.data.output || 'Code executed successfully with no output.');
        setIsError(false);
      }
      
      if (response.data.time) setMetrics({ time: response.data.time, memory: response.data.memory });
    } catch (err) {
      setOutput(err.message || 'Failed to connect to execution server.');
      setIsError(true);
    } finally {
      setIsRunning(false);
    }
  };

  const submitExam = async () => {
    if (!window.confirm("Are you sure you want to submit your exam? You cannot undo this action.")) return;
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        alert("User session lost. Cannot submit.");
        return;
      }
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/student/submit`, {
        user_id: user.id,
        test_id: testInfo.id,
        status: 'Submitted',
        mcq_answers: mcqAnswers
      });
      
      if (res.data.mcq_score !== undefined) {
        alert(`Exam submitted successfully!\nYour MCQ Score: ${res.data.mcq_score} / ${res.data.mcq_total}`);
      } else {
        alert('Exam submitted successfully!');
      }
      
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to submit exam.');
    }
  };

  const handleMcqSelect = (mcqId, optionNumber) => {
    setMcqAnswers(prev => ({
      ...prev,
      [mcqId]: optionNumber
    }));
  };

  return (
    <div className="app-container">
      {examLocked && (
        <div className="exam-lock-overlay">
          <h1>EXAM LOCKED</h1>
          <p>Suspicious activity was detected: <strong>{lockReason}</strong></p>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#8b949e' }}>
            Your session has been terminated and reported. Please contact the administrator.
          </p>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="header" style={{borderBottom: 'none'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '2rem'}}>
          <h1>{testInfo.title}</h1>
          <div className="exam-timer" style={{color: '#ef4444', fontWeight: 'bold'}}>
            ⏱️ {formatTime(timeElapsed)}
          </div>
        </div>
        
        <div className="controls">
          <button 
            className="btn-primary" 
            onClick={submitExam}
            disabled={examLocked}
            style={{background: '#16a34a', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600}}
          >
            Submit Entire Exam
          </button>
        </div>
      </header>

      {/* TAB NAVIGATION */}
      <div style={{display: 'flex', gap: '1rem', padding: '0 1.5rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)'}}>
        {MCQS.length > 0 && (
          <div 
            onClick={() => setActiveTab('MCQ')}
            style={{padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: activeTab === 'MCQ' ? '3px solid #4318ff' : '3px solid transparent', fontWeight: activeTab === 'MCQ' ? '600' : '400', color: activeTab === 'MCQ' ? '#1b2559' : '#64748b'}}
          >
            MCQ Section
          </div>
        )}
        {QUESTIONS.length > 0 && (
          <div 
            onClick={() => setActiveTab('Coding')}
            style={{padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: activeTab === 'Coding' ? '3px solid #4318ff' : '3px solid transparent', fontWeight: activeTab === 'Coding' ? '600' : '400', color: activeTab === 'Coding' ? '#1b2559' : '#64748b'}}
          >
            Coding Challenges
          </div>
        )}
      </div>

      <main className="main-content" style={{flexDirection: 'column', overflow: 'hidden'}}>
        
        {/* MCQ TAB CONTENT */}
        {activeTab === 'MCQ' && (
          <div style={{display: 'flex', height: '100%'}}>
            {/* MCQ Sidebar */}
            <div style={{width: '250px', borderRight: '1px solid var(--border-color)', background: 'var(--panel-bg)', padding: '1rem'}}>
              <h3 style={{fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em'}}>Sections</h3>
              {mcqCategories.map(cat => (
                <div 
                  key={cat}
                  onClick={() => setActiveMcqCategory(cat)}
                  style={{padding: '0.75rem 1rem', background: activeMcqCategory === cat ? '#e2e8f0' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: activeMcqCategory === cat ? '600' : '400', color: '#1b2559', marginBottom: '0.5rem'}}
                >
                  {cat}
                </div>
              ))}
            </div>

            {/* MCQ List */}
            <div style={{flex: 1, padding: '2rem', overflowY: 'auto', background: '#f8fafc'}}>
              <h2 style={{fontSize: '1.5rem', marginBottom: '2rem', color: '#1b2559'}}>{activeMcqCategory}</h2>
              {MCQS.filter(m => m.category === activeMcqCategory).map((mcq, idx) => (
                <div key={mcq.id} style={{background: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                  <p style={{fontSize: '1.1rem', color: '#1b2559', marginBottom: '1.5rem'}}><strong>Q{idx + 1}.</strong> {mcq.question_text}</p>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {[1, 2, 3, 4].map(optNum => (
                      <label 
                        key={optNum} 
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                          border: mcqAnswers[mcq.id] === optNum ? '2px solid #4318ff' : '1px solid #e2e8f0', 
                          borderRadius: '8px', cursor: 'pointer',
                          background: mcqAnswers[mcq.id] === optNum ? 'rgba(67,24,255,0.05)' : 'transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input 
                          type="radio" 
                          name={`mcq-${mcq.id}`} 
                          checked={mcqAnswers[mcq.id] === optNum} 
                          onChange={() => handleMcqSelect(mcq.id, optNum)}
                          style={{transform: 'scale(1.2)'}}
                        />
                        <span style={{color: '#1b2559'}}>{mcq.options[optNum - 1]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CODING TAB CONTENT */}
        {activeTab === 'Coding' && (
          <>
            {/* Coding Sub-Header */}
            <div className="header" style={{borderTop: 'none', background: 'var(--panel-bg)', padding: '0.5rem 1.5rem'}}>
              <div className="controls">
                <select 
                  className="select-question" 
                  value={activeQuestion?.id || ''} 
                  onChange={handleQuestionChange}
                  disabled={isRunning || examLocked || !activeQuestion}
                >
                  {QUESTIONS.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.difficulty})
                    </option>
                  ))}
                </select>
              </div>
              <div className="controls">
                <select 
                  className="select-language" 
                  value={language} 
                  onChange={handleLanguageChange}
                  disabled={isRunning || examLocked || !activeQuestion}
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="cpp">C++</option>
                </select>
                <button 
                  className="btn-run" 
                  onClick={runCode}
                  disabled={isRunning || examLocked || !activeQuestion}
                >
                  {isRunning ? <div className="loader"></div> : null} Run Code
                </button>
              </div>
            </div>

            <div style={{display: 'flex', flex: 1, minHeight: 0}}>
              {/* Problem Description */}
              <section className="question-panel">
                <div className="section-header">Problem Description</div>
                <div className="question-content">
                  {activeQuestion ? (
                    <>
                      <h2>
                        {activeQuestion.title}
                        <span className={`difficulty-badge diff-${activeQuestion.difficulty.toLowerCase()}`}>
                          {activeQuestion.difficulty}
                        </span>
                      </h2>
                      <div className="meta-info">
                        <span><strong>Target Time:</strong> {activeQuestion.timeComplexity}</span>
                        <span><strong>Target Space:</strong> {activeQuestion.spaceComplexity}</span>
                      </div>
                      <p>{activeQuestion.description}</p>
                      
                      {activeQuestion.examples && activeQuestion.examples.map((ex, idx) => (
                        <div key={idx}>
                          <h3>Example {idx + 1}:</h3>
                          <pre>
                            <strong>Input:</strong> {ex.input}<br />
                            <strong>Output:</strong> {ex.output}
                          </pre>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>No coding questions available for this test.</p>
                  )}
                </div>
              </section>

              {/* IDE Workspace */}
              <div className="code-workspace">
                <section className="editor-section">
                  <div className="section-header">Source Code</div>
                  <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    theme="vs-light"
                    value={code}
                    onChange={(value) => setCode(value)}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', monospace",
                      contextmenu: false,
                      wordWrap: 'on'
                    }}
                  />
                </section>

                <section className="terminal-section">
                  <div className="section-header">
                    Terminal Output
                    {metrics.time && (
                      <div className="metrics">
                        <span className="metric-badge">{metrics.time} ms</span>
                        <span className="metric-badge">{metrics.memory} KB</span>
                      </div>
                    )}
                  </div>
                  <div className={`output-content ${isError ? 'error' : ''}`}>
                    {output}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
