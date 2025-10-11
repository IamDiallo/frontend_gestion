/**
 * Custom Hook: useUserManagementFilters
 * Manages filtering, searching, and pagination for users and groups
 */

import { useState, useMemo, useEffect } from 'react';
import { User, Group } from '../interfaces/users';
import { GridPaginationModel } from '@mui/x-data-grid';

interface UseUserManagementFiltersProps {
  users: User[];
  groups: Group[];
}

interface UseUserManagementFiltersReturn {
  // Filtered data
  filteredUsers: User[];
  filteredGroups: Group[];
  
  // User filters
  userFilters: {
    searchTerm: string;
    statusFilter: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
  };
  
  // Group filters
  groupFilters: {
    searchTerm: string;
    statusFilter: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
  };
  
  // Pagination
  userPaginationModel: GridPaginationModel;
  setUserPaginationModel: (model: GridPaginationModel) => void;
  groupPaginationModel: GridPaginationModel;
  setGroupPaginationModel: (model: GridPaginationModel) => void;
  
  // Reset functions
  resetUserFilters: () => void;
  resetGroupFilters: () => void;
}

export const useUserManagementFilters = ({
  users,
  groups
}: UseUserManagementFiltersProps): UseUserManagementFiltersReturn => {
  // ============================================================================
  // USER FILTERS STATE
  // ============================================================================
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userPaginationModel, setUserPaginationModel] = useState<GridPaginationModel>({
    pageSize: 10,
    page: 0,
  });

  // ============================================================================
  // GROUP FILTERS STATE
  // ============================================================================
  
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [groupStatusFilter, setGroupStatusFilter] = useState('');
  const [groupPaginationModel, setGroupPaginationModel] = useState<GridPaginationModel>({
    pageSize: 10,
    page: 0,
  });

  // ============================================================================
  // RESET PAGINATION WHEN FILTERS CHANGE
  // ============================================================================
  
  useEffect(() => {
    setUserPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [userSearchTerm, userStatusFilter]);

  useEffect(() => {
    setGroupPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [groupSearchTerm, groupStatusFilter]);

  // ============================================================================
  // FILTER USERS
  // ============================================================================
  
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
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
  }, [users, userSearchTerm, userStatusFilter]);

  // ============================================================================
  // FILTER GROUPS
  // ============================================================================
  
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch = 
        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase());
      
      const matchesStatus = groupStatusFilter === '' || 
        (groupStatusFilter === 'active' && group.is_active) || 
        (groupStatusFilter === 'inactive' && !group.is_active);
      
      return matchesSearch && matchesStatus;
    });
  }, [groups, groupSearchTerm, groupStatusFilter]);

  // ============================================================================
  // RESET FUNCTIONS
  // ============================================================================
  
  const resetUserFilters = () => {
    setUserSearchTerm('');
    setUserStatusFilter('');
    setUserPaginationModel({ pageSize: 10, page: 0 });
  };

  const resetGroupFilters = () => {
    setGroupSearchTerm('');
    setGroupStatusFilter('');
    setGroupPaginationModel({ pageSize: 10, page: 0 });
  };

  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Filtered data
    filteredUsers,
    filteredGroups,
    
    // User filters
    userFilters: {
      searchTerm: userSearchTerm,
      statusFilter: userStatusFilter,
      onSearchChange: setUserSearchTerm,
      onStatusChange: setUserStatusFilter,
    },
    
    // Group filters
    groupFilters: {
      searchTerm: groupSearchTerm,
      statusFilter: groupStatusFilter,
      onSearchChange: setGroupSearchTerm,
      onStatusChange: setGroupStatusFilter,
    },
    
    // Pagination
    userPaginationModel,
    setUserPaginationModel,
    groupPaginationModel,
    setGroupPaginationModel,
    
    // Reset functions
    resetUserFilters,
    resetGroupFilters,
  };
};
