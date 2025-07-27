import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  StandardButton, 
  StandardDataGrid, 
  StandardTextField, 
  StatusChip,
  ContactDialog 
} from './common';
import { t } from '../utils/translations';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { ClientsAPI, AccountsAPI } from '../services/api';
import { Client, Account } from '../interfaces/business';
import { PriceGroup } from '../interfaces/products';
import { SnackbarState } from '../interfaces/common';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';

const Clients = () => {
  // Add permission checks
  const { canPerform } = usePermissionCheck();
  const canEditClient = canPerform('change_client');
  const canDeleteClient = canPerform('delete_client');

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    price_group: 1,
    account: undefined,
    is_active: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Define static price groups
  const priceGroups: PriceGroup[] = [
    { id: 1, name: 'Standard' },
    { id: 2, name: 'Premium' },
    { id: 3, name: 'VIP' }
  ];
  
  // Replace static accounts with dynamic ones
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Pagination state for DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Helper function to get price group name by ID
  const getPriceGroupName = (priceGroupId?: number): string => {
    if (!priceGroupId) return 'Aucun';
    const priceGroup = priceGroups.find(pg => pg.id === priceGroupId);
    return priceGroup ? priceGroup.name : 'Inconnu';
  };

  // Handle row click to edit client
  const handleRowClick = (params: { row: Client }) => {
    if (canEditClient) {
      handleOpenDialog(params.row);
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ClientsAPI.getAll();
        setClients(data);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError('Erreur lors du chargement des clients. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Add effect to load available client accounts
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      try {
        setLoadingAccounts(true);
        // Get client-type accounts that aren't assigned to clients yet
        const accounts = await AccountsAPI.getByType('client');
        
        // Filter out accounts that are already assigned to clients
        const usedAccountIds = clients.filter(c => c.account !== undefined).map(c => c.account);
        const availableAccounts = accounts.filter(a => !usedAccountIds.includes(a.id));
        
        setAvailableAccounts(availableAccounts);
      } catch (err) {
        console.error('Error loading available accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (openDialog) {
      fetchAvailableAccounts();
    }
  }, [openDialog, clients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setFormData({
        name: client.name,
        contact_person: client.contact_person,
        email: client.email,
        phone: client.phone,
        address: client.address,
        price_group: client.price_group,
        account: client.account,
        is_active: client.is_active
      });
      setEditMode(true);
      setCurrentId(client.id!);
    } else {
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        price_group: 1,
        account: undefined,
        is_active: true,
      });
      setEditMode(false);
      setCurrentId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAccountChange = (value: number | '') => {
    setFormData(prev => ({ ...prev, account: value === '' ? undefined : value }));
  };

  const handlePriceGroupChange = (value: number) => {
    setFormData(prev => ({ ...prev, price_group: value }));
  };

  // Handle form data changes for ContactDialog
  const handleFormDataChange = (data: typeof formData) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name) {
        setSnackbar({
          open: true,
          message: 'Le nom du client est requis',
          severity: 'error'
        });
        return;
      }
      
      if (!formData.contact_person) {
        setSnackbar({
          open: true,
          message: 'Le nom du contact est requis',
          severity: 'error'
        });
        return;
      }
      
      if (!formData.email) {
        setSnackbar({
          open: true,
          message: 'L\'email est requis',
          severity: 'error'
        });
        return;
      }
      
      if (!formData.phone) {
        setSnackbar({
          open: true,
          message: 'Le téléphone est requis',
          severity: 'error'
        });
        return;
      }
      
      if (!formData.address) {
        setSnackbar({
          open: true,
          message: 'L\'adresse est requise',
          severity: 'error'
        });
        return;
      }
      
      if (!formData.price_group) {
        setSnackbar({
          open: true,
          message: 'Le groupe de prix est requis',
          severity: 'error'
        });
        return;
      }

      if (editMode && currentId) {
        // Update client via API
        await ClientsAPI.update(currentId, formData as Client);
        const data = await ClientsAPI.getAll();
        setClients(data);
        setSnackbar({
          open: true,
          message: 'Client mis à jour avec succès',
          severity: 'success'
        });
      } else {
        // Add client via API
        await ClientsAPI.create(formData as Client);
        const data = await ClientsAPI.getAll();
        setClients(data);
        setSnackbar({
          open: true,
          message: 'Client ajouté avec succès',
          severity: 'success'
        });
      }
      handleCloseDialog();
    } catch (error: unknown) {
      let errorMessage = 'Erreur lors de l\'enregistrement du client';
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 
          'data' in error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
            .join('\n');
          if (errorMessages) errorMessage = `Erreurs: ${errorMessages}`;
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Snackbar close handler
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      setError(null);
      
      // Confirmation avant suppression
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${client.name}" ?`)) {
        return;
      }
      
      await ClientsAPI.delete(client.id!);
      setClients(clients.filter(c => c.id !== client.id));
      setSnackbar({
        open: true,
        message: 'Client supprimé avec succès',
        severity: 'success'
      });
    } catch (err: unknown) {
      console.error('Error deleting client:', err);
      
      let errorMessage = 'Erreur lors de la suppression du client.';
      
      // Vérifier si l'erreur contient des détails spécifiques de l'API
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data) {
        const errorData = err.response.data;
        
        if (typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = String(errorData.error);
          
          if ('detail' in errorData && errorData.detail) {
            errorMessage += ' ' + String(errorData.detail);
          }
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // DataGrid columns definition
  // Clients DataGrid columns
  const clientsColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('company'),
      flex: 1.2,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {params.row.name}
        </Typography>
      )
    },
    {
      field: 'contact_person',
      headerName: t('contactPerson'),
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.row.contact_person}
        </Typography>
      )
    },
    {
      field: 'phone',
      headerName: t('phone'),
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.row.phone}</Typography>
        </Box>
      )
    },
    {
      field: 'email',
      headerName: t('email'),
      flex: 1.2,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.row.email}</Typography>
        </Box>
      )
    },
    {
      field: 'address',
      headerName: t('address'),
      flex: 1.3,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <LocationIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
          <Typography variant="body2">{params.row.address}</Typography>
        </Box>
      )
    },
    {
      field: 'price_group',
      headerName: t('priceGroup'),
      flex: 0.8,
      valueGetter: (value, row) => getPriceGroupName(row.price_group)
    },
    {
      field: 'is_active',
      headerName: t('status'),
      flex: 0.7,
      renderCell: (params: GridRenderCellParams) => (
        <StatusChip 
          status={params.row.is_active ? 'active' : 'inactive'}
        />
      )
    },
    {
      field: 'actions',
      headerName: t('actions'),
      flex: 0.8,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('edit')}>
            <IconButton 
              color="primary" 
              size="small" 
              sx={{ mr: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(params.row);
              }}
              disabled={!canEditClient}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('delete')}>
            <IconButton 
              color="error" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClient(params.row);
              }}
              disabled={!canDeleteClient}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <PermissionGuard requiredPermission="view_client" fallbackPath="/">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestion des Clients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez votre portefeuille clients
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'flex-end' },
            mb: 3,
            gap: 2
          }}>
            <StandardTextField
              label={t('search')}
              placeholder="Nom, contact, email ou téléphone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: { md: 400 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <StandardButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={!canPerform('add_client')}
            >
              {t('addClient')}
            </StandardButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <StandardDataGrid
              rows={filteredClients}
              columns={clientsColumns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              loading={loading}
              getRowId={(row) => row.id || Math.random()}
              onRowClick={handleRowClick}
              sx={{
                minHeight: 400,
                '& .MuiDataGrid-row': {
                  cursor: 'pointer'
                }
              }}
            />
          )}
        </Paper>

        {/* Add/Edit Client Dialog */}
        <ContactDialog
          open={openDialog}
          editMode={editMode}
          contactType="client"
          formData={formData}
          availableAccounts={availableAccounts.map(a => ({ id: a.id, name: a.name }))}
          loadingAccounts={loadingAccounts}
          priceGroups={priceGroups}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          onAccountChange={handleAccountChange}
          onPriceGroupChange={handlePriceGroupChange}
        />

        {/* Snackbar pour les notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PermissionGuard>
  );
};

export default Clients;