import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { secureStorage } from '../../utils/storage';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AdminGuard({ children }) {
  const [isValidAdmin, setIsValidAdmin] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    const validateAdmin = async () => {
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
      
      if (!token) {
        setIsValidAdmin(false);
        return;
      }
      
      // Move token to sessionStorage for tab-specific access
      if (localStorage.getItem('adminToken')) {
        sessionStorage.setItem('adminToken', token);
        localStorage.removeItem('adminToken');
      }
      
      const decoded = parseJwt(token);
      if (!decoded || !decoded.username) {
        sessionStorage.removeItem('adminToken');
        localStorage.removeItem('adminToken');
        setIsValidAdmin(false);
        return;
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        sessionStorage.removeItem('adminToken');
        localStorage.removeItem('adminToken');
        setIsValidAdmin(false);
        return;
      }
      
      // Server-side validation
      try {
        await axios.get(`http://localhost:5001/api/admin/profile/${decoded.username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Clear user session data when admin access is confirmed
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        secureStorage.removeItem('userDetails');
        
        setIsValidAdmin(true);
      } catch (error) {
        sessionStorage.removeItem('adminToken');
        localStorage.removeItem('adminToken');
        secureStorage.removeItem('adminToken');
        setIsValidAdmin(false);
      }
    };
    
    validateAdmin();
  }, [location.pathname]);
  
  if (isValidAdmin === null) {
    return <div>Verifying access...</div>;
  }
  
  if (!isValidAdmin) {
    return <Navigate to="/ItsmeAdmin/login" replace />;
  }
  
  return children;
}