import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { AuthService } from '../services/auth'; // Import AuthService for cached getCurrentUser

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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchPermissions = async (abortSignal?: AbortSignal, forceRefresh = false) => {
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

      // Check cache - if data is fresh and not forcing refresh, use cached data
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      if (!forceRefresh && timeSinceLastFetch < CACHE_DURATION && lastFetchTime > 0) {
        console.log('✅ Using cached permissions (fresh for', Math.round((CACHE_DURATION - timeSinceLastFetch) / 1000), 'more seconds)');
        // Load from localStorage (already in state, but ensure consistency)
        const storedPermissions = localStorage.getItem('user_permissions');
        const storedIsAdmin = localStorage.getItem('is_admin');
        const storedRole = localStorage.getItem('user_role');
        const storedGroups = localStorage.getItem('user_groups');
        
        if (storedPermissions) {
          setUserPermissions(JSON.parse(storedPermissions));
          setIsAdmin(storedIsAdmin === 'true');
          setUserRole(storedRole || null);
          setUserGroups(storedGroups ? JSON.parse(storedGroups) : []);
        }
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching fresh permissions from server...');

      // Get permissions from the API - Updated to new domain-driven endpoint
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/core/users/user_permissions/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortSignal
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
      
      // Update last fetch time
      setLastFetchTime(Date.now());
      
      // Also store in localStorage for persistence
      localStorage.setItem('user_permissions', JSON.stringify(permissions || []));
      localStorage.setItem('is_admin', JSON.stringify(is_admin || false));
      localStorage.setItem('user_role', role || '');
      localStorage.setItem('user_groups', JSON.stringify(groups || []));
      localStorage.setItem('permissions_fetch_time', Date.now().toString());
    } catch (err) {
      // If request was cancelled, don't treat it as an error
      if (axios.isCancel(err) || (err as Error).name === 'CanceledError') {
        console.log('Permission fetch was cancelled, using cached data');
        // Load from localStorage without treating as error
        const storedPermissions = localStorage.getItem('user_permissions');
        const storedIsAdmin = localStorage.getItem('is_admin');
        const storedRole = localStorage.getItem('user_role');
        const storedGroups = localStorage.getItem('user_groups');
        
        if (storedPermissions) {
          setUserPermissions(JSON.parse(storedPermissions));
          setIsAdmin(storedIsAdmin === 'true');
          setUserRole(storedRole || null);
          setUserGroups(storedGroups ? JSON.parse(storedGroups) : []);
        }
        setLoading(false);
        return;
      }
      
      console.error('Error fetching permissions:', err);
      
      // Fallback: Try to get permissions from /users/me/ endpoint using cached service
      try {
        console.log('⚠️ /user_permissions/ failed, trying fallback with cached getCurrentUser...');
        const userData = await AuthService.getCurrentUser();
        
        if (userData?.permissions) {
          // Extract just the simplified permissions
          const simplifiedPermissions = userData.permissions.map((p: string) => 
            p.includes('.') ? p.split('.')[1] : p
          );
          
          setUserPermissions(simplifiedPermissions);
          setIsAdmin(userData.is_superuser || false);
          setUserRole(userData.profile_data?.role || null);
          setUserGroups(userData.groups || []);
          
          // Save to localStorage
          localStorage.setItem('user_permissions', JSON.stringify(simplifiedPermissions));
          localStorage.setItem('is_admin', JSON.stringify(userData.is_superuser || false));
          localStorage.setItem('user_role', userData.profile_data?.role || '');
          localStorage.setItem('user_groups', JSON.stringify(userData.groups || []));
          
          setLastFetchTime(Date.now());
          localStorage.setItem('permissions_fetch_time', Date.now().toString());
          setLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
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
    const controller = new AbortController();
    
    // Check if we have cached data
    const cachedFetchTime = localStorage.getItem('permissions_fetch_time');
    if (cachedFetchTime) {
      const lastFetch = parseInt(cachedFetchTime, 10);
      setLastFetchTime(lastFetch);
      
      const timeSinceLastFetch = Date.now() - lastFetch;
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('✅ Loading from cache on mount');
        // Load from cache immediately
        const storedPermissions = localStorage.getItem('user_permissions');
        const storedIsAdmin = localStorage.getItem('is_admin');
        const storedRole = localStorage.getItem('user_role');
        const storedGroups = localStorage.getItem('user_groups');
        
        if (storedPermissions) {
          setUserPermissions(JSON.parse(storedPermissions));
          setIsAdmin(storedIsAdmin === 'true');
          setUserRole(storedRole || null);
          setUserGroups(storedGroups ? JSON.parse(storedGroups) : []);
          setLoading(false);
          return;
        }
      }
    }
    
    // Fetch fresh data if cache is invalid/missing
    fetchPermissions(controller.signal);
    
    // Cleanup function to abort request if component unmounts
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    console.log('🔄 Force refreshing permissions...');
    await fetchPermissions(undefined, true); // Force refresh
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
