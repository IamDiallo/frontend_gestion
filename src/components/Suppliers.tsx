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
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Supplier } from '../interfaces/business';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import PermissionButton from './common/PermissionButton';

// Mock data for suppliers
const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Fournisseur ABC',
    contact_person: 'Jean Dupont',
    email: 'jean@abc.com',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue de la Paix, Paris',
    is_active: true
  },
  {
    id: 2,
    name: 'Société XYZ',
    contact_person: 'Marie Martin',
    email: 'marie@xyz.com',
    phone: '+33 2 34 56 78 90',
    address: '456 Avenue des Champs, Lyon',
    is_active: true
  }
];

const initialFormState: Omit<Supplier, 'id'> = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  is_active: true
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

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      // Simulate API call with our mock data
      setTimeout(() => {
        setSuppliers(mockSuppliers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des fournisseurs',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        is_active: supplier.is_active
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editMode && currentId) {
        // Mise à jour d'un fournisseur existant
        // Remplacer par l'appel API réel
        // await fetch(`/api/suppliers/${currentId}/`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        
        // Mise à jour locale en attendant l'API
        setSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === currentId ? { ...formData, id: currentId } : supplier
          )
        );
        
        setSnackbar({
          open: true,
          message: 'Fournisseur mis à jour avec succès',
          severity: 'success'
        });
      } else {
        // Création d'un nouveau fournisseur
        // Remplacer par l'appel API réel
        // const response = await fetch('/api/suppliers/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        // const newSupplier = await response.json();
        
        // Création locale en attendant l'API
        const newSupplier = {
          ...formData,
          id: suppliers.length > 0 ? Math.max(...suppliers.map(s => s.id)) + 1 : 1
        };
        
        setSuppliers(prev => [...prev, newSupplier]);
        
        setSnackbar({
          open: true,
          message: 'Fournisseur ajouté avec succès',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving supplier:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'enregistrement du fournisseur',
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