import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Client } from '../interfaces/business';
import { Product, ProductCategory, UnitOfMeasure } from '../interfaces/products';
import { Sale, Invoice, Quote, OutstandingSale, SaleDeletionResponse, SaleCanDeleteResponse } from '../interfaces/sales';
import { User, Group, UserCreateRequest } from '../interfaces/users';
import { 
  Stock, StockSupply, StockTransfer, Inventory, StockMovement,
  CreateStockSupply, CreateStockTransfer, CreateInventory, UpdateInventory
} from '../interfaces/inventory';
import { 
  Account, Supplier, Zone 
} from '../interfaces/business';
import { 
  Expense, AccountTransfer, CashReceipt, 
  ClientPayment, SupplierPayment, Currency
} from '../interfaces/financial';
import { Production } from '../interfaces/production';
import { AccountPaymentResponse } from '../interfaces/payment';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
console.log('Using API URL:', API_URL);
// const API_URL = 'http://ec2-3-84-250-165.compute-1.amazonaws.com/api/';


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for cookies/authorization
});

// Add a request interceptor
api.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    console.log('Request configuration:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL,
      withCredentials: config.withCredentials
    });
    
    const token = localStorage.getItem('access_token');
    const tokenExpiration = localStorage.getItem('token_expiration');
    
    // If we have a token but it's expiring soon (within 1 minute) or expired
    if (token && tokenExpiration) {
      const expirationTime = parseInt(tokenExpiration, 10);
      const currentTime = new Date().getTime();
      const timeToExpire = expirationTime - currentTime;
      
      // If token will expire in less than 1 minute, try to refresh it proactively
      if (timeToExpire < 60000 && timeToExpire > 0) {
        console.log('Token expiring soon, refreshing proactively');
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/token/refresh/`, {
              refresh: refreshToken
            });
            
            if (response.data && response.data.access) {
              const newToken = response.data.access;
              localStorage.setItem('access_token', newToken);
              
              // Update expiration time (assuming 15 minutes)
              const newExpirationTime = new Date().getTime() + (15 * 60 * 1000);
              localStorage.setItem('token_expiration', newExpirationTime.toString());
              
              config.headers.Authorization = `Bearer ${newToken}`;
              return config;
            }
          }
        } catch (error) {
          console.error('Failed to refresh token proactively:', error);
          // Continue with request even if refresh failed, 
          // the response interceptor will handle 401 if needed
        }
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('Response successful:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.config.url
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('Response error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null,
      request: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : null
    });
    
    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token available');
        const response = await api.post('/token/refresh/', { refresh });
        const token = response.data.access;
        localStorage.setItem('access_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Enhance debug helper with more detailed logging
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
    const res = response as AxiosResponse;
    console.log('Status:', res.status);
    console.log('Data:', res.data);
    console.log('Is array?', Array.isArray(res.data));
    console.log('Length:', Array.isArray(res.data) ? res.data.length : 'N/A');
  },

  logError: (endpoint: string, error: unknown) => {
    console.error(`%cAPI Error from ${endpoint}:`, 'background: #edd; color: #800; font-weight: bold', error);
    const err = error as AxiosError;
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
      console.error('Response headers:', err.response.headers);
    } else if (err.request) {
      console.error('Request was made but no response received', err.request);
    } else {
      console.error('Error during request setup:', err.message);
    }
    console.error('Error config:', err.config);
  }
};

// Let's enhance the fetchData function to provide better debugging
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
    return response.data;  } catch (error: unknown) {
    debugAPI.logError(`/${endpoint}/`, error);
    throw error;
  }
};

// Create a debug endpoint to test connectivity
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

// Create a function to verify authentication
export const checkAuthentication = async () => {
  try {
    const token = localStorage.getItem('access_token');
    console.log('Current token:', token ? `${token.substring(0, 15)}...` : 'No token');
    
    if (!token) {
      return { authenticated: false, reason: 'No token found' };
    }
    
    // Set a timeout for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      debugAPI.logRequest('/users/me/', 'GET');
      const response = await api.get('/users/me/', {
        signal: controller.signal
      });
      
      // Clear the timeout since request completed
      clearTimeout(timeoutId);
      
      debugAPI.logResponse('/users/me/', response);
      
      // Check if the user has a role through profile_data
      const userData = response.data;
      
      // Extract role and check if admin
      const role = userData.profile_data?.role || null;
      const isAdmin = role === 'admin';
      
      console.log(`User role detected: ${role}, isAdmin: ${isAdmin}`);
      
      // Store role and permissions in localStorage for fallback access
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
      // Clear the timeout if there was an error
      clearTimeout(timeoutId);
      throw error;
    }  } catch (error: unknown) {
    debugAPI.logError('/users/me/', error);
    
    // Check if request was aborted
    if (axios.isCancel(error)) {
      return { 
        authenticated: false, 
        reason: 'Request timeout', 
        error: new Error('Authentication check timed out')
      };
    }
    
    const axiosError = error as AxiosError;
    // Handle 401 errors by clearing tokens
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

// Add this method to inspect and log any CORS issues
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

// Add these helper methods to check permissions
export const hasPermission = async (userId: number, permission: string): Promise<boolean> => {
  try {
    console.log(`Checking API permission "${permission}" for user ${userId}`);
    const response = await api.get(`/users/${userId}/check-permission/?permission_code=${permission}`);
    
    // Log the response for debugging
    console.log('Permission check response:', response.data);
    
    // The API should return {has_permission: true/false}
    return response.data.has_permission === true;
  } catch (error) {
    console.error('Error checking permission:', error);
    
    // On error, deny permission by default for security
    return false;
  }
};

// Generic API functions

export const createData = async <T>(endpoint: string, data: T) => {
  try {
    const response = await api.post(`/${endpoint}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error creating ${endpoint}:`, error);
    throw error;
  }
};

export const updateData = async <T>(endpoint: string, id: number, data: T) => {
  try {
    const response = await api.put(`/${endpoint}/${id}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error updating ${endpoint}:`, error);
    throw error;
  }
};

export const deleteData = async (endpoint: string, id: number) => {
  try {
    await api.delete(`/${endpoint}/${id}/`);
    return true;
  } catch (error: unknown) {
    console.error(`Error deleting ${endpoint}:`, error);
    throw error;
  }
};

export const createDataWithPermissionCheck = async <T>(endpoint: string, data: T, requiredPermission: string): Promise<T> => {
  try {
    // Check authentication first
    const authCheck = await checkAuthentication();
    if (!authCheck.authenticated) {
      throw new Error('Not authenticated');
    }
    
    // For admin users, skip permission check
    if (authCheck.user?.role === 'admin') {
      const response = await api.post(`/${endpoint}/`, data);
      return response.data;
    }
    
    // Check if user has permission
    const userId = authCheck.user?.id;
    if (!userId) {
      throw new Error('User ID not available');
    }
    
    const permitted = await hasPermission(userId, requiredPermission);
    if (!permitted) {
      throw new Error(`Permission denied: ${requiredPermission}`);
    }
      // Proceed with request
    const response = await api.post(`/${endpoint}/`, data);
    return response.data;
  } catch (error: unknown) {
    console.error(`Error creating ${endpoint}:`, error);
    throw error;
  }
};

// Clients API
export const ClientsAPI = {
  getAll: async (): Promise<Client[]> => {
    try {
      debugAPI.logRequest('/clients/', 'GET');
      const response = await api.get('/clients/');
      
      // Ensure response.data is an array
      const clients = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/clients/', { ...response, data: clients });
      return clients;
    } catch (error) {
      debugAPI.logError('/clients/', error);
      throw error;
    }
  },
  
  get: (id: number): Promise<Client> => fetchData(`clients/${id}`),
  create: (data: Client): Promise<Client> => createData('clients', data),
  update: (id: number, data: Client): Promise<Client> => updateData('clients', id, data),
  delete: (id: number): Promise<boolean> => deleteData('clients', id),
};

// Zones API
export const ZonesAPI = {
  getAll: async (): Promise<Zone[]> => {
    try {
      debugAPI.logRequest('/zones/', 'GET');
      const response = await api.get('/zones/');
      
      // Ensure response.data is an array
      const zones = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/zones/', { ...response, data: zones });
      return zones;
    } catch (error) {
      debugAPI.logError('/zones/', error);
      throw error;
    }
  },
  
  get: async (id: number): Promise<Zone> => {
    try {
      debugAPI.logRequest(`/zones/${id}/`, 'GET');
      const response = await api.get(`/zones/${id}/`);
      debugAPI.logResponse(`/zones/${id}/`, response.data);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/zones/${id}/`, error);
      throw error;
    }
  },
  
  create: (data: Zone): Promise<Zone> => createData('zones', data),
  update: (id: number, data: Zone): Promise<Zone> => updateData('zones', id, data),
  delete: (id: number): Promise<boolean> => deleteData('zones', id),
};

