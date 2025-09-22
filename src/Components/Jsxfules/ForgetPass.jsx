import React, { useState } from 'react';
import axios from 'axios';
import '../Cssfiles/Forget.css';
import { API_BASE_URL } from '../../config';

export default function ForgetPass({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Verify user
  const handleVerify = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Backend should accept either email or username as "identifier"
      await axios.post(`${API_BASE_URL}/api/forgot-password`, { identifier });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'User not found');
    }
  };

  // Step 2: Reset password
  const handleReset = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/forgot-password`, {
        identifier,
        newPassword
      });
      setSuccess('Password reset successful! You can now log in.');
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
    }
  };

  return (
    <div className="forgot-container">
      <h2>Forgot Password</h2>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      {step === 1 && (
        <form onSubmit={handleVerify}>
          <label>
            Enter your username or email:
            <input
              type="text"
              value={identifier}
              required
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Username or Email"
            />
          </label>
          <button type="submit">Next</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleReset}>
          <label>
            New password:
            <div className="password-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                required
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <span
                className={`eye-icon ${showNewPassword ? "open" : ""}`}
                onClick={() => setShowNewPassword(v => !v)}
                tabIndex={0}
                role="button"
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#6ec1e4" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#6ec1e4" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                    <line x1="3" y1="3" x2="21" y2="21" stroke="#6ec1e4" strokeWidth="2"/>
                  </svg>
                )}
              </span>
            </div>
          </label>
          <label>
            Confirm password:
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPass}
                required
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Confirm new password"
              />
              <span
                className={`eye-icon ${showConfirmPassword ? "open" : ""}`}
                onClick={() => setShowConfirmPassword(v => !v)}
                tabIndex={0}
                role="button"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#6ec1e4" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <path fill="#6ec1e4" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                    <line x1="3" y1="3" x2="21" y2="21" stroke="#6ec1e4" strokeWidth="2"/>
                  </svg>
                )}
              </span>
            </div>
          </label>
          <button type="submit">Reset Password</button>
        </form>
      )}
      <button style={{ marginTop: 16 }} onClick={onBackToLogin}>Back to Login</button>
    </div>
  );
}