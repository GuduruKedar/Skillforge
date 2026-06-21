import { useState, useEffect } from 'react';
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
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [regNo, setRegNo] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  
  // UI State
  const [step, setStep] = useState(0); // 0: Roles, 1: Auth Form, 2: OTP
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation State
  const [passwordStrength, setPasswordStrength] = useState({ label: '', color: '' });
  
  const navigate = useNavigate();

  // Validate Password on change
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ label: '', color: '' });
      return;
    }
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength({ label: 'Weak 🔴', color: '#ef4444' });
    else if (strength === 3) setPasswordStrength({ label: 'Fair 🟡', color: '#eab308' });
    else if (strength === 4) setPasswordStrength({ label: 'Good 🔵', color: '#3b82f6' });
    else setPasswordStrength({ label: 'Strong 🟢', color: '#22c55e' });
  }, [password]);

  const handleAuthModeChange = (mode) => {
    setAuthMode(mode);
    setError('');
    setMessage('');
    setEmail('');
    setOtp('');
    setPassword('');
    setRegNo('');
    setStudentInfo(null);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(1);
    setAuthMode('signin');
    setError('');
    setMessage('');
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Pre-flight Validations
    if (authMode === 'signup' && ['admin', 'college', 'tutor'].includes(selectedRole.id)) {
      setError('Registration disabled from public UI. Please contact system administrator.');
      return;
    }

    if (authMode === 'signup' && selectedRole.id === 'student' && !studentInfo) {
      // Step 1 of Student Signup: Verify Reg No
      if (!regNo.trim()) return setError('Registration Number is required.');
      setLoading(true);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/verify-student-reg`, { registration_no: regNo.trim() });
        setStudentInfo(res.data.studentInfo);
        setMessage(`Verified: Welcome ${res.data.studentInfo.name}! Please set up your email and password.`);
      } catch (err) {
        setError(err.response?.data?.error || 'Verification failed. Contact Admin.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Step 2 of Signup OR Step 1 of Signin
    const cleanedEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanedEmail)) return setError('Invalid email format.');
    if (!password.trim()) return setError('Password is required.');
    
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/request-otp`, { 
        email: cleanedEmail, 
        role: selectedRole ? selectedRole.id : undefined 
      });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!otp.trim()) return setError('OTP is required');

    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/verify-auth`, { 
        authMode, 
        email: email.trim().toLowerCase(), 
        password: password.trim(), 
        otp: otp.trim(), 
        role: selectedRole ? selectedRole.id : undefined,
        registration_no: regNo ? regNo.trim() : undefined,
        name: studentInfo ? studentInfo.name : undefined,
        college_id: studentInfo ? studentInfo.college_id : undefined
      });
      
      const loggedUser = res.data.user;
      setUser(loggedUser);
      
      // Role-Based Redirect
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
      <div className="login-left-panel premium-left">
        <div className="login-hero-content">
          <div className="brand-badge">SkillForge Enterprise</div>
          <h1>Build Skills.<br/><span className="highlight-text">Crack Placements.</span><br/>Shape Your Future.</h1>
          <p>Access mock tests, coding challenges, AI-powered learning, interview preparation, and real-time performance analytics—all in one platform.</p>
        </div>
      </div>

      {/* RIGHT SPLIT SCREEN */}
      <div className="login-right-panel">
        <div className="login-glass-panel">
          
          <div className="login-header">
            <h2>Welcome to SkillForge</h2>
            <p>{step === 0 ? "Select your portal to continue" : `Logging in as: ${selectedRole?.name}`}</p>
          </div>

          {step === 1 && (
            <div className="auth-tabs">
              <button className={`auth-tab ${authMode === 'signin' ? 'active' : ''}`} onClick={() => handleAuthModeChange('signin')}>Sign In</button>
              <button className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => handleAuthModeChange('signup')}>Sign Up</button>
            </div>
          )}

          {error && <div className="message-box message-error">⚠️ {error}</div>}
          {message && <div className="message-box message-success">✅ {message}</div>}

          {/* STEP 0: ROLES */}
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

          {/* STEP 1: AUTH FORM */}
          {step === 1 && (
            <form onSubmit={handleAuthSubmit} className="login-form-step">
              
              {/* Disabled Signup Alert */}
              {authMode === 'signup' && ['admin', 'college', 'tutor'].includes(selectedRole.id) && (
                <div className="alert-box">
                  🚨 <strong>Registration Restricted</strong>
                  <p>Accounts for this role are created internally. Please contact the system administrator.</p>
                </div>
              )}

              {/* Student Signup Flow */}
              {authMode === 'signup' && selectedRole.id === 'student' && !studentInfo && (
                <div className="input-group">
                  <label>Registration Number</label>
                  <input 
                    type="text" 
                    className="premium-input"
                    placeholder="e.g. STU-2026-001" 
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* General Login / Student Setup Email & Password */}
              {((authMode === 'signin') || (authMode === 'signup' && selectedRole.id === 'student' && studentInfo)) && (
                <div className="input-group-vertical">
                  <div className="input-field">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      className="premium-input"
                      placeholder="Enter official email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-field relative">
                    <label>Password</label>
                    <div className="password-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="premium-input"
                        placeholder="Enter password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "🙈" : "👁️"}
                      </span>
                    </div>
                    {authMode === 'signup' && password && (
                      <div className="password-strength" style={{color: passwordStrength.color}}>
                        {passwordStrength.label}
                      </div>
                    )}
                  </div>

                  {authMode === 'signin' && (
                    <div className="auth-options">
                      <label className="remember-me">
                        <input type="checkbox" /> Remember Me
                      </label>
                      <span className="forgot-link" onClick={() => alert("Forgot password flow initiated. OTP sent.")}>
                        Forgot Password?
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Submit Buttons */}
              <button 
                type="submit" 
                className="premium-btn" 
                disabled={loading || (authMode === 'signup' && ['admin', 'college', 'tutor'].includes(selectedRole.id))}
              >
                {loading ? 'Processing...' : (
                  authMode === 'signin' ? 'Sign In →' : 
                  (!studentInfo ? 'Verify Registration →' : 'Send Setup OTP →')
                )}
              </button>

              {authMode === 'signin' && (
                <button type="button" className="google-btn">
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" />
                  Continue with Google
                </button>
              )}
              
              <div style={{ textAlign: 'center' }}>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => { setStep(0); setError(''); setMessage(''); setEmail(''); setPassword(''); setStudentInfo(null); }}
                >
                  ← Change Role
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="login-form-step">
              <div className="selected-role-badge">
                ✉️ Secure OTP sent to <strong>{email}</strong>
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
                {loading ? 'Verifying...' : 'Complete Authentication'}
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