// ProductCategories API
export const ProductCategoriesAPI = {
  getAll: async (): Promise<ProductCategory[]> => {
    try {
      debugAPI.logRequest('/product-categories/', 'GET');
      const response = await api.get('/product-categories/');
      
      // Ensure response.data is an array
      const categories = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/product-categories/', { ...response, data: categories });
      return categories;
    } catch (error) {
      debugAPI.logError('/product-categories/', error);
      throw error;
    }
  },
  
  get: (id: number): Promise<ProductCategory> => fetchData(`product-categories/${id}`),
  create: (data: ProductCategory): Promise<ProductCategory> => createData('product-categories', data),
  update: (id: number, data: ProductCategory): Promise<ProductCategory> => updateData('product-categories', id, data),
  delete: (id: number): Promise<boolean> => deleteData('product-categories', id),
};

// Units of Measure API
export const UnitsOfMeasureAPI = {
  getAll: async (): Promise<UnitOfMeasure[]> => {
    try {
      debugAPI.logRequest('/units-of-measure/', 'GET');
      const response = await api.get('/units-of-measure/');
      
      // Ensure response.data is an array
      const units = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/units-of-measure/', { ...response, data: units });
      return units;
    } catch (error) {
      debugAPI.logError('/units-of-measure/', error);
      throw error;
    }
  },
  
  get: (id: number): Promise<UnitOfMeasure> => fetchData(`units-of-measure/${id}`),
  create: (data: UnitOfMeasure): Promise<UnitOfMeasure> => createData('units-of-measure', data),
  update: (id: number, data: UnitOfMeasure): Promise<UnitOfMeasure> => updateData('units-of-measure', id, data),
  delete: (id: number): Promise<boolean> => deleteData('units-of-measure', id),
};

// Products API
export const ProductsAPI = {
  getAll: async (): Promise<Product[]> => {
    try {
      debugAPI.logRequest('/products/', 'GET');
      const response = await api.get('/products/');
      
      // Ensure response.data is an array
      const products = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/products/', { ...response, data: products });
      return products;
    } catch (error) {
      debugAPI.logError('/products/', error);
      throw error;
    }
  },
  
  get: (id: number): Promise<Product> => fetchData(`products/${id}`),
  create: (data: Product): Promise<Product> => createData('products', data),
  update: (id: number, data: Product): Promise<Product> => updateData('products', id, data),
  delete: (id: number): Promise<boolean> => deleteData('products', id),
};

