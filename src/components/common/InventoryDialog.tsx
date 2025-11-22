import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StandardButton } from './index';
import { GENERAL_TRANSLATIONS } from '../../utils/translations';
import {
  validateIntegerInput,
  validateDecimalInput,
  formatNumberDisplay
} from '../../utils/inputValidation';
import { Product } from '../../interfaces/products';
import { Zone, Supplier } from '../../interfaces/business';
import { UnitOfMeasure } from '../../interfaces/settings';

// Currency formatting function
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 GNF';
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Types for the different operation modes
export type InventoryOperationType = 'supply' | 'transfer' | 'inventory';

// Union type for status based on operation type
export type InventoryDialogStatus = 
  | 'pending' | 'received' | 'partial' | 'cancelled' // Supply statuses
  | 'completed' // Transfer statuses
  | 'draft' | 'in_progress'; // Inventory statuses

// Item structure used by all operations
export interface InventoryDialogItem {
  id?: number; // Optional ID for existing items (used during updates)
  product: number;
  product_name?: string; // Display name for the product
  product_obj?: unknown; // Optional product object reference
  quantity: number;
  unit_price: number;
  total_price: number;
  expected_quantity?: number; // For inventory operations
  unit_symbol?: string; // Unit abbreviation from backend
}

// Form data structure that adapts based on operation type
export interface InventoryDialogFormData {
  // Common fields
  items: InventoryDialogItem[];
  status: InventoryDialogStatus;
  
  // Supply-specific fields
  supplier?: number | '';
  zone?: number | '';
  
  // Transfer-specific fields
  sourceZone?: number | '';
  targetZone?: number | '';
  
  // Inventory-specific fields
  inventoryZone?: number | '';
  
  // Current item being added
  currentProduct: Product | null;
  currentQuantity: number;
  currentUnitPrice: number;
}

