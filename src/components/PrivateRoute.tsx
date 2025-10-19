import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { checkAuthentication } from '../services/api/auth.api';

const PrivateRoute: React.FC = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const validateAuth = async () => {
      // Quick check: if no token exists, skip API validation
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      try {
        // Validate token with backend
        const authCheck = await checkAuthentication();
        
        if (authCheck.authenticated) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid or expired
          console.log('Authentication failed:', authCheck.reason);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expiration');
          localStorage.removeItem('user_permissions');
          localStorage.removeItem('user_role');
          localStorage.removeItem('is_admin');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        // On error, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiration');
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    validateAuth();
  }, [location.pathname]);
  
  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, render nested routes
  return <Outlet />;
};

export default PrivateRoute;
