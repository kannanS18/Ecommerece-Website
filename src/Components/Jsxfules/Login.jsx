import React, { useState, useRef } from 'react';
import '../Cssfiles/Login.css'; 
import axios from 'axios';
import ForgetPass from './ForgetPass';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../../utils/storage';

export default function Login({ setUser, defaultTab = 'register', onClose }) {
  const navigate = useNavigate(); 
  const [animStep, setAnimStep] = useState("form"); 
  const [showAuthCard, setShowAuthCard] = useState(false);
  const [tab, setTab] = useState(defaultTab);
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginFailedOnce, setLoginFailedOnce] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showForgot, setShowForgot] = useState(false);



const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);
  const registerEmailRef = useRef(null);
  const registerPasswordRef = useRef(null);
  const registerConfirmRef = useRef(null);

  const getMascotExpression = () => {
    if (showLoginPassword || showRegisterPassword || showRegisterConfirm) return 'peek';
    if (
      document.activeElement === loginEmailRef.current ||
      document.activeElement === registerEmailRef.current
    ) {
      return loginUser || registerEmail ? 'tongue' : 'smiling';
    }
    if (
      document.activeElement === loginPasswordRef.current ||
      document.activeElement === registerPasswordRef.current
    ) return 'closed';
    if (document.activeElement === registerConfirmRef.current) {
      if (!registerConfirm) return 'shocked';
      return registerPassword === registerConfirm && registerConfirm.length > 0 ? 'happy' : 'worried';
    }
    return 'neutral';
  };

const handleLogin = async e => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoginFailedOnce(false);

  // 1. Card flattens
  setAnimStep("flatten");
  setTimeout(async () => {
    // 2. Spinner slides out, card stays flattened
    setShowAuthCard(true);
    setAnimStep("auth-out");

    // Do the login request while spinner is out
    let loginSuccess = false;
    let loginError = '';
    let userEmail = '';
    let userObj = null;

    try {
      const payload = { loginUser, loginPassword };
      const result = await axios.post("http://localhost:5000/api/login", payload);
      if (result.data && result.data.error) {
        loginError = result.data.error;
      } else if (result.data && result.data.message === 'Login successful') {
        setSuccess('Login successful!');
        sessionStorage.setItem('token', result.data.token);
        userEmail = result.data.user.email;
        loginSuccess = true;
      } else {
        loginError = 'Login failed';
      }
    } catch (err) {
      loginError =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Login failed';
    }

    setTimeout(async () => {
      // 3. Spinner slides back in, card returns to normal
      setAnimStep("auth-in");

      setTimeout(async () => {
        setShowAuthCard(false);

        if (loginSuccess && userEmail) {
          try {
            // Always fetch full profile after login
            const res = await axios.get(`http://localhost:5000/api/user/${userEmail}`);
            userObj = res.data;
            const userData = {
              ...userObj,
              registerName: userObj.name,
              registerEmail: userObj.email,
            };
            
            // Store user details with 2-day expiration
            const userSession = {
              ...userData,
              loginTime: Date.now(),
              expiresAt: Date.now() + (2 * 24 * 60 * 60 * 1000) // 2 days
            };
            secureStorage.setItem('userDetails', userSession);
            
            setUser(userData);
          } catch {
            setUser(null);
          }
          setLoginUser('');
          setLoginPassword('');
          setError('');
          setSuccess('');
          // 4. Show success
          setAnimStep("done");
          setTimeout(() => {
            setAnimStep("form");
            navigate('/home');
            if (onClose) onClose();
          }, 1200);
        } else {
          setLoginFailedOnce(true);
          setError(loginError);
          setAnimStep("form");
        }
      }, 800); // spinner slides in for 0.8s (should match CSS)
    }, 1800); // spinner stays out for 1.8s (should match CSS)
  }, 500); // flatten for 0.5s (should match CSS)
};