interface InventoryDialogProps {
  open: boolean;
  operationType: InventoryOperationType;
  editMode: boolean;
  formData: InventoryDialogFormData;
  products: Product[];
  zones: Zone[];
  suppliers?: Supplier[]; // Only needed for supply operations
  units?: UnitOfMeasure[]; // Units of measure for display
  loading: boolean;
  quantityError: string;
  priceError: string;
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (data: Partial<InventoryDialogFormData>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onOpenScanner: () => void;
  getProductName: (productId: number) => string;
}


/**
 * Unified dialog component for all inventory operations (supply, transfer, inventory count)
 */
const InventoryDialog: React.FC<InventoryDialogProps> = ({
  open,
  operationType,
  editMode,
  formData,
  products,
  zones,
  suppliers = [],
  units = [],
  loading,
  quantityError,
  priceError,
  onClose,
  onSubmit,
  onFormDataChange,
  onAddItem,
  onRemoveItem,
  onOpenScanner,
  getProductName,
}) => {
  const theme = useTheme();

  // Helper function to get unit symbol
  const getUnitSymbol = (unitId: number): string => {
    const unit = units.find(u => u.id === unitId);
    return unit?.abbreviation || '';
  };

  // Get dialog title based on operation type
  const getDialogTitle = () => {
    const prefix = editMode ? 'Modifier' : 'Nouveau';
    switch (operationType) {
      case 'supply':
        return `${prefix} Approvisionnement`;
      case 'transfer':
        return `${prefix} Transfert de Stock`;
      case 'inventory':
        return `${prefix} Inventaire`;
      default:
        return prefix;
    }
  };

  // Get available status options based on operation type
  const getStatusOptions = () => {
    switch (operationType) {
      case 'supply':
        return [
          { value: 'pending', label: 'En attente' },
          { value: 'received', label: 'Reçu' },
          { value: 'partial', label: 'Partiel' },
          { value: 'cancelled', label: 'Annulé' },
        ];
      case 'transfer':
        return [
          { value: 'pending', label: 'En attente' },
          { value: 'partial', label: 'Partiel' },
          { value: 'completed', label: 'Terminé' },
          { value: 'cancelled', label: 'Annulé' },
        ];
      case 'inventory':
        return [
          { value: 'draft', label: 'Brouillon' },
          { value: 'in_progress', label: 'En cours' },
          { value: 'completed', label: 'Terminé' },
          { value: 'cancelled', label: 'Annulé' },
        ];
      default:
        return [];
    }
  };

  // Get validation message for submit button
  const getSubmitValidation = () => {
    if (formData.items.length === 0) {
      return 'Veuillez ajouter au moins un produit';
    }

    switch (operationType) {
      case 'supply':
        if (!formData.supplier) return 'Veuillez sélectionner un fournisseur';
        if (!formData.zone) return 'Veuillez sélectionner un emplacement';
        break;
      case 'transfer':
        if (!formData.sourceZone) return 'Veuillez sélectionner un emplacement source';
        if (!formData.targetZone) return 'Veuillez sélectionner un emplacement cible';
        if (formData.sourceZone === formData.targetZone) return 'Les emplacements source et cible doivent être différents';
        break;
      case 'inventory':
        if (!formData.inventoryZone) return 'Veuillez sélectionner un emplacement';
        break;
    }
    return null;
  };

  const isSubmitDisabled = !!getSubmitValidation() || loading;

  // Handle quantity change with validation
  const handleQuantityChange = (value: string) => {
    const validatedValue = validateIntegerInput(value, formData.currentQuantity);
    onFormDataChange({ currentQuantity: validatedValue });
  };

  // Handle unit price change with validation
  const handleUnitPriceChange = (value: string) => {
    const validatedValue = validateDecimalInput(value, formData.currentUnitPrice);
    onFormDataChange({ currentUnitPrice: validatedValue });
  };

  // Check if add item button should be disabled
  const isAddItemDisabled = !formData.currentProduct || 
    (formData.currentQuantity ?? 0) <= 0 || 
    (formData.currentUnitPrice ?? 0) < 0 || 
    !!quantityError || 
    !!priceError;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          padding: theme.spacing(1),
          borderRadius: theme.spacing(1),
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: theme.spacing(1),
          fontSize: '1.25rem',
          fontWeight: 600,
        }}
      >
        {getDialogTitle()}
      </DialogTitle>

      <DialogContent
        sx={{
          padding: theme.spacing(2),
          paddingTop: `${theme.spacing(1)} !important`,
        }}
      >
        <Grid container spacing={2}>
          {/* Operation-specific fields */}
          {operationType === 'supply' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Fournisseur</InputLabel>
                  <Select
                    label="Fournisseur"
                    value={formData.supplier || ''}
                    onChange={(e) => onFormDataChange({ supplier: e.target.value as number })}
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
                <FormControl fullWidth required>
                  <InputLabel>Emplacement</InputLabel>
                  <Select
                    label="Emplacement"
                    value={formData.zone || ''}
                    onChange={(e) => onFormDataChange({ zone: e.target.value as number })}
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

          {operationType === 'transfer' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Emplacement Source</InputLabel>
                  <Select
                    label="Emplacement Source"
                    value={formData.sourceZone || ''}
                    onChange={(e) => onFormDataChange({ sourceZone: e.target.value as number })}
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
                <FormControl fullWidth required>
                  <InputLabel>Emplacement Cible</InputLabel>
                  <Select
                    label="Emplacement Cible"
                    value={formData.targetZone || ''}
                    onChange={(e) => onFormDataChange({ targetZone: e.target.value as number })}
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

          {operationType === 'inventory' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Emplacement</InputLabel>
                <Select
                  label="Emplacement"
                  value={formData.inventoryZone || ''}
                  onChange={(e) => onFormDataChange({ inventoryZone: e.target.value as number })}
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
            <FormControl fullWidth required>
              <InputLabel>Statut</InputLabel>
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => onFormDataChange({ status: e.target.value as InventoryDialogStatus })}
              >
                {getStatusOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Products section */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                {operationType === 'inventory' ? 'Produits et Quantités' : 'Produits'}
              </Typography>
            </Box>

            {/* Product selection form */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.name}
                value={formData.currentProduct}
                onChange={(event, newValue) => {
                  // Check if this product already exists in the items list
                  const existingItem = formData.items.find(item => item.product === newValue?.id);
                  
                  onFormDataChange({
                    currentProduct: newValue,
                    currentUnitPrice: existingItem?.unit_price ?? newValue?.purchase_price ?? 0,
                    currentQuantity: existingItem?.quantity ?? 1,
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Produit"
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => {
                  const unitSymbol = getUnitSymbol(option.unit);
                  return (
                    <li {...props} key={`product-${option.id}`}>
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body1">
                          {option.name} 
                          {unitSymbol && (
                            <Typography component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 600 }}>
                              ({unitSymbol})
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Réf: {option.reference} • Prix: {formatCurrency(
                            operationType === 'supply' ? option.purchase_price : option.selling_price
                          )}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                sx={{ flexGrow: 1 }} 
              />

              <TextField
                label="Quantité"
                type="text"
                value={formatNumberDisplay(formData.currentQuantity)}
                onChange={(e) => handleQuantityChange(e.target.value)}
                sx={{ width: 120 }}
                error={!!quantityError}
                helperText={quantityError}
                size="small"
              />

              <TextField
                label="Prix Unitaire"
                type="text"
                value={formatNumberDisplay(formData.currentUnitPrice)}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                sx={{ width: 120 }}
                error={!!priceError}
                helperText={priceError}
                size="small"
              />

              <StandardButton
                variant="contained"
                onClick={onAddItem}
                disabled={isAddItemDisabled}
                sx={{ height: 'fit-content', px: 3 }}
              >
                Ajouter
              </StandardButton>
              
              <StandardButton
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
                onClick={onOpenScanner}
                sx={{ height: 'fit-content' }}
              >
                Scanner
              </StandardButton>
            </Box>

            {/* Items table */}
            {formData.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produit</TableCell>
                      <TableCell align="right">
                        {operationType === 'inventory' ? 'Quantité comptée' : 'Quantité'}
                      </TableCell>
                      <TableCell align="center">Unité</TableCell>
                      <TableCell align="right">Prix Unitaire</TableCell>
                      <TableCell align="right">Prix Total</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => {
                      const product = products.find(p => p.id === item.product);
                      const unitSymbol = product ? getUnitSymbol(product.unit) : '';
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.product)}</TableCell>
                          <TableCell align="right">{Number(item.quantity) || 0}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                              {unitSymbol}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(Number(item.unit_price) || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(Number(item.total_price) || 0)}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => onRemoveItem(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
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
                        {formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                      </TableCell>
                      <TableCell align="center">
                        {/* Empty cell for unit column */}
                      </TableCell>
                      <TableCell align="right">
                        {/* Empty cell for unit price column */}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(formData.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0))}
                      </TableCell>
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
                {operationType === 'supply' && ' cet approvisionnement'}
                {operationType === 'transfer' && ' ce transfert'}
                {operationType === 'inventory' && ' cet inventaire'}
                .
              </Alert>
            )}

            {/* Scanner button */}
            <Box sx={{ mt: 2 }}>
              <StandardButton
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
                onClick={onOpenScanner}
              >
                Scanner un Produit
              </StandardButton>
            </Box>

            {/* Additional info for inventory */}
            {operationType === 'inventory' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Note : Pour les produits non trouvés lors du scan, vous pouvez les ajouter manuellement. 
                  Les articles avec une quantité de 0 seront enregistrés comme étant en rupture de stock.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          padding: theme.spacing(2),
          paddingTop: theme.spacing(1),
          gap: theme.spacing(1),
        }}
      >
        <StandardButton onClick={onClose}>
          {GENERAL_TRANSLATIONS.cancel}
        </StandardButton>
        <StandardButton
          variant="contained"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            `${editMode ? 'Mettre à jour' : 'Créer'} ${
              operationType === 'supply' ? "l'Approvisionnement" :
              operationType === 'transfer' ? 'le Transfert' :
              "l'Inventaire"
            }`
          )}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryDialog;
