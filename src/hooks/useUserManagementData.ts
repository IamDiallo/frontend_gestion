/**
 * Custom Hook: useUserManagementData
 * Manages all data fetching and CRUD operations for user management
 */

import { useState, useCallback } from 'react';
import { UserAPI, GroupAPI, PermissionAPI, ZonesAPI } from '../services/api';
import { User, Group, UserCreateRequest, PermissionCategory as PermissionCategoryType } from '../interfaces/users';
import { Zone } from '../interfaces/sales';

// Re-export types for convenience
export type { PermissionCategoryType };

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
      const response = await UserAPI.getUsers();
      
      // Handle both paginated response with results and direct array response
      const userData = Array.isArray(response) ? response : (response as { results?: User[] }).results || response;
      
      // Transform the data to match our component's expected format
      const transformedUsers = (userData as User[]).map((user: User) => ({
        ...user,
        // Extract role and zone from profile_data if available
        role: user.profile_data?.role || user.profile?.role || '',
        zone: user.profile_data?.zone !== undefined ? user.profile_data.zone : user.profile?.zone,
        is_active: user.is_active,
        // Ensure groups is always an array
        groups: Array.isArray(user.groups) ? 
          user.groups.map(g => {
            // If groups are already objects with required Group properties, return them as is
            if (typeof g === 'object' && g !== null && 'id' in g && 'name' in g && 'permissions' in g) return g;
            // If groups are simple objects with id/name, convert them to full Group objects
            if (typeof g === 'object' && g !== null && 'id' in g && 'name' in g) {
              return { ...g, permissions: [] } as Group;
            }
            // If groups are just IDs (numbers), convert them to full Group objects
            const groupId = typeof g === 'number' ? g : Number(g);
            return { 
              id: groupId, 
              name: getGroupName(groupId),
              permissions: []
            } as Group;
          }) : 
          []
      }));
      
      setUsers(transformedUsers);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Une erreur est survenue lors du chargement des utilisateurs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getGroupName]);

  const fetchUserById = useCallback(async (userId: number): Promise<User | null> => {
    try {
      const user = await UserAPI.getUser(userId);
      return user;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      return null;
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await GroupAPI.getGroups();
      setGroups(data);
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
      const zonesData = await ZonesAPI.getAll();
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
      const response = await PermissionAPI.getCategorizedPermissions();
      
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
            Object.entries(models as Record<string, unknown[]>).forEach(([modelName, permissions]) => {
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
        permissionsArray = (response as { results: PermissionCategoryType[] }).results;
      } else if (response && 'data' in response) {
        // Handle wrapped response
        permissionsArray = (response as { data: PermissionCategoryType[] }).data;
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
      const newUser = await UserAPI.createUser(userData);
      
      // Transform the new user to match our component structure
      const transformedNewUser = {
        ...newUser,
        role: newUser.profile_data?.role || newUser.profile?.role || '',
        zone: newUser.profile_data?.zone !== undefined ? newUser.profile_data.zone : newUser.profile?.zone,
        is_active: newUser.is_active
      };
      
      setUsers(prev => [...prev, transformedNewUser]);
      setError(null);
      return transformedNewUser;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (id: number, userData: UserUpdateData): Promise<User> => {
    try {
      const updatedUser = await UserAPI.updateUser(id, userData);
      
      // Reload user list to get fresh data
      await fetchUsers();
      
      // Transform the updated user to match our component structure
      const transformedUser = {
        ...updatedUser,
        role: updatedUser.profile_data?.role || '',
        zone: updatedUser.profile_data?.zone !== undefined ? 
              updatedUser.profile_data.zone : null,
        is_active: Boolean(updatedUser.is_active)
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
      await UserAPI.deleteUser(id);
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
      const newGroup = await GroupAPI.createGroup(groupData);
      setGroups(prev => [...prev, newGroup]);
      setError(null);
      return newGroup;
    } catch (err) {
      console.error('Error creating group:', err);
      throw err;
    }
  }, []);

  const updateGroup = useCallback(async (id: number, groupData: { name: string; permissions: number[] }): Promise<Group> => {
    try {
      const updatedGroup = await GroupAPI.updateGroup(id, groupData);
      setGroups(prev => prev.map(g => g.id === id ? updatedGroup : g));
      setError(null);
      return updatedGroup;
    } catch (err) {
      console.error('Error updating group:', err);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (id: number): Promise<void> => {
    try {
      await GroupAPI.deleteGroup(id);
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
