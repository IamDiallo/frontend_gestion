import api from './api';

interface LoginResponse {
  access: string;
  refresh: string;
  user?: unknown;
}

export const AuthService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
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
          const userResponse = await api.get('/users/me/');
          
          // Store the current user data in localStorage for sidebar change detection
          localStorage.setItem('current_user', JSON.stringify(userResponse.data));
          
          return {
            ...response.data,
            user: userResponse.data
          };
        } catch (error) {
          console.error('Error fetching user data after login:', error);
          return response.data;
        }
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    // Clear all cached user data when logging out
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('user_role');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('current_user');
  },

  isAuthenticated: () => {
    return localStorage.getItem('access_token') !== null;
  },

  refreshToken: async (refreshToken: string): Promise<string> => {
    try {
      const response = await api.post('/token/refresh/', {
        refresh: refreshToken
      });
      
      if (response.data && response.data.access) {
        const newToken = response.data.access;
        localStorage.setItem('access_token', newToken);
        
        // Update token expiration time (assuming 15 minutes)
        const expiresIn = 15 * 60 * 1000; // 15 minutes in milliseconds
        const expirationTime = new Date().getTime() + expiresIn;
        localStorage.setItem('token_expiration', expirationTime.toString());
        
        return newToken;
      }
      throw new Error('No access token received from refresh endpoint');
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
};

export default AuthService;