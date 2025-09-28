import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import '../Cssfiles/AdminNavbar.css';
import axios from 'axios';
import logo from '../../Images/Logo.png';

export default function AdminNavbar({ admin, onLogout }) {
  const location = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post(`${process.env.REACT_APP_ADMIN_URL || 'https://ecommerece-website-2.onrender.com'}/api/admin/add`, {
        username: newAdmin.username,
        password: newAdmin.password,
        profile: {
          name: newAdmin.name,
          email: newAdmin.email
        },
        currentAdmin: admin.username
      });
      setSuccess('Admin added!');
      setNewAdmin({ username: '', password: '', name: '', email: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add admin');
    }
  };

  return (
    <div className="admin-layout">
      <button 
        className="admin-menu-toggle"
        onClick={() => setIsNavbarVisible(!isNavbarVisible)}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <aside className={`admin-sidebar ${isNavbarVisible ? 'visible' : 'hidden'}`}>
        <div className="admin-sidebar-header">
          <img src={logo} alt="Admin Logo" className="admin-sidebar-logo" />
          <h2 className="admin-sidebar-title">Admin Panel</h2>
        </div>
        
        <div className="admin-user-info">
          <strong>{admin.profile?.name || admin.username}</strong>
          <small>Last login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}</small>
        </div>
        
        <nav className="admin-nav">
          <NavLink
            to="/ItsmeAdmin"
            className={({ isActive }) =>
              "admin-navlink" + (isActive && location.pathname === "/ItsmeAdmin" ? " active" : "")
            }
          >
            Items
          </NavLink>
          
          {admin.isSuperAdmin && (
            <NavLink
              to="/ItsmeAdmin/users"
              className={({ isActive }) => "admin-navlink" + (isActive ? " active" : "")}
            >
              Users
            </NavLink>
          )}
          
          <NavLink
            to="/ItsmeAdmin/orders"
            className={({ isActive }) => "admin-navlink" + (isActive ? " active" : "")}
          >
            Orders
          </NavLink>
          
          {admin.isSuperAdmin && (
            <button
              className="admin-action-btn add"
              onClick={() => setShowAdd(true)}
            >
              + Add Admin
            </button>
          )}
        </nav>
        
        <button className="admin-action-btn logout" onClick={onLogout}>
          Logout
        </button>
        
        {showAdd && (
          <div className="admin-modal-backdrop" onClick={() => setShowAdd(false)}>
            <form
              className="admin-modal-form"
              onClick={e => e.stopPropagation()}
              onSubmit={handleAddAdmin}
            >
              <h3>Add New Admin</h3>
              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}
              <input
                type="text"
                placeholder="Username"
                value={newAdmin.username}
                onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Name"
                value={newAdmin.name}
                onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
              <div className="button-container">
                <button type="submit">Add</button>
                <button type="button" className="delete" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </aside>
      
      {isNavbarVisible && <div className="admin-overlay" onClick={() => setIsNavbarVisible(false)}></div>}
      
      <main className={`admin-main ${isNavbarVisible ? 'with-sidebar' : 'full-width'}`}>
        <Outlet />
      </main>
    </div>
  );
}