/**
 * Custom Hook: useUserManagementData
 * Manages all data fetching and CRUD operations for user management
 */

import { useState, useCallback } from 'react';
import * as CoreAPI from '../services/api/core.api';
import { Zone } from '../interfaces/core';
import { User, Group, UserCreateRequest } from '../interfaces/users';

// Extended Permission type with additional fields needed for UI
export interface ExtendedPermission {
  id: number;
  name: string;
  codename: string;
  content_type: {
    app_label: string;
  };
  full_codename: string;
}

// Categorized permissions structure
export interface PermissionCategoryType {
  name: string;
  app: string;
  model: string;
  permissions: ExtendedPermission[];
}

export interface UserUpdateData {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff?: boolean;
  role: string;
  zone?: number | null;
  is_profile_active?: boolean;
  groups: number[];
  password?: string;
}

interface UseUserManagementDataReturn {
  // State
  users: User[];
  groups: Group[];
  zones: Zone[];
  availablePermissions: PermissionCategoryType[];
  permissionIdMapping: Record<string, number>;
  permissionCodeMapping: Record<number, string>;
  loading: boolean;
  error: string | null;
  
  // Data fetching
  fetchUsers: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  fetchZones: () => Promise<void>;
  fetchAvailablePermissions: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // User operations
  createUser: (userData: UserCreateRequest) => Promise<User>;
  updateUser: (id: number, userData: UserUpdateData) => Promise<User>;
  deleteUser: (id: number) => Promise<void>;
  fetchUserById: (userId: number) => Promise<User | null>;
  
  // Group operations
  createGroup: (groupData: { name: string; permissions: number[] }) => Promise<Group>;
  updateGroup: (id: number, groupData: { name: string; permissions: number[] }) => Promise<Group>;
  deleteGroup: (id: number) => Promise<void>;
  
  // Utility
  setError: (error: string | null) => void;
  getGroupName: (groupId: number) => string;
}

export const useUserManagementData = (): UseUserManagementDataReturn => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionCategoryType[]>([]);
  const [permissionIdMapping, setPermissionIdMapping] = useState<Record<string, number>>({});
  const [permissionCodeMapping, setPermissionCodeMapping] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getGroupName = useCallback((groupId: number): string => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Groupe inconnu';
  }, [groups]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CoreAPI.fetchUsers();
      
      // Handle both paginated response with results and direct array response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userData = Array.isArray(response) ? response : (response as { results?: any[] }).results || response;
      
      // Transform Core User types to users.ts User types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedUsers: User[] = (userData as any[]).map((coreUser: any) => {
        // Extract role and zone from profile_data if available
        const role = coreUser.profile_data?.role || '';
        const zone = null; // Will be handled by profile_data
        
        // Convert groups: Core API returns Group[] with Permission[], we need number[]
        let groupIds: number[] = [];
        if (Array.isArray(coreUser.groups)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          groupIds = coreUser.groups.map((g: any) => {
            if (typeof g === 'number') return g;
            return g.id || 0;
          });
        }
        
        // Create user object matching users.ts interface
        const user: User = {
          id: coreUser.id,
          username: coreUser.username,
          email: coreUser.email,
          first_name: coreUser.first_name || '',
          last_name: coreUser.last_name || '',
          is_active: coreUser.is_active,
          is_staff: coreUser.is_staff,
          date_joined: coreUser.date_joined,
          profile_data: coreUser.profile_data ? {
            role: coreUser.profile_data.role,
            is_active: coreUser.is_active,
            zone: null // UserProfile from core doesn't have zone
          } : undefined,
          groups: groupIds,
          role: role,
          zone: zone,
          permissions: coreUser.permissions || []
        };
        
        return user;
      });
      
      setUsers(transformedUsers);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Une erreur est survenue lors du chargement des utilisateurs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserById = useCallback(async (userId: number): Promise<User | null> => {
    try {
      const coreUser = await CoreAPI.fetchUser(userId);
      
      // Transform Core User to users.ts User
      const role = coreUser.profile_data?.role || '';
      let groupIds: number[] = [];
      if (Array.isArray(coreUser.groups)) {
        groupIds = coreUser.groups.map((g) => {
          if (typeof g === 'number') return g;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (g as any).id || 0;
        });
      }
      
      const user: User = {
        id: coreUser.id,
        username: coreUser.username,
        email: coreUser.email,
        first_name: coreUser.first_name || '',
        last_name: coreUser.last_name || '',
        is_active: coreUser.is_active,
        is_staff: coreUser.is_staff,
        date_joined: coreUser.date_joined,
        profile_data: coreUser.profile_data ? {
          role: coreUser.profile_data.role,
          is_active: coreUser.is_active,
          zone: null
        } : undefined,
        groups: groupIds,
        role: role,
        zone: null,
        permissions: coreUser.permissions || []
      };
      
      return user;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      return null;
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const coreGroups = await CoreAPI.fetchGroups();
      
      // Transform Core Groups to users.ts Groups
      const transformedGroups: Group[] = coreGroups.map((coreGroup) => ({
        id: coreGroup.id,
        name: coreGroup.name,
        permissions: coreGroup.permissions.map(p => p.id), // Extract permission IDs
        description: undefined,
        is_active: true
      }));
      
      setGroups(transformedGroups);
      setError(null);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError('Une erreur est survenue lors du chargement des groupes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
  const zonesData = await CoreAPI.fetchZones();
      // Ensure zones have required id and name properties
      const transformedZones = zonesData.map(zone => ({
        ...zone,
        id: zone.id || 0,
        name: zone.name || 'Zone sans nom'
      }));
      setZones(transformedZones);
    } catch (err) {
      console.error('Error loading zones:', err);
      setError('Une erreur est survenue lors du chargement des zones');
    }
  }, []);

  const fetchAvailablePermissions = useCallback(async () => {
    try {
      setAvailablePermissions([]); // Reset permissions before fetching
      
      // Get permissions in a categorized format from backend
      const response = await CoreAPI.fetchCategorizedPermissions();
      
      console.log('Raw permissions response from API:', response);
      
      // Transform the backend response format to our frontend format
      // Backend returns: { app_label: { model_name: [permissions...] } }
      // Frontend expects: [{ name, app, model, permissions: [...] }]
      
      let permissionsArray: PermissionCategoryType[] = [];
      
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        // Transform nested dictionary to array of categories
        const transformed: PermissionCategoryType[] = [];
        
        Object.entries(response).forEach(([appLabel, models]) => {
          if (models && typeof models === 'object') {
            // Cast to unknown first to bypass type checking, then to our expected type
            Object.entries(models as unknown as Record<string, unknown[]>).forEach(([modelName, permissions]) => {
              if (Array.isArray(permissions) && permissions.length > 0) {
                transformed.push({
                  name: `${appLabel} - ${modelName}`,
                  app: appLabel,
                  model: modelName,
                  permissions: permissions.map(perm => {
                    const p = perm as { id: number; name: string; codename: string };
                    return {
                      id: p.id,
                      name: p.name,
                      codename: p.codename,
                      content_type: {
                        app_label: appLabel
                      },
                      full_codename: `${appLabel}.${p.codename}`
                    };
                  })
                });
              }
            });
          }
        });
        
        permissionsArray = transformed;
      } else if (Array.isArray(response)) {
        // Already in correct format
        permissionsArray = response;
      } else if (response && 'results' in response) {
        // Handle paginated response
        permissionsArray = (response as unknown as { results: PermissionCategoryType[] }).results;
      } else if (response && 'data' in response) {
        // Handle wrapped response
        permissionsArray = (response as unknown as { data: PermissionCategoryType[] }).data;
      }
      
      console.log('Transformed permissions array:', permissionsArray);
      
      if (!permissionsArray || permissionsArray.length === 0) {
        setError('Aucune permission n\'est disponible. Veuillez contacter l\'administrateur.');
        return;
      }
      
      // Create mappings between permission IDs and codes
      const idToCode: Record<number, string> = {};
      const codeToId: Record<string, number> = {};

      // Process the permissions to ensure they have full_codename
      const processedPermissions = permissionsArray.map(category => {
        category.permissions.forEach(perm => {
          // Type guard: check if content_type is an object with app_label
          const contentTypeObj = typeof perm.content_type === 'object' ? perm.content_type : null;
          
          const fullCode = perm.full_codename || 
            (contentTypeObj?.app_label && perm.codename ? 
              `${contentTypeObj.app_label}.${perm.codename}` : 
              perm.codename);
          
          if (perm.id) {
            idToCode[perm.id] = fullCode;
            codeToId[fullCode] = perm.id;
          }
        });
        
        return {
          ...category,
          permissions: category.permissions.map(perm => {
            // Type guard: check if content_type is an object with app_label
            const contentTypeObj = typeof perm.content_type === 'object' ? perm.content_type : null;
            
            return {
              ...perm,
              // Ensure full_codename exists - construct it if missing
              full_codename: perm.full_codename || 
                (contentTypeObj?.app_label && perm.codename ? 
                  `${contentTypeObj.app_label}.${perm.codename}` : 
                  perm.codename)
            };
          })
        };
      });
      
      console.log('Final processed permissions:', processedPermissions);
      console.log('Permission mappings - idToCode:', idToCode);
      console.log('Permission mappings - codeToId:', codeToId);
      
      setPermissionIdMapping(codeToId);
      setPermissionCodeMapping(idToCode);
      setAvailablePermissions(processedPermissions);
      setError(null);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Une erreur est survenue lors du chargement des permissions');
      setAvailablePermissions([]);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchGroups(),
        fetchZones(),
        fetchAvailablePermissions()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, fetchGroups, fetchZones, fetchAvailablePermissions]);

  // ============================================================================
  // USER CRUD OPERATIONS
  // ============================================================================

  const createUser = useCallback(async (userData: UserCreateRequest): Promise<User> => {
    try {
      const newCoreUser = await CoreAPI.createUser(userData);
      
      // Transform the new user
      const role = newCoreUser.profile_data?.role || '';
      let groupIds: number[] = [];
      if (Array.isArray(newCoreUser.groups)) {
        groupIds = newCoreUser.groups.map((g) => {
          if (typeof g === 'number') return g;
          return ((g as Record<string, unknown>).id as number) || 0;
        });
      }
      
      const transformedUser: User = {
        id: newCoreUser.id,
        username: newCoreUser.username,
        email: newCoreUser.email,
        first_name: newCoreUser.first_name || '',
        last_name: newCoreUser.last_name || '',
        is_active: newCoreUser.is_active,
        is_staff: newCoreUser.is_staff,
        date_joined: newCoreUser.date_joined,
        profile_data: newCoreUser.profile_data ? {
          role: newCoreUser.profile_data.role,
          is_active: newCoreUser.is_active,
          zone: null
        } : undefined,
        groups: groupIds,
        role: role,
        zone: null,
        permissions: newCoreUser.permissions || []
      };
      
      setUsers(prev => [...prev, transformedUser]);
      setError(null);
      return transformedUser;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (id: number, userData: UserUpdateData): Promise<User> => {
    try {
      const updatedCoreUser = await CoreAPI.updateUser(id, userData);
      
      // Reload user list to get fresh data
      await fetchUsers();
      
      // Transform the updated user
      const role = updatedCoreUser.profile_data?.role || '';
      let groupIds: number[] = [];
      if (Array.isArray(updatedCoreUser.groups)) {
        groupIds = updatedCoreUser.groups.map((g) => {
          if (typeof g === 'number') return g;
          return ((g as Record<string, unknown>).id as number) || 0;
        });
      }
      
      const transformedUser: User = {
        id: updatedCoreUser.id,
        username: updatedCoreUser.username,
        email: updatedCoreUser.email,
        first_name: updatedCoreUser.first_name || '',
        last_name: updatedCoreUser.last_name || '',
        is_active: updatedCoreUser.is_active,
        is_staff: updatedCoreUser.is_staff,
        date_joined: updatedCoreUser.date_joined,
        profile_data: updatedCoreUser.profile_data ? {
          role: updatedCoreUser.profile_data.role,
          is_active: updatedCoreUser.is_active,
          zone: null
        } : undefined,
        groups: groupIds,
        role: role,
        zone: null,
        permissions: updatedCoreUser.permissions || []
      };
      
      setUsers(prev => prev.map(u => u.id === id ? transformedUser : u));
      setError(null);
      return transformedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: number): Promise<void> => {
    try {
  await CoreAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Une erreur est survenue lors de la suppression de l\'utilisateur');
      throw err;
    }
  }, []);

  // ============================================================================
  // GROUP CRUD OPERATIONS
  // ============================================================================

  const createGroup = useCallback(async (groupData: { name: string; permissions: number[] }): Promise<Group> => {
    try {
      const newCoreGroup = await CoreAPI.createGroup(groupData);
      
      // Transform Core Group to users.ts Group
      const transformedGroup: Group = {
        id: newCoreGroup.id,
        name: newCoreGroup.name,
        permissions: newCoreGroup.permissions.map(p => p.id),
        description: undefined,
        is_active: true
      };
      
      setGroups(prev => [...prev, transformedGroup]);
      setError(null);
      return transformedGroup;
    } catch (err) {
      console.error('Error creating group:', err);
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (id: number, groupData: { name: string; permissions: number[] }): Promise<Group> => {
    try {
      // Send the group data as-is to API (it expects number[] for permissions)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedCoreGroup = await CoreAPI.updateGroup(id, groupData as any);
      
      // Transform Core Group to users.ts Group
      const transformedGroup: Group = {
        id: updatedCoreGroup.id,
        name: updatedCoreGroup.name,
        permissions: updatedCoreGroup.permissions.map(p => p.id),
        description: undefined,
        is_active: true
      };
      
      setGroups(prev => prev.map(g => g.id === id ? transformedGroup : g));
      setError(null);
      return transformedGroup;
    } catch (err) {
      console.error('Error updating group:', err);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id: number): Promise<void> => {
    try {
  await CoreAPI.deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting group:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    users,
    groups,
    zones,
    availablePermissions,
    permissionIdMapping,
    permissionCodeMapping,
    loading,
    error,
    
    // Data fetching
    fetchUsers,
    fetchGroups,
    fetchZones,
    fetchAvailablePermissions,
    refreshAllData,
    
    // User operations
    createUser,
    updateUser,
    deleteUser,
    fetchUserById,
    
    // Group operations
    createGroup,
    updateGroup,
    deleteGroup,
    
    // Utility
    setError,
    getGroupName,
  };
};
