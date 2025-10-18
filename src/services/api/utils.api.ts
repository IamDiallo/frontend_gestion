/**
 * API Utility Functions
 * Helper functions for API operations, debugging, generic CRUD operations, etc.
 * 
 * Note: Authentication functions have been moved to auth.api.ts
 */

import { api } from './config';
// Re-export auth functions from auth.api.ts for backward compatibility
export { 
  checkAuthentication, 
  hasPermission, 
  testBackendConnection, 
  detectCorsIssues 
} from './auth.api';
import { checkAuthentication, hasPermission } from './auth.api';

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

export const debugAPI = {
  logRequest: (endpoint: string, method: string, data?: unknown) => {
    console.log(`%cAPI Request: ${method.toUpperCase()} ${endpoint}`, 'background: #ded; color: #080; font-weight: bold');
    if (data) {
      console.log('Request data:', data);
    }
    console.log('Request headers:', api.defaults.headers);
    console.log('Auth token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');
  },
  
  logResponse: (endpoint: string, response: unknown) => {
    console.log(`%cAPI Response from ${endpoint}:`, 'background: #dde; color: #008; font-weight: bold');
    const res = response as { status: number; data: unknown };
    console.log('Status:', res.status);
    console.log('Data:', res.data);
    console.log('Is array?', Array.isArray(res.data));
    console.log('Length:', Array.isArray(res.data) ? res.data.length : 'N/A');
  },

  logError: (endpoint: string, error: unknown) => {
    console.error(`%cAPI Error from ${endpoint}:`, 'background: #edd; color: #800; font-weight: bold', error);
    const err = error as { response?: unknown; request?: unknown; message?: string; config?: unknown };
    const axiosErr = err as { 
      response?: { data: unknown; status: number; headers: unknown }; 
      request?: unknown; 
      message?: string; 
      config?: unknown 
    };
    if (axiosErr.response) {
      console.error('Response data:', axiosErr.response.data);
      console.error('Response status:', axiosErr.response.status);
      console.error('Response headers:', axiosErr.response.headers);
    } else if (axiosErr.request) {
      console.error('Request was made but no response received', axiosErr.request);
    } else {
      console.error('Error during request setup:', axiosErr.message);
    }
    console.error('Error config:', axiosErr.config);
  }
};

// ============================================================================
// GENERIC CRUD OPERATIONS (Deprecated - use domain-specific APIs)
// ============================================================================

/**
 * @deprecated Use domain-specific APIs instead
 */
export const fetchData = async (endpoint: string) => {
  debugAPI.logRequest(`/${endpoint}/`, 'GET');
  try {
    const startTime = performance.now();
    const response = await api.get(`/${endpoint}/`);
    const endTime = performance.now();
    console.log(`Request to /${endpoint}/ took ${endTime - startTime}ms`);
    
    if (Array.isArray(response.data) && response.data.length === 0) {
      console.warn(`Empty array returned from /${endpoint}/`);
    } else if (response.data === null || response.data === undefined) {
      console.warn(`Null/undefined response from /${endpoint}/`);
    }
    
    debugAPI.logResponse(`/${endpoint}/`, response);
    return response.data;
  } catch (error: unknown) {
    debugAPI.logError(`/${endpoint}/`, error);
    throw error;
  }
};

/**
 * @deprecated Use domain-specific APIs instead
 */
export const createData = async <T>(endpoint: string, data: T) => {
  try {
    const response = await api.post(`/${endpoint}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error creating ${endpoint}:`, error);
    throw error;
  }
};

/**
 * @deprecated Use domain-specific APIs instead
 */
export const updateData = async <T>(endpoint: string, id: number, data: T) => {
  try {
    const response = await api.put(`/${endpoint}/${id}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error updating ${endpoint}:`, error);
    throw error;
  }
};

/**
 * @deprecated Use domain-specific APIs instead
 */
export const deleteData = async (endpoint: string, id: number) => {
  try {
    await api.delete(`/${endpoint}/${id}/`);
    return true;
  } catch (error: unknown) {
    console.error(`Error deleting ${endpoint}:`, error);
    throw error;
  }
};

/**
 * @deprecated Use domain-specific APIs with permission checks instead
 */
export const createDataWithPermissionCheck = async <T>(
  endpoint: string,
  data: T,
  requiredPermission: string
): Promise<T> => {
  try {
    const authCheck = await checkAuthentication();
    if (!authCheck.authenticated) {
      throw new Error('Not authenticated');
    }
    
    const user = authCheck.user as { role?: string; id?: number } | undefined;
    if (user?.role === 'admin') {
      const response = await api.post(`/${endpoint}/`, data);
      return response.data;
    }
    
    const userId = user?.id;
    if (!userId) {
      throw new Error('User ID not available');
    }
    
    const permitted = await hasPermission(userId, requiredPermission);
    if (!permitted) {
      throw new Error(`Permission denied: ${requiredPermission}`);
    }
    
    const response = await api.post(`/${endpoint}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error creating ${endpoint}:`, error);
    throw error;
  }
};
