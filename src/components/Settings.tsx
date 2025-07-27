import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Tab, Tabs, Button, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, TextField, CircularProgress, Snackbar, Alert,
  Paper, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Divider, Card, CardHeader, CardContent, Fade, Backdrop, useTheme,
  FormControlLabel, Checkbox, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import PermissionGuard from './PermissionGuard';
import { SettingsAPI } from '../services/api';
import { 
  validateDecimalInput, 
  formatNumberDisplay, 
  getValidationError 
} from '../utils/inputValidation';

const Settings = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentSettingType, setCurrentSettingType] = useState('');  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    code: '',
    symbol: '',
    discount_percentage: 0,
    is_active: true,
    is_base: false,
    address: '',
    account_type: '',
    account_number: '',
    currency: '',
    initial_balance: 0
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  // Define the list of settings categories using useMemo to prevent re-creation on every render
  const settingsCategories = useMemo(() => [
    { id: 'expense-categories', label: 'Catégories de dépenses', endpoint: 'expense-categories' },
    { id: 'units', label: 'Unités de mesure', endpoint: 'units-of-measure' },
    { id: 'currencies', label: 'Devises', endpoint: 'currencies' },
    { id: 'payment-methods', label: 'Méthodes de paiement', endpoint: 'payment-methods' },
    { id: 'accounts', label: 'Comptes', endpoint: 'accounts' },
    { id: 'price-groups', label: 'Groupes de prix', endpoint: 'price-groups' },
    { id: 'product-categories', label: 'Catégories de produits', endpoint: 'product-categories' },
    { id: 'charge-types', label: 'Types de charges', endpoint: 'charge-types' },
    { id: 'client-groups', label: 'Groupes de clients', endpoint: 'client-groups' },
    { id: 'zones', label: 'Zones', endpoint: 'zones' },
  ], []);
  // Function to get data based on current tab
  const fetchData = useCallback(async () => {
    const currentCategory = settingsCategories[tabValue];
    if (!currentCategory) return;
    setLoadingData(true);
    try {
      const responseData = await SettingsAPI.getSettings(currentCategory.endpoint);
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (error) {
      console.error(`Error fetching ${currentCategory.endpoint}:`, error);
      setNotification({
        open: true,
        message: `Erreur lors du chargement des données: ${error.message}`,
        severity: 'error'
      });
      // Always set data to empty array on error
      setData([]);
    } finally {
      setLoadingData(false);
    }
  }, [tabValue, settingsCategories]);

  // Load currencies for account form
  const fetchCurrencies = useCallback(async () => {
    if (settingsCategories[tabValue]?.endpoint === 'accounts') {
      try {
        const currenciesData = await SettingsAPI.getSettings('currencies');
        setCurrencies(Array.isArray(currenciesData) ? currenciesData : []);
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    }
  }, [tabValue, settingsCategories]);

  // Load data when tab changes
  useEffect(() => {
    fetchData();
    // Check if we need to load currencies for accounts tab
    if (settingsCategories[tabValue]?.endpoint === 'accounts') {
      fetchCurrencies();
    }
  }, [tabValue, fetchData, fetchCurrencies, settingsCategories]);

  // Function to get setting type based on current tab
  const getSettingType = () => {
    return settingsCategories[tabValue]?.label || '';
  };

  // Function to get API endpoint based on current tab
  const getEndpoint = () => {
    return settingsCategories[tabValue]?.endpoint || '';
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setCurrentSettingType(getSettingType());
  };
  // Handle opening add dialog
  const handleAddClick = () => {
    // Reset form data with default values for all possible fields
    setFormData({
      name: '',
      description: '',
      code: '',
      symbol: '',
      discount_percentage: 0,
      is_active: true,
      is_base: false,
      address: '',
      account_type: '',
      account_number: '',
      currency: '',
      initial_balance: 0
    });
    setCurrentSettingType(getSettingType());
    
    // Fetch currencies if we're adding an account
    if (getEndpoint() === 'accounts') {
      fetchCurrencies();
    }
    
    setShowAddDialog(true);  };

  // Handle opening edit dialog
  const handleEditClick = (item) => {
    setCurrentItem(item);
    // Initialize form with all possible fields from the item
    setFormData({
      name: item.name || '',
      description: item.description || '',
      code: item.code || '',
      symbol: item.symbol || '',
      discount_percentage: item.discount_percentage || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
      is_base: item.is_base !== undefined ? item.is_base : false,
      address: item.address || '',
      account_type: item.account_type || '',
      account_number: item.account_number || '',
      currency: item.currency || '',
      initial_balance: item.initial_balance || 0
    });
    setCurrentSettingType(getSettingType());
    
    // Fetch currencies if we're editing an account
    if (getEndpoint() === 'accounts') {
      fetchCurrencies();
    }
    
    setShowEditDialog(true);
  };

  // Handle opening delete dialog
  const handleDeleteClick = (item) => {
    setCurrentItem(item);
    setCurrentSettingType(getSettingType());
    setShowDeleteDialog(true);
  };

  // Handle closing dialogs
  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setShowDeleteDialog(false);
  };

  // Handle form field changes
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle submit (add or edit)
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const endpoint = getEndpoint();
      if (!endpoint) throw new Error("No endpoint specified");
      
      if (showAddDialog) {
        // Add new item
        await SettingsAPI.createSetting(endpoint, formData);
        setNotification({
          open: true,
          message: `${currentSettingType} ajouté avec succès`,
          severity: 'success'
        });
      } else {
        // Edit existing item
        await SettingsAPI.updateSetting(endpoint, currentItem.id, formData);
        setNotification({
          open: true,
          message: `${currentSettingType} modifié avec succès`,
          severity: 'success'
        });
      }
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error during save operation:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleCloseDialog();
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const endpoint = getEndpoint();
      if (!endpoint) throw new Error("No endpoint specified");
      
      await SettingsAPI.deleteSetting(endpoint, currentItem.id);
      setNotification({
        open: true,
        message: `${currentSettingType} supprimé avec succès`,
        severity: 'success'
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error during delete operation:', error);
      setNotification({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
      handleCloseDialog();
    }
  };

  // Handle closing notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Function to render form fields based on the current tab
  const renderFormFields = () => {
    const currentEndpoint = getEndpoint();
    
    // Common fields for all settings
    const commonFields = (
      <TextField 
        name="name"
        label="Nom"
        value={formData.name}
        onChange={handleFormChange}
        fullWidth
        margin="normal"
        variant="outlined"
        required
      />
    );

    // Additional fields for specific settings
    switch (currentEndpoint) {
      case 'currencies':
        return (
          <>
            {commonFields}
            <TextField 
              name="code"
              label="Code (ex: USD, EUR)"
              value={formData.code}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              inputProps={{ maxLength: 3 }}
              helperText="Code à 3 caractères (ex: USD, EUR)"
            />
            <TextField 
              name="symbol"
              label="Symbole (ex: $, €)"
              value={formData.symbol}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              inputProps={{ maxLength: 5 }}
              helperText="Symbole monétaire (ex: $, €)"
            />
          </>
        );
      case 'price-groups':
        return (
          <>
            {commonFields}
            <TextField 
              name="discount_percentage"
              label="Pourcentage de remise"
              value={formatNumberDisplay(formData.discount_percentage)}
              onChange={(e) => {
                const newValue = validateDecimalInput(e.target.value, formData.discount_percentage);
                setFormData({...formData, discount_percentage: newValue});
              }}
              type="text"
              fullWidth
              margin="normal"
              variant="outlined"
              error={formData.discount_percentage < 0 || formData.discount_percentage > 100}
              helperText={
                formData.discount_percentage < 0 ? "Le pourcentage doit être positif" :
                formData.discount_percentage > 100 ? "Le pourcentage ne peut pas dépasser 100" : ""
              }
            />
            <TextField 
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.is_base || false} 
                  onChange={(e) => setFormData({...formData, is_base: e.target.checked})}
                  name="is_base" 
                />
              }
              label="Groupe de prix de base"
            />
          </>
        );
      case 'units-of-measure':
        return (
          <>
            {commonFields}
            <TextField 
              name="symbol"
              label="Symbole de l'unité de mesure"
              value={formData.symbol}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
            />
          </>
        );
      case 'zones':
        return (
          <>
            {commonFields}
            <TextField 
              name="address"
              label="Adresse"
              value={formData.address || ''}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              multiline
              rows={2}
            />
            <TextField 
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
          </>
        );
      case 'accounts':
        return (
          <>
            {commonFields}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="account-type-label">Type de compte</InputLabel>
              <Select
                labelId="account-type-label"
                name="account_type"
                value={formData.account_type}
                onChange={handleFormChange}
                label="Type de compte"
              >
                <MenuItem value="internal">Compte Interne</MenuItem>
                <MenuItem value="bank">Compte Bancaire</MenuItem>
                <MenuItem value="cash">Caisse</MenuItem>
                <MenuItem value="client">Compte Client</MenuItem>
                <MenuItem value="supplier">Compte Fournisseur</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="currency-label">Devise</InputLabel>
              <Select
                labelId="currency-label"
                name="currency"
                value={formData.currency}
                onChange={handleFormChange}
                label="Devise"
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.id} value={currency.id}>
                    {currency.name} ({currency.symbol})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField 
              name="initial_balance"
              label="Solde initial"
              value={formatNumberDisplay(formData.initial_balance || 0)}
              onChange={(e) => {
                const newValue = validateDecimalInput(e.target.value, formData.initial_balance || 0);
                setFormData({...formData, initial_balance: newValue});
              }}
              type="text"
              fullWidth
              margin="normal"
              variant="outlined"
              error={(formData.initial_balance || 0) < 0}
              helperText={getValidationError(formData.initial_balance || 0, 'price')}
            />
            
            <TextField 
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={formData.is_active} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  name="is_active" 
                />
              }
              label="Actif"
            />
          </>
        );
      default:
        return (
          <>
            {commonFields}
            <TextField 
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
          </>
        );
    }
  };

  return (
    <PermissionGuard requiredPermission="change_user" fallbackPath="/">
      <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Paramètres du système
        </Typography>

        <Paper elevation={2} sx={{ mb: 3, p: 1 }}>          <Tabs 
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            {settingsCategories.map((category) => (
              <Tab key={category.id} label={category.label} />
            ))}
          </Tabs>
        </Paper>

        <Card elevation={3}>
          <CardHeader 
            title={getSettingType()}
            action={
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddClick}
                sx={{ borderRadius: '20px' }}
              >
                Ajouter
              </Button>
            }
          />
          <CardContent>
            {loadingData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : data.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ p: 3 }}>
                Aucun élément trouvé
              </Typography>
            ) : (
              <List>
                {Array.isArray(data) ? data.map((item) => (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText 
                        primary={item.name} 
                        secondary={item.description || item.symbol || item.code} 
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit" 
                          onClick={() => handleEditClick(item)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDeleteClick(item)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                )) : (
                  <Typography color="error" align="center">
                    Erreur de format des données
                  </Typography>
                )}
              </List>
            )}
          </CardContent>
        </Card>

        <Dialog 
          open={showAddDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          TransitionComponent={Fade}
          keepMounted={false}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.12)',
              backgroundColor: theme.palette.background.paper
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.primary.main, 
            color: theme.palette.primary.contrastText,
            fontWeight: 'bold' 
          }}>
            Ajouter {currentSettingType}
          </DialogTitle>
          <DialogContent dividers sx={{ 
            p: 3, 
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Box sx={{ pt: 1 }}>
              {renderFormFields()}
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.02)'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              disabled={loading}
              variant="outlined"
              sx={{ borderRadius: '20px' }}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={loading || !formData.name || 
                (getEndpoint() === 'currencies' && (!formData.code || !formData.symbol)) ||
                (getEndpoint() === 'units-of-measure' && !formData.symbol) ||
                (getEndpoint() === 'accounts' && (!formData.account_type || !formData.currency))}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
              sx={{ 
                borderRadius: '20px',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 2px 5px rgba(0,0,0,0.2)' 
                  : '0 2px 5px rgba(0,0,0,0.05)',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 10px rgba(0,0,0,0.3)' 
                    : '0 4px 10px rgba(0,0,0,0.1)'
                }
              }}
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showEditDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.12)',
              backgroundColor: theme.palette.background.paper
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.info.main, 
            color: '#fff',
            fontWeight: 'bold'
          }}>
            Modifier {currentSettingType}
          </DialogTitle>
          <DialogContent dividers sx={{ 
            p: 3, 
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Box sx={{ pt: 1 }}>
              {renderFormFields()}
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.02)'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              disabled={loading}
              variant="outlined"
              sx={{ borderRadius: '20px' }}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={loading || !formData.name || 
                (getEndpoint() === 'currencies' && (!formData.code || !formData.symbol)) ||
                (getEndpoint() === 'units-of-measure' && !formData.symbol) ||
                (getEndpoint() === 'accounts' && (!formData.account_type || !formData.currency))}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
              sx={{ 
                borderRadius: '20px',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 2px 5px rgba(0,0,0,0.2)' 
                  : '0 2px 5px rgba(0,0,0,0.05)',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 10px rgba(0,0,0,0.3)' 
                    : '0 4px 10px rgba(0,0,0,0.1)'
                }
              }}
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showDeleteDialog} 
          onClose={handleCloseDialog}
          TransitionComponent={Fade}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 30px rgba(0,0,0,0.3)' 
                : '0 8px 30px rgba(0,0,0,0.12)',
              backgroundColor: theme.palette.background.paper
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.error.main, 
            color: '#fff',
            fontWeight: 'bold'
          }}>
            Confirmation de suppression
          </DialogTitle>
          <DialogContent sx={{ 
            p: 3, 
            mt: 2, 
            backgroundColor: theme.palette.background.paper 
          }}>
            <DialogContentText color="text.primary" sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir supprimer <strong>{currentItem?.name}</strong> ?
            </DialogContentText>
            
            <Alert severity="error">
              Cette action est irréversible.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.02)'
          }}>
            <Button 
              onClick={handleCloseDialog} 
              disabled={deleteLoading}
              variant="outlined"
              sx={{ borderRadius: '20px' }}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDelete}
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              sx={{ 
                borderRadius: '20px',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 2px 5px rgba(0,0,0,0.2)' 
                  : '0 2px 5px rgba(0,0,0,0.05)',
                '&:hover': {
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 10px rgba(0,0,0,0.3)' 
                    : '0 4px 10px rgba(0,0,0,0.1)'
                }
              }}
            >
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity} 
            sx={{ 
              width: '100%',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(0,0,0,0.3)' 
                : '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: 2
            }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
        
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(0, 0, 0, 0.6)'
          }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
       
      </Box>
    </PermissionGuard>
  );
};

export default Settings;