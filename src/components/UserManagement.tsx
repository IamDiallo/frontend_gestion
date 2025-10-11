import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { usePermissions } from '../context/PermissionContext';
import PermissionGuard from './PermissionGuard';
import { TabPanelProps } from '../interfaces/common';
import { User, Group } from '../interfaces/users';

// Import custom hooks
import {
  useUserManagementData,
  useUserManagementFilters,
  useUserDialog,
  useGroupDialog,
} from '../hooks/userManagementHooks';

// Import utilities
import {
  getRoleColor,
  getRoleLabel,
  formatZones,
  formatGroups,
  getZoneName,
  extractErrorMessage,
  handleGroupError,
} from '../utils/userManagementUtils';

// TabPanel component
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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { hasPermission } = usePermissions();
  
  // Use custom hooks
  const userData = useUserManagementData();
  const filters = useUserManagementFilters({ 
    users: userData.users, 
    groups: userData.groups 
  });
  const userDialog = useUserDialog();
  const groupDialog = useGroupDialog();
  
  // Local UI state
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Permission checks
  const canEditUsers = hasPermission('change_user');
  const canCreateUsers = hasPermission('add_user');
  const canDeleteUsers = hasPermission('delete_user');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    userData.refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // USER HANDLERS
  // ============================================================================

  const handleAddUser = useCallback(() => {
    userDialog.openAddDialog();
  }, [userDialog]);

  const handleEditUser = useCallback(async (user: User) => {
    try {
      // Fetch the latest user data from API
      const latestUserData = await userData.fetchUserById(user.id!);
      userDialog.openEditDialog(latestUserData || user);
    } catch (error) {
      console.error('Error preparing user for edit:', error);
      userData.setError('Une erreur est survenue lors de la récupération des données de l\'utilisateur');
    }
  }, [userData, userDialog]);

  const handleDeleteUser = useCallback(async (user: User) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await userData.deleteUser(user.id!);
        setSnackbarMessage('Utilisateur supprimé avec succès');
      } catch (err) {
        console.error('Error deleting user:', err);
        userData.setError('Une erreur est survenue lors de la suppression de l\'utilisateur');
      }
    }
  }, [userData]);

  const handleSaveUser = async () => {
    if (!userDialog.selectedUser) return;

    try {
      if (userDialog.selectedUser.id) {
        // Update existing user
        const userToUpdate = userDialog.prepareUserDataForUpdate(userDialog.selectedUser);
        await userData.updateUser(userDialog.selectedUser.id, userToUpdate);
        setSnackbarMessage('Utilisateur modifié avec succès');
      } else {
        // Create new user
        const newUserData = userDialog.prepareUserDataForCreate(userDialog.selectedUser);
        await userData.createUser(newUserData);
        setSnackbarMessage('Utilisateur créé avec succès');
      }
      userDialog.closeDialog();
    } catch (err: unknown) {
      console.error('Error saving user:', err);
      const errorObj = err as { response?: { data?: unknown } };
      if (errorObj.response?.data) {
        const errorMessage = extractErrorMessage(errorObj.response.data);
        userData.setError(errorMessage || 'Une erreur est survenue lors de la sauvegarde de l\'utilisateur');
      } else {
        userData.setError('Une erreur est survenue lors de la sauvegarde de l\'utilisateur');
      }
    }
  };

  // ============================================================================
  // GROUP HANDLERS
  // ============================================================================

  const handleAddGroup = useCallback(() => {
    groupDialog.openAddDialog();
  }, [groupDialog]);

  const handleEditGroup = useCallback((group: Group) => {
    groupDialog.openEditDialog(group, userData.permissionIdMapping);
  }, [groupDialog, userData.permissionIdMapping]);

  const handleDeleteGroup = useCallback(async (group: Group) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      try {
        await userData.deleteGroup(group.id!);
        setSnackbarMessage('Groupe supprimé avec succès');
      } catch (err) {
        console.error('Error deleting group:', err);
        const errorMessage = handleGroupError(err);
        userData.setError(errorMessage);
      }
    }
  }, [userData]);

  const handleSaveGroup = async () => {
    try {
      const groupData = groupDialog.prepareGroupDataForSave();
      if (!groupData) return;

      if (groupDialog.selectedGroup?.id) {
        // Update existing group
        await userData.updateGroup(groupDialog.selectedGroup.id, groupData);
        setSnackbarMessage('Groupe modifié avec succès');
      } else {
        // Create new group
        await userData.createGroup(groupData);
        setSnackbarMessage('Groupe créé avec succès');
      }
      groupDialog.closeDialog();
    } catch (err) {
      const errorMessage = handleGroupError(err);
      userData.setError(errorMessage);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderGroupPermissions = useCallback((group: Group) => {
    if (!group || !group.permissions || !Array.isArray(group.permissions) || group.permissions.length === 0) {
      return <Typography variant="body2" color="text.secondary">Aucune</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {(group.permissions || []).slice(0, 3).map((permission, index) => {
          let permName = '';
          
          if (typeof permission === 'number') {
            permName = userData.permissionCodeMapping[permission] || `ID: ${permission}`;
          }
          
          // Find permission label from available permissions
          let label = permName;
          for (const category of userData.availablePermissions) {
            const perm = category.permissions.find(p => p.id === permission);
            if (perm) {
              label = `${category.name}: ${perm.name}`;
              break;
            }
          }
          
          return (
            <Chip
              key={`${group.id || 'new'}-perm-${index}-${permName}`}
              label={label}
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
  }, [userData.permissionCodeMapping, userData.availablePermissions]);

  const renderZoneMenuItems = () => {
    if (userData.loading) {
      return (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          Chargement des zones...
        </MenuItem>
      );
    }
    
    if (userData.zones.length === 0) {
      return <MenuItem disabled>Aucune zone disponible</MenuItem>;
    }
    
    return userData.zones.map(zone => (
      <MenuItem key={zone.id} value={zone.id}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1rem' }} />
          {zone.name}
        </Box>
      </MenuItem>
    ));
  };

  const renderPermissionSelector = () => (
    <Grid item xs={12}>
      <FormControl fullWidth>
        <InputLabel>Permissions</InputLabel>
        <Select
          multiple
          value={groupDialog.selectedGroup?.permissions || []}
          label="Permissions"
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as number[]).length > 0 ? (
                (selected as number[]).map((id) => {
                  const code = userData.permissionCodeMapping[id] || '';
                  let label = code;
                  let category = '';
                  
                  for (const cat of userData.availablePermissions) {
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
                        const code = userData.permissionCodeMapping[id];
                        if (code) groupDialog.togglePermission(code, userData.permissionIdMapping);
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
          onChange={() => {}}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 400, width: 400 }
            }
          }}
        >
          {userData.availablePermissions.length > 0 ? (
            userData.availablePermissions.map(category => [
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
                const isSelected = groupDialog.isPermissionSelected(fullCode, userData.permissionIdMapping);
                
                return (
                  <MenuItem 
                    key={fullCode} 
                    value={permission.id}
                    onClick={(e) => {
                      e.preventDefault();
                      groupDialog.togglePermission(fullCode, userData.permissionIdMapping);
                    }}
                    sx={{
                      padding: '8px 16px',
                      borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : 'none',
                      backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    }}
                  >
                    <Checkbox 
                      checked={isSelected} 
                      color="primary"
                      sx={{ padding: '4px' }}
                    />
                    <ListItemText 
                      primary={permission.name} 
                      secondary={fullCode}
                    />
                  </MenuItem>
                );
              })
            ])
          ) : (
            <MenuItem disabled>Chargement des permissions...</MenuItem>
          )}
        </Select>
      </FormControl>
    </Grid>
  );

  // ============================================================================
  // DATAGRID COLUMNS
  // ============================================================================

  const userColumns: GridColDef[] = useMemo(() => [
    { 
      field: 'username', 
      headerName: 'Utilisateur', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params || !params.row) return <></>;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" color="action" />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {params.row.username}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1,
      valueGetter: (value) => value || ''
    },
    { 
      field: 'role', 
      headerName: 'Rôle', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
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
    },
    { 
      field: 'zone', 
      headerName: 'Zone', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row) return 'Aucune zone';
        const zoneId = row.zone || row.profile_data?.zone;
        const zoneName = getZoneName(zoneId, userData.zones);
        return formatZones(zoneId, zoneName);
      }
    },
    { 
      field: 'groups', 
      headerName: 'Groupes', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || !row.groups) return 'Aucun groupe';
        return formatGroups(row.groups);
      }
    },
    { 
      field: 'is_active', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
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
  ], [userData.zones, canEditUsers, canDeleteUsers, handleEditUser, handleDeleteUser]);

  const groupColumns: GridColDef[] = useMemo(() => [
    { 
      field: 'name', 
      headerName: 'Nom du groupe', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
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
  ], [renderGroupPermissions, handleEditGroup, handleDeleteGroup]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PermissionGuard requiredPermission="view_user" fallbackPath="/">
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

        <Paper sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)}
              sx={{ px: 3, pt: 2 }}
            >
              <Tab icon={<PersonIcon />} iconPosition="start" label="Utilisateurs" />
              <Tab icon={<GroupIcon />} iconPosition="start" label="Groupes" />
            </Tabs>
          </Box>

          {/* Users Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                  <TextField
                    label="Rechercher"
                    placeholder="Nom d'utilisateur ou email"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={filters.userFilters.searchTerm}
                    onChange={(e) => filters.userFilters.onSearchChange(e.target.value)}
                  />
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filters.userFilters.statusFilter}
                      onChange={(e) => filters.userFilters.onStatusChange(e.target.value)}
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
                >
                  Nouvel utilisateur
                </Button>
              </Box>

              {userData.error && <Alert severity="error" sx={{ mb: 3 }}>{userData.error}</Alert>}
              {snackbarMessage && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSnackbarMessage(null)}>{snackbarMessage}</Alert>}

              {userData.loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={filters.filteredUsers}
                    columns={userColumns}
                    paginationModel={filters.userPaginationModel}
                    onPaginationModelChange={filters.setUserPaginationModel}
                    pageSizeOptions={[5, 10, 25]}
                  />
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Groups Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                  <TextField
                    label="Rechercher"
                    placeholder="Nom du groupe"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={filters.groupFilters.searchTerm}
                    onChange={(e) => filters.groupFilters.onSearchChange(e.target.value)}
                  />
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={filters.groupFilters.statusFilter}
                      onChange={(e) => filters.groupFilters.onStatusChange(e.target.value)}
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
                >
                  Nouveau groupe
                </Button>
              </Box>

              {userData.error && <Alert severity="error" sx={{ mb: 3 }}>{userData.error}</Alert>}
              {snackbarMessage && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSnackbarMessage(null)}>{snackbarMessage}</Alert>}

              {userData.loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={filters.filteredGroups}
                    columns={groupColumns}
                    paginationModel={filters.groupPaginationModel}
                    onPaginationModelChange={filters.setGroupPaginationModel}
                    pageSizeOptions={[5, 10, 25]}
                  />
                </Box>
              )}
            </Box>
          </TabPanel>
        </Paper>

        {/* User Dialog */}
        <Dialog open={userDialog.showDialog} onClose={userDialog.closeDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {userDialog.selectedUser?.id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nom d'utilisateur"
                  fullWidth
                  required
                  value={userDialog.selectedUser?.user?.username || ''}
                  onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, username: e.target.value }
                  } : null)}
                  InputProps={{ readOnly: !!userDialog.selectedUser?.id }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={userDialog.selectedUser?.user?.email || ''}
                  onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, email: e.target.value }
                  } : null)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prénom"
                  fullWidth
                  value={userDialog.selectedUser?.user?.first_name || ''}
                  onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, first_name: e.target.value }
                  } : null)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nom"
                  fullWidth
                  value={userDialog.selectedUser?.user?.last_name || ''}
                  onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, last_name: e.target.value }
                  } : null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mot de passe"
                  type={userDialog.showPassword ? "text" : "password"}
                  fullWidth
                  required={!userDialog.selectedUser?.id}
                  value={userDialog.selectedUser?.user?.password || ''}
                  onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                    ...prev, 
                    user: { ...prev.user, password: e.target.value }
                  } : null)}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={userDialog.togglePasswordVisibility} edge="end">
                        {userDialog.showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Rôle</InputLabel>
                  <Select
                    value={userDialog.selectedUser?.role || ''}
                    label="Rôle"
                    onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                      ...prev, 
                      role: e.target.value
                    } : null)}
                  >
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
                    value={userDialog.selectedUser?.zone || ''}
                    label="Zone"
                    onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
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
                <FormControl fullWidth>
                  <InputLabel>Groupes</InputLabel>
                  <Select
                    multiple
                    value={userDialog.selectedUser?.group_ids || []}
                    label="Groupes"
                    onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                      ...prev, 
                      group_ids: typeof e.target.value === 'string' ? [Number(e.target.value)] : e.target.value as number[]
                    } : null)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => (
                          <Chip key={value} label={userData.getGroupName(value)} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {userData.groups.map(group => (
                      <MenuItem key={group.id} value={group.id}>
                        <Checkbox checked={userDialog.selectedUser?.group_ids?.includes(group.id!)} />
                        <ListItemText primary={group.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={userDialog.selectedUser?.is_active ? "1" : "0"}
                    label="Statut"
                    onChange={(e) => userDialog.setSelectedUser(prev => prev ? {
                      ...prev, 
                      is_active: e.target.value === "1",
                      user: { ...prev.user, is_active: e.target.value === "1" }
                    } : null)}
                  >
                    <MenuItem value="1">Actif</MenuItem>
                    <MenuItem value="0">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={userDialog.closeDialog}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleSaveUser}
              disabled={
                !userDialog.selectedUser?.user?.username || 
                !userDialog.selectedUser?.user?.email || 
                !userDialog.selectedUser?.role ||
                (!userDialog.selectedUser?.id && !userDialog.selectedUser?.user?.password)
              }
            >
              {userDialog.selectedUser?.id ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Group Dialog */}
        <Dialog open={groupDialog.showDialog} onClose={groupDialog.closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {groupDialog.selectedGroup?.id ? 'Modifier le groupe' : 'Nouveau groupe'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nom du groupe"
                  fullWidth
                  required
                  value={groupDialog.selectedGroup?.name || ''}
                  onChange={(e) => groupDialog.setSelectedGroup(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </Grid>
              {renderPermissionSelector()}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={groupDialog.closeDialog}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleSaveGroup}
              disabled={!groupDialog.selectedGroup?.name}
            >
              {groupDialog.selectedGroup?.id ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  );
};

export default UserManagement;
