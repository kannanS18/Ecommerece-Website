// components/AdminPrivateRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_API_URL } from '../../config';

export default function AdminPrivateRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null); // null = loading
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      try {
        const res = await axios.get(`${ADMIN_API_URL}/api/admin/verify-token`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.isAdmin === true) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        setIsAuthorized(false);
      }
    };

    verifyAdmin();
  }, [token]);

  if (isAuthorized === null) return null; // or show a loading spinner
  if (!isAuthorized) return <Navigate to="/ItsmeAdmin/login" replace />;
  return children;
}
