/**
 * Token Validation Utilities
 * Helper functions to validate JWT tokens client-side
 */

interface DecodedToken {
  exp?: number;
  user_id?: number;
  token_type?: string;
}

/**
 * Decode a JWT token without verification (client-side only)
 * This is used for checking expiration, NOT for security validation
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if a token is expired
 * Returns true if expired, false if still valid
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    // If we can't decode or no expiration, consider it expired
    return true;
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get time until token expires in milliseconds
 * Returns negative number if already expired
 */
export const getTokenTimeToExpire = (token: string): number => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return -1;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeToExpire = decoded.exp - currentTime;
  
  // Convert to milliseconds
  return timeToExpire * 1000;
};

/**
 * Check if token should be refreshed
 * Returns true if token is expiring within the next 2 minutes
 */
export const shouldRefreshToken = (token: string): boolean => {
  const timeToExpire = getTokenTimeToExpire(token);
  
  // Refresh if less than 2 minutes remaining
  return timeToExpire > 0 && timeToExpire < 120000; // 2 minutes in ms
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expiration');
  localStorage.removeItem('user_permissions');
  localStorage.removeItem('user_role');
  localStorage.removeItem('is_admin');
  localStorage.removeItem('user_groups');
  localStorage.removeItem('current_user');
};
