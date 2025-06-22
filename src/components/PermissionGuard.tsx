import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionContext';

interface PermissionGuardProps {
  requiredPermission: string;
  fallbackPath: string;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  requiredPermission, 
  fallbackPath, 
  children 
}) => {
  const { hasPermission, loading, isAdmin } = usePermissions();
  
  // While checking permissions, show nothing
  if (loading) {
    return null; // Or a loading spinner if preferred
  }
  
  // Admin users can access everything
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Check permission and redirect if necessary
  if (!hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  // User has permission, render children
  return <>{children}</>;
};

export default PermissionGuard;
