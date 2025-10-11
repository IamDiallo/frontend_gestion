/**
 * Custom Hook: useUserDialog
 * Manages user dialog state and form handling
 */

import { useState, useCallback } from 'react';
import { User, UserFormData, UserCreateRequest } from '../interfaces/users';
import { UserUpdateData } from './useUserManagementData';

interface UseUserDialogReturn {
  // Dialog state
  showDialog: boolean;
  selectedUser: UserFormData | null;
  showPassword: boolean;
  
  // Actions
  openAddDialog: () => void;
  openEditDialog: (user: User) => void;
  closeDialog: () => void;
  setSelectedUser: React.Dispatch<React.SetStateAction<UserFormData | null>>;
  setShowPassword: (show: boolean) => void;
  togglePasswordVisibility: () => void;
  
  // Form data preparation
  prepareUserForEdit: (user: User) => UserFormData;
  prepareUserDataForCreate: (formData: UserFormData) => UserCreateRequest;
  prepareUserDataForUpdate: (formData: UserFormData) => UserUpdateData;
}

export const useUserDialog = (): UseUserDialogReturn => {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================================
  // DIALOG ACTIONS
  // ============================================================================

  const openAddDialog = useCallback(() => {
    setSelectedUser({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_active: true,
      role: '', 
      group_ids: [],
      zone: undefined,
      groups: [],
      permissions: [],
      user: {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_active: true
      }
    });
    setShowPassword(true);
    setShowDialog(true);
  }, []);

  const prepareUserForEdit = useCallback((user: User): UserFormData => {
    // Create a deep copy of the user object with safe defaults
    const userCopy: UserFormData = {
      ...user,
      // Use profile_data or direct properties
      role: user.profile_data?.role || user.profile?.role || user.role || '',
      zone: user.profile_data?.zone !== undefined ? user.profile_data.zone : 
            user.profile?.zone !== undefined ? user.profile?.zone : user.zone,
      is_active: user.is_active,
      user: {
        username: user.username || '',
        email: user.email || '',
        password: '', // Empty password field for editing
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        is_active: user.is_active
      },
      // Extract group IDs properly from the groups array
      group_ids: Array.isArray(user.groups) ? 
        user.groups.map(g => typeof g === 'object' && g && 'id' in g ? g.id : Number(g)).filter((id): id is number => id !== undefined) : 
        []
    };
    
    return userCopy;
  }, []);

  const openEditDialog = useCallback((user: User) => {
    const userToEdit = prepareUserForEdit(user);
    setSelectedUser(userToEdit);
    setShowPassword(false); // Hide password field for existing users by default
    setShowDialog(true);
  }, [prepareUserForEdit]);

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setSelectedUser(null);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // ============================================================================
  // DATA PREPARATION FOR API
  // ============================================================================

  const prepareUserDataForCreate = useCallback((formData: UserFormData): UserCreateRequest => {
    // Verify that role is selected
    if (!formData.role) {
      throw new Error('Veuillez sélectionner un rôle pour l\'utilisateur');
    }

    // Verify password is provided
    if (!formData.user?.password) {
      throw new Error('Le mot de passe est requis pour un nouvel utilisateur');
    }

    // Prepare the data for a new user - backend expects flat structure
    // NOT nested under "user" key
    return {
      username: formData.user.username,
      email: formData.user.email,
      password: formData.user.password,
      first_name: formData.user.first_name || '',
      last_name: formData.user.last_name || '',
      is_active: formData.user.is_active,
      role: formData.role,
      zone: formData.zone !== undefined && formData.zone !== null ? formData.zone : undefined,
      is_profile_active: formData.is_active,
      groups: formData.group_ids || [],
    };
  }, []);

  const prepareUserDataForUpdate = useCallback((formData: UserFormData): UserUpdateData => {
    // Ensure group_ids is an array of integers
    const groupIds = formData.group_ids && Array.isArray(formData.group_ids)
      ? formData.group_ids.map(id => Number(id))
      : [];

    const userToUpdate: UserUpdateData = {
      username: formData.username || formData.user?.username || '',
      email: formData.email || formData.user?.email || '',
      first_name: formData.first_name || formData.user?.first_name || '',
      last_name: formData.last_name || formData.user?.last_name || '',
      is_active: formData.is_active,
      is_staff: formData.is_staff !== undefined ? formData.is_staff : formData.role === 'admin',
      role: formData.role || '',
      zone: formData.zone, 
      is_profile_active: formData.is_active,
      groups: groupIds,
    };

    // Add password only if it was provided and not empty
    if (formData.user?.password && formData.user.password.trim() !== '') {
      userToUpdate.password = formData.user.password;
    }

    return userToUpdate;
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Dialog state
    showDialog,
    selectedUser,
    showPassword,
    
    // Actions
    openAddDialog,
    openEditDialog,
    closeDialog,
    setSelectedUser,
    setShowPassword,
    togglePasswordVisibility,
    
    // Form data preparation
    prepareUserForEdit,
    prepareUserDataForCreate,
    prepareUserDataForUpdate,
  };
};
