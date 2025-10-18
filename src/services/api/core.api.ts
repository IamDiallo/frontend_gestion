/**
 * Core Domain API
 * Handles: Users, UserProfiles, Zones, Groups, Permissions
 * Base path: /api/core/
 */

import { api } from './config';
import { User, Group, UserCreateRequest } from '../../interfaces/core';
import type { Zone, Permission, CategorizedPermissions, UserProfile } from '../../interfaces/core';

// ============================================================================
// USERS
// ============================================================================

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get('/core/users/');
  return response.data.results || response.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get('/core/users/me/');
  return response.data;
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
// ZONES
// ============================================================================

export const fetchZones = async (): Promise<Zone[]> => {
  const response = await api.get('/core/zones/');
  return response.data.results || response.data;
};

export const createZone = async (data: Partial<Zone>): Promise<Zone> => {
  const response = await api.post('/core/zones/', data);
  return response.data;
};

export const updateZone = async (id: number, data: Partial<Zone>): Promise<Zone> => {
  const response = await api.patch(`/core/zones/${id}/`, data);
  return response.data;
};

export const deleteZone = async (id: number): Promise<void> => {
  await api.delete(`/core/zones/${id}/`);
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
