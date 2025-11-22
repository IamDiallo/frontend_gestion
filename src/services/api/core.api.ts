/**
 * Core Domain API
 * Handles: Users, UserProfiles, Zones, Groups, Permissions
 * Base path: /api/core/
 */

import { api } from './config';
import { User, Group, UserCreateRequest } from '../../interfaces/core';
import type { Zone, Permission, CategorizedPermissions, UserProfile } from '../../interfaces/core';
import { getCurrentUser as getCachedCurrentUser } from './auth.api'; // Import cached version

// ============================================================================
// USERS
// ============================================================================

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get('/core/users/');
  return response.data.results || response.data;
};

/**
 * Fetch current user with 5-minute cache
 * This delegates to auth.api.ts getCurrentUser which has caching
 */
export const fetchCurrentUser = async (forceRefresh = false): Promise<User> => {
  return getCachedCurrentUser(forceRefresh);
};

export const fetchUser = async (id: number): Promise<User> => {
  const response = await api.get(`/core/users/${id}/`);
  return response.data;
};

export const createUser = async (userData: UserCreateRequest): Promise<User> => {
  const response = await api.post('/core/users/', userData);
  return response.data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const response = await api.patch(`/core/users/${id}/`, userData);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/core/users/${id}/`);
};

export const changePassword = async (userId: number, data: { old_password: string; new_password: string }) => {
  const response = await api.post(`/core/users/${userId}/change_password/`, data);
  return response.data;
};

// ============================================================================
// USER PROFILES
// ============================================================================

export const fetchUserProfiles = async (): Promise<UserProfile[]> => {
  const response = await api.get('/core/user-profiles/');
  return response.data.results || response.data;
};

export const updateUserProfile = async (id: number, data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.patch(`/core/user-profiles/${id}/`, data);
  return response.data;
};

// ============================================================================
// ZONES (with caching)
// ============================================================================

const ZONES_CACHE_KEY = 'zones_cache';
const ZONES_CACHE_TIME_KEY = 'zones_cache_time';
const ZONES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (zones rarely change)

export const fetchZones = async (forceRefresh = false): Promise<Zone[]> => {
  // Check cache first
  if (!forceRefresh) {
    const cachedData = localStorage.getItem(ZONES_CACHE_KEY);
    const cachedTime = localStorage.getItem(ZONES_CACHE_TIME_KEY);
    
    if (cachedData && cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10);
      if (age < ZONES_CACHE_DURATION) {
        console.log('✅ Using cached zones (fresh for', Math.round((ZONES_CACHE_DURATION - age) / 1000), 'more seconds)');
        return JSON.parse(cachedData);
      }
    }
  }
  
  console.log('🔄 Fetching fresh zones from server...');
  const response = await api.get('/core/zones/');
  const zones = response.data.results || response.data;
  
  // Cache the response
  localStorage.setItem(ZONES_CACHE_KEY, JSON.stringify(zones));
  localStorage.setItem(ZONES_CACHE_TIME_KEY, Date.now().toString());
  
  return zones;
};

export const createZone = async (data: Partial<Zone>): Promise<Zone> => {
  const response = await api.post('/core/zones/', data);
  // Invalidate cache when creating a zone
  localStorage.removeItem(ZONES_CACHE_KEY);
  localStorage.removeItem(ZONES_CACHE_TIME_KEY);
  return response.data;
};

export const updateZone = async (id: number, data: Partial<Zone>): Promise<Zone> => {
  const response = await api.patch(`/core/zones/${id}/`, data);
  // Invalidate cache when updating a zone
  localStorage.removeItem(ZONES_CACHE_KEY);
  localStorage.removeItem(ZONES_CACHE_TIME_KEY);
  return response.data;
};

export const deleteZone = async (id: number): Promise<void> => {
  await api.delete(`/core/zones/${id}/`);
  // Invalidate cache when deleting a zone
  localStorage.removeItem(ZONES_CACHE_KEY);
  localStorage.removeItem(ZONES_CACHE_TIME_KEY);
};

// ============================================================================
// GROUPS (Roles)
// ============================================================================

export const fetchGroups = async (): Promise<Group[]> => {
  const response = await api.get('/core/groups/');
  return response.data.results || response.data;
};

export const createGroup = async (data: { name: string; permissions: number[] }): Promise<Group> => {
  const response = await api.post('/core/groups/', data);
  return response.data;
};

export const updateGroup = async (id: number, data: Partial<Group>): Promise<Group> => {
  const response = await api.patch(`/core/groups/${id}/`, data);
  return response.data;
};

export const deleteGroup = async (id: number): Promise<void> => {
  await api.delete(`/core/groups/${id}/`);
};

// ============================================================================
// PERMISSIONS
// ============================================================================

export const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await api.get('/core/permissions/');
  return response.data.results || response.data;
};

export const fetchCategorizedPermissions = async (): Promise<CategorizedPermissions> => {
  const response = await api.get('/core/permissions/categorized/');
  return response.data;
};
