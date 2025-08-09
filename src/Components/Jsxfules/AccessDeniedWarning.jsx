import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Cssfiles/AccessDeniedWarning.css';

export default function AccessDeniedWarning() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="warning-icon">⚠️</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin area.</p>
        <p>This section is restricted to administrators only.</p>
        <button className="go-home-btn" onClick={handleGoHome}>
          Go to Home
        </button>
      </div>
    </div>
  );
}