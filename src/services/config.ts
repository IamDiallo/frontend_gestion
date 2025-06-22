// Define API URL configuration

// Get the API URL from environment variables or use a default
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Other global API configurations can be added here
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Config for dev tools and debugging
export const config = {
  debug: import.meta.env.DEV || false,
  enableLogs: import.meta.env.DEV || false,
};