// Suppliers API
export const SuppliersAPI = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      debugAPI.logRequest('/suppliers/', 'GET');
      const response = await api.get('/suppliers/');
      
      // Ensure response.data is an array
      const suppliers = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/suppliers/', { ...response, data: suppliers });
      return suppliers;
    } catch (error) {
      debugAPI.logError('/suppliers/', error);
      throw error;
    }
  },
  
  get: (id: number): Promise<Supplier> => fetchData(`suppliers/${id}`),
  create: (data: Supplier): Promise<Supplier> => createData('suppliers', data),
  update: (id: number, data: Supplier): Promise<Supplier> => updateData('suppliers', id, data),
  delete: (id: number): Promise<boolean> => deleteData('suppliers', id),
};

// InventoryAPI
export const InventoryAPI = {
  getStocks: async (): Promise<Stock[]> => {
    try {
      debugAPI.logRequest('/stocks/', 'GET');
      const response = await api.get('/stocks/');
      
      // Ensure response.data is an array
      const stock = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/stocks/', { ...response, data: stock });
      return stock;
    } catch (error) {
      debugAPI.logError('/stocks/', error);
      throw error;
    }
  },
  
  getStockByZone: async (zoneId: number): Promise<Stock[]> => {
    try {
      debugAPI.logRequest(`/stocks/by_zone/${zoneId}/`, 'GET');
      const response = await api.get(`/stocks/by_zone/${zoneId}/`);
      
      const stock = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse(`/stocks/by_zone/${zoneId}/`, { ...response, data: stock });
      return stock;
    } catch (error) {
      debugAPI.logError(`/stocks/by_zone/${zoneId}/`, error);
      throw error;
    }
  },
    getStockCards: async (): Promise<StockMovement[]> => {
    try {
      debugAPI.logRequest('/stock-cards/', 'GET');
      const response = await api.get('/stock-cards/');
      
      const movements = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/stock-cards/', { ...response, data: movements });
      return movements;
    } catch (error) {
      debugAPI.logError('/stock-cards/', error);
      throw error;
    }
  },
    createStockSupply: async (data: CreateStockSupply): Promise<StockSupply> => {
    try {
      debugAPI.logRequest('/stock-supplies/', 'POST', data);
      const response = await api.post('/stock-supplies/', data);
      debugAPI.logResponse('/stock-supplies/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/stock-supplies/', error);
      throw error;
    }
  },
  
  getStockSupplies: async (): Promise<StockSupply[]> => {
    try {
      debugAPI.logRequest('/stock-supplies/', 'GET');
      const response = await api.get('/stock-supplies/');
      
      const supplies = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/stock-supplies/', { ...response, data: supplies });
      return supplies;
    } catch (error) {
      debugAPI.logError('/stock-supplies/', error);
      throw error;
    }
  },
  
  getStockSupply: async (id: number): Promise<StockSupply> => {
    try {
      debugAPI.logRequest(`/stock-supplies/${id}/`, 'GET');
      const response = await api.get(`/stock-supplies/${id}/`);
      debugAPI.logResponse(`/stock-supplies/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/stock-supplies/${id}/`, error);
      throw error;
    }
  },
  
  updateStockSupply: async (id: number, data: Partial<StockSupply>): Promise<StockSupply> => {
    try {
      debugAPI.logRequest(`/stock-supplies/${id}/`, 'PUT', data);
      const response = await api.put(`/stock-supplies/${id}/`, data);
      debugAPI.logResponse(`/stock-supplies/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/stock-supplies/${id}/`, error);
      throw error;
    }
  },
    createStockTransfer: async (data: CreateStockTransfer): Promise<StockTransfer> => {
    try {
      debugAPI.logRequest('/stock-transfers/', 'POST', data);
      const response = await api.post('/stock-transfers/', data);
      debugAPI.logResponse('/stock-transfers/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/stock-transfers/', error);
      throw error;
    }
  },
  
  getStockTransfers: async (): Promise<StockTransfer[]> => {
    try {
      debugAPI.logRequest('/stock-transfers/', 'GET');
      const response = await api.get('/stock-transfers/');
      
      const transfers = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/stock-transfers/', { ...response, data: transfers });
      return transfers;
    } catch (error) {
      debugAPI.logError('/stock-transfers/', error);
      throw error;
    }
  },
  
  getStockTransfer: async (id: number): Promise<StockTransfer> => {
    try {
      debugAPI.logRequest(`/stock-transfers/${id}/`, 'GET');
      const response = await api.get(`/stock-transfers/${id}/`);
      debugAPI.logResponse(`/stock-transfers/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/stock-transfers/${id}/`, error);
      throw error;
    }
  },
  
  updateStockTransfer: async (id: number, data: Partial<StockTransfer>): Promise<StockTransfer> => {
    try {
      debugAPI.logRequest(`/stock-transfers/${id}/`, 'PUT', data);
      const response = await api.put(`/stock-transfers/${id}/`, data);
      debugAPI.logResponse(`/stock-transfers/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/stock-transfers/${id}/`, error);
      throw error;
    }
  },

  createInventory: async (data: CreateInventory): Promise<Inventory> => {
    try {
      debugAPI.logRequest('/inventories/', 'POST', data);
      const response = await api.post('/inventories/', data);
      debugAPI.logResponse('/inventories/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/inventories/', error);
      throw error;
    }
  },

  getInventories: async (): Promise<Inventory[]> => {
    try {
      debugAPI.logRequest('/inventories/', 'GET');
      const response = await api.get('/inventories/');
      
      const inventories = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/inventories/', { ...response, data: inventories });
      return inventories;
    } catch (error) {
      debugAPI.logError('/inventories/', error);
      throw error;
    }
  },

  getInventory: async (id: number): Promise<Inventory> => {
    try {
      debugAPI.logRequest(`/inventories/${id}/`, 'GET');
      const response = await api.get(`/inventories/${id}/`);
      debugAPI.logResponse(`/inventories/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/inventories/${id}/`, error);
      throw error;
    }
  },

  updateInventory: async (id: number, data: UpdateInventory): Promise<Inventory> => {
    try {
      debugAPI.logRequest(`/inventories/${id}/`, 'PUT', data);
      const response = await api.put(`/inventories/${id}/`, data);
      debugAPI.logResponse(`/inventories/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/inventories/${id}/`, error);
      throw error;
    }
  },

  deleteSupply: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/stock-supplies/${id}/`, 'DELETE');
      await api.delete(`/stock-supplies/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/stock-supplies/${id}/`, error);
      throw error;
    }
  },

  deleteTransfer: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/stock-transfers/${id}/`, 'DELETE');
      await api.delete(`/stock-transfers/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/stock-transfers/${id}/`, error);
      throw error;
    }
  },

  deleteInventory: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/inventories/${id}/`, 'DELETE');
      await api.delete(`/inventories/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/inventories/${id}/`, error);
      throw error;
    }
  },
  
  checkStockAvailability: async (productId: number, zoneId: number, quantity: number): Promise<{available: boolean, stock: number}> => {
    try {
      debugAPI.logRequest(`/stocks/check_availability/?product=${productId}&zone=${zoneId}&quantity=${quantity}`, 'GET');
      const response = await api.get(`/stocks/check_availability/?product=${productId}&zone=${zoneId}&quantity=${quantity}`);
      debugAPI.logResponse('/stocks/check_availability/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/stocks/check_availability/', error);
      throw error;
    }
  }
};

// Sales API
export const SalesAPI = {
  getAll: async (): Promise<Sale[]> => {
    try {
      debugAPI.logRequest('/sales/', 'GET');
      const response = await api.get('/sales/');
      
      // Ensure response.data is an array
      const sales = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/sales/', { ...response, data: sales });
      return sales;
    } catch (error) {
      debugAPI.logError('/sales/', error);
      throw error;
    }
  },
  
  get: async (id: number): Promise<Sale> => {
    try {
      debugAPI.logRequest(`/sales/${id}/`, 'GET');
      const response = await api.get(`/sales/${id}/`);
      debugAPI.logResponse(`/sales/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/sales/${id}/`, error);
      throw error;
    }
  },
  
  create: async (sale: Sale): Promise<Sale> => {
    try {
      debugAPI.logRequest('/sales/', 'POST', sale);
      const response = await api.post('/sales/', sale);
      debugAPI.logResponse('/sales/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/sales/', error);
      throw error;
    }
  },
  
  update: async (id: number, sale: Sale): Promise<Sale> => {
    try {
      debugAPI.logRequest(`/sales/${id}/`, 'PUT', sale);
      const response = await api.put(`/sales/${id}/`, sale);
      debugAPI.logResponse(`/sales/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/sales/${id}/`, error);
      throw error;
    }
  },
  
  // Add a method for partial updates (e.g., just updating the status)
  updatePartial: async (id: number, partialData: Partial<Sale>): Promise<Sale> => {
    try {
      debugAPI.logRequest(`/sales/${id}/`, 'PATCH', partialData);
      const response = await api.patch(`/sales/${id}/`, partialData);
      debugAPI.logResponse(`/sales/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/sales/${id}/`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<SaleDeletionResponse> => {
    try {
      debugAPI.logRequest(`/sales/${id}/`, 'DELETE');
      const response = await api.delete(`/sales/${id}/`);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/sales/${id}/`, error);
      throw error;
    }
  },

  canDelete: async (id: number): Promise<SaleCanDeleteResponse> => {
    try {
      debugAPI.logRequest(`/sales/${id}/can_delete/`, 'GET');
      const response = await api.get(`/sales/${id}/can_delete/`);
      debugAPI.logResponse(`/sales/${id}/can_delete/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/sales/${id}/can_delete/`, error);
      throw error;
    }
  },
  
  // Fetch sales with outstanding payments for a specific client
  getOutstandingSalesByClient: async (clientId: number): Promise<OutstandingSale[]> => {
    try {
      debugAPI.logRequest(`/sales/?client=${clientId}&payment_status=unpaid,partially_paid`, 'GET');
      const response = await api.get(`/sales/?client=${clientId}&payment_status=unpaid,partially_paid`);
      
      // Get the sales
      const sales = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      // Fetch payment information for each sale to determine the actual balance
      const outstandingSales: OutstandingSale[] = await Promise.all(sales.map(async (sale) => {
        // Get all payments (cash receipts) for this sale
        const payments = await TreasuryAPI.getCashReceiptsBySale(sale.id);
        
        // Calculate the total amount paid
        const paidAmount = payments.reduce((sum, receipt) => sum + receipt.amount, 0);
        
        // Calculate the remaining balance
        const balance = sale.total_amount - paidAmount;
        
        return {
          id: sale.id,
          reference: sale.reference,
          date: sale.date,
          total_amount: sale.total_amount,
          paid_amount: paidAmount,
          balance: balance,
          payment_status: sale.payment_status
        };
      }));
      
      debugAPI.logResponse(`/sales/outstanding/${clientId}`, { data: outstandingSales });
      return outstandingSales;
    } catch (error) {
      debugAPI.logError(`/sales/outstanding/${clientId}`, error);
      throw error;
    }
  },
  payFromAccount: async (saleId: number, paymentData: { amount: number, description?: string }): Promise<AccountPaymentResponse> => {
    try {
      debugAPI.logRequest(`/sales/${saleId}/pay_from_account/`, 'POST', paymentData);
      const response = await api.post(`/sales/${saleId}/pay_from_account/`, paymentData);
      debugAPI.logResponse(`/sales/${saleId}/pay_from_account/`, response);
        // If payment results in fully paid status and the sale is in payment_pending or confirmed status,
      // automatically update the sale status to 'paid'
      if (response.data.sale?.payment_status === 'paid') {
        const saleResponse = await api.get(`/sales/${saleId}/`);
        if (saleResponse.data.status === 'payment_pending' || saleResponse.data.status === 'confirmed') {
          await api.patch(`/sales/${saleId}/`, { status: 'paid' });
          // Update the response data with the new status
          response.data.sale.status = 'paid';
        }
      }
      
      return response.data;
    } catch (error) {
      debugAPI.logError(`/sales/${saleId}/pay_from_account/`, error);
      throw error;
    }
  },
};

// Invoices API
export const InvoicesAPI = {
  getAll: async (): Promise<Invoice[]> => {
    try {
      debugAPI.logRequest('/invoices/', 'GET');
      const response = await api.get('/invoices/');
      
      // Ensure response.data is an array
      const invoices = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/invoices/', { ...response, data: invoices });
      return invoices;
    } catch (error) {
      debugAPI.logError('/invoices/', error);
      throw error;
    }
  },
  
  get: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}/`);
    return response.data;
  },
  
  create: async (invoice: Invoice): Promise<Invoice> => {
    const response = await api.post('/invoices/', invoice);
    return response.data;
  },
  
  update: async (id: number, invoice: Invoice): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}/`, invoice);
    return response.data;
  },
  
  delete: async (id: number): Promise<boolean> => {
    await api.delete(`/invoices/${id}/`);
    return true;
  }
};

// Quotes API
export const QuotesAPI = {
  getAll: async (): Promise<Quote[]> => {
    try {
      debugAPI.logRequest('/quotes/', 'GET');
      const response = await api.get('/quotes/');
      
      // Ensure response.data is an array
      const quotes = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/quotes/', { ...response, data: quotes });
      return quotes;
    } catch (error) {
      debugAPI.logError('/quotes/', error);
      throw error;
    }
  },
  
  get: async (id: number): Promise<Quote> => {
    const response = await api.get(`/quotes/${id}/`);
    return response.data;
  },
  
  create: async (quote: Quote): Promise<Quote> => {
    const response = await api.post('/quotes/', quote);
    return response.data;
  },
  
  update: async (id: number, quote: Quote): Promise<Quote> => {
    const response = await api.put(`/quotes/${id}/`, quote);
    return response.data;
  },
  
  delete: async (id: number): Promise<boolean> => {
    await api.delete(`/quotes/${id}/`);
    return true;
  },
  
  convertToSale: async (id: number, zone?: number): Promise<Sale> => {
    const response = await api.post(`/quotes/${id}/convert_to_sale/`, { zone });
    return response.data;
  }
};

// User API
export const UserAPI = {
  getUsers: async (): Promise<User[]> => {
    try {
      debugAPI.logRequest('/users/', 'GET');
      const response = await api.get('/users/');
      
      // Ensure response.data is an array
      const users = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/users/', { ...response, data: users });
      return users;
    } catch (error) {
      debugAPI.logError('/users/', error);
      throw error;
    }
  },
  
  getUser: async (id: number): Promise<User> => {
    try {
      debugAPI.logRequest(`/users/${id}/`, 'GET');
      const response = await api.get(`/users/${id}/`);
      debugAPI.logResponse(`/users/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/users/${id}/`, error);
      throw error;
    }
  },
  
  createUser: async (userData: UserCreateRequest): Promise<User> => {
    try {
      debugAPI.logRequest('/users/', 'POST', userData);
      const response = await api.post('/users/', userData);
      debugAPI.logResponse('/users/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/users/', error);
      throw error;
    }
  },
  
  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    try {
      debugAPI.logRequest(`/users/${id}/`, 'PUT', userData);
      const response = await api.put(`/users/${id}/`, userData);
      debugAPI.logResponse(`/users/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/users/${id}/`, error);
      throw error;
    }
  },
  
  deleteUser: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/users/${id}/`, 'DELETE');
      await api.delete(`/users/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/users/${id}/`, error);
      throw error;
    }
  },
  
  getCurrentUser: async (): Promise<User> => {
    try {
      debugAPI.logRequest('/users/me/', 'GET');
      const response = await api.get('/users/me/');
      debugAPI.logResponse('/users/me/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/users/me/', error);
      throw error;
    }
  }
};

// Group API
export const GroupAPI = {
  getGroups: async (): Promise<Group[]> => {
    try {
      debugAPI.logRequest('/groups/', 'GET');
      const response = await api.get('/groups/');
      
      // Ensure response.data is an array
      const groups = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/groups/', { ...response, data: groups });
      return groups;
    } catch (error) {
      debugAPI.logError('/groups/', error);
      throw error;
    }
  },
  
  getGroup: async (id: number): Promise<Group> => {
    try {
      debugAPI.logRequest(`/groups/${id}/`, 'GET');
      const response = await api.get(`/groups/${id}/`);
      debugAPI.logResponse(`/groups/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/groups/${id}/`, error);
      throw error;
    }
  },
  
  createGroup: async (groupData: Group): Promise<Group> => {
    try {
      debugAPI.logRequest('/groups/', 'POST', groupData);
      const response = await api.post('/groups/', groupData);
      debugAPI.logResponse('/groups/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/groups/', error);
      throw error;
    }
  },
  
  updateGroup: async (id: number, groupData: Group): Promise<Group> => {
    try {
      debugAPI.logRequest(`/groups/${id}/`, 'PUT', groupData);
      const response = await api.put(`/groups/${id}/`, groupData);
      debugAPI.logResponse(`/groups/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/groups/${id}/`, error);
      throw error;
    }
  },
  
  deleteGroup: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/groups/${id}/`, 'DELETE');
      await api.delete(`/groups/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/groups/${id}/`, error);
      throw error;
    }
  }
};

// Permission API
export const PermissionAPI = {
  getPermissions: async () => {
    try {
      debugAPI.logRequest('/permissions/', 'GET');
      const response = await api.get('/permissions/');
      
      // Ensure response.data is an array
      const permissions = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/permissions/', { ...response, data: permissions });
      return permissions;
    } catch (error) {
      debugAPI.logError('/permissions/', error);
      throw error;
    }
  },
  
  getCategorizedPermissions: async () => {
    try {
      debugAPI.logRequest('/permissions/categorized/', 'GET');
      const response = await api.get('/permissions/categorized/');
      debugAPI.logResponse('/permissions/categorized/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/permissions/categorized/', error);
      throw error;
    }
  }
};

// Production API
export const ProductionAPI = {
  getAll: async (): Promise<Production[]> => {
    try {
      debugAPI.logRequest('/productions/', 'GET');
      const response = await api.get('/productions/');
      
      // Ensure response.data is an array
      const productions = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/productions/', { ...response, data: productions });
      return productions;
    } catch (error) {
      debugAPI.logError('/productions/', error);
      throw error;
    }
  },
  
  get: async (id: number): Promise<Production> => {
    try {
      debugAPI.logRequest(`/productions/${id}/`, 'GET');
      const response = await api.get(`/productions/${id}/`);
      debugAPI.logResponse(`/productions/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/productions/${id}/`, error);
      throw error;
    }
  },
  
  create: async (data: Production): Promise<Production> => {
    try {
      debugAPI.logRequest('/productions/', 'POST', data);
      const response = await api.post('/productions/', data);
      debugAPI.logResponse('/productions/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/productions/', error);
      throw error;
    }
  },
  
  update: async (id: number, data: Production): Promise<Production> => {
    try {
      debugAPI.logRequest(`/productions/${id}/`, 'PUT', data);
      const response = await api.put(`/productions/${id}/`, data);
      debugAPI.logResponse(`/productions/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/productions/${id}/`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/productions/${id}/`, 'DELETE');
      await api.delete(`/productions/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/productions/${id}/`, error);
      throw error;
    }
  }
};

// Settings API (for all parameter types)
export const SettingsAPI = {
  getSettings: async (endpoint: string) => {
    try {
      debugAPI.logRequest(`/${endpoint}/`, 'GET');
      const response = await api.get(`/${endpoint}/`);
      
      // Ensure response.data is an array
      const data = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse(`/${endpoint}/`, { ...response, data });
      return data;
    } catch (error) {
      debugAPI.logError(`/${endpoint}/`, error);
      throw error;
    }
  },
    createSetting: async (endpoint: string, data: unknown) => {
    try {
      debugAPI.logRequest(`/${endpoint}/`, 'POST', data);
      const response = await api.post(`/${endpoint}/`, data);
      debugAPI.logResponse(`/${endpoint}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/${endpoint}/`, error);
      throw error;
    }
  },
  
  updateSetting: async (endpoint: string, id: number, data: unknown) => {
    try {
      debugAPI.logRequest(`/${endpoint}/${id}/`, 'PUT', data);
      const response = await api.put(`/${endpoint}/${id}/`, data);
      debugAPI.logResponse(`/${endpoint}/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/${endpoint}/${id}/`, error);
      throw error;
    }
  },
  
  deleteSetting: async (endpoint: string, id: number) => {
    try {
      debugAPI.logRequest(`/${endpoint}/${id}/`, 'DELETE');
      await api.delete(`/${endpoint}/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/${endpoint}/${id}/`, error);
      throw error;
    }
  },
};

// Define specialized API for Currency
export const CurrencyAPI = {
  getAll: async () => {
    try {
      debugAPI.logRequest('/currencies/', 'GET');
      const response = await api.get('/currencies/');
      
      const currencies = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/currencies/', { ...response, data: currencies });
      return currencies;
    } catch (error) {
      debugAPI.logError('/currencies/', error);
      throw error;
    }
  },
  
  get: async (id: number) => {
    try {
      debugAPI.logRequest(`/currencies/${id}/`, 'GET');
      const response = await api.get(`/currencies/${id}/`);
      debugAPI.logResponse(`/currencies/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/currencies/${id}/`, error);
      throw error;
    }
  },
  
  create: async (data: Currency) => {
    try {
      debugAPI.logRequest('/currencies/', 'POST', data);
      const response = await api.post('/currencies/', data);
      debugAPI.logResponse('/currencies/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/currencies/', error);
      throw error;
    }
  },
  
  update: async (id: number, data: Currency) => {
    try {
      debugAPI.logRequest(`/currencies/${id}/`, 'PUT', data);
      const response = await api.put(`/currencies/${id}/`, data);
      debugAPI.logResponse(`/currencies/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/currencies/${id}/`, error);
      throw error;
    }
  },
  
  delete: async (id: number) => {
    try {
      debugAPI.logRequest(`/currencies/${id}/`, 'DELETE');
      await api.delete(`/currencies/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/currencies/${id}/`, error);
      throw error;
    }
  },
};

// Dedicated Accounts API
export const AccountsAPI = {
  getAll: async (): Promise<Account[]> => {
    try {
      debugAPI.logRequest('/accounts/', 'GET');
      const response = await api.get('/accounts/');
      
      const accounts = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/accounts/', { ...response, data: accounts });
      return accounts;
    } catch (error) {
      debugAPI.logError('/accounts/', error);
      throw error;
    }
  },
  
  get: async (id: number): Promise<Account> => {
    try {
      debugAPI.logRequest(`/accounts/${id}/`, 'GET');
      const response = await api.get(`/accounts/${id}/`);
      debugAPI.logResponse(`/accounts/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/accounts/${id}/`, error);
      throw error;
    }
  },
  
  create: async (data: Account): Promise<Account> => {
    try {
      debugAPI.logRequest('/accounts/', 'POST', data);
      const response = await api.post('/accounts/', data);
      debugAPI.logResponse('/accounts/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/accounts/', error);
      throw error;
    }
  },
  
  update: async (id: number, data: Account): Promise<Account> => {
    try {
      debugAPI.logRequest(`/accounts/${id}/`, 'PUT', data);
      const response = await api.put(`/accounts/${id}/`, data);
      debugAPI.logResponse(`/accounts/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/accounts/${id}/`, error);
      throw error;
    }
  },
  
  delete: async (id: number): Promise<boolean> => {
    try {
      debugAPI.logRequest(`/accounts/${id}/`, 'DELETE');
      await api.delete(`/accounts/${id}/`);
      return true;
    } catch (error) {
      debugAPI.logError(`/accounts/${id}/`, error);
      throw error;
    }
  },
  
  getByType: async (type: string): Promise<Account[]> => {
    try {
      debugAPI.logRequest(`/accounts/by_type/?type=${type}`, 'GET');
      const response = await api.get(`/accounts/by_type/?type=${type}`);
      
      const accounts = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse(`/accounts/by_type/?type=${type}`, { ...response, data: accounts });
      return accounts;
    } catch (error) {
      debugAPI.logError(`/accounts/by_type/?type=${type}`, error);
      throw error;
    }
  }
};

// Treasury API for financial operations
export const TreasuryAPI = {
  // Client Payments
  getClientPayments: async (): Promise<ClientPayment[]> => {
    try {
      debugAPI.logRequest('/client-payments/', 'GET');
      const response = await api.get('/client-payments/');
      
      const payments = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/client-payments/', { ...response, data: payments });
      return payments;
    } catch (error) {
      debugAPI.logError('/client-payments/', error);
      throw error;
    }
  },
  
  createClientPayment: async (data: ClientPayment): Promise<ClientPayment> => {
    try {
      debugAPI.logRequest('/client-payments/', 'POST', data);
      const response = await api.post('/client-payments/', data);
      debugAPI.logResponse('/client-payments/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/client-payments/', error);
      throw error;
    }
  },
  
  // Supplier Payments
  getSupplierPayments: async (): Promise<SupplierPayment[]> => {
    try {
      debugAPI.logRequest('/supplier-payments/', 'GET');
      const response = await api.get('/supplier-payments/');
      
      const payments = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/supplier-payments/', { ...response, data: payments });
      return payments;
    } catch (error) {
      debugAPI.logError('/supplier-payments/', error);
      throw error;
    }
  },
  
  createSupplierPayment: async (data: SupplierPayment): Promise<SupplierPayment> => {
    try {
      debugAPI.logRequest('/supplier-payments/', 'POST', data);
      const response = await api.post('/supplier-payments/', data);
      debugAPI.logResponse('/supplier-payments/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/supplier-payments/', error);
      throw error;
    }
  },
  
  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    try {
      debugAPI.logRequest('/expenses/', 'GET');
      const response = await api.get('/expenses/');
      
      const expenses = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/expenses/', { ...response, data: expenses });
      return expenses;
    } catch (error) {
      debugAPI.logError('/expenses/', error);
      throw error;
    }
  },
  
  createExpense: async (data: Expense): Promise<Expense> => {
    try {
      debugAPI.logRequest('/expenses/', 'POST', data);
      const response = await api.post('/expenses/', data);
      debugAPI.logResponse('/expenses/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/expenses/', error);
      throw error;
    }
  },
  
  // Cash Receipts
  getCashReceipts: async (): Promise<CashReceipt[]> => {
    try {
      debugAPI.logRequest('/cash-receipts/', 'GET');
      const response = await api.get('/cash-receipts/');
      
      const receipts = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/cash-receipts/', { ...response, data: receipts });
      return receipts;
    } catch (error) {
      debugAPI.logError('/cash-receipts/', error);
      throw error;
    }
  },
  
  getCashReceiptsBySale: async (saleId: number): Promise<CashReceipt[]> => {
    try {
      debugAPI.logRequest(`/cash-receipts/?sale=${saleId}`, 'GET');
      const response = await api.get(`/cash-receipts/?sale=${saleId}`);
      const receipts = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      debugAPI.logResponse(`/cash-receipts/?sale=${saleId}`, response);
      return receipts;
    } catch (error) {
      debugAPI.logError(`/cash-receipts/?sale=${saleId}`, error);
      throw error;
    }
  },
  
  createCashReceipt: async (data: CashReceipt): Promise<CashReceipt> => {
    try {
      debugAPI.logRequest('/cash-receipts/', 'POST', data);
      const response = await api.post('/cash-receipts/', data);
      debugAPI.logResponse('/cash-receipts/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/cash-receipts/', error);
      throw error;
    }
  },
  
  createCashReceiptFromSale: async (saleId: number, data: {
    account_id: number;
    amount: number;
    payment_method_id: number;
    date: string;
  }): Promise<CashReceipt> => {
    try {
      debugAPI.logRequest('/cash-receipts/from_sale/', 'POST', { sale_id: saleId, ...data });
      const response = await api.post('/cash-receipts/from_sale/', { 
        sale_id: saleId, 
        ...data 
      });
      debugAPI.logResponse('/cash-receipts/from_sale/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/cash-receipts/from_sale/', error);
      throw error;
    }
  },
    // Cash Payments
  getCashPayments: async (): Promise<unknown[]> => {
    try {
      debugAPI.logRequest('/cash-payments/', 'GET');
      const response = await api.get('/cash-payments/');
      
      const payments = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/cash-payments/', { ...response, data: payments });
      return payments;
    } catch (error) {
      debugAPI.logError('/cash-payments/', error);
      throw error;
    }
  },
  
  createCashPayment: async (data: unknown): Promise<unknown> => {
    try {
      debugAPI.logRequest('/cash-payments/', 'POST', data);
      const response = await api.post('/cash-payments/', data);
      debugAPI.logResponse('/cash-payments/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/cash-payments/', error);
      throw error;
    }
  },
  
  // Account Transfers
  getAccountTransfers: async (): Promise<AccountTransfer[]> => {
    try {
      debugAPI.logRequest('/account-transfers/', 'GET');
      const response = await api.get('/account-transfers/');
      
      const transfers = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/account-transfers/', { ...response, data: transfers });
      return transfers;
    } catch (error) {
      debugAPI.logError('/account-transfers/', error);
      throw error;
    }
  },
  
  createAccountTransfer: async (data: AccountTransfer): Promise<AccountTransfer> => {
    try {
      debugAPI.logRequest('/account-transfers/', 'POST', data);
      const response = await api.post('/account-transfers/', data);
      debugAPI.logResponse('/account-transfers/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/account-transfers/', error);
      throw error;
    }
  },
  
  // Accounts
  getAccounts: async (): Promise<Account[]> => {
    try {
      debugAPI.logRequest('/accounts/', 'GET');
      const response = await api.get('/accounts/');
      
      const accounts = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse('/accounts/', { ...response, data: accounts });
      return accounts;
    } catch (error) {
      debugAPI.logError('/accounts/', error);
      throw error;
    }
  },
  
  getAccountById: async (id: number): Promise<Account> => {
    try {
      debugAPI.logRequest(`/accounts/${id}/`, 'GET');
      const response = await api.get(`/accounts/${id}/`);
      debugAPI.logResponse(`/accounts/${id}/`, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/accounts/${id}/`, error);
      throw error;
    }
  },
  
  getAccountsByType: async (type: string): Promise<Account[]> => {
    try {
      debugAPI.logRequest(`/accounts/by_type/?type=${type}`, 'GET');
      const response = await api.get(`/accounts/by_type/?type=${type}`);
      
      const accounts = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse(`/accounts/by_type/?type=${type}`, { ...response, data: accounts });
      return accounts;
    } catch (error) {
      debugAPI.logError(`/accounts/by_type/?type=${type}`, error);
      throw error;
    }
  },
    // Client Balance
  getClientBalance: async (clientId: number): Promise<unknown> => {
    try {
      const endpoint = `/account-statements/client_balance/?client_id=${clientId}`;
      debugAPI.logRequest(endpoint, 'GET');
      const response = await api.get(endpoint);
      debugAPI.logResponse(endpoint, response);
      return response.data;
    } catch (error) {
      debugAPI.logError(`/account-statements/client_balance/?client_id=${clientId}`, error);
      throw error;
    }
  },
    // Account Statements
  getAccountStatements: async (accountId?: number): Promise<unknown[]> => {
    try {
      let endpoint = '/account-statements/';
      if (accountId) {
        endpoint += `?account=${accountId}`;
      }
      
      debugAPI.logRequest(endpoint, 'GET');
      const response = await api.get(endpoint);
      
      const statements = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      debugAPI.logResponse(endpoint, { ...response, data: statements });
      return statements;
    } catch (error) {
      debugAPI.logError('/account-statements/', error);
      throw error;
    }
  },
};

// QR Code API 
export const fetchProductQRCode = async (productId: number): Promise<Blob> => {
  try {
    debugAPI.logRequest(`/products/${productId}/qr-code/`, 'GET');
    
    // Use responseType 'blob' to request binary data
    const response = await api.get(`/products/${productId}/qr-code/`, {
      responseType: 'blob'
    });
    
    debugAPI.logResponse(`/products/${productId}/qr-code/`, {
      status: response.status,
      data: 'Blob data (not shown)'
    });
    
    return response.data;
  } catch (error) {
    debugAPI.logError(`/products/${productId}/qr-code/`, error);
    throw error;
  }
};

// Dashboard API
export const DashboardAPI = {
  getStats: async (period = 'year', startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (period === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      
      debugAPI.logRequest(`/dashboard/stats/?${params.toString()}`, 'GET');
      const response = await api.get(`/dashboard/stats/?${params.toString()}`);
      debugAPI.logResponse('/dashboard/stats/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/dashboard/stats/', error);
      throw error;
    }
  },

  getInventoryStats: async (period = 'year', startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (period === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      
      debugAPI.logRequest(`/dashboard/inventory/?${params.toString()}`, 'GET');
      const response = await api.get(`/dashboard/inventory/?${params.toString()}`);
      debugAPI.logResponse('/dashboard/inventory/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/dashboard/inventory/', error);
      throw error;
    }
  },

  getLowStockProducts: async () => {
    try {
      debugAPI.logRequest('/dashboard/low-stock/', 'GET');
      const response = await api.get('/dashboard/low-stock/');
      debugAPI.logResponse('/dashboard/low-stock/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/dashboard/low-stock/', error);
      throw error;
    }
  },

  getRecentSales: async () => {
    try {
      debugAPI.logRequest('/dashboard/recent-sales/', 'GET');
      const response = await api.get('/dashboard/recent-sales/');
      debugAPI.logResponse('/dashboard/recent-sales/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/dashboard/recent-sales/', error);
      throw error;
    }
  },

  getSalesReport: async (period = 'year', startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      
      if (period === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      
      debugAPI.logRequest(`/reports/sales/?${params.toString()}`, 'GET');
      const response = await api.get(`/reports/sales/?${params.toString()}`);
      debugAPI.logResponse('/reports/sales/', response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/reports/sales/', error);
      throw error;
    }
  },

  getClientAccountStatements: async (clientId?: number) => {
    try {
      const endpoint = clientId 
        ? `/account-statements/client_balance/?client_id=${clientId}`
        : '/account-statements/client_balance/';
      
      debugAPI.logRequest(endpoint, 'GET');
      const response = await api.get(endpoint);
      debugAPI.logResponse(endpoint, response);
      return response.data;
    } catch (error) {
      debugAPI.logError('/account-statements/client_balance/', error);
      throw error;
    }
  }
};

// Export the default api instance
export default api;