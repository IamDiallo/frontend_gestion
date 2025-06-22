import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  ListSubheader,
  Checkbox,
  ListItemText,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Group as GroupIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { UserAPI, GroupAPI, PermissionAPI, ZonesAPI } from '../services/api';
import { usePermissions } from '../context/PermissionContext';
import PermissionGuard from './PermissionGuard';
import { TabPanelProps } from '../interfaces/common';
import { Group, User, UserFormData } from '../interfaces/users';
import { Zone } from '../interfaces/sales';

// TabPanel component to show content based on selected tab
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`access-tabpanel-${index}`}
      aria-labelledby={`access-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Add this hook to check permissions
const usePermissionCheck = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canPerform: (permission: string) => hasPermission(permission)
  };
};

const UserManagement = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { hasPermission, isAdmin, userRole, userGroups, userPermissions, loading: permissionsLoading } = usePermissions();
  const { canPerform } = usePermissionCheck();
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Groups state
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);  // Add this to your existing state declarations
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  
  // Add search and filter state
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [groupStatusFilter, setGroupStatusFilter] = useState('');
  
  // Add pagination models
  const [userPaginationModel, setUserPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  
  const [groupPaginationModel, setGroupPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Add this to store permission ID mapping
  const [permissionIdMapping, setPermissionIdMapping] = useState<Record<string, number>>({});
  const [permissionCodeMapping, setPermissionCodeMapping] = useState<Record<number, string>>({});
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };  // Call this in useEffect alongside your other fetch calls
  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchZones();
    fetchAvailablePermissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add this function to handle permission checking
  useEffect(() => {
    // Debug permissions
    console.log('Permission check for User Management:', {
      isAdmin,
      userRole,
      userGroups,
      userPermissions,
      permissionsLoading,
      hasChangeUserPerm: hasPermission('change_user') // Note: now using simplified permission name
    });
  }, [hasPermission, isAdmin, userRole, userGroups, userPermissions, permissionsLoading]);

  // Disable editing if user doesn't have permission
  const canEditUsers = canPerform('change_user'); // Note: simplified permission name
  const canCreateUsers = canPerform('add_user'); // Note: simplified permission name
  const canDeleteUsers = canPerform('delete_user'); // Note: simplified permission name  // Users functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await UserAPI.getUsers();
      
      // Handle both paginated response with results and direct array response
      const userData = Array.isArray(response) ? response : (response as { results?: User[] }).results || response;
      
      // Transform the data to match our component's expected format
      const transformedUsers = (userData as User[]).map((user: User) => {
        // Add additional logging to debug user data
        console.log(`Processing user ${user.username}, groups:`, user.groups);
        
        return {
          ...user,
          // Extract role and zone from profile_data if available
          role: user.profile_data?.role || user.profile?.role || '',
          zone: user.profile_data?.zone !== undefined ? user.profile_data.zone : user.profile?.zone,
          is_active: user.is_active,          // Ensure groups is always an array, and make sure it's properly formatted
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
            // If user.groups doesn't exist or is not an array, initialize as empty array
            []
        };
      });
      
      console.log('Transformed users with groups:', transformedUsers);
      setUsers(transformedUsers);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Une erreur est survenue lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to fetch a single user by ID to ensure we have the latest data
  const fetchUserById = async (userId: number) => {
    try {
      console.log(`Fetching user ${userId} details directly from API`);
      const user = await UserAPI.getUser(userId);
      console.log(`Direct API response for user ${userId}:`, user);
      return user;
    } catch (err) {
      console.error(`Error fetching user ${userId}:`, err);
      return null;
    }
  };

  const handleAddUser = () => {
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
    setShowAddDialog(true);
  };

  const handleEditUser = async (user: User) => {
    try {
      // Fetch the latest user data directly from the API to ensure we have the most up-to-date information
      const latestUserData = await fetchUserById(user.id);
      const userToEdit = latestUserData || user;
      
      // Log the latest user data received from the API
      console.log('Latest user data from API:', userToEdit);
      
      // Create a deep copy of the user object with safe defaults
      const userCopy = {
        ...userToEdit,
        // Use profile_data or direct properties
        role: userToEdit.profile_data?.role || userToEdit.profile?.role || userToEdit.role || '',
        zone: userToEdit.profile_data?.zone !== undefined ? userToEdit.profile_data.zone : 
              userToEdit.profile?.zone !== undefined ? userToEdit.profile?.zone : userToEdit.zone,
        is_active: userToEdit.is_active,
        user: {
          username: userToEdit.username || '',
          email: userToEdit.email || '',
          password: '', // Empty password field for editing
          first_name: userToEdit.first_name || '',
          last_name: userToEdit.last_name || '',
          is_active: userToEdit.is_active
        },
        // Fix: Extract group IDs properly from the groups array or use the groups field directly
        group_ids: Array.isArray(userToEdit.groups) ? 
          userToEdit.groups.map(g => typeof g === 'object' && g.id ? g.id : Number(g)) : 
          []
      };
      
      // Enhanced debugging for groups
      console.log(`User ${userToEdit.username} being edited:`, userToEdit);
      console.log(`Groups from user ${userToEdit.username}:`, userToEdit.groups);
      console.log(`Extracted group_ids for ${userToEdit.username}:`, userCopy.group_ids);
      
      setSelectedUser(userCopy);
      setShowPassword(false); // Hide password field for existing users by default
      setShowAddDialog(true);
    } catch (error) {
      console.error('Error preparing user for edit:', error);
      setError('Une erreur est survenue lors de la récupération des données de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await UserAPI.deleteUser(user.id!);
        setUsers(users.filter(u => u.id !== user.id));
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Une erreur est survenue lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleSaveUser = async () => {
    if (selectedUser) {
      try {
        if (selectedUser.id) {
          // Update existing user - match API structure
          // Ensure group_ids is an array of integers
          const groupIds = selectedUser.group_ids && Array.isArray(selectedUser.group_ids)
            ? selectedUser.group_ids.map(id => Number(id))
            : [];
            
          console.log('Group IDs for update:', groupIds);
          
          const userToUpdate = {
            username: selectedUser.username || selectedUser.user?.username,
            email: selectedUser.email || selectedUser.user?.email,
            first_name: selectedUser.first_name || selectedUser.user?.first_name || '',
            last_name: selectedUser.last_name || selectedUser.user?.last_name || '',
            is_active: selectedUser.is_active,
            is_staff: selectedUser.is_staff !== undefined ? selectedUser.is_staff : selectedUser.role === 'admin',
            role: selectedUser.role,
            zone: selectedUser.zone, 
            is_profile_active: selectedUser.is_active,
            groups: groupIds
          };
          
          // Add password only if it was provided and not empty
          if (selectedUser.user?.password && selectedUser.user.password.trim() !== '') {
            userToUpdate.password = selectedUser.user.password;
          }
          
          console.log('Sending update user data:', userToUpdate);
          console.log('%c Groups being sent for update:', 'background: #afa; color: #080;', JSON.stringify(userToUpdate.groups));
          
          // Let's add a specific validation to double check the format before sending
          if (!Array.isArray(userToUpdate.groups)) {
            console.error('Warning: groups is not an array before sending to backend');
            userToUpdate.groups = groupIds;
          }
          
          console.log('Final API payload:', JSON.stringify(userToUpdate));
          
          const updatedUser = await UserAPI.updateUser(selectedUser.id, userToUpdate);
          
          console.log('Response from server after update:', updatedUser);
          
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
          
          setUsers(prevUsers => prevUsers.map(u => u.id === selectedUser.id ? transformedUser : u));
        } else {
          // For new users - match API structure
          if (!selectedUser.user?.password) {
            setError('Le mot de passe est requis pour un nouvel utilisateur');
            return;
          }
          
          // Verify that role is selected
          if (!selectedUser.role) {
            setError('Veuillez sélectionner un rôle pour l\'utilisateur');
            return;
          }
          
          // Prepare the data for a new user - ensure all fields are explicitly included
          const newUserData = {
            username: selectedUser.user.username,
            email: selectedUser.user.email,
            password: selectedUser.user.password,
            first_name: selectedUser.user.first_name || '',
            last_name: selectedUser.user.last_name || '',
            is_active: selectedUser.user.is_active,
            is_staff: selectedUser.is_staff !== undefined ? selectedUser.is_staff : selectedUser.role === 'admin',
            role: selectedUser.role, // Required field
            zone: selectedUser.zone !== undefined ? selectedUser.zone : null, // Must be explicit null if not specified
            is_profile_active: selectedUser.is_active,
            // Ensure groups is not an empty array if group_ids exist
            groups: selectedUser.group_ids && selectedUser.group_ids.length > 0 
              ? selectedUser.group_ids 
              : []
          };
          
          // Add detailed debugging to confirm data is being sent correctly
          console.log('%c VALIDATED USER DATA FOR CREATION', 'background: #ff8; color: #000; font-weight: bold');
          console.log('Role value (required):', selectedUser.role);
          console.log('Zone value:', selectedUser.zone !== undefined ? selectedUser.zone : 'null (not specified)');
          console.log('Group IDs:', selectedUser.group_ids || 'empty array');
          console.log('Final data for API:', newUserData);
          console.log('Group IDs to be saved:', JSON.stringify(selectedUser.group_ids));
          console.log('Final groups data for API:', JSON.stringify(newUserData.groups));
          
          let newUser;
          
          try {
            // Send to API and capture the response
            newUser = await UserAPI.createUser(newUserData as any);
            console.log('API response:', newUser);
          } catch (apiError) {
            console.error('API call failed:', apiError);
            if (apiError.response) {
              console.error('Response status:', apiError.response.status);
              console.error('Response data:', apiError.response.data);
            }
            throw apiError; // Re-throw to be caught by the outer catch block
          }
          
          // Only proceed if we received a valid response
          if (newUser) {
            // Transform the new user to match our component structure
            const transformedNewUser = {
              ...newUser,
              role: newUser.profile_data?.role || newUser.profile?.role || '',
              zone: newUser.profile_data?.zone !== undefined ? newUser.profile_data.zone : newUser.profile?.zone,
              is_active: newUser.is_active
            };
            
            setUsers([...users, transformedNewUser]);
          } else {
            throw new Error('No user data received from API');
          }
        }
        setShowAddDialog(false);
        setSelectedUser(null);
        setError(null);
      } catch (err) {
        console.error('Error saving user:', err);
        // Display more detailed error information from the API
        if (err.response?.data) {
          console.error('Backend response:', err.response.data);
          const errorMessage = extractErrorMessage(err.response.data);
          setError(errorMessage || 'Une erreur est survenue lors de la sauvegarde de l\'utilisateur');
        } else {
          setError('Une erreur est survenue lors de la sauvegarde de l\'utilisateur');
        }
      }
    }
  };
  // Helper function to extract error messages from various API response formats
  const extractErrorMessage = (data: unknown): string | null => {
    if (typeof data === 'string') {
      return data;
    } 
    
    if (data && typeof data === 'object') {
      const errorData = data as Record<string, unknown>;
      
      if (errorData.detail) {
        return String(errorData.detail);
      } else if (errorData.message) {
        return String(errorData.message);
      } else if (errorData.user && typeof errorData.user === 'object') {
        const userData = errorData.user as Record<string, unknown>;
        
        if (userData.username && Array.isArray(userData.username)) {
          return `Erreur de nom d'utilisateur: ${userData.username[0]}`;
        }
        
        // Check for any other user field errors
        const fieldErrors = Object.entries(userData)
          .filter(([, errors]) => Array.isArray(errors) && errors.length > 0)
          .map(([field, errors]) => `${field}: ${(errors as string[])[0]}`);
        
        if (fieldErrors.length > 0) {
          return `Erreurs de validation: ${fieldErrors.join(', ')}`;
        }
      }
    }
    
    return null;
  };

  // Groups functions
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const data = await GroupAPI.getGroups();
      setGroups(data);
      setGroupError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setGroupError('Une erreur est survenue lors du chargement des groupes');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleAddGroup = () => {
    console.log('Initializing new group with empty permissions array');
    setSelectedGroup({
      name: '',
      permissions: [], // Explicitly initialize as empty array
    });
    setShowGroupDialog(true);
    
    // Double check the state was set correctly
    setTimeout(() => {
      console.log('Checking selectedGroup state after initialization:', selectedGroup);
    }, 100);
  };
  // Add a helper function to normalize permissions for editing
  const normalizePermissions = (permissions: unknown[]): number[] => {
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
  };

  const handleEditGroup = (group: Group) => {
    console.log('Editing group:', group);
    console.log('Original permissions:', group.permissions);
    
    // Create a copy with normalized permissions - ensure it's always an array of IDs
    const groupCopy = { 
      ...group,
      permissions: Array.isArray(group.permissions) ? 
        normalizePermissions(group.permissions) : 
        [] // If permissions is not an array, initialize as empty array
    };
    
    console.log('Normalized permissions (as IDs) for editing:', groupCopy.permissions);
    setSelectedGroup(groupCopy);
    setShowGroupDialog(true);
    
    // Double check the state was set correctly
    setTimeout(() => {
      console.log('Checking selectedGroup state after setting for edit:', selectedGroup);
    }, 100);
  };

  const handleDeleteGroup = async (group: Group) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      try {
        await GroupAPI.deleteGroup(group.id!);
        setGroups(groups.filter(g => g.id !== group.id));
        setGroupError(null);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        if (err.response?.data?.detail) {
          setGroupError(err.response.data.detail);
        } else {
          setGroupError('Une erreur est survenue lors de la suppression du groupe');
        }
      }
    }
  };

  // Add this function to check if a permission is selected
  const isPermissionSelected = (permissionCode: string): boolean => {
    if (!selectedGroup?.permissions || !Array.isArray(selectedGroup.permissions)) {
      return false;
    }
    
    // Convert code to ID and check if it's in the selected permissions
    const permissionId = permissionIdMapping[permissionCode];
    if (!permissionId) return false;
    
    return selectedGroup.permissions.includes(permissionId);
  };

  // Add this function to add or remove a permission
  const togglePermission = (permissionCode: string) => {
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
  };

  const handleSaveGroup = async () => {
    if (selectedGroup) {
      try {
        // Validate form data
        if (!selectedGroup.name) {
          setGroupError('Le nom du groupe est requis');
          return;
        }
        
        // Critical logging to debug the permissions issue
        console.log('%c DEBUG GROUP SAVE', 'background: #ff0000; color: #ffffff; font-size: 16px; font-weight: bold;');
        console.log('selectedGroup state:', JSON.parse(JSON.stringify(selectedGroup)));
        console.log('permissions in selectedGroup:', selectedGroup.permissions);
        console.log('permissions type:', typeof selectedGroup.permissions);
        console.log('is permissions array?', Array.isArray(selectedGroup.permissions));
        
        
        // Declare finalPermissions variable
        let finalPermissions = [];
        
        // If permissions is undefined, null or not an array, initialize it
        if (!selectedGroup.permissions || !Array.isArray(selectedGroup.permissions)) {
          console.warn('Permissions is not an array - initializing empty array');
          finalPermissions = [];
        } else {
          // Safe copy of permissions
          finalPermissions = [...selectedGroup.permissions];
          console.log('Copied permissions array with length:', finalPermissions.length);
        }
        
        // Create a clean data object for the API
        const groupData = {
          name: selectedGroup.name,
          permissions: finalPermissions,
        };
        
        console.log('Final data for API call:', JSON.stringify(groupData));
        
        // Continue with creating or updating the group
        if (selectedGroup.id) {
          // Update existing group
          try {
            const updatedGroup = await GroupAPI.updateGroup(selectedGroup.id, groupData);
            console.log('Group updated successfully:', updatedGroup);
            setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));
            setShowGroupDialog(false);
            setSelectedGroup(null);
            setGroupError(null);
          } catch (err) {
            handleGroupError(err);
          }
        } else {
          // Add new group
          try {
            const newGroup = await GroupAPI.createGroup(groupData);
            console.log('Group created successfully:', newGroup);
            setGroups([...groups, newGroup]);
            setShowGroupDialog(false);
            setSelectedGroup(null);
            setGroupError(null);
          } catch (err) {
            handleGroupError(err);
          }
        }
      } catch (err) {
        handleGroupError(err);
      }
    }
  };
  // Helper function to handle group save errors
  const handleGroupError = (err: unknown) => {
    console.error('Error saving group:', err);
    
    // More detailed error handling
    if (err && typeof err === 'object' && 'response' in err) {
      const errorWithResponse = err as { response?: { data?: unknown; status?: number; statusText?: string } };
      const responseData = errorWithResponse.response?.data;
      
      console.error('Backend response:', responseData);
      
      if (responseData && typeof responseData === 'object') {
        const data = responseData as Record<string, unknown>;
        
        // Handle various error response formats
        if (typeof data === 'string') {
          setGroupError(String(data));
        } else if (data.detail) {
          setGroupError(String(data.detail));
        } else if (data.name && Array.isArray(data.name)) {
          setGroupError(`Erreur: ${data.name[0]}`);
        } else if (data.permissions) {
          if (Array.isArray(data.permissions)) {
            // Look for uniqueness constraint errors
            const uniquenessErrors = data.permissions.filter((p: unknown) => {
              if (p && typeof p === 'object') {
                const permError = p as Record<string, unknown>;
                return permError.non_field_errors && 
                       Array.isArray(permError.non_field_errors) &&
                       permError.non_field_errors[0] &&
                       String(permError.non_field_errors[0]).includes('ensemble unique');
              }
              return false;
            });
            
            if (uniquenessErrors.length > 0) {
              setGroupError("Erreur: Des permissions en double ont été détectées. Veuillez réessayer.");
            } else {
              setGroupError(`Erreur de permissions: ${JSON.stringify(data.permissions)}`);
            }
          } else {
            setGroupError(`Erreur de permissions: ${String(data.permissions)}`);
          }
        } else {
          const status = errorWithResponse.response?.status;
          const statusText = errorWithResponse.response?.statusText;
          setGroupError(`Erreur ${status}: ${statusText}`);
        }
      } else if (typeof responseData === 'string') {
        setGroupError(responseData);
      }    } else if (err && typeof err === 'object' && 'message' in err) {
      setGroupError(`Erreur: ${String((err as { message: unknown }).message)}`);
    } else {
      setGroupError('Une erreur inattendue est survenue lors de la sauvegarde du groupe');
    }
  };
  const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'consultant':
        return 'info';
      case 'supervisor':
        return 'warning';
      case 'commercial':
        return 'success';
      case 'cashier':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'consultant':
        return 'Consultant';
      case 'supervisor':
        return 'Superviseur';
      case 'commercial':
        return 'Commercial';
      case 'cashier':
        return 'Chef de Caisse';
      default:
        return role;
    }
  };

  // Get available permissions
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);

  // Enhance the fetchAvailablePermissions function with better error handling
  const fetchAvailablePermissions = async () => {
    try {
      console.log("Fetching categorized permissions...");
      setAvailablePermissions([]); // Reset permissions before fetching
      
      // Get permissions in a categorized format
      const response = await PermissionAPI.getCategorizedPermissions();
      console.log("Received categorized permissions:", response);
      
      if (!response) {
        console.warn("Warning: No response received for permissions!");
        setGroupError('Aucune permission n\'a été reçue. Veuillez contacter l\'administrateur.');
        return;
      }
      
      if (Array.isArray(response) && response.length === 0) {
        console.warn("Warning: Received empty permissions array!");
        setGroupError('Aucune permission n\'est disponible. Veuillez contacter l\'administrateur.');
        return;
      }
      
      // Create mappings between permission IDs and codes
      const idToCode: Record<number, string> = {};
      const codeToId: Record<string, number> = {};

      // Process the permissions to ensure they have full_codename
      const processedPermissions = response.map(category => {
        category.permissions.forEach(perm => {
          const fullCode = perm.full_codename || 
            (perm.content_type?.app_label && perm.codename ? 
              `${perm.content_type.app_label}.${perm.codename}` : 
              perm.codename);
          
          if (perm.id) {
            idToCode[perm.id] = fullCode;
            codeToId[fullCode] = perm.id;
          }
        });
        
        return {
          ...category,
          permissions: category.permissions.map(perm => ({
            ...perm,
            // Ensure full_codename exists - construct it if missing
            full_codename: perm.full_codename || 
              (perm.content_type?.app_label && perm.codename ? 
                `${perm.content_type.app_label}.${perm.codename}` : 
                perm.codename)
          }))
        };
      });
      
      console.log("Permission mappings created:", { idToCode, codeToId });
      setPermissionIdMapping(codeToId);
      setPermissionCodeMapping(idToCode);
      
      console.log("Processed permissions:", processedPermissions);
      setGroupError(null);
      setAvailablePermissions(processedPermissions);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setGroupError('Une erreur est survenue lors du chargement des permissions');
      setAvailablePermissions([]);
    }
  };

  // Add this function to fetch zones
  const fetchZones = async () => {
    try {
      setLoadingZones(true);
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
    } finally {
      setLoadingZones(false);
    }
  };

  // Helper function to display zone name
  const formatZones = (zone?: number, zoneName?: string): string => {
    if (!zone) return 'Aucune zone';
    // Display zone name if available, otherwise fall back to zone ID
    return zoneName || `Zone ${zone}`;
  };

  // Helper function to get group name
  const getGroupName = (groupId: number): string => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Groupe inconnu';
  };

  // Add a function to display user groups with proper null checking
  const formatGroups = (groups?: Group): string => {
    // Check if user and groups are defined
    if (!groups || !Array.isArray(groups)) return 'Aucun groupe';
    return groups.map(g => g?.name || 'Groupe inconnu').join(', ');
  };

  // Fix permissions rendering - ensure we're rendering strings, not objects
  const formatPermissionName = (permission: any): string => {
    // If permission is an object with a code property, return the code
    if (permission && typeof permission === 'object' && 'code' in permission) {
      return permission.code;
    }
    // If it's a string, return it directly
    if (typeof permission === 'string') {
      return permission;
    }
    // Otherwise, return an empty string
    return '';
  };

  // Helper function to get permission label for display
  const getPermissionLabel = (permissionValue: string): string => {
    // Try to find the permission in availablePermissions
    for (const category of availablePermissions) {
      const permission = category.permissions.find(p => 
        p.codename === permissionValue || 
        p.full_codename === permissionValue
      );
      if (permission) {
        return `${category.name}: ${permission.name}`;
      }
    }
    // If not found, return the original value
    return permissionValue;
  };

  // Add a helper function to safely access user properties
  const safeGetUsername = (user: User): string => {
    // This is now directly on the user object, not nested in user.user
    return user?.username || '';
  };

  const safeGetEmail = (mail:string): string => {
    // This is now directly on the user object, not nested in user.user
    return mail || '';
  };

  // Update the permission selection UI with improved handling of selected permissions
  const renderPermissionSelectionUI = () => (
    <Grid item xs={12}>
      <FormControl fullWidth>
        <InputLabel>Permissions</InputLabel>
        <Select
          multiple
          value={selectedGroup?.permissions || []}
          label="Permissions"
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as number[]).length > 0 ? (
                (selected as number[]).map((id) => {
                  // Get the code from the ID using our mapping
                  const code = permissionCodeMapping[id] || '';
                  
                  // Find the permission in availablePermissions to get its display name
                  let label = code;
                  let category = '';
                  
                  for (const cat of availablePermissions) {
                    const permission = cat.permissions.find(p => p.id === id);
                    if (permission) {
                      label = permission.name;
                      category = cat.name;
                      break;
                    }
                  }
                  
                  return (
                    <Chip 
                      key={id} 
                      label={`${category}: ${label}`}
                      size="small"
                      onDelete={() => {
                        const code = permissionCodeMapping[id];
                        if (code) togglePermission(code);
                      }}
                      sx={{ m: 0.1 }}
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune permission sélectionnée
                </Typography>
              )}
            </Box>
          )}
          onChange={(e) => {
            // This is just a placeholder as we're using custom handling with togglePermission
            console.log('Select onChange triggered, but using custom togglePermission instead',e);
          }}
          MenuProps={{
            PaperProps: {
              style: { 
                maxHeight: 400,
                width: 400
              }
            }
          }}
        >
          {availablePermissions.length > 0 ? (
            availablePermissions.map(category => [
              <ListSubheader 
                key={`header-${category.app}.${category.model}`}
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 'bold'
                }}
              >
                {category.name}
              </ListSubheader>,
              ...category.permissions.map(permission => {
                const fullCode = permission.full_codename;
                const isSelected = isPermissionSelected(fullCode);
                
                return (
                  <MenuItem 
                    key={fullCode} 
                    value={permission.id} // Use ID as the value
                    onClick={(e) => {
                      e.preventDefault();
                      togglePermission(fullCode);
                    }}
                    sx={{
                      padding: '8px 16px',
                      borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : 'none',
                      backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      '&:hover': {
                        backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <Checkbox 
                      checked={isSelected} 
                      color="primary"
                      sx={{ padding: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => togglePermission(fullCode)}
                    />
                    <ListItemText 
                      primary={permission.name} 
                      secondary={fullCode}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 700 : 400,
                        color: isSelected ? theme.palette.primary.main : 'inherit'
                      }}
                    />
                  </MenuItem>
                );
              })
            ])
          ) : (
            <MenuItem disabled>Chargement des permissions...</MenuItem>
          )}
        </Select>
        
        {/* Selected permissions summary */}
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Permissions sélectionnées ({selectedGroup?.permissions?.length || 0})
          </Typography>
          <Box sx={{ 
            mt: 1,  
            p: 2, 
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            {selectedGroup?.permissions?.length ? (
              <Grid container spacing={1}>
                {selectedGroup.permissions.map((id) => {
                  const code = permissionCodeMapping[id] || '';
                  let displayName = code;
                  let categoryName = '';
                  
                  // Find the permission display name
                  for (const category of availablePermissions) {
                    const permission = category.permissions.find(p => p.id === id);
                    if (permission) {
                      displayName = permission.name;
                      categoryName = category.name;
                      break;
                    }
                  }
                  
                  return (
                    <Grid item key={id}>
                      <Chip
                        label={`${categoryName}: ${displayName}`}
                        onDelete={() => {
                          const code = permissionCodeMapping[id];
                          if (code) togglePermission(code);
                        }}
                        size="small"
                        sx={{ m: 0.25 }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                Aucune permission sélectionnée
              </Typography>
            )}
          </Box>
        </Box>
      </FormControl>
    </Grid>
  );

  // Add a function to show a warning if no groups are selected
  const renderGroupsWarning = () => {
    if (selectedUser && (!selectedUser.group_ids || selectedUser.group_ids.length === 0)) {
      return (
        <Typography variant="caption" color="warning.main">
          Aucun groupe sélectionné. L'utilisateur n'aura pas de permissions spécifiques.
        </Typography>
      );
    }
    return null;
  };

  // Improve the renderPermissionSelectionUI function to better handle permission display
  const renderGroupPermissions = (group: Group) => {
    // Safety check that group is defined and has permissions
    if (!group || !group.permissions || !Array.isArray(group.permissions) || group.permissions.length === 0) {
      return <Typography variant="body2" color="text.secondary">Aucune</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {(group.permissions || []).slice(0, 3).map((permission, index) => {
          // If permission is a number (ID), try to get the code from our mapping
          let permName = '';
          
          if (typeof permission === 'number') {
            permName = permissionCodeMapping[permission] || `ID: ${permission}`;
          } else {
            permName = formatPermissionName(permission);
          }
          
          return (
            <Chip
              key={`${group.id || 'new'}-perm-${index}-${permName}`}
              label={getPermissionLabel(permName)}
              size="small"
              color="primary"
              variant="outlined"
            />
          );
        })}
        {(group.permissions || []).length > 3 && (
          <Chip
            label={`+${group.permissions.length - 3} more`}
            size="small"
            color="default"
            variant="outlined"
          />
        )}
      </Box>
    );
  };

  // Add this helper function
  const renderZoneMenuItems = () => {
    if (loadingZones) {
      return (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Chargement des zones...
        </MenuItem>
      );
    }
    
    if (zones.length === 0) {
      return <MenuItem disabled>Aucune zone disponible</MenuItem>;
    }
    
    return zones.map(zone => (
      <MenuItem 
        key={zone.id} 
        value={zone.id}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1rem' }} />
          {zone.name}
        </Box>
      </MenuItem>
    ));
  };

  // Add useEffect hooks to reset page in pagination models when filters change
  useEffect(() => {
    setUserPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [userSearchTerm, userStatusFilter]);

  useEffect(() => {
    setGroupPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [groupSearchTerm, groupStatusFilter]);


  // Filter users based on search term and status filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || false) ||
      (user.first_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || false) ||
      (user.last_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || false);
    const matchesStatus = userStatusFilter === '' || 
      (userStatusFilter === 'active' && user.is_active) || 
      (userStatusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesStatus;
  });

  // Filter groups based on search term and status filter
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = 
      group.name.toLowerCase().includes(groupSearchTerm.toLowerCase());
    const matchesStatus = groupStatusFilter === '' || 
      (groupStatusFilter === 'active' && group.is_active) || 
      (groupStatusFilter === 'inactive' && !group.is_active);
    return matchesSearch && matchesStatus;
  });

  // Define columns for the Users DataGrid with better null checking
  const userColumns: GridColDef[] = [
    { 
      field: 'username', 
      headerName: 'Utilisateur', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {safeGetUsername(params.row)}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1,      valueGetter: (params) => {
        // Add safety check for undefined params or row
        if (!params) return '';
        return safeGetEmail(params);
      }
    },
    { 
      field: 'role', 
      headerName: 'Rôle', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
          return (
          <Chip
            icon={<SecurityIcon />}
            label={getRoleLabel(params.row.role || '')}
            color={getRoleColor(params.row.role || '')}
            size="small"
          />
        );
      }
    },    { 
      field: 'profile_data', 
      headerName: 'Zone', 
      flex: 1,
      valueGetter: (value, row) => {
        // Add safety check for undefined row
        if (!row) return 'Aucune zone';
        
        const zoneId = row.zone || row.profile_data?.zone;
        const zoneName = zones.find(z => z.id === zoneId)?.name;
        
        return formatZones(zoneId, zoneName);
      }
    },    { 
      field: 'groups', 
      headerName: 'Groupes', 
      flex: 1,
      valueGetter: (value, row) => {
        // Add safety check for undefined row
        if (!row || !row.groups) return 'Aucun groupe';
        
        return formatGroups(row.groups);
      }
    },
    { 
      field: 'is_active', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
        
        return (
          <Chip
            label={params.row.is_active ? 'Actif' : 'Inactif'}
            color={params.row.is_active ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
        
        return (
          <Box>
            <IconButton
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => handleEditUser(params.row)}
              disabled={!canEditUsers}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteUser(params.row)}
              disabled={!canDeleteUsers}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    },
  ];

  // Define columns for the Groups DataGrid with better null checking
  const groupColumns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Nom du groupe', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {params.row.name || ''}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'permissions', 
      headerName: 'Permissions', 
      flex: 1.5,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
        
        return renderGroupPermissions(params.row);
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params || !params.row) return <></>;
        
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => handleEditGroup(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteGroup(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    },
  ];

  return (
    <PermissionGuard
      requiredPermission="auth.change_user"
      fallbackPath="/"
    >
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              borderBottom: `2px solid ${theme.palette.primary.light}`,
              pb: 1,
              width: 'fit-content'
            }}
          >
            Gestion des Accès
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les profils, les permissions et les groupes d'utilisateurs
          </Typography>
        </Box>

        <Paper 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="access management tabs"
              sx={{ 
                px: 3, 
                pt: 2,
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '1rem',
                }
              }}
            >
              <Tab 
                icon={<PersonIcon />} 
                iconPosition="start" 
                label="Utilisateurs"  
                id="access-tab-0" 
                aria-controls="access-tabpanel-0" 
              />
              <Tab 
                icon={<GroupIcon />} 
                iconPosition="start" 
                label="Groupes" 
                id="access-tab-1" 
                aria-controls="access-tabpanel-1" 
              />
            </Tabs>
          </Box>

          {/* Users Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', md: 'flex-end' }, 
                mb: 3,
                gap: 2
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: 2,
                  width: { xs: '100%', md: 'auto' },
                  flexGrow: 1
                }}>
                  <TextField
                    label="Rechercher"
                    placeholder="Nom d'utilisateur ou email"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="user-status-filter-label">Statut</InputLabel>
                    <Select
                      labelId="user-status-filter-label"
                      id="user-status-filter"
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      label="Statut"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="active">Actifs</MenuItem>
                      <MenuItem value="inactive">Inactifs</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Button
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddUser}
                  disabled={!canCreateUsers}
                  sx={{ 
                    borderRadius: '20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  Nouvel utilisateur
                </Button>
              </Box>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                >
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={filteredUsers}
                    columns={userColumns}
                    pagination
                    paginationModel={userPaginationModel}
                    onPaginationModelChange={setUserPaginationModel}
                    pageSizeOptions={[5, 10, 25]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick
                    loading={loading}
                    getRowId={(row) => {
                      // Safely handle undefined or null rows
                      if (!row || row.id === undefined) return Math.random();
                      return row.id;
                    }}                    localeText={{
                      noRowsLabel: "Aucun utilisateur correspondant n'a été trouvé",
                      footerRowSelected: count => `${count} utilisateur${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`,
                      toolbarColumns: "Colonnes",
                      toolbarFilters: "Filtres",
                      toolbarDensity: "Densité",
                      toolbarExport: "Exporter",
                      filterPanelAddFilter: "Ajouter un filtre",
                      filterPanelRemoveAll: "Supprimer tous",
                      filterPanelOperatorAnd: "Et",
                      filterPanelOperatorOr: "Ou",
                      filterPanelColumns: "Colonnes",
                      filterPanelInputLabel: "Valeur",
                      filterPanelInputPlaceholder: "Valeur du filtre",
                    }}
                  />
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Groups Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', md: 'flex-end' }, 
                mb: 3,
                gap: 2
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: 2,
                  width: { xs: '100%', md: 'auto' },
                  flexGrow: 1
                }}>
                  <TextField
                    label="Rechercher"
                    placeholder="Nom ou description"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={groupSearchTerm}
                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                  />
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="group-status-filter-label">Statut</InputLabel>
                    <Select
                      labelId="group-status-filter-label"
                      id="group-status-filter"
                      value={groupStatusFilter}
                      onChange={(e) => setGroupStatusFilter(e.target.value)}
                      label="Statut"
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="active">Actifs</MenuItem>
                      <MenuItem value="inactive">Inactifs</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddGroup}
                  sx={{ 
                    borderRadius: '20px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  Nouveau groupe
                </Button>
              </Box>

              {groupError && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                >
                  {groupError}
                </Alert>
              )}

              {loadingGroups ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={filteredGroups}
                    columns={groupColumns}
                    pagination
                    paginationModel={groupPaginationModel}
                    onPaginationModelChange={setGroupPaginationModel}
                    pageSizeOptions={[5, 10, 25]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick
                    loading={loadingGroups}
                    getRowId={(row) => {
                      // Safely handle undefined or null rows
                      if (!row || row.id === undefined) return Math.random();
                      return row.id;
                    }}
                    localeText={{
                      noRowsLabel: "Aucun groupe correspondant n'a été trouvé",
                      footerRowSelected: count => `${count} groupe${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`,
                      toolbarColumns: "Colonnes",
                      toolbarFilters: "Filtres",
                      toolbarDensity: "Densité",
                      toolbarExport: "Exporter",
                      filterPanelAddFilter: "Ajouter un filtre",
                      filterPanelRemoveAll: "Supprimer tous",
                      filterPanelOperatorAnd: "Et",
                      filterPanelOperatorOr: "Ou",
                      filterPanelColumns: "Colonnes",
                      filterPanelInputLabel: "Valeur",
                      filterPanelInputPlaceholder: "Valeur du filtre",
                    }}
                  />
                </Box>
              )}
            </Box>
          </TabPanel>
        </Paper>

        <Dialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle
            sx={{ 
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {selectedUser?.id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* User Information Section */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                  Information de l'utilisateur
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}> 
                <TextField
                  label="Nom d'utilisateur"
                  fullWidth
                  required
                  value={selectedUser?.user?.username || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, username: e.target.value }
                  } : null)}
                  // Make username field read-only during edit
                  InputProps={{
                    readOnly: !!selectedUser?.id
                  }}
                  helperText={selectedUser?.id ? "Le nom d'utilisateur ne peut pas être modifié" : ""}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={selectedUser?.user.email || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, email: e.target.value }
                  } : null)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prénom"
                  fullWidth
                  value={selectedUser?.user.first_name || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, first_name: e.target.value }
                  } : null)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nom"
                  fullWidth
                  value={selectedUser?.user.last_name || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, last_name: e.target.value }
                  } : null)}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Mot de passe"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required={!selectedUser?.id} // Required only for new users
                  value={selectedUser?.user.password || ''}
                  onChange={(e) => setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, password: e.target.value }
                  } : null)}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                  helperText={selectedUser?.id ? "Laissez vide pour conserver le mot de passe actuel" : ""}
                />
              </Grid>
              
              {/* Role and Permissions Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                  Rôle et permissions
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Rôle</InputLabel>
                  <Select
                    value={selectedUser?.role || ''}
                    label="Rôle"
                    onChange={(e) => setSelectedUser(prev => prev ? {
                      ...prev, 
                      role: e.target.value as string,
                      // Update is_staff automatically when role changes to admin
                      is_staff: e.target.value === 'admin'
                    } : null)}
                  >
                    <MenuItem value="" disabled>Sélectionner un rôle</MenuItem>
                    <MenuItem value="admin">Administrateur</MenuItem>
                    <MenuItem value="consultant">Consultant</MenuItem>
                    <MenuItem value="supervisor">Superviseur</MenuItem>
                    <MenuItem value="commercial">Commercial</MenuItem>
                    <MenuItem value="cashier">Chef de Caisse</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    value={selectedUser?.zone || ''}
                    label="Zone"
                    onChange={(e) => setSelectedUser(prev => prev ? {
                      ...prev, 
                      zone: e.target.value ? Number(e.target.value) : undefined
                    } : null)}
                  >
                    <MenuItem value="">Aucune zone</MenuItem>
                    {renderZoneMenuItems()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth key={`groups-select-${selectedUser?.id || 'new'}`}>
                  <InputLabel>Groupes</InputLabel>
                  <Select
                    multiple
                    value={selectedUser?.group_ids || []}
                    label="Groupes"
                    onChange={(e) => {
                      const newGroupIds = typeof e.target.value === 'string' 
                        ? [Number(e.target.value)] 
                        : e.target.value as number[];
                      
                      console.log('Group IDs selected:', newGroupIds);
                      setSelectedUser(prev => prev ? {
                        ...prev, 
                        group_ids: newGroupIds
                      } : null);
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).length > 0 ? 
                          (selected as number[]).map((value) => (
                            <Chip 
                              key={value} 
                              label={getGroupName(value)} 
                              size="small" 
                              sx={{ m: 0.1 }}
                            />
                          )) : 
                          <Typography variant="body2" color="text.secondary">Aucun groupe sélectionné</Typography>
                        }
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 250
                        },
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      }
                    }}
                  >
                    {loadingGroups ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Chargement des groupes...
                      </MenuItem>
                    ) : groups.length === 0 ? (
                      <MenuItem disabled>Aucun groupe disponible</MenuItem>
                    ) : (
                      groups.map(group => (
                        <MenuItem 
                          key={group.id} 
                          value={group.id}
                          sx={{
                            padding: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                          }}
                        >
                          <Checkbox 
                            checked={selectedUser?.group_ids?.includes(group.id)} 
                            color="primary"
                            sx={{ padding: '4px' }}
                          />
                          <ListItemText 
                            primary={group.name} 
                            secondary={group.description && group.description.length > 30 
                              ? `${group.description.substring(0, 30)}...` 
                              : group.description}
                            primaryTypographyProps={{
                              fontWeight: selectedUser?.group_ids?.includes(group.id) ? 500 : 'normal'
                            }}
                          />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {renderGroupsWarning()}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Les groupes définissent les permissions de l'utilisateur sur le système.
                  </Typography>
                </FormControl>
              </Grid>
              {/* Status Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                  Statut
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={selectedUser?.is_active ? "1" : "0"}
                    label="Statut"
                    onChange={(e) => setSelectedUser(prev => prev ? {
                      ...prev, 
                      is_active: e.target.value === "1",
                      user: { 
                        ...prev.user, 
                        is_active: e.target.value === "1" 
                      }
                    } : null)}
                  >
                    <MenuItem value="1">Actif</MenuItem>
                    <MenuItem value="0">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setShowAddDialog(false)}
              sx={{ borderRadius: '20px' }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveUser}
              disabled={
                !selectedUser?.user.username || 
                !selectedUser?.user.email || 
                !selectedUser?.role || // Changed from group to role
                (!selectedUser?.id && !selectedUser?.user.password)
              }
              sx={{ 
                borderRadius: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                }
              }}
            >
              {selectedUser?.id ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Group Dialog */}
        <Dialog 
          open={showGroupDialog} 
          onClose={() => setShowGroupDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle
            sx={{ 
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {selectedGroup?.id ? 'Modifier le groupe' : 'Nouveau groupe'}
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nom du groupe"
                  fullWidth
                  required
                  value={selectedGroup?.name || ''}
                  onChange={(e) => setSelectedGroup(prev => prev ? {...prev, name: e.target.value} : null)}
                  error={!selectedGroup?.name && selectedGroup?.name !== undefined}
                  helperText={!selectedGroup?.name && selectedGroup?.name !== undefined ? 'Le nom est requis' : ''}
                />
              </Grid>
              {renderPermissionSelectionUI()}
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setShowGroupDialog(false)}
              sx={{ borderRadius: '20px' }}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveGroup}
              // Only require the name field to be filled, permissions can be optional
              disabled={!selectedGroup?.name}
              sx={{ 
                borderRadius: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                }
              }}
            >
              {selectedGroup?.id ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  );
};

export default UserManagement;