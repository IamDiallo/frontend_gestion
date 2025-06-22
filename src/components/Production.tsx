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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ProductionAPI, ProductsAPI } from '../services/api';
import { Production } from '../interfaces/production';
import { Product } from '../interfaces/products';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import PermissionButton from './common/PermissionButton';

const initialProductionState = {
  product: 0,
  quantity: 0,
  zone: Number(import.meta.env.VITE_DEFAULT_ZONE) || 1,
  date: new Date().toISOString().split('T')[0],
  notes: ''
};

const zones = [
  { id: 1, name: 'Atelier Principal' },
  { id: 2, name: 'Entrepôt Central' },
  { id: 3, name: 'Magasin Paris' },
  { id: 4, name: 'Magasin Lyon' }
];

const ProductionComponent = () => {
  const theme = useTheme();  const { canPerform } = usePermissionCheck();
  const canEditProduction = canPerform('change_production');
  const canDeleteProduction = canPerform('delete_production');
  const [productions, setProductions] = useState<Production[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialProductionState);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch productions
      const productionsData = await ProductionAPI.getAll();
      setProductions(productionsData);
      
      // Fetch products for the dropdown
      const productsData = await ProductsAPI.getAll();
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (production?: Production) => {
    if (production) {
      // Edit mode
      setFormData({
        product: production.product,
        quantity: production.quantity,
        zone: production.zone,
        date: production.date,
        notes: production.notes || ''
      });
      setEditMode(true);
      setCurrentId(production.id || null);
    } else {
      // Add mode
      setFormData(initialProductionState);
      setEditMode(false);
      setCurrentId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setError(null);
        const dataToSubmit = {
        ...formData,
        product: Number(formData.product),
        quantity: Number(formData.quantity),
        zone: Number(formData.zone),
        reference: editMode && currentId ? 
          (productions.find(p => p.id === currentId)?.reference || `PROD-${Date.now()}`) : 
          `PROD-${Date.now()}`
      };
      
      if (editMode && currentId) {
        // Update existing production
        const updated = await ProductionAPI.update(currentId, dataToSubmit);
        setProductions(prev => prev.map(p => p.id === currentId ? updated : p));
        setSnackbar({
          open: true,
          message: 'Production mise à jour avec succès',
          severity: 'success'
        });
      } else {
        // Create new production
        const created = await ProductionAPI.create(dataToSubmit);
        setProductions(prev => [...prev, created]);
        setSnackbar({
          open: true,
          message: 'Production ajoutée avec succès',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving production:', err);
      setError('Erreur lors de l\'enregistrement de la production');
    }
  };

  const handleDelete = async (id: number) => {
    if (!canDeleteProduction) {
      setSnackbar({
        open: true,
        message: 'Vous n\'avez pas la permission de supprimer des productions',
        severity: 'error'
      });
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette production ?')) {
      try {
        await ProductionAPI.delete(id);
        setProductions(prev => prev.filter(p => p.id !== id));
        setSnackbar({
          open: true,
          message: 'Production supprimée avec succès',
          severity: 'success'
        });
      } catch (err) {
        console.error('Error deleting production:', err);
        setSnackbar({
          open: true,
          message: 'Erreur lors de la suppression de la production',
          severity: 'error'
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Produit inconnu';
  };

  const getZoneName = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : 'Zone inconnue';
  };

  return (
    <PermissionGuard requiredPermission="view_production" fallbackPath="/">
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            fontWeight: 700,
            color: theme.palette.primary.main,
            borderBottom: `2px solid ${theme.palette.primary.light}`,
            pb: 1,
            width: 'fit-content'
          }}>
            Gestion de la Production
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Suivez et gérez toutes les opérations de production
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Productions</Typography>
            <PermissionButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              requiredPermission="add_production"
              sx={{ borderRadius: 2 }}
            >
              Nouvelle Production
            </PermissionButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell align="right">Quantité</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Aucune production enregistrée
                      </TableCell>
                    </TableRow>
                  ) : (
                    productions.map((production) => (
                      <TableRow key={production.id}>
                        <TableCell>{getProductName(production.product)}</TableCell>
                        <TableCell align="right">{production.quantity}</TableCell>
                        <TableCell>{getZoneName(production.zone)}</TableCell>
                        <TableCell>{new Date(production.date).toLocaleDateString()}</TableCell>
                        <TableCell>{production.notes}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="primary" 
                            size="small" 
                            onClick={() => handleOpenDialog(production)}
                            disabled={!canEditProduction}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={() => production.id && handleDelete(production.id)}
                            disabled={!canDeleteProduction}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editMode ? 'Modifier la Production' : 'Nouvelle Production'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Produit</InputLabel>
                  <Select
                    name="product"
                    value={String(formData.product)}
                    onChange={handleSelectChange}
                    label="Produit"
                  >
                    <MenuItem value="0">Sélectionnez un produit</MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="quantity"
                  label="Quantité"
                  type="number"
                  fullWidth
                  required
                  value={formData.quantity}
                  onChange={handleInputChange}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    name="zone"
                    value={String(formData.zone)}
                    onChange={handleSelectChange}
                    label="Zone"
                  >
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={String(zone.id)}>
                        {zone.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="date"
                  label="Date"
                  type="date"
                  fullWidth
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={
                !formData.product || 
                formData.quantity <= 0 || 
                !formData.zone || 
                !formData.date
              }
            >
              {editMode ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PermissionGuard>
  );
};

export default ProductionComponent;