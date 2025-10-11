/**
 * Custom Hook: useGroupDialog
 * Manages group dialog state and permission selection
 */

import { useState, useCallback } from 'react';
import { Group } from '../interfaces/users';

interface UseGroupDialogReturn {
  // Dialog state
  showDialog: boolean;
  selectedGroup: Group | null;
  
  // Actions
  openAddDialog: () => void;
  openEditDialog: (group: Group, permissionIdMapping: Record<string, number>) => void;
  closeDialog: () => void;
  setSelectedGroup: React.Dispatch<React.SetStateAction<Group | null>>;
  
  // Permission management
  isPermissionSelected: (permissionCode: string, permissionIdMapping: Record<string, number>) => boolean;
  togglePermission: (permissionCode: string, permissionIdMapping: Record<string, number>) => void;
  
  // Data preparation
  prepareGroupForEdit: (group: Group, permissionIdMapping: Record<string, number>) => Group;
  prepareGroupDataForSave: () => { name: string; permissions: number[] } | null;
}

export const useGroupDialog = (): UseGroupDialogReturn => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Normalize permissions to array of IDs
   */
  const normalizePermissions = useCallback((permissions: unknown[], permissionIdMapping: Record<string, number>): number[] => {
    if (!permissions || !Array.isArray(permissions)) return [];
    
    return permissions.map(permission => {
      // If it's already a number (ID), return it directly
      if (typeof permission === 'number') return permission;
      
      // If it's a string (full_codename), convert to ID using our mapping
      if (typeof permission === 'string') {
        return permissionIdMapping[permission] || -1;
      } 
      // If it's an object, extract ID directly or look up by codename
      else if (permission && typeof permission === 'object') {
        const permObj = permission as Record<string, unknown>;
        if (typeof permObj.id === 'number') return permObj.id;
        
        // Otherwise try to find by various codename formats
        const fullCode = permObj.full_codename || 
          permObj.codename || 
          permObj.code;
        
        if (typeof fullCode === 'string') {
          return permissionIdMapping[fullCode] || -1;
        }
      }
      return -1;
    }).filter(p => p !== -1);
  }, []);

  // ============================================================================
  // DIALOG ACTIONS
  // ============================================================================

  const openAddDialog = useCallback(() => {
    setSelectedGroup({
      name: '',
      permissions: [], // Explicitly initialize as empty array
    });
    setShowDialog(true);
  }, []);

  const prepareGroupForEdit = useCallback((group: Group, permissionIdMapping: Record<string, number>): Group => {
    // Create a copy with normalized permissions - ensure it's always an array of IDs
    return { 
      ...group,
      permissions: Array.isArray(group.permissions) ? 
        normalizePermissions(group.permissions, permissionIdMapping) : 
        [] // If permissions is not an array, initialize as empty array
    };
  }, [normalizePermissions]);

  const openEditDialog = useCallback((group: Group, permissionIdMapping: Record<string, number>) => {
    const groupCopy = prepareGroupForEdit(group, permissionIdMapping);
    setSelectedGroup(groupCopy);
    setShowDialog(true);
  }, [prepareGroupForEdit]);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setSelectedGroup(null);
  }, []);

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  const isPermissionSelected = useCallback((permissionCode: string, permissionIdMapping: Record<string, number>): boolean => {
    if (!selectedGroup?.permissions || !Array.isArray(selectedGroup.permissions)) {
      return false;
    }
    
    // Convert code to ID and check if it's in the selected permissions
    const permissionId = permissionIdMapping[permissionCode];
    if (!permissionId) return false;
    
    return selectedGroup.permissions.includes(permissionId);
  }, [selectedGroup]);

  const togglePermission = useCallback((permissionCode: string, permissionIdMapping: Record<string, number>) => {
    if (!selectedGroup) return;
    
    // Get the ID from the code
    const permissionId = permissionIdMapping[permissionCode];
    if (!permissionId) {
      console.warn(`No ID found for permission code: ${permissionCode}`);
      return;
    }
    
    setSelectedGroup(prev => {
      if (!prev) return null;
      
      const permissions = Array.isArray(prev.permissions) ? [...prev.permissions] : [];
      const isSelected = permissions.includes(permissionId);
      
      if (isSelected) {
        // Remove the permission ID
        return {
          ...prev,
          permissions: permissions.filter(id => id !== permissionId)
        };
      } else {
        // Add the permission ID
        return {
          ...prev,
          permissions: [...permissions, permissionId]
        };
      }
    });
  }, [selectedGroup]);

  // ============================================================================
  // DATA PREPARATION FOR API
  // ============================================================================

  const prepareGroupDataForSave = useCallback((): { name: string; permissions: number[] } | null => {
    if (!selectedGroup) return null;

    // Validate form data
    if (!selectedGroup.name) {
      throw new Error('Le nom du groupe est requis');
    }

    // Declare finalPermissions variable
    let finalPermissions: number[] = [];
    
    // If permissions is undefined, null or not an array, initialize it
    if (!selectedGroup.permissions || !Array.isArray(selectedGroup.permissions)) {
      finalPermissions = [];
    } else {
      // Safe copy of permissions
      finalPermissions = [...selectedGroup.permissions];
    }
    
    // Create a clean data object for the API
    return {
      name: selectedGroup.name,
      permissions: finalPermissions,
    };
  }, [selectedGroup]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Dialog state
    showDialog,
    selectedGroup,
    
    // Actions
    openAddDialog,
    openEditDialog,
    closeDialog,
    setSelectedGroup,
    
    // Permission management
    isPermissionSelected,
    togglePermission,
    
    // Data preparation
    prepareGroupForEdit,
    prepareGroupDataForSave,
  };
};
