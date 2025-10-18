/**
 * API Configuration
 * Shared axios instance with authentication interceptors
 */

import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from "react-toastify";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for token refresh
api.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    const tokenExpiration = localStorage.getItem("token_expiration");

    if (token && tokenExpiration) {
      const expirationTime = parseInt(tokenExpiration, 10);
      const currentTime = Date.now();
      const timeToExpire = expirationTime - currentTime;

      // Refresh proactively if expiring within 1 min
      if (timeToExpire < 60000 && timeToExpire > 0) {
        try {
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            const response = await axios.post(`${API_URL}/token/refresh/`, {
              refresh: refreshToken,
            });

            if (response.data?.access) {
              const newAccess = response.data.access;
              localStorage.setItem("access_token", newAccess);

              if (response.data.refresh) {
                localStorage.setItem("refresh_token", response.data.refresh);
              }

              const newExpirationTime = Date.now() + 15 * 60 * 1000;
              localStorage.setItem("token_expiration", newExpirationTime.toString());

              config.headers.Authorization = `Bearer ${newAccess}`;
              return config;
            }
          }
        } catch (error) {
          console.error("Proactive refresh failed:", error);
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token available");

        const response = await axios.post(`${API_URL}/token/refresh/`, { refresh });

        const newAccess = response.data.access;
        localStorage.setItem("access_token", newAccess);

        if (response.data.refresh) {
          localStorage.setItem("refresh_token", response.data.refresh);
        }

        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_expiration");

        toast.error("Your session has expired. Please log in again.", {
          position: "top-center",
          autoClose: 3000,
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 3200);

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance
export { api };

// Debug utilities
export const debugAPI = {
  logRequest: (endpoint: string, method: string, data?: unknown) => {
    console.log(`%cAPI Request: ${method.toUpperCase()} ${endpoint}`, 'background: #ded; color: #080; font-weight: bold');
    if (data) console.log('Request data:', data);
  },
  
  logResponse: (endpoint: string, response: unknown) => {
    console.log(`%cAPI Response from ${endpoint}:`, 'background: #dde; color: #008; font-weight: bold');
    const res = response as AxiosResponse;
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  },

  logError: (endpoint: string, error: unknown) => {
    console.error(`%cAPI Error from ${endpoint}:`, 'background: #edd; color: #800; font-weight: bold', error);
    const err = error as AxiosError;
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
    }
  }
};

