import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AccessDeniedWarning from './AccessDeniedWarning';
import { secureStorage } from '../../utils/storage';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function UserGuard({ children }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const adminToken = sessionStorage.getItem('adminToken');
    const userToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const userDetails = secureStorage.getItem('userDetails');
    
    // Check if user is trying to access admin routes
    const isAdminRoute = location.pathname.startsWith('/ItsmeAdmin');
    
    if (adminToken) {
      const decoded = parseJwt(adminToken);
      if (decoded && decoded.username && (!decoded.exp || decoded.exp > Date.now() / 1000)) {
        setIsAdmin(true);
        setShowAccessDenied(false);
        return;
      } else {
        // Remove invalid admin token
        sessionStorage.removeItem('adminToken');
      }
    }
    
    // For admin routes, check if user is logged in THIS TAB (sessionStorage only)
    if (isAdminRoute) {
      const sessionUserToken = sessionStorage.getItem('token');
      const sessionUserDetails = sessionStorage.getItem('userDetails');
      
      // If user is logged in this tab, show warning
      if (sessionUserToken || sessionUserDetails) {
        let hasValidUserSession = false;
        if (userDetails) {
          hasValidUserSession = !userDetails.expiresAt || Date.now() < userDetails.expiresAt;
        } else if (sessionUserToken) {
          hasValidUserSession = true;
        }
        
        if (hasValidUserSession) {
          setShowAccessDenied(true);
          setIsAdmin(false);
          return;
        }
      }
      
      // If no user session in this tab, allow admin routes to pass through
      setIsAdmin(false);
      setShowAccessDenied(false);
      return;
    }
    
    setIsAdmin(false);
    setShowAccessDenied(false);
  }, [location.pathname]);
  
  if (isAdmin === null) {
    return null;
  }
  
  if (isAdmin) {
    return <Navigate to="/ItsmeAdmin" replace />;
  }
  
  if (showAccessDenied) {
    return <AccessDeniedWarning />;
  }
  
  return children;
}