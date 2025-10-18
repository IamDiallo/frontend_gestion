/**
 * @deprecated Use AuthAPI from './api/auth.api' instead
 * This file is kept for backward compatibility only
 */

import * as AuthAPI from './api/auth.api';

// Re-export types for backward compatibility
export interface LoginResponse {
  access: string;
  refresh: string;
  user?: unknown;
}

// Re-export AuthService using new AuthAPI
export const AuthService = {
  login: AuthAPI.login,
  logout: AuthAPI.logout,
  isAuthenticated: AuthAPI.isAuthenticated,
  refreshToken: AuthAPI.refreshToken,
  getCurrentUser: AuthAPI.getCurrentUser
};

export default AuthService;
