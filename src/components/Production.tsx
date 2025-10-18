import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  IconButton,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  SelectChangeEvent,
  InputAdornment,
} from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ProductionAPI, InventoryAPI, CoreAPI } from '../services/api/index';
import { Production } from '../interfaces/production';
import { Product } from '../interfaces/products';
import { Zone } from '../interfaces/business';
import PermissionGuard from './PermissionGuard';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import PermissionButton from './common/PermissionButton';
import StandardDataGrid from './common/StandardDataGrid';
import { 
  getStandardPrimaryButtonStyles,
  getStandardSecondaryButtonStyles 
} from '../utils/styleUtils';

const initialProductionState = {
  product: 0,
  quantity: 0,
  zone: Number(import.meta.env.VITE_DEFAULT_ZONE) || 1,
  date: new Date().toISOString().split('T')[0],
  notes: ''
};

const ProductionComponent = () => {
  const theme = useTheme();
  const { canPerform } = usePermissionCheck();
  const canEditProduction = canPerform('change_production');
  const canDeleteProduction = canPerform('delete_production');
  
  const [productions, setProductions] = useState<Production[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialProductionState);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState<Production | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Add pagination state
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Reset pagination when filters change
  useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [searchTerm, zoneFilter, productFilter]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch productions
      const productionsData = await ProductionAPI.fetchProductions();
      setProductions(productionsData);
      
      // Fetch products for the dropdown
      const productsData = await InventoryAPI.fetchProducts();
      setProducts(productsData);
      
      // Fetch zones from backend
      const zonesData = await CoreAPI.fetchZones();
      setZones(zonesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Produit inconnu';
  };

  const getZoneName = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : 'Zone inconnue';
  };

  // Filter productions based on search and filters
  const filteredProductions = productions.filter((production) => {
    const productName = getProductName(production.product).toLowerCase();
    const matchesSearch = productName.includes(searchTerm.toLowerCase()) ||
      (production.notes && production.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesZone = zoneFilter === '' || production.zone === Number(zoneFilter);
    const matchesProduct = productFilter === '' || production.product === Number(productFilter);
    return matchesSearch && matchesZone && matchesProduct;
  });

  const uniqueZoneIds = [...new Set(productions.map((p) => p.zone))];
  const uniqueProductIds = [...new Set(productions.map((p) => p.product))];

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
    setError(null);
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
        const updated = await ProductionAPI.updateProduction(currentId, dataToSubmit);
        setProductions(prev => prev.map(p => p.id === currentId ? updated : p));
      } else {
        // Create new production
        const created = await ProductionAPI.createProduction(dataToSubmit);
        setProductions(prev => [...prev, created]);
      }
      
      handleCloseDialog();
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error saving production:', err);
      setError('Erreur lors de l\'enregistrement de la production');
    }
  };

  const handleDeleteProduction = (production: Production) => {
    setProductionToDelete(production);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!productionToDelete || !productionToDelete.id) return;
    
    setDeleteLoading(true);
    try {
      await ProductionAPI.deleteProduction(productionToDelete.id);
      setProductions(prev => prev.filter(p => p.id !== productionToDelete.id));
      setShowDeleteDialog(false);
      setProductionToDelete(null);
    } catch (err) {
      console.error('Error deleting production:', err);
      setError('Erreur lors de la suppression de la production');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setProductionToDelete(null);
  };

  // Handle row clicks for editing
  const handleRowClick = (params: { row: Production }) => {
    handleOpenDialog(params.row);
  };

  return (
    <PermissionGuard requiredPermission="view_production" fallbackPath="/">
      <Box>
        <Box 
          sx={{ 
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' }
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Gestion de la Production
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Suivez et gérez toutes les opérations de production
            </Typography>
          </Box>
        </Box>

        <Paper
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }} 
        >
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
                placeholder="Produit ou notes"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="zone-filter-label">Zone</InputLabel>
                <Select
                  labelId="zone-filter-label"
                  id="zone-filter"
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  label="Zone"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Toutes les zones</MenuItem>
                  {uniqueZoneIds.map((zoneId) => (
                    <MenuItem key={zoneId} value={zoneId}>{getZoneName(zoneId)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="product-filter-label">Produit</InputLabel>
                <Select
                  labelId="product-filter-label"
                  id="product-filter"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  label="Produit"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Tous les produits</MenuItem>
                  {uniqueProductIds.map((productId) => (
                    <MenuItem key={productId} value={productId}>{getProductName(productId)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <PermissionButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              requiredPermission="add_production"
              sx={getStandardPrimaryButtonStyles()}
            >
              Nouvelle Production
            </PermissionButton>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
              }}
            >
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <StandardDataGrid
              rows={filteredProductions}
              columns={[
                { 
                  field: 'product', 
                  headerName: 'Produit', 
                  flex: 1.5,
                  valueGetter: (value, row) => {
                    if (!row) return 'N/A';
                    return getProductName(row.product);
                  }
                },
                { 
                  field: 'quantity', 
                  headerName: 'Quantité', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row || row.quantity === undefined) return '0';
                    return row.quantity.toLocaleString();
                  }
                },
                { 
                  field: 'zone', 
                  headerName: 'Zone', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row) return 'N/A';
                    return getZoneName(row.zone);
                  }
                },
                { 
                  field: 'date', 
                  headerName: 'Date', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row || !row.date) return '';
                    return new Date(row.date).toLocaleDateString('fr-FR');
                  }
                },
                { 
                  field: 'notes', 
                  headerName: 'Notes', 
                  flex: 1.5,
                  valueGetter: (value, row) => {
                    if (!row) return '';
                    return row.notes || '';
                  }
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  flex: 1,
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
                        disabled={!canEditProduction}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduction(params.row);
                        }}
                        disabled={!canDeleteProduction}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )
                }
              ]}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              onRowClick={handleRowClick}
              loading={loading}
              getRowId={(row) => {
                if (!row || row.id === undefined) return Math.random();
                return row.id;
              }}
            />
          )}
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
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
            {editMode ? 'Modifier la Production' : 'Nouvelle Production'}
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
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
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              sx={getStandardSecondaryButtonStyles()}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={
                !formData.product || 
                formData.quantity <= 0 || 
                !formData.zone || 
                !formData.date
              }
              sx={getStandardPrimaryButtonStyles()}
            >
              {editMode ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={showDeleteDialog} 
          onClose={handleCancelDelete}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.error.main,
            color: 'white',
            fontWeight: 'bold'
          }}>
            Confirmer la suppression
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 2 }}>
            <DialogContentText>
              Êtes-vous sûr de vouloir supprimer cette production ?
              {productionToDelete && (
                <Box component="span" sx={{ display: 'block', mt: 2, fontWeight: 'bold' }}>
                  Produit : {getProductName(productionToDelete.product)}<br />
                  Quantité : {productionToDelete.quantity}<br />
                  Date : {new Date(productionToDelete.date).toLocaleDateString('fr-FR')}
                </Box>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={handleCancelDelete}
              disabled={deleteLoading}
              sx={getStandardSecondaryButtonStyles()}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              sx={getStandardPrimaryButtonStyles()}
            >
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  );
};

export default ProductionComponent;