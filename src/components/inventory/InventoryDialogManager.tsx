/**
 * InventoryDialogManager Component
 * Unified dialog for supply, transfer, and inventory operations
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import {
  StandardButton,
  InventoryOperationType,
} from '../common';
import { UseInventoryDialogReturn } from '../../hooks/useInventoryDialog';
import { Product } from '../../interfaces/products';
import { Zone, Supplier } from '../../interfaces/business';
import { formatNumberDisplay, validateIntegerInput, validateDecimalInput } from '../../utils/inputValidation';

// ============================================================================
// INTERFACES
// ============================================================================

export interface InventoryDialogManagerProps {
  // Dialog state and actions from useInventoryDialog hook
  dialog: UseInventoryDialogReturn;
  
  // Reference data
  products: Product[];
  zones: Zone[];
  suppliers: Supplier[];
  
  // View mode (disable editing)
  isViewMode?: boolean;
  
  // Actions
  onOpenScanner?: () => void;
  onSubmit?: (operation: string, editMode: boolean, formData: unknown, selectedItemId?: number) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InventoryDialogManager: React.FC<InventoryDialogManagerProps> = ({
  dialog,
  products,
  zones,
  suppliers,
  isViewMode = false,
  onOpenScanner,
  onSubmit,
}) => {
  
  const {
    dialogOpen,
    dialogOperation,
    editMode,
    dialogFormData,
    dialogQuantityError,
    dialogPriceError,
    closeDialog,
    setFormData,
    addItem,
    removeItem,
    validateForm,
    getFormDataForSubmit,
  } = dialog;
  console.log("dialogFormData:", dialogFormData);
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [availableProducts, setAvailableProducts] = React.useState<Product[]>(products);
  
  // Filter products by source zone for transfers
  React.useEffect(() => {
    const filterProducts = async () => {
      if (dialogOperation === 'transfer' && dialogFormData.sourceZone) {
        try {
          const { InventoryAPI } = await import('../../services/api/index');
          const stockData = await InventoryAPI.getStockByZone(Number(dialogFormData.sourceZone));
          const productsInZone = products.filter(p => 
            stockData.some(s => s.product === p.id && s.quantity > 0)
          );
          setAvailableProducts(productsInZone);
        } catch (error) {
          console.error('Error filtering products:', error);
          setAvailableProducts(products);
        }
      } else {
        setAvailableProducts(products);
      }
    };
    filterProducts();
  }, [dialogOperation, dialogFormData.sourceZone, products]);
  
  // ============================================================================
  // HELPERS
  // ============================================================================
  
  const theme = useTheme();
  
  /**
   * Get default status for operation type
   */
  const getDefaultStatus = (operation: InventoryOperationType): string => {
    switch (operation) {
      case 'inventory':
        return 'draft';
      case 'supply':
      case 'transfer':
      default:
        return 'pending';
    }
  };
  
  /**
   * Get valid status value for Select
   */
  const getValidStatusValue = (): string => {
    const status = dialogFormData.status;
    // If status is empty or undefined, return default for current operation
    if (!status) {
      return getDefaultStatus(dialogOperation);
    }
    return status;
  };
  
  /**
   * Get MenuItems for status based on operation type
   */
  const getStatusMenuItems = () => {
    switch (dialogOperation) {
      case 'supply':
        return [
          <MenuItem key="pending" value="pending">En attente</MenuItem>,
          <MenuItem key="received" value="received">Reçu</MenuItem>,
          <MenuItem key="partial" value="partial">Partiel</MenuItem>,
          <MenuItem key="cancelled" value="cancelled">Annulé</MenuItem>
        ];
      case 'transfer':
        return [
          <MenuItem key="pending" value="pending">En attente</MenuItem>,
          <MenuItem key="partial" value="partial">Partiel</MenuItem>,
          <MenuItem key="completed" value="completed">Terminé</MenuItem>,
          <MenuItem key="cancelled" value="cancelled">Annulé</MenuItem>
        ];
      case 'inventory':
        return [
          <MenuItem key="draft" value="draft">Brouillon</MenuItem>,
          <MenuItem key="in_progress" value="in_progress">En cours</MenuItem>,
          <MenuItem key="completed" value="completed">Terminé</MenuItem>,
          <MenuItem key="cancelled" value="cancelled">Annulé</MenuItem>
        ];
      default:
        return [];
    }
  };
  
  /**
   * Update a form field
   */
  const updateFormField = (field: string, value: unknown) => {
    setFormData({ [field]: value });
  };
  
  /**
   * Handle quantity change with validation
   */
  const handleQuantityChange = (value: string) => {
    const validatedValue = validateIntegerInput(value, dialogFormData.currentQuantity);
    updateFormField('currentQuantity', validatedValue);
  };

  /**
   * Handle unit price change with validation
   */
  const handleUnitPriceChange = (value: string) => {
    const validatedValue = validateDecimalInput(value, dialogFormData.currentUnitPrice);
    updateFormField('currentUnitPrice', validatedValue);
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (validateForm()) {
      const formData = getFormDataForSubmit();
      if (formData && onSubmit) {
        try {
          const selectedItemId = dialog.selectedItem?.id;
          await onSubmit(dialogOperation, editMode, formData, selectedItemId);
          closeDialog();
        } catch (error) {
          console.error('Error submitting form:', error);
          // Don't close dialog on error so user can correct and retry
        }
      } else if (formData) {
        // No onSubmit handler provided, just close
        closeDialog();
      }
    }
  };
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Handle product selection for adding item
   */
  const handleProductSelect = (_event: React.SyntheticEvent, value: Product | null) => {
    // Check if this product already exists in the items list
    const existingItem = dialogFormData.items.find(item => item.product === value?.id);
    
    setFormData({
      currentProduct: value,
      currentUnitPrice: existingItem?.unit_price ?? value?.purchase_price ?? 0,
      currentQuantity: existingItem?.quantity ?? 1,
    });
  };
  
  /**
   * Handle add item click
   */
  const handleAddItem = () => {
    if (dialogFormData.currentProduct && dialogFormData.currentQuantity > 0) {
      addItem();
    }
  };
  
  /**
   * Check if add item button should be disabled
   */
  const isAddItemDisabled = !dialogFormData.currentProduct || 
    (dialogFormData.currentQuantity ?? 0) <= 0 || 
    (dialogFormData.currentUnitPrice ?? 0) < 0 || 
    !!dialogQuantityError || 
    !!dialogPriceError;
  
  /**
   * Format currency
   */
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 GNF';
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  /**
   * Get product name by ID
   */
  const getProductName = (productId: number): string => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Produit inconnu';
  };
  
  /**
   * Get validation message for submit button
   */
  const getSubmitValidation = () => {
    if (dialogFormData.items.length === 0) {
      return 'Veuillez ajouter au moins un produit';
    }

    switch (dialogOperation) {
      case 'supply':
        if (!dialogFormData.supplier) return 'Veuillez sélectionner un fournisseur';
        if (!dialogFormData.zone) return 'Veuillez sélectionner un emplacement';
        break;
      case 'transfer':
        if (!dialogFormData.sourceZone) return 'Veuillez sélectionner un emplacement source';
        if (!dialogFormData.targetZone) return 'Veuillez sélectionner un emplacement cible';
        if (dialogFormData.sourceZone === dialogFormData.targetZone) return 'Les emplacements source et cible doivent être différents';
        break;
      case 'inventory':
        if (!dialogFormData.inventoryZone) return 'Veuillez sélectionner un emplacement';
        break;
    }
    return null;
  };

  const isSubmitDisabled = !!getSubmitValidation();
  
  /**
   * Get dialog title based on operation type
   */
  const getDialogTitle = () => {
    if (editMode) {
      switch (dialogOperation) {
        case 'supply':
          return 'Modifier la Réception';
        case 'transfer':
          return 'Modifier le Transfert';
        case 'inventory':
          return 'Modifier l\'Inventaire';
        default:
          return 'Modifier';
      }
    } else {
      switch (dialogOperation) {
        case 'supply':
          return 'Nouvelle Réception';
        case 'transfer':
          return 'Nouveau Transfert';
        case 'inventory':
          return 'Nouvel Inventaire';
        default:
          return 'Nouvelle Opération';
      }
    }
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Dialog
      open={dialogOpen}
      onClose={closeDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {getDialogTitle()}
        <IconButton
          aria-label="fermer"
          onClick={closeDialog}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent
        sx={{
          padding: theme.spacing(2),
          paddingTop: `${theme.spacing(1)} !important`,
        }}
      >
        <Grid container spacing={2}>
          {/* Supply Form Fields */}
          {dialogOperation === 'supply' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={isViewMode}>
                  <InputLabel>Fournisseur</InputLabel>
                  <Select
                    label="Fournisseur"
                    value={dialogFormData.supplier || ''}
                    onChange={(e) => updateFormField('supplier', e.target.value as number)}
                  >
                    <MenuItem value="">
                      <em>Sélectionner un fournisseur</em>
                    </MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={isViewMode}>
                  <InputLabel>Emplacement</InputLabel>
                  <Select
                    label="Emplacement"
                    value={dialogFormData.zone || ''}
                    onChange={(e) => updateFormField('zone', e.target.value as number)}
                  >
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Transfer Form Fields */}
          {dialogOperation === 'transfer' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={isViewMode}>
                  <InputLabel>Emplacement Source</InputLabel>
                  <Select
                    label="Emplacement Source"
                    value={dialogFormData.sourceZone || ''}
                    onChange={(e) => updateFormField('sourceZone', e.target.value as number)}
                  >
                    <MenuItem value="">
                      <em>Sélectionner l'emplacement source</em>
                    </MenuItem>
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={isViewMode}>
                  <InputLabel>Emplacement Cible</InputLabel>
                  <Select
                    label="Emplacement Cible"
                    value={dialogFormData.targetZone || ''}
                    onChange={(e) => updateFormField('targetZone', e.target.value as number)}
                  >
                    <MenuItem value="">
                      <em>Sélectionner l'emplacement cible</em>
                    </MenuItem>
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Inventory Form Fields */}
          {dialogOperation === 'inventory' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={isViewMode}>
                <InputLabel>Emplacement</InputLabel>
                <Select
                  label="Emplacement"
                  value={dialogFormData.inventoryZone || ''}
                  onChange={(e) => updateFormField('inventoryZone', e.target.value as number)}
                >
                  <MenuItem value="">
                    <em>Sélectionner un emplacement</em>
                  </MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Status field - common to all operations */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={isViewMode}>
              <InputLabel>Statut</InputLabel>
              <Select
                key={`status-select-${dialogOperation}`}
                label="Statut"
                value={getValidStatusValue()}
                onChange={(e) => updateFormField('status', e.target.value)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {getStatusMenuItems()}
              </Select>
            </FormControl>
          </Grid>

          {/* Products section */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                {dialogOperation === 'inventory' ? 'Produits et Quantités' : 'Produits'}
              </Typography>
            </Box>

            {/* Product selection form */}
            {!isViewMode && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Autocomplete
                options={availableProducts}
                getOptionLabel={(option) => option.name}
                value={dialogFormData.currentProduct}
                onChange={(event, newValue) => {
                  handleProductSelect(event, newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Produit"
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`product-${option.id}`}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Réf: {option.reference} • Prix: {formatCurrency(
                          dialogOperation === 'supply' ? option.purchase_price : option.selling_price
                        )}
                      </Typography>
                    </Box>
                  </li>
                )}
                sx={{ flexGrow: 1 }} 
              />

              <TextField
                label="Quantité"
                type="text"
                value={formatNumberDisplay(dialogFormData.currentQuantity)}
                onChange={(e) => handleQuantityChange(e.target.value)}
                sx={{ width: 120 }}
                error={!!dialogQuantityError}
                helperText={dialogQuantityError}
                size="small"
              />

              {dialogOperation === 'supply' && (
              <TextField
                label="Prix Unitaire"
                type="text"
                value={formatNumberDisplay(dialogFormData.currentUnitPrice)}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                sx={{ width: 120 }}
                error={!!dialogPriceError}
                helperText={dialogPriceError}
                size="small"
              />
              )}

              <StandardButton
                variant="contained"
                onClick={handleAddItem}
                disabled={isAddItemDisabled}
                sx={{ height: 'fit-content', px: 3 }}
              >
                Ajouter
              </StandardButton>
              
              {onOpenScanner && (
                <StandardButton
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={onOpenScanner}
                  sx={{ height: 'fit-content' }}
                >
                  Scanner
                </StandardButton>
              )}
            </Box>
            )}

            {/* Items table */}
            {dialogFormData.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produit</TableCell>
                      <TableCell align="right">
                        {dialogOperation === 'inventory' ? 'Quantité comptée' : 'Quantité'}
                      </TableCell>
                      <TableCell align="center">Unité</TableCell>
                      {dialogOperation === 'supply' && (
                        <>
                          <TableCell align="right">Prix Unitaire</TableCell>
                          <TableCell align="right">Prix Total</TableCell>
                        </>
                      )}
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dialogFormData.items.map((item, index) => {
                      const unitSymbol = item.unit_symbol || '';
                      return (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.product)}</TableCell>
                          <TableCell align="right">{Number(item.quantity) || 0}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                              {unitSymbol}
                            </Typography>
                          </TableCell>
                          {dialogOperation === 'supply' && (
                            <>
                              <TableCell align="right">{formatCurrency(Number(item.unit_price) || 0)}</TableCell>
                              <TableCell align="right">{formatCurrency(Number(item.total_price) || 0)}</TableCell>
                            </>
                          )}
                          <TableCell align="right">
                            {!isViewMode && (
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => removeItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals row */}
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {dialogFormData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                      </TableCell>
                      <TableCell align="center">
                        {/* Empty cell for unit column */}
                      </TableCell>
                      {dialogOperation === 'supply' && (
                        <>
                          <TableCell align="right">
                            {/* Empty cell for unit price column */}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(dialogFormData.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0))}
                          </TableCell>
                        </>
                      )}
                      <TableCell align="right">
                        {/* Empty cell for actions column */}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucun produit ajouté. Utilisez le formulaire ci-dessus pour ajouter des produits à 
                {dialogOperation === 'supply' && ' cet approvisionnement'}
                {dialogOperation === 'transfer' && ' ce transfert'}
                {dialogOperation === 'inventory' && ' cet inventaire'}
                .
              </Alert>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <StandardButton 
          variant="outlined" 
          onClick={closeDialog}
        >
          {isViewMode ? 'Fermer' : 'Annuler'}
        </StandardButton>
        
        {!isViewMode && (
        <StandardButton
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {editMode ? 'Mettre à jour' : 'Créer'}
        </StandardButton>
        )}
      </DialogActions>
    </Dialog>
  );
};
