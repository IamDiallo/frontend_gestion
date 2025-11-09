import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Alert,
  InputAdornment,
} from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, QrCode as QrCodeIcon } from '@mui/icons-material';
import { 
  Product, 
  ProductCategory,
  UnitOfMeasure
} from '../interfaces/products';
import { 
  InventoryAPI,
  SettingsAPI
} from '../services/api/index';
import { 
  validateDecimalInput, 
  validateIntegerInput,
  formatNumberDisplay, 
  getValidationError 
} from '../utils/inputValidation';
import { useTheme } from '@mui/material/styles';
import { PermissionButton, ProductQRCode, StandardDataGrid, StatusChip } from './common';
import { 
  getStandardPrimaryButtonStyles,
  getStandardSecondaryButtonStyles 
} from '../utils/styleUtils';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import PermissionGuard from './PermissionGuard';

const Products = () => {
  const theme = useTheme();  const { canPerform } = usePermissionCheck();
  const canEditProduct = canPerform('change_product');
  const canDeleteProduct = canPerform('delete_product');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    reference: '',
    description: '',
    category: 0,
    unit: 0,
    purchase_price: 0,
    selling_price: 0,
    min_stock_level: 0, // Add this line
    is_raw_material: false,
    is_active: true,
  });
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add pagination state for the products grid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Handle row clicks for editing
  const handleRowClick = (params: { row: Product }) => {
    handleEditProduct(params.row);
  };

  useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productsData = await InventoryAPI.fetchProducts();
        setProducts(productsData);
        
        setLoadingCategories(true);
        const categoriesData = await SettingsAPI.fetchProductCategories();
        setCategories(categoriesData);
        setLoadingCategories(false);
        
        setLoadingUnits(true);
        const unitsData = await SettingsAPI.fetchUnitsOfMeasure();
        setUnits(unitsData);
        setLoadingUnits(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Inconnu';
  };

  const getUnitName = (unitId: number): string => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'Inconnu';
  };

  const uniqueCategoryIds = [...new Set(products.map((product) => product.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || product.category === Number(categoryFilter);
    return matchesSearch && matchesCategory;
  });
  

  const handleAddProduct = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!newProduct.name) {
        setError('Le nom du produit est requis');
        return;
      }
      
      if (!newProduct.category) {
        setError('La catégorie du produit est requise');
        return;
      }
      
      if (!newProduct.unit) {
        setError('L\'unité du produit est requise');
        return;
      }
      
      // Format the product data for the API
      const productToCreate = {
        ...newProduct,
        purchase_price: Number(newProduct.purchase_price),
        selling_price: Number(newProduct.selling_price),
        min_stock_level: Number(newProduct.min_stock_level), // Add this line
      };
      
      // Remove reference field, backend will generate it based on category
      delete productToCreate.reference;
      
      console.log('Creating product:', productToCreate);
      const createdProduct = await InventoryAPI.createProduct(productToCreate);
      console.log('Product created:', createdProduct);
      
      // Display the new reference that was generated
      console.log(`New product reference: ${createdProduct.reference}`);
      
      setProducts([...products, createdProduct]);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        reference: '',
        description: '',
        category: 0,
        unit: 0,
        purchase_price: 0,
        selling_price: 0,
        min_stock_level: 0, // Reset this field
        is_raw_material: false,
        is_active: true,
      });
    } catch (err: unknown) {
      console.error('Error creating product:', err);
      
      let errorMessage = 'Erreur lors de la création du produit. Veuillez réessayer plus tard.';
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          
          if (errorMessages) {
            errorMessage = `Erreurs: ${errorMessages}`;
          }
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {  
    try {
      setError(null);
      
      if (!editingProduct) {
        setError('Produit à éditer manquant');
        return;
      }
      
      if (!editingProduct.id) {
        setError('ID du produit manquant');
        return;
      }
      
      if (!editingProduct.name) {
        setError('Le nom du produit est requis');
        return;
      }
      
      if (!editingProduct.reference) {
        setError('La référence du produit est requise');
        return;
      }
      
      if (!editingProduct.category) {
        setError('La catégorie du produit est requise');
        return;
      }
      
      if (!editingProduct.unit) {
        setError('L\'unité du produit est requise');
        return;
      }
      
      const productToUpdate = {
        ...editingProduct,
        purchase_price: Number(editingProduct.purchase_price),
        selling_price: Number(editingProduct.selling_price),
        min_stock_level: Number(editingProduct.min_stock_level), // Add this line
      };
      
      console.log('Updating product:', productToUpdate);
      const updatedProduct = await InventoryAPI.updateProduct(editingProduct.id, productToUpdate);
      console.log('Product updated:', updatedProduct);
      
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (err: unknown) {
      console.error('Error updating product:', err);
      
      let errorMessage = 'Erreur lors de la mise à jour du produit. Veuillez réessayer plus tard.';
      if (err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
          
          if (errorMessages) {
            errorMessage = `Erreurs: ${errorMessages}`;
          }
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {      
      setError(null);
      console.log('Deleting product:', product);
      
      if (!product.id) {
        setError('ID du produit manquant');
        return;
      }
      
      // Show confirmation dialog instead of window.confirm
      setProductToDelete(product);
      setShowDeleteDialog(true);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Erreur lors de la suppression du produit. Veuillez réessayer plus tard.');
    }
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!productToDelete?.id) {
      setError('Aucun produit sélectionné pour suppression');
      return;
    }

    try {
      setError(null);
      setDeleteLoading(true);

      console.log('Deleting product:', productToDelete);
      await InventoryAPI.deleteProduct(productToDelete.id);
      console.log('Product deleted');
      
      setProducts(products.filter(p => p.id !== productToDelete.id));
      
      // Close dialog and reset state
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Erreur lors de la suppression du produit. Veuillez réessayer plus tard.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle cancel deletion
  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setProductToDelete(null);
  };

  return (
    <PermissionGuard requiredPermission="view_product" fallbackPath="/">
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
              Gestion des Produits
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez votre catalogue de produits
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
                placeholder="Nom ou référence"
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
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="category-filter-label">Catégorie</InputLabel>
                <Select
                  labelId="category-filter-label"
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Catégorie"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Toutes les catégories</MenuItem>
                  {loadingCategories ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Chargement...
                    </MenuItem>
                  ) : (
                    uniqueCategoryIds.map((categoryId) => (
                      <MenuItem key={categoryId} value={categoryId}>{getCategoryName(categoryId)}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>

            <PermissionButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowAddModal(true)}
              requiredPermission="add_product"
              sx={getStandardPrimaryButtonStyles()}
            >
              Ajouter un produit
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
              rows={filteredProducts}
              columns={[
                { field: 'name', headerName: 'Produit', flex: 1 },
                { field: 'reference', headerName: 'Référence', flex: 1 },
                { 
                  field: 'category', 
                  headerName: 'Catégorie', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row) return 'N/A';
                    return getCategoryName(row.category);
                  }
                },
                { 
                  field: 'unit', 
                  headerName: 'Unité', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row) return 'N/A';
                    return getUnitName(row.unit);
                  }
                },
                { 
                  field: 'purchase_price', 
                  headerName: 'Prix d\'achat', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row || row.purchase_price === undefined) return '';
                    return `${row.purchase_price.toLocaleString()} GNF`;
                  }
                },
                { 
                  field: 'selling_price', 
                  headerName: 'Prix de vente', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row || row.selling_price === undefined) return '';
                    return `${row.selling_price.toLocaleString()} GNF`;
                  }
                },
                { 
                  field: 'min_stock_level', 
                  headerName: 'Stock Min.', 
                  flex: 1,
                  valueGetter: (value, row) => {
                    if (!row || row.min_stock_level === undefined) return '0';
                    return row.min_stock_level.toString();
                  }
                },
                { 
                  field: 'is_raw_material', 
                  headerName: 'Type', 
                  flex: 1,
                  renderCell: (params: GridRenderCellParams) => (
                    <StatusChip 
                      status={params.value ? 'raw_material' : 'finished_product'}
                      size="small"
                    />
                  )
                },
                { 
                  field: 'is_active', 
                  headerName: 'Statut', 
                  flex: 1,
                  renderCell: (params: GridRenderCellParams) => (
                    <StatusChip 
                      status={params.value ? 'active' : 'inactive'}
                      size="small"
                    />
                  )
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
                          handleEditProduct(params.row);
                        }}
                        disabled={!canEditProduct}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Instead of directly opening a URL, use the fetchProductQRCode function
                          // and create a download link for the QR code
                          InventoryAPI.fetchProductQRCode(params.row.id)
                            .then(blob => {
                              // Create a temporary URL for the blob
                              const url = URL.createObjectURL(blob);
                              // Create a temporary link and trigger download
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `qr-code-product-${params.row.id}-${params.row.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              // Clean up the URL
                              URL.revokeObjectURL(url);
                            })
                            .catch(error => {
                              console.error('Error downloading QR code:', error);
                              alert('Impossible de télécharger le code QR. Vérifiez votre connexion.');
                            });
                        }}
                      >
                        <QrCodeIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(params.row);
                        }}
                        disabled={!canDeleteProduct}
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

        <Dialog 
          open={showAddModal} 
          onClose={() => setShowAddModal(false)} 
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
            Ajouter un produit
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nom"
                  fullWidth
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Catégorie</InputLabel>
                  <Select
                    value={newProduct.category || ''}
                    onChange={(e) => setNewProduct({...newProduct, category: Number(e.target.value)})}
                    label="Catégorie"
                  >
                    {loadingCategories ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Chargement...
                      </MenuItem>
                    ) : (
                      categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Unité</InputLabel>
                  <Select
                    value={newProduct.unit || ''}
                    onChange={(e) => setNewProduct({...newProduct, unit: Number(e.target.value)})}
                    label="Unité"
                  >
                    {loadingUnits ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Chargement...
                      </MenuItem>
                    ) : (
                      units.map((unit) => (
                        <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prix d'achat"
                  fullWidth
                  type="text"
                  value={formatNumberDisplay(newProduct.purchase_price)}
                  onChange={(e) => {
                    const newValue = validateDecimalInput(e.target.value, newProduct.purchase_price);
                    setNewProduct({...newProduct, purchase_price: newValue});
                  }}
                  error={newProduct.purchase_price < 0}
                  helperText={getValidationError(newProduct.purchase_price, 'price')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prix de vente"
                  fullWidth
                  type="text"
                  value={formatNumberDisplay(newProduct.selling_price)}
                  onChange={(e) => {
                    const newValue = validateDecimalInput(e.target.value, newProduct.selling_price);
                    setNewProduct({...newProduct, selling_price: newValue});
                  }}
                  error={newProduct.selling_price < 0}
                  helperText={getValidationError(newProduct.selling_price, 'price')}
                />
              </Grid>
              <Grid item xs={12} sm={6}> {/* Add Grid item for min_stock_level */}
                <TextField
                  label="Niveau Stock Min."
                  fullWidth
                  type="text"
                  value={formatNumberDisplay(newProduct.min_stock_level)}
                  onChange={(e) => {
                    const newValue = validateIntegerInput(e.target.value, newProduct.min_stock_level);
                    setNewProduct({...newProduct, min_stock_level: newValue});
                  }}
                  error={newProduct.min_stock_level < 0}
                  helperText={getValidationError(newProduct.min_stock_level, 'stock')}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newProduct.is_raw_material ? 1 : 0}
                    onChange={(e) => setNewProduct({...newProduct, is_raw_material: Number(e.target.value) === 1})}
                    label="Type"
                  >
                    <MenuItem value={0}>Produit fini</MenuItem>
                    <MenuItem value={1}>Matière première</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Note: Un code QR sera automatiquement généré lors de la création du produit.
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setShowAddModal(false)}
              sx={getStandardSecondaryButtonStyles()}
            >
              Annuler
            </Button>
            <Button 
              variant="contained"
              onClick={handleAddProduct}
              sx={getStandardPrimaryButtonStyles()}
            >
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={showEditModal} 
          onClose={() => setShowEditModal(false)} 
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
            Modifier un produit
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1 }}>
            {editingProduct && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Nom"
                    fullWidth
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Référence"
                    fullWidth
                    value={editingProduct.reference}
                    onChange={(e) => setEditingProduct({...editingProduct, reference: e.target.value})}
                    required
                    helperText="La référence doit être unique"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Catégorie</InputLabel>
                    <Select
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, category: Number(e.target.value)})}
                      label="Catégorie"
                    >
                      {loadingCategories ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} /> Chargement...
                        </MenuItem>
                      ) : (
                        categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Unité</InputLabel>
                    <Select
                      value={editingProduct.unit || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, unit: Number(e.target.value)})}
                      label="Unité"
                    >
                      {loadingUnits ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} /> Chargement...
                        </MenuItem>
                      ) : (
                        units.map((unit) => (
                          <MenuItem key={unit.id} value={unit.id}>{unit.name}</MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prix d'achat"
                    fullWidth
                    type="text"
                    value={formatNumberDisplay(editingProduct.purchase_price)}
                    onChange={(e) => {
                      const newValue = validateDecimalInput(e.target.value, editingProduct.purchase_price);
                      setEditingProduct({...editingProduct, purchase_price: newValue});
                    }}
                    error={(editingProduct.purchase_price ?? 0) < 0}
                    helperText={getValidationError(editingProduct.purchase_price, 'price')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Prix de vente"
                    fullWidth
                    type="text"
                    value={formatNumberDisplay(editingProduct.selling_price)}
                    onChange={(e) => {
                      const newValue = validateDecimalInput(e.target.value, editingProduct.selling_price);
                      setEditingProduct({...editingProduct, selling_price: newValue});
                    }}
                    error={(editingProduct.selling_price ?? 0) < 0}
                    helperText={getValidationError(editingProduct.selling_price, 'price')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}> {/* Add Grid item for min_stock_level */}
                  <TextField
                    label="Niveau Stock Min."
                    fullWidth
                    type="text"
                    value={formatNumberDisplay(editingProduct.min_stock_level)}
                    onChange={(e) => {
                      const newValue = validateDecimalInput(e.target.value, editingProduct.min_stock_level);
                      setEditingProduct({...editingProduct, min_stock_level: newValue});
                    }}
                    error={(editingProduct.min_stock_level ?? 0) < 0}
                    helperText={getValidationError(editingProduct.min_stock_level, 'stock')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={editingProduct.is_raw_material ? 1 : 0}
                      onChange={(e) => setEditingProduct({...editingProduct, is_raw_material: Number(e.target.value) === 1})}
                      label="Type"
                    >
                      <MenuItem value={0}>Produit fini</MenuItem>
                      <MenuItem value={1}>Matière première</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Code QR du produit
                    </Typography>
                    <Box className="qr-code-container">
                      <ProductQRCode 
                        productId={editingProduct.id} 
                        productName={editingProduct.name}
                        width="150px"
                        height="150px"
                        downloadable={true}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                        Le code QR contient les informations du produit et peut être scanné pour identification rapide.
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setShowEditModal(false)}
              sx={getStandardSecondaryButtonStyles()}
            >
              Annuler
            </Button>
            <Button 
              variant="contained"
              onClick={handleSaveEdit}
              sx={getStandardPrimaryButtonStyles()}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={showDeleteDialog} 
          onClose={handleCancelDelete}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              backgroundColor: 'background.paper'
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: 'error.main', 
            color: '#fff',
            fontWeight: 'bold'
          }}>
            Confirmation de suppression
          </DialogTitle>
          <DialogContent sx={{ 
            p: 3, 
            mt: 2, 
            backgroundColor: 'background.paper' 
          }}>
            <DialogContentText color="text.primary" sx={{ mb: 2 }}>
              Êtes-vous sûr de vouloir supprimer le produit <strong>{productToDelete?.name}</strong> ?
            </DialogContentText>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Cette action supprimera définitivement le produit et ses données associées.
            </Alert>
            
            <Alert severity="error">
              Cette action est irréversible.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ 
            p: 2, 
            backgroundColor: 'rgba(0,0,0,0.02)'
          }}>
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
              startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
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

export default Products;