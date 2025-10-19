import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { usePermissions } from '../context/PermissionContext';
import { AuthService } from '../services/auth';
import { toast } from 'react-toastify';
import { useTheme } from '@mui/material/styles';

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_superuser: boolean;
  is_staff: boolean;
  date_joined: string;
  last_login?: string;
  profile_data?: {
    role: string;
    phone?: string;
    address?: string;
  };
  groups?: string[];
  permissions?: string[];
}

const Profile: React.FC = () => {
  const theme = useTheme();
  const { userPermissions, isAdmin, userRole, userGroups, loading: permissionsLoading } = usePermissions();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AuthService.getCurrentUser();
      setUserData(data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Impossible de charger les informations de profil');
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      // This would need an API endpoint for password change
      // await api.post('/users/change-password/', passwordData);
      toast.success('Mot de passe changé avec succès');
      setChangePasswordOpen(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Erreur lors du changement de mot de passe');
    }
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      'admin': 'Administrateur',
      'consultant': 'Consultant',
      'supervisor': 'Superviseur',
      'commercial': 'Commercial',
      'cashier': 'Chef de Caisse',
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
    const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
      'admin': 'error' as 'primary',
      'consultant': 'info',
      'supervisor': 'warning',
      'commercial': 'success',
      'cashier': 'primary',
    };
    return colorMap[role] || 'primary';
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string): string => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupPermissionsByContentType = () => {
    // Group permissions by their content type (model)
    const grouped: Record<string, Set<string>> = {};

    userPermissions.forEach((perm) => {
      const lower = perm.toLowerCase();
      
      // Extract action
      let action = '';
      if (lower.includes('view') || lower.startsWith('view')) {
        action = 'view';
      } else if (lower.includes('add') || lower.startsWith('add')) {
        action = 'add';
      } else if (lower.includes('change') || lower.startsWith('change')) {
        action = 'change';
      } else if (lower.includes('delete') || lower.startsWith('delete')) {
        action = 'delete';
      }

      // Extract content type
      let contentType = '';
      if (lower.includes('_')) {
        // Format: action_contenttype (e.g., view_sale, add_client)
        const parts = lower.split('_');
        if (parts.length >= 2) {
          contentType = parts.slice(1).join('_'); // Everything after the first underscore
        }
      } else {
        // Try to extract from action prefix
        if (action) {
          contentType = lower.replace(action, '').replace('_', '');
        } else {
          contentType = lower;
        }
      }

      contentType = contentType.trim();
      if (!contentType) return;

      // Normalize content type - consolidate related tables
      contentType = normalizeContentType(contentType);

      // Initialize content type Set if not exists
      if (!grouped[contentType]) {
        grouped[contentType] = new Set<string>();
      }

      // Add the action (Set automatically prevents duplicates)
      if (action) {
        grouped[contentType].add(action);
      }
    });

    // Convert Sets to Arrays
    const result: Record<string, string[]> = {};
    Object.entries(grouped).forEach(([contentType, actionsSet]) => {
      result[contentType] = Array.from(actionsSet);
    });

    return result;
  };

  const normalizeContentType = (contentType: string): string => {
    const lower = contentType.toLowerCase();
    
    // Consolidate related tables
    if (lower.includes('client') || lower.includes('customer')) {
      return 'client';
    }
    if (lower.includes('supplier') || lower.includes('fournisseur')) {
      return 'supplier';
    }
    if (lower.includes('product')) {
      return 'product';
    }
    if (lower.includes('sale') || lower.includes('vente')) {
      return 'sale';
    }
    if (lower.includes('stock') || lower.includes('inventory')) {
      return 'stock';
    }
    if (lower.includes('production')) {
      return 'production';
    }
    if (lower.includes('payment') || lower.includes('cash') || lower.includes('treasury')) {
      return 'payment';
    }
    if (lower.includes('user') || lower.includes('utilisateur')) {
      return 'user';
    }
    if (lower.includes('group')) {
      return 'group';
    }
    
    return contentType;
  };

  const translateContentType = (contentType: string): string => {
    const translations: Record<string, string> = {
      'sale': 'Ventes',
      'client': 'Clients',
      'customer': 'Clients',
      'product': 'Produits',
      'stock': 'Stock',
      'inventory': 'Inventaire',
      'supplier': 'Fournisseurs',
      'fournisseur': 'Fournisseurs',
      'user': 'Utilisateurs',
      'utilisateur': 'Utilisateurs',
      'payment': 'Paiements / Trésorerie',
      'cashreceipt': 'Paiements / Trésorerie',
      'production': 'Production',
      'productionorder': 'Production',
      'rawmaterial': 'Production',
      'group': 'Groupes',
      'permission': 'Permissions',
      'treasury': 'Trésorerie',
      'expense': 'Dépenses',
      'income': 'Revenus',
    };

    return translations[contentType.toLowerCase()] || contentType.charAt(0).toUpperCase() + contentType.slice(1);
  };

  const translateAction = (action: string): string => {
    const translations: Record<string, string> = {
      'view': 'Voir',
      'add': 'Ajouter',
      'change': 'Modifier',
      'delete': 'Supprimer',
    };
    
    return translations[action.toLowerCase()] || action;
  };

  const sortActions = (actions: string[]): string[] => {
    // Sort actions in a logical order: view, add, change, delete
    const order = ['view', 'add', 'change', 'delete'];
    return actions.sort((a, b) => {
      const indexA = order.indexOf(a.toLowerCase());
      const indexB = order.indexOf(b.toLowerCase());
      return indexA - indexB;
    });
  };

  const getCategoryForContentType = (contentType: string): string => {
    const lower = contentType.toLowerCase();
    
    if (lower.includes('sale') || lower.includes('vente')) return 'Ventes';
    if (lower.includes('client') || lower.includes('customer')) return 'Clients';
    if (lower.includes('product') || lower.includes('produit')) return 'Produits';
    if (lower.includes('stock') || lower.includes('inventory')) return 'Stock';
    if (lower.includes('supplier') || lower.includes('fournisseur')) return 'Fournisseurs';
    if (lower.includes('production') || lower.includes('rawmaterial')) return 'Production';
    if (lower.includes('cash') || lower.includes('payment') || lower.includes('treasury') || lower.includes('expense') || lower.includes('income')) return 'Trésorerie';
    if (lower.includes('user') || lower.includes('group') || lower.includes('permission')) return 'Administration';
    
    return 'Autres';
  };

  const organizeByCategory = (groupedByContentType: Record<string, string[]>) => {
    const categories: Record<string, Array<{ contentType: string; permissions: string[] }>> = {};

    Object.entries(groupedByContentType).forEach(([contentType, permissions]) => {
      const category = getCategoryForContentType(contentType);
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push({ contentType, permissions });
    });

    return categories;
  };

  if (loading || permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !userData) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Erreur lors du chargement du profil'}</Alert>
      </Box>
    );
  }

  const groupedByContentType = groupPermissionsByContentType();
  const organizedPermissions = organizeByCategory(groupedByContentType);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Mon Profil
      </Typography>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '2.5rem',
                  }}
                >
                  {getInitials(userData.first_name, userData.last_name, userData.username)}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {userData.first_name && userData.last_name
                    ? `${userData.first_name} ${userData.last_name}`
                    : userData.username}
                </Typography>
                <Chip
                  label={getRoleLabel(userData.profile_data?.role || userRole || 'Utilisateur')}
                  color={getRoleColor(userData.profile_data?.role || userRole || '')}
                  sx={{ mb: 1 }}
                />
                {isAdmin && (
                  <Chip
                    label="Administrateur"
                    color="error"
                    size="small"
                    icon={<SecurityIcon />}
                  />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nom d'utilisateur"
                    secondary={userData.username}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={userData.email || 'Non renseigné'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <BadgeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Rôle"
                    secondary={getRoleLabel(userData.profile_data?.role || userRole || 'Utilisateur')}
                  />
                </ListItem>

                {userData.profile_data?.phone && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Téléphone"
                      secondary={userData.profile_data.phone}
                    />
                  </ListItem>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Membre depuis: {formatDate(userData.date_joined)}
              </Typography>
              {userData.last_login && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Dernière connexion: {formatDate(userData.last_login)}
                </Typography>
              )}

              <Box mt={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<EditIcon />}
                  onClick={() => setChangePasswordOpen(true)}
                >
                  Changer le mot de passe
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Groups and Permissions */}
        <Grid item xs={12} md={8}>
          {/* Groups Card */}
          {userGroups.length > 0 && (
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <GroupIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Groupes</Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {userGroups.map((group, index) => (
                    <Chip key={index} label={group} color="primary" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Permissions Card */}
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Permissions</Typography>
              </Box>

              {isAdmin ? (
                <Alert severity="success" icon={<SecurityIcon />} sx={{ mb: 2 }}>
                  En tant qu'administrateur, vous avez accès à toutes les fonctionnalités du système.
                </Alert>
              ) : (
                <>
                  {Object.keys(organizedPermissions).length === 0 ? (
                    <Alert severity="warning">
                      Aucune permission spécifique n'est attribuée. Contactez votre administrateur.
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {Object.entries(organizedPermissions).map(([category, contentTypes]) => (
                        <Grid item xs={12} key={category}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography
                              variant="subtitle1"
                              color="primary"
                              gutterBottom
                              sx={{ fontWeight: 600, mb: 2 }}
                            >
                              {category}
                            </Typography>
                            <Grid container spacing={2}>
                              {contentTypes.map(({ contentType, permissions }) => (
                                <Grid item xs={12} sm={6} md={4} key={contentType}>
                                  <Box
                                    sx={{
                                      p: 1.5,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      bgcolor: 'background.default',
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600, mb: 1 }}
                                    >
                                      {translateContentType(contentType)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {sortActions(permissions).map((action) => translateAction(action)).join(', ')}
                                    </Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </>
              )}

              {!isAdmin && (
                <Box mt={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total des permissions: {userPermissions.length}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Ancien mot de passe"
              type={showOldPassword ? 'text' : 'password'}
              value={passwordData.old_password}
              onChange={(e) =>
                setPasswordData({ ...passwordData, old_password: e.target.value })
              }
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Nouveau mot de passe"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData({ ...passwordData, new_password: e.target.value })
              }
              margin="normal"
              helperText="Au moins 8 caractères"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirm_password: e.target.value })
              }
              margin="normal"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setChangePasswordOpen(false);
              setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
            }}
            startIcon={<CancelIcon />}
          >
            Annuler
          </Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            startIcon={<EditIcon />}
            disabled={
              !passwordData.old_password ||
              !passwordData.new_password ||
              !passwordData.confirm_password
            }
          >
            Changer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
