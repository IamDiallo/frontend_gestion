import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  InputLabel,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
  import type { SelectChangeEvent } from '@mui/material/Select';

import { useTheme } from '@mui/material/styles';
import { Supplier } from '../interfaces/business';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import PermissionButton from './common/PermissionButton';
import { SuppliersAPI } from '../services/api';
import { AccountsAPI } from '../services/api';

const initialFormState: Omit<Supplier, 'id'> = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  is_active: true,
  account: undefined // Add account field
};

const Suppliers = () => {
  const theme = useTheme();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleAccountChange = (e: SelectChangeEvent<number>) => {
    setFormData(prev => ({ ...prev, account: e.target.value === '' ? undefined : Number(e.target.value) }));
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
    } catch (error: any) {
      let errorMessage = 'Erreur lors de l\'enregistrement du fournisseur';
      if (error && error.response && error.response.data) {
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

  return (
    <PermissionGuard requiredPermission="view_suppliers" fallbackPath="/">
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
            <TextField
              label="Rechercher"
              variant="outlined"
              size="small"
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
            />            <PermissionButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              requiredPermission="add_supplier"
            >
              Ajouter un fournisseur
            </PermissionButton>
          </Box>

          {/* Suppliers listing */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>
                        <Chip 
                          label={supplier.is_active ? 'Actif' : 'Inactif'} 
                          color={supplier.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDialog(supplier)}
                          disabled={!canEditSupplier}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(supplier.id!)}
                          disabled={!canDeleteSupplier}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add/Edit Supplier Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 'bold'
          }}>
            {editMode ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                name="name"
                label="Nom du fournisseur"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                name="contact_person"
                label="Personne de contact"
                fullWidth
                value={formData.contact_person}
                onChange={handleInputChange}
              />
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
                type="email"
              />
              <TextField
                name="phone"
                label="Téléphone"
                fullWidth
                value={formData.phone}
                onChange={handleInputChange}
              />
              <TextField
                name="address"
                label="Adresse"
                fullWidth
                value={formData.address}
                onChange={handleInputChange}
                multiline
                rows={2}
                sx={{ gridColumn: '1 / span 2' }}
              />
              {/* Account select styled like Clients.tsx */}
              <FormControl fullWidth required sx={{ gridColumn: '1 / span 2' }}>
                <InputLabel id="account-label">Compte fournisseur</InputLabel>
                <Select
                  labelId="account-label"
                  name="account"
                  value={formData.account ?? ''}
                  onChange={handleAccountChange}
                  label="Compte fournisseur"
                  MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                >
                  <MenuItem value="">Sélectionner un compte</MenuItem>
                  {loadingAccounts ? (
                    <MenuItem disabled>Chargement des comptes...</MenuItem>
                  ) : availableAccounts && Array.isArray(availableAccounts) && availableAccounts.length === 0 ? (
                    <MenuItem disabled>Aucun compte fournisseur disponible</MenuItem>
                  ) : (
                    availableAccounts && Array.isArray(availableAccounts) && availableAccounts.map(account => (
                      <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                    ))
                  )}
                </Select>
                {availableAccounts && Array.isArray(availableAccounts) && availableAccounts.length === 0 && !loadingAccounts && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    Aucun compte fournisseur disponible. Veuillez d'abord créer un compte de type fournisseur dans la section Trésorerie.
                  </Typography>
                )}
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ borderRadius: '20px' }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={!formData.name}
              sx={{ 
                borderRadius: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(0,0,0,0.15)'
                }
              }}
            >
              {editMode ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

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