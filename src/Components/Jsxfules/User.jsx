import React, { useEffect, useState } from 'react';
import '../Cssfiles/user.css';
import axios from 'axios';

export default function AdminUsers({ admin }) {
  const [admins, setAdmins] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Helper to calculate worked time
  const calculateHoursWorked = (login, logout) => {
    if (!login || !logout) return '';
    const loginTime = new Date(login);
    const logoutTime = new Date(logout);
    const diffMs = logoutTime - loginTime;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const fetchAdmins = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const res = await axios.get('http://localhost:5001/api/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const visibleAdmins = admin.isSuperAdmin
        ? res.data
        : res.data.filter(a => !a.isSuperAdmin);
      setAdmins(visibleAdmins);
    } catch (err) {
      console.error('Failed to fetch admins', err);
    }
  };

  useEffect(() => {
    fetchAdmins();
    const interval = setInterval(() => {
      fetchAdmins();
    }, 10000);
    return () => clearInterval(interval);
  }, [admin]);

  const startEdit = (a) => {
    setEditId(a._id);
    setEditForm({
      name: a.profile?.name || '',
      email: a.profile?.email || '',
      password: '', // blank for security
      prevPassword: '*****', // for display
    });
    setShowPassword(false);
  };

  const saveEdit = async () => {
    const token = sessionStorage.getItem('adminToken');
    await axios.put(`http://localhost:5001/api/admin/${editId}`, editForm, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEditId(null);
    fetchAdmins();
  };

  const deleteAdmin = async (id) => {
    if (window.confirm('Are you sure?')) {
      const token = sessionStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5001/api/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(admins.filter(a => a._id !== id));
    }
  };

  return (
    <div className="admin-users-container">
      <h2>All Admins</h2>
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>Password</th>
            <th>SuperAdmin</th>
            <th>Status</th>
            <th>Hours Worked</th>
            {admin.isSuperAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {admins.map(a => {
            const isActive = !a.lastLogout || new Date(a.lastLogin) > new Date(a.lastLogout);
            const worked = !isActive && a.lastLogin && a.lastLogout
              ? calculateHoursWorked(a.lastLogin, a.lastLogout)
              : '';

            return (
              <tr key={a._id}>
                <td>{a.username}</td>
                <td>
                  {editId === a._id ? (
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name"
                    />
                  ) : (
                    a.profile?.name || ''
                  )}
                </td>
                <td>
                  {editId === a._id ? (
                    <input
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Email"
                    />
                  ) : (
                    a.profile?.email || ''
                  )}
                </td>
                <td>
                  {editId === a._id ? (
                    a.isSuperAdmin ? (
                      <span>*****</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        {!showPassword ? (
                          <>
                            <span style={{ marginRight: 8 }}>*****</span>
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.1em',
                                color: '#555'
                              }}
                              onClick={() => setShowPassword(true)}
                              title="Show password"
                            >
                              👁️
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={editForm.password}
                              onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                              placeholder="Leave blank to keep current"
                              style={{ marginRight: 8 }}
                            />
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.1em',
                                color: '#555'
                              }}
                              onClick={() => setShowPassword(false)}
                              title="Hide password"
                            >
                              🙈
                            </button>
                          </>
                        )}
                      </span>
                    )
                  ) : (
                    <span>*****</span>
                  )}
                </td>
                <td>{a.isSuperAdmin ? 'Yes' : 'No'}</td>
                <td style={{ color: isActive ? 'green' : 'gray' }}>
                  {isActive ? 'Active Now' : 'Logged Out'}
                </td>
                <td>{worked}</td>
                {admin.isSuperAdmin && (
                  <td>
                    {admin.username !== a.username && (
                      editId === a._id ? (
                        <>
                          <button onClick={saveEdit}>Save</button>
                          <button onClick={() => setEditId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(a)}>Edit</button>
                          <button onClick={() => deleteAdmin(a._id)} className="delete">Delete</button>
                        </>
                      )
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Card layout for mobile */}
      <div className="admin-users-cards">
        {admins.map(a => {
          const isActive = !a.lastLogout || new Date(a.lastLogin) > new Date(a.lastLogout);
          const worked = !isActive && a.lastLogin && a.lastLogout
            ? calculateHoursWorked(a.lastLogin, a.lastLogout)
            : '';

          return (
            <div key={a._id} className="user-card">
              <div className="user-card-header">
                <div className="user-card-name">{a.username}</div>
                <div style={{ color: isActive ? 'green' : 'gray', fontSize: '12px' }}>
                  {isActive ? 'Active' : 'Offline'}
                </div>
              </div>
              
              <div className="user-card-info">
                <div className="user-card-field">
                  <span className="user-card-label">Name:</span>
                  <div className="user-card-value">
                    {editId === a._id ? (
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Name"
                      />
                    ) : (
                      a.profile?.name || 'N/A'
                    )}
                  </div>
                </div>
                
                <div className="user-card-field">
                  <span className="user-card-label">Email:</span>
                  <div className="user-card-value">
                    {editId === a._id ? (
                      <input
                        value={editForm.email}
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email"
                      />
                    ) : (
                      a.profile?.email || 'N/A'
                    )}
                  </div>
                </div>
                
                <div className="user-card-field">
                  <span className="user-card-label">Password:</span>
                  <div className="user-card-value">
                    {editId === a._id ? (
                      a.isSuperAdmin ? (
                        <span>*****</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {!showPassword ? (
                            <>
                              <span>*****</span>
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => setShowPassword(true)}
                              >
                                👁️
                              </button>
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={editForm.password}
                                onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                                placeholder="Leave blank to keep current"
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                                onClick={() => setShowPassword(false)}
                              >
                                🙈
                              </button>
                            </>
                          )}
                        </div>
                      )
                    ) : (
                      <span>*****</span>
                    )}
                  </div>
                </div>
                
                <div className="user-card-field">
                  <span className="user-card-label">Super:</span>
                  <div className="user-card-value">{a.isSuperAdmin ? 'Yes' : 'No'}</div>
                </div>
                
                {worked && (
                  <div className="user-card-field">
                    <span className="user-card-label">Worked:</span>
                    <div className="user-card-value">{worked}</div>
                  </div>
                )}
              </div>
              
              {admin.isSuperAdmin && admin.username !== a.username && (
                <div className="user-card-actions">
                  {editId === a._id ? (
                    <>
                      <button onClick={saveEdit}>Save</button>
                      <button onClick={() => setEditId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(a)}>Edit</button>
                      <button onClick={() => deleteAdmin(a._id)} className="delete">Delete</button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}