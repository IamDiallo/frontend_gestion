/**
 * Authentication API
 * Handles login, logout, token refresh, and authentication state
 */

import { api, debugAPI } from './config';
import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.127:8000/api';

// ============================================================================
// TYPES
// ============================================================================

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: unknown;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  user?: unknown;
  role?: string | null;
  isAdmin?: boolean;
  reason?: string;
  error?: unknown;
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Login with username and password
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    debugAPI.logRequest('/token/', 'POST', { username, password: '***' });
    const response = await api.post('/token/', {
      username,
      password
    });

    if (response.data && response.data.access) {
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Calculate and store token expiration time (assuming JWTs with 15min expiry)
      const expiresIn = 15 * 60 * 1000; // 15 minutes in milliseconds
      const expirationTime = new Date().getTime() + expiresIn;
      localStorage.setItem('token_expiration', expirationTime.toString());
        // Try to get user data immediately
      try {
        const userResponse = await api.get('/core/users/me/');
        
        // Store the current user data in localStorage for sidebar change detection
        localStorage.setItem('current_user', JSON.stringify(userResponse.data));
        
        debugAPI.logResponse('/token/', response);
        return {
          ...response.data,
          user: userResponse.data
        };
      } catch (error) {
        console.error('Error fetching user data after login:', error);
        debugAPI.logResponse('/token/', response);
        return response.data;
      }
    }
    debugAPI.logResponse('/token/', response);
    return response.data;
  } catch (error) {
    debugAPI.logError('/token/', error);
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout and clear all stored tokens and user data
 */
export const logout = () => {
  // Clear all cached user data when logging out
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expiration');
  localStorage.removeItem('user_permissions');
  localStorage.removeItem('user_role');
  localStorage.removeItem('is_admin');
  localStorage.removeItem('current_user');
};

/**
 * Check if user is authenticated (has valid access token)
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('access_token') !== null;
};

/**
 * Refresh the access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<string> => {
  try {
    debugAPI.logRequest('/token/refresh/', 'POST', { refresh: '***' });
    const response = await api.post('/token/refresh/', {
      refresh: refreshToken
    });
    
    if (response.data && response.data.access) {
      const newToken = response.data.access;
      localStorage.setItem('access_token', newToken);
      
      // Save new refresh token if rotation is enabled
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      
      // Update token expiration time (assuming 15 minutes)
      const expiresIn = 15 * 60 * 1000; // 15 minutes in milliseconds
      const expirationTime = new Date().getTime() + expiresIn;
      localStorage.setItem('token_expiration', expirationTime.toString());
      
      debugAPI.logResponse('/token/refresh/', response);
      return newToken;
    }
    throw new Error('No access token received from refresh endpoint');
  } catch (error) {
    debugAPI.logError('/token/refresh/', error);
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token found');
    }
    
    debugAPI.logRequest('/core/users/me/', 'GET');
    const response = await api.get('/core/users/me/');
    debugAPI.logResponse('/core/users/me/', response);
    return response.data;
  } catch (error) {
    debugAPI.logError('/core/users/me/', error);
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Check authentication status and fetch user data
 */
export const checkAuthentication = async (): Promise<AuthCheckResponse> => {
  try {
    const token = localStorage.getItem('access_token');
    console.log('Current token:', token ? `${token.substring(0, 15)}...` : 'No token');
    
    if (!token) {
      return { authenticated: false, reason: 'No token found' };
    }
    
    // Reduced timeout for faster response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const currentUserEndpoint = '/core/users/me/';
    const legacyCurrentUserEndpoint = '/users/me/';
    
    try {
      debugAPI.logRequest(currentUserEndpoint, 'GET');
      let response;
      try {
        response = await api.get(currentUserEndpoint, {
          signal: controller.signal
        });
      } catch (primaryError) {
        if (axios.isAxiosError(primaryError) && primaryError.response?.status === 404) {
          debugAPI.logError(currentUserEndpoint, primaryError);
          debugAPI.logRequest(legacyCurrentUserEndpoint, 'GET');
          response = await api.get(legacyCurrentUserEndpoint, {
            signal: controller.signal
          });
        } else {
          throw primaryError;
        }
      }
      
      clearTimeout(timeoutId);
      debugAPI.logResponse(currentUserEndpoint, response);
      
      const userData = response.data;
      const role = userData.profile_data?.role || null;
      const isAdmin = role === 'admin';
      
      console.log(`User role detected: ${role}, isAdmin: ${isAdmin}`);
      
      if (userData.permissions) {
        localStorage.setItem('user_permissions', JSON.stringify(userData.permissions));
      }
      if (role) {
        localStorage.setItem('user_role', role);
      }
      localStorage.setItem('is_admin', isAdmin ? 'true' : 'false');
      
      return {
        authenticated: true,
        user: response.data,
        role,
        isAdmin
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: unknown) {
    debugAPI.logError('/core/users/me/', error);
    
    if (axios.isCancel(error)) {
      return { 
        authenticated: false, 
        reason: 'Request timeout', 
        error: new Error('Authentication check timed out')
      };
    }
    
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 401) {
      console.warn('Authentication token invalid, clearing tokens');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_admin');
    }
    
    return {
      authenticated: false,
      reason: axiosError.response?.status === 401 ? 'Invalid token' : 'Request failed',
      error
    };
  }
};

/**
 * Test backend connection
 */
export const testBackendConnection = async () => {
  try {
    debugAPI.logRequest('/health-check/', 'GET');
    const response = await api.get('/health-check/');
    debugAPI.logResponse('/health-check/', response);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    debugAPI.logError('/health-check/', error);
    return {
      success: false,
      error
    };
  }
};

/**
 * Detect CORS issues for debugging
 */
export const detectCorsIssues = async (endpoint: string = 'health-check') => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      credentials: 'include'
    });
    
    console.log('CORS test response status:', response.status);
    console.log('CORS test response headers:', {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
    });
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      }
    };
  } catch (error: unknown) {
    console.error('CORS test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = async (userId: number, permission: string): Promise<boolean> => {
  try {
    console.log(`Checking API permission "${permission}" for user ${userId}`);
    const permissionEndpoint = `/core/users/${userId}/check_permission/?permission_code=${permission}`;
    let response;
    try {
      response = await api.get(permissionEndpoint);
    } catch (primaryError) {
      if (axios.isAxiosError(primaryError) && primaryError.response?.status === 404) {
        const legacyEndpoint = `/users/${userId}/check-permission/?permission_code=${permission}`;
        debugAPI.logError(permissionEndpoint, primaryError);
        response = await api.get(legacyEndpoint);
      } else {
        throw primaryError;
      }
    }
    
    console.log('Permission check response:', response.data);
    return response.data.has_permission === true;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// ============================================================================
// LEGACY EXPORT (for backward compatibility)
// ============================================================================

export const AuthAPI = {
  login,
  logout,
  isAuthenticated,
  refreshToken,
  getCurrentUser,
  checkAuthentication,
  testBackendConnection,
  detectCorsIssues,
  hasPermission
};

export default AuthAPI;
