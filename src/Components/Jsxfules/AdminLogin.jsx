import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../../utils/storage';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5001/api/admin/login', {
        username,
        password,
      });

      const token = res.data.token;
      if (!token) throw new Error('No token received');

      // Save admin token using secure storage
      const adminData = { token, username, loginTime: Date.now() };
      secureStorage.setItem('adminToken', adminData);
      sessionStorage.setItem('adminToken', token);

      // Optional: Fetch profile (used for admin state check)
      const profileRes = await axios.get(
        `http://localhost:5001/api/admin/profile/${username}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('✅ Login success:', profileRes.data);

      // ✅ Redirect to /ItsmeAdmin — VERY IMPORTANT
      navigate('/ItsmeAdmin');

    } catch (err) {
      console.error('❌ Admin login failed:', err);
      setError('Invalid credentials or server error.');
    }
  };

  return (
    <div className="login-container">
      <form className="auth-form auth-card" onSubmit={handleLogin}>
        <h2>Admin Login</h2>
        {error && <div className="auth-error">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          autoFocus
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