const handleRegister = async e => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setAnimStep("flatten");
  setTimeout(async () => {
    setShowAuthCard(true);
    setAnimStep("auth-out");

    // Validation
    if (/[\s!@#$%^&*(),.?":{}|<>]/.test(registerName[0])) {
      setTimeout(() => {
        setShowAuthCard(false);
        setError(' Start with a space, or start with a special character');
        setAnimStep("form");
      }, 800);
      return;
    }
    if (!registerName || !registerEmail || !registerPassword) {
      setTimeout(() => {
        setShowAuthCard(false);
        setError('Please fill all fields');
        setAnimStep("form");
      }, 800);
      return;
    }
    if (registerPassword !== registerConfirm) {
      setTimeout(() => {
        setShowAuthCard(false);
        setError('Passwords do not match');
        setAnimStep("form");
      }, 800);
      return;
    }

    // Simulate spinner out, then in, then done
    setTimeout(async () => {
      setAnimStep("auth-in");

      setTimeout(async () => {
        setShowAuthCard(false);

        try {
          const result = await axios.post("http://localhost:5000/api/register", { name: registerName, email: registerEmail, password: registerPassword });
          if (result.data && result.data.error) {
            setError(result.data.error);
            setAnimStep("form");
          } else if (result.data && result.data.message === 'Registration successful') {
            setSuccess('Registration successful! Logging you in...');
            sessionStorage.setItem('token', result.data.token);
            const email = result.data.user.email;
            // Always fetch full profile after register
            const res = await axios.get(`http://localhost:5000/api/user/${email}`);
            const userObj = res.data;
            const userData = {
              ...userObj,
              registerName: userObj.name,
              registerEmail: userObj.email,
            };
            
            // Store user details with 2-day expiration
            const userSession = {
              ...userData,
              loginTime: Date.now(),
              expiresAt: Date.now() + (2 * 24 * 60 * 60 * 1000) // 2 days
            };
            secureStorage.setItem('userDetails', userSession);
            
            setUser(userData);
            setRegisterName('');
            setRegisterEmail('');
            setRegisterPassword('');
            setRegisterConfirm('');
            setError('');
            setSuccess('');
            setAnimStep("done");
            setTimeout(() => {
              setAnimStep("form");
              navigate('/home');
              if (onClose) onClose();
            }, 1200);
          } else {
            setError('Registration failed');
            setAnimStep("form");
          }
        } catch (err) {
          const msg =
            err.response && err.response.data && err.response.data.error
              ? err.response.data.error
              : 'Registration failed';
          setError(msg);
          setAnimStep("form");
        }
      }, 800); // spinner slides in for 0.8s
    }, 1800); // spinner stays out for 1.8s

  }, 500); // flatten for 0.5s
};

  return (
    <div className="login-container">


      <div className="center-stack" style={{ position: "relative" }}>
        {showAuthCard && (
          <div className={`auth-spinner-card ${animStep}`}>
            <div className="login-anim-spinner"></div>
            <span>Authenticating...</span>
          </div>
        )}
        <div className={`auth-card ${animStep}`}>
          <button
            className="close-login"
            onClick={onClose}
            aria-label="Close login modal"
          >
            ×
          </button>
          {animStep === "auth" ? (
            <div className="login-anim-authenticating">
              <div className="login-anim-spinner"></div>
              <span>Authenticating...</span>
            </div>
          ) : animStep === "done" ? (
            <div className="login-anim-success">
              <span>✔️</span>
              <span>Welcome!</span>
            </div>
          ) : showForgot ? (
            <ForgetPass onBackToLogin={() => setShowForgot(false)} />
          ) : (
            <>
              {/* Gingerbread Mascot */}
              <div className="gingerbread-mascot">
                <div className={`gingerbread-face ${getMascotExpression()}`}>
                  <div className="gingerbread-ears">
                    <div className="ear left-ear"></div>
                    <div className="ear right-ear"></div>
                  </div>
                  <div className="gingerbread-eyes">
                    <div className="eye left-eye"></div>
                    <div className="eye right-eye"></div>
                  </div>
                  <div className="gingerbread-mouth"></div>
                  {/* <div className="gingerbread-buttons">
                    <div className="button"></div>
                    <div className="button"></div>
                    <div className="button"></div>
                  </div> */}
                </div>
              </div>
              
              {tab === 'login' && (
                <form className="auth-form" onSubmit={handleLogin}>
                  <h2>Login</h2>
                  {error && <div className="auth-error">{error}</div>}
                  {success && <div className="auth-success">{success}</div>}
                  <label>
                    Username or Email
                    <input
                      type="text"
                      value={loginUser}
                      required
                      ref={loginEmailRef}
                      onChange={e => setLoginUser(e.target.value)}
                      placeholder="Enter your username or email"
                    />
                  </label>
                  <label>
                    Password
                    <div className="password-wrapper">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        required
                        ref={loginPasswordRef}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                      <span
                        className={`eye-icon ${showLoginPassword ? "open" : ""}`}
                        onClick={() => setShowLoginPassword(v => !v)}
                        tabIndex={0}
                        role="button"
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? <FaEye /> : <FaEyeSlash />}
                      </span>
                    </div>
                  </label>
                  <button type="submit">Login</button>
                  {loginFailedOnce && (
                    <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.98rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6ec1e4',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                          font: 'inherit'
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.98rem' }}>
                    Don't have an account?{' '}
                    <span
                      style={{ color: '#6ec1e4', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
                    >
                      Register
                    </span>
                  </div>
                </form>
              )}
              {tab === 'register' && (
                <form className="auth-form" onSubmit={handleRegister}>
                  <h2>Register</h2>
                  {error && <div className="auth-error">{error}</div>}
                  {success && <div className="auth-success">{success}</div>}
                  <div className="register-fields">
                    <div className="register-left">
                      <label>
                        Name
                        <input
                          type="text"
                          value={registerName}
                          required
                          onChange={e => setRegisterName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={registerEmail}
                          required
                          ref={registerEmailRef}
                          onChange={e => setRegisterEmail(e.target.value)}
                          placeholder="Enter your email"
                        />
                      </label>
                    </div>
                    <div className="register-right">
                      <label>
                        Password
                        <div className="password-wrapper">
                          <input
                            type={showRegisterPassword ? "text" : "password"}
                            value={registerPassword}
                            required
                            ref={registerPasswordRef}
                            onChange={e => setRegisterPassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                          <span
                            className={`eye-icon ${showRegisterPassword ? "open" : ""}`}
                            onClick={() => setShowRegisterPassword(v => !v)}
                            tabIndex={0}
                            role="button"
                            aria-label="Toggle password visibility"
                          >
                            {showRegisterPassword ? <FaEye /> : <FaEyeSlash />}
                          </span>
                        </div>
                      </label>
                      <label>
                        Confirm Password
                        <div className="password-wrapper">
                          <input
                            type={showRegisterConfirm ? "text" : "password"}
                            value={registerConfirm}
                            required
                            ref={registerConfirmRef}
                            onChange={e => setRegisterConfirm(e.target.value)}
                            placeholder="Enter your password"
                          />
                          <span
                            className={`eye-icon ${showRegisterConfirm ? "open" : ""}`}
                            onClick={() => setShowRegisterConfirm(v => !v)}
                            tabIndex={0}
                            role="button"
                            aria-label="Toggle password visibility"
                          >
                            {showRegisterConfirm ? <FaEye /> : <FaEyeSlash />}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <button type="submit">Register</button>
                  <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.98rem' }}>
                    Already have an account?{' '}
                    <span
                      style={{ color: '#6ec1e4', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                    >
                      Login
                    </span>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}