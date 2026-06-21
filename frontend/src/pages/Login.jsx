import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const ROLES = [
  { id: 'admin', name: 'Super Admin', icon: '👑' },
  { id: 'college', name: 'College', icon: '🏫' },
  { id: 'tutor', name: 'Tutor', icon: '👨‍🏫' },
  { id: 'student', name: 'Student', icon: '🧑‍💻' },
];

export default function Login({ setUser }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(0); // 0: Role, 1: Email, 2: OTP
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setError('');
    setMessage('');
    setEmail('');
    setOtp('');
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(1);
    setAuthMode('signin');
    setError('');
    setMessage('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/request-otp`, { 
        email, 
        role: selectedRole ? selectedRole.id : undefined 
      });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/verify-auth`, { 
        authMode, 
        email, 
        password, 
        otp, 
        role: selectedRole ? selectedRole.id : undefined 
      });
      
      const loggedUser = res.data.user;
      setUser(loggedUser);
      
      if (loggedUser.role === 'admin') navigate('/admin');
      else if (loggedUser.role === 'college') navigate('/college');
      else if (loggedUser.role === 'tutor') navigate('/tutor');
      else navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      
      {/* LEFT SPLIT SCREEN */}
      <div className="login-left-panel">
        <div className="login-hero-content">
          <h1>Empower Your Learning Journey</h1>
          <p>Sign in to access world-class mock tests, a powerful real-time compiler, and deep performance analytics.</p>
        </div>
      </div>

      {/* RIGHT SPLIT SCREEN */}
      <div className="login-right-panel">
        <div className="login-glass-panel">
          
          <div className="login-header">
            <h2>Welcome to SkillForge</h2>
            <p>{step === 0 ? "Select your portal to continue" : "Access your personalized learning portal"}</p>
          </div>

          {step === 1 && (
            <div className="auth-tabs">
              <button className={`auth-tab ${authMode === 'signin' ? 'active' : ''}`} onClick={() => handleAuthModeChange('signin')}>Sign In</button>
              <button className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => handleAuthModeChange('signup')}>Sign Up</button>
            </div>
          )}

          {error && <div className="message-box message-error">⚠️ {error}</div>}
          {message && <div className="message-box message-success">✅ {message}</div>}

          {step === 0 && (
            <div className="roles-grid">
              {ROLES.map((role) => (
                <div 
                  key={role.id} 
                  className="role-card"
                  onClick={() => handleRoleSelect(role)}
                >
                  <div className="role-icon">{role.icon}</div>
                  <div className="role-name">{role.name}</div>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleAuthSubmit} className="login-form-step">
              {selectedRole && (
                <div className="selected-role-badge">
                  {selectedRole.icon} Selected Role: <strong>{selectedRole.name}</strong>
                </div>
              )}
              
              <div className="input-group" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <input 
                  type="email" 
                  className="premium-input"
                  placeholder="Enter your Email Address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input 
                  type="password" 
                  className="premium-input"
                  placeholder="Enter your Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {authMode === 'signin' && (
                <div style={{textAlign: 'right', marginTop: '-0.5rem'}}>
                  <span 
                    style={{color: '#4318ff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500}} 
                    onClick={() => alert("Password reset link sent to your email!")}
                  >
                    Forgot Password?
                  </span>
                </div>
              )}
              
              <button type="submit" className="premium-btn" disabled={loading}>
                {loading ? 'Processing...' : (authMode === 'signin' ? 'Sign In →' : 'Create Account →')}
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => { setStep(0); setError(''); setMessage(''); setEmail(''); setPassword(''); }}
                >
                  ← Back to Roles
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="login-form-step">
              <div className="selected-role-badge">
                ✉️ OTP sent to <strong>{email}</strong>
              </div>

              <div className="input-group">
                <input 
                  type="text" 
                  className="premium-input"
                  placeholder="Enter 6-digit OTP" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              
              <button type="submit" className="premium-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); }}
                >
                  ← Back to Email
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
      
    </div>
  );
}
