import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface PermissionContextType {
  userPermissions: string[];
  isAdmin: boolean;
  userRole: string | null;
  userGroups: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

// Create context with default values
const PermissionContext = createContext<PermissionContextType>({
  userPermissions: [],
  isAdmin: false,
  userRole: null,
  userGroups: [],
  loading: true,
  error: null,
  hasPermission: () => false,
  refreshPermissions: async () => {},
});

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the token
      const token = localStorage.getItem('access_token');
      if (!token) {
        // No token means user is not logged in
        setUserPermissions([]);
        setIsAdmin(false);
        setUserRole(null);
        setUserGroups([]);
        setLoading(false);
        return;
      }

      // Get permissions from the API - Updated to new domain-driven endpoint
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/core/users/user_permissions/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const {
        permissions = [],
        is_admin = false,
        role = null,
        groups = [],
      } = response.data;
      
      // Store in state
      setUserPermissions(permissions || []);
      setIsAdmin(is_admin || false);
      setUserRole(role || null);
      setUserGroups(groups || []);
      
      // Also store in localStorage for persistence
      localStorage.setItem('user_permissions', JSON.stringify(permissions || []));
      localStorage.setItem('is_admin', JSON.stringify(is_admin || false));
      localStorage.setItem('user_role', role || '');
      localStorage.setItem('user_groups', JSON.stringify(groups || []));
    } catch (err) {
      console.error('Error fetching permissions:', err);
      
      try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error("No token available");
        
  const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/core/users/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
          if (userResponse.data?.permissions) {
          // Extract just the simplified permissions
          const simplifiedPermissions = userResponse.data.permissions.map((p: string) => 
            p.includes('.') ? p.split('.')[1] : p
          );
          
          setUserPermissions(simplifiedPermissions);
          setIsAdmin(userResponse.data.is_superuser || false);
          setUserRole(userResponse.data.profile_data?.role || null);
          setUserGroups(userResponse.data.groups || []);
          
          // Save to localStorage
          localStorage.setItem('user_permissions', JSON.stringify(simplifiedPermissions));
          localStorage.setItem('is_admin', JSON.stringify(userResponse.data.is_superuser || false));
          localStorage.setItem('user_role', userResponse.data.profile_data?.role || '');
          localStorage.setItem('user_groups', JSON.stringify(userResponse.data.groups || []));
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback to /me endpoint also failed:", fallbackErr);
      }
        // Try to load from localStorage as fallback
      const storedPermissions = localStorage.getItem('user_permissions');
      const storedIsAdmin = localStorage.getItem('is_admin');
      const storedRole = localStorage.getItem('user_role');
      const storedGroups = localStorage.getItem('user_groups');
      
      if (storedPermissions) {
        setUserPermissions(JSON.parse(storedPermissions));
        setIsAdmin(storedIsAdmin === 'true');
        setUserRole(storedRole || null);
        setUserGroups(storedGroups ? JSON.parse(storedGroups) : []);
      } else {
        setError('Failed to load permissions');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load of permissions
  useEffect(() => {
    fetchPermissions();
  }, []);

  // Function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    // Admin can perform any action
    if (isAdmin) return true;
    
    // Normalize permission format - we now expect all permissions to be simplified already
    let permissionToCheck = permission;
    
    // If the permission includes an app label (contains a dot), extract just the permission name
    if (permission.includes('.')) {
      permissionToCheck = permission.split('.')[1];
    }
    
    const hasAccess = userPermissions.includes(permissionToCheck);
    
    // Debug logging for important permission checks
    if (['view_sale', 'view_client', 'view_product', 'view_stock', 'view_cashreceipt', 'change_user'].includes(permissionToCheck)) {
      console.log('🔍 Permission Check:', {
        requested: permission,
        checking: permissionToCheck,
        userPermissions: userPermissions.slice(0, 15), // Show first 15 to avoid spam
        hasAccess,
        isAdmin
      });
    }
    
    // Direct match in simplified permissions
    return hasAccess;
  };

  // Function to refresh permissions (useful after login/logout)
  const refreshPermissions = async () => {
    await fetchPermissions();
  };
  return (
    <PermissionContext.Provider 
      value={{ 
        userPermissions,
        isAdmin, 
        userRole,
        userGroups,
        loading, 
        error, 
        hasPermission,
        refreshPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

// Custom hook to use the permission context
// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = () => useContext(PermissionContext);

export default PermissionProvider;
