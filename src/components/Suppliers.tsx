import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment
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

import { Supplier } from '../interfaces/business';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import { SuppliersAPI } from '../services/api';
import { AccountsAPI } from '../services/api';

const initialFormState: Omit<Supplier, 'id'> = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  is_active: true,
  account: undefined
};

const Suppliers = () => {
  const { canPerform } = usePermissionCheck();

  const canEditSupplier = canPerform('change_supplier');
  const canDeleteSupplier = canPerform('delete_supplier');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [availableAccounts, setAvailableAccounts] = useState<{ id: number; name: string }[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Pagination state for DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Suppliers DataGrid columns
  const suppliersColumns: GridColDef[] = [
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
          <IconButton 
            color="primary" 
            size="small" 
            sx={{ mr: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(params.row);
            }}
            disabled={!canEditSupplier}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            color="error" 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.row.id!);
            }}
            disabled={!canDeleteSupplier}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await SuppliersAPI.getAll();
        setSuppliers(data);
      } catch (err) {
        console.error('Error loading clients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch available accounts of type "supplier"
  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const accounts = await AccountsAPI.getByType('supplier');
        // Filter out accounts already assigned to suppliers
        const usedAccountIds = suppliers.filter(s => s.account !== undefined).map(s => s.account);
        const available = accounts.filter(a => !usedAccountIds.includes(a.id));
        // Only map id and name to match the expected type
        setAvailableAccounts(
          available.map((a: { id?: number; name?: string }) => ({
            id: a.id ?? 0,
            name: a.name ?? '',
          }))
        );
      } catch (err) {
        console.error('Error loading available accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };
    if (openDialog) {
      fetchAvailableAccounts();
    }
  }, [openDialog, suppliers]);

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        is_active: supplier.is_active,
        account: supplier.account
      });      setEditMode(true);
      setCurrentId(supplier.id!);
    } else {
      setFormData(initialFormState);
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

  // Handle form data changes for ContactDialog
  const handleFormDataChange = (data: typeof formData) => {
    setFormData(data);
  };

  const handleSubmit = async () => {
    try {
      // Require account field
      if (!formData.account) {
        setSnackbar({
          open: true,
          message: 'Le compte fournisseur est requis',
          severity: 'error'
        });
        return;
      }
      if (editMode && currentId) {
        // Update supplier via API
        await SuppliersAPI.update(currentId, formData as Supplier);
        const data = await SuppliersAPI.getAll();
        setSuppliers(data);
        setSnackbar({
          open: true,
          message: 'Fournisseur mis à jour avec succès',
          severity: 'success'
        });
      } else {
        // Add supplier via API
        await SuppliersAPI.create(formData as Supplier);
        const data = await SuppliersAPI.getAll();
        setSuppliers(data);
        setSnackbar({
          open: true,
          message: 'Fournisseur ajouté avec succès',
          severity: 'success'
        });
      }
      handleCloseDialog();
    } catch (error: unknown) {
      let errorMessage = 'Erreur lors de l\'enregistrement du fournisseur';
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

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur?')) {
      try {
        // Remplacer par l'appel API réel
        // await fetch(`/api/suppliers/${id}/`, {
        //   method: 'DELETE'
        // });
        
        // Suppression locale en attendant l'API
        setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
        
        setSnackbar({
          open: true,
          message: 'Fournisseur supprimé avec succès',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting supplier:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors de la suppression du fournisseur',
          severity: 'error'
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle row click to edit supplier
  const handleRowClick = (params: { row: Supplier }) => {
    if (canEditSupplier) {
      handleOpenDialog(params.row);
    }
  };

  return (
    <PermissionGuard requiredPermission="view_supplier" fallbackPath="/">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gestion des Fournisseurs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez vos relations avec les fournisseurs
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <StandardTextField
              label={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: '300px' }}
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
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              disabled={!canPerform('add_supplier')}
            >
              {t('addSupplier')}
            </StandardButton>
          </Box>

          {/* Suppliers listing */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <StandardDataGrid
              rows={filteredSuppliers}
              columns={suppliersColumns}
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

        {/* Add/Edit Supplier Dialog */}
        <ContactDialog
          open={openDialog}
          editMode={editMode}
          contactType="supplier"
          formData={formData}
          availableAccounts={availableAccounts}
          loadingAccounts={loadingAccounts}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          onAccountChange={handleAccountChange}
        />

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

export default Suppliers;