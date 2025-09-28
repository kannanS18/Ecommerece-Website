import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AdminNavbar from '../Components/Jsxfules/AdminNavbar';
import Admin from '../Components/Jsxfules/Admin';
import Users from '../Components/Jsxfules/User';
import AdminOrders from '../Components/Jsxfules/Adminorder';
import { secureStorage } from '../utils/storage';
import { API_BASE_URL, ADMIN_API_URL } from '../config';

// Helper to decode JWT (without verifying signature)
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const [items, setItems] = useState([]);
  const [admin, setAdmin] = useState(null);
  const token = sessionStorage.getItem('adminToken');
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch admin profile
  useEffect(() => {
    if (token && !admin) {
      const decoded = parseJwt(token);
      if (decoded && decoded.username) {
        axios
          .get(`${ADMIN_API_URL}/api/admin/profile/${decoded.username}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((profileRes) => {
            setAdmin({
              username: decoded.username,
              isSuperAdmin: decoded.isSuperAdmin,
              ...profileRes.data,
            });
          })
          .catch(() => {
            setAdmin(null);
            sessionStorage.removeItem('adminToken');
            navigate('/ItsmeAdmin/login'); // Redirect to login if token fails
          });
      } else {
        navigate('/ItsmeAdmin/login');
      }
    } else if (!token) {
      navigate('/ItsmeAdmin/login');
    }
  }, [token, admin, navigate]);

  // Fetch items after admin is loaded
  useEffect(() => {
    if (admin && token) {
      axios
        .get(`${API_BASE_URL}/api/items`)
        .then((res) => setItems(res.data))
        .catch((err) => console.log('Failed to fetch items:', err));
    }
  }, [admin, token]);

  // Handle logout
  const handleLogout = async () => {
    if (admin) {
      await axios.post(`${ADMIN_API_URL}/api/admin/logout`, {
        username: admin.username,
      });
    }
    setAdmin(null);
    sessionStorage.removeItem('adminToken');
    secureStorage.removeItem('adminToken');
    // Clear any user session data as well
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    secureStorage.removeItem('userDetails');
    navigate('/ItsmeAdmin/login');
  };

  // Wait until admin profile is loaded
  if (!admin) return null;

  return (
    <div>
      <AdminNavbar admin={admin} onLogout={handleLogout} />
      <div className="admin-layout-content">
        <Routes location={location}>
          <Route path="/" element={<Admin items={items} setItems={setItems} />} />
          <Route path="users" element={
            admin.isSuperAdmin ? <Users admin={admin} /> : 
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>Access Denied</h2>
              <p>Only super admins can access the users page.</p>
            </div>
          } />
          <Route path="orders" element={<AdminOrders admin={admin} />} />
         
        </Routes>
      </div>
    </div>
  );
}
