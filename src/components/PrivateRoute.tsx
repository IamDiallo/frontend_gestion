import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

const PrivateRoute: React.FC = () => {
  const location = useLocation();
  
  // Check for authentication token
  const isAuthenticated = localStorage.getItem('access_token') !== null;
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // User is authenticated, render nested routes
  return <Outlet />;
};

export default PrivateRoute;
