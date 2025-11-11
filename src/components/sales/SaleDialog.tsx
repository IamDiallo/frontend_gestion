/**
 * SaleDialog Component
 * Handles sale creation and editing
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  QrCodeScanner as QrCodeScannerIcon
} from '@mui/icons-material';
import { SalesWorkflow } from '../common';
import { QRScanner } from '../inventory/index';
import { useQRScanner } from '../../hooks/useQRScanner';
import * as SalesAPI from '../../services/api/sales.api';
import type { SalesStatus } from '../common/SalesWorkflow';
import type { SaleDialogState } from '../../hooks/useSalesDialogs';
import type { Client, Zone, ExtendedSale, SaleItem } from '../../interfaces/sales';
import type { Product } from '../../interfaces/products';

interface SaleDialogProps {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  sale: ExtendedSale | null;
  clients: Client[];
  zones: Zone[];
  productsWithStock: Product[];
  availableStock: Record<number, number>;
  saleDialog: SaleDialogState;
  onClose: () => void;
  updateSaleDialog: (data: Partial<SaleDialogState>) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refreshData?: () => Promise<void>;
}

const SaleDialog: React.FC<SaleDialogProps> = ({
  open,
  mode,
  sale,
  clients,
  zones,
  productsWithStock,
  availableStock,
  saleDialog,
  onClose,
  updateSaleDialog,
  onSuccess,
  onError,
  refreshData
}) => {
  // Use saleDialog state from hook
  const selectedClient = saleDialog.selectedClient;
  const selectedZone = saleDialog.selectedZone;
  const selectedProducts = saleDialog.selectedProducts;
  const currentProduct = saleDialog.currentProduct;
  const currentQuantity = saleDialog.currentQuantity;
  
  const [stockError, setStockError] = useState('');
  
  // Store fetched sale details for edit mode (includes status, payment_status, etc.)
  const [loadedSale, setLoadedSale] = useState<ExtendedSale | null>(null);

  // Use loaded sale if available (edit mode), otherwise use prop
  const currentSale = loadedSale || sale;

  // QR Scanner integration
  const qrScanner = useQRScanner(
    productsWithStock || [],
    (product, quantity) => {
      // Try to add the product to cart with stock validation
      const success = addProductToCart(product, quantity);
      
      if (success) {
        // Reset current product and quantity on success
        updateSaleDialog({ 
          currentProduct: null,
          currentQuantity: 1
        });
      } else {
        // On failure, set the product so user can see the error and adjust
        updateSaleDialog({ 
          currentProduct: product, 
          currentQuantity: quantity 
        });
      }
    }
  );

  // Get allowed transitions based on current status
  const getAllowedTransitions = (status: string): SalesStatus[] => {
    switch (status) {
      case 'draft':
        return ['pending', 'cancelled'];
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['payment_pending', 'paid', 'cancelled'];
      case 'payment_pending':
        return ['paid', 'cancelled'];
      case 'partially_paid':
        return ['paid', 'cancelled'];
      case 'paid':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered', 'cancelled'];
      case 'delivered':
        return ['completed', 'cancelled'];
      case 'completed':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };

  // Initialize Sale dialog data when opening in edit mode
  useEffect(() => {
    const fetchSaleDetails = async () => {
      if (open && sale && mode === 'edit') {
        // Only fetch if we haven't loaded this sale yet (prevent infinite loop)
        if (loadedSale?.id === sale.id) {
          console.log('Sale already loaded, skipping fetch');
          return;
        }
        
        try {
          console.log('Fetching sale details for sale ID:', sale.id);
          const saleDetails = await SalesAPI.fetchSale(sale.id!);
          console.log('Fetched sale details:', saleDetails);
          
          // Store the complete fetched sale details (includes status, payment_status, etc.)
          setLoadedSale(saleDetails);
          
          if (saleDetails.client && clients) {
            const client = clients.find(c => c.id === saleDetails.client);
            console.log('Found client:', client);
            if (client) {
              updateSaleDialog({ selectedClient: client });
            }
          }
          
          if (saleDetails.zone) {
            console.log('Setting zone:', saleDetails.zone);
            updateSaleDialog({ selectedZone: saleDetails.zone });
          }
          
          // Set products from sale items
          if (saleDetails.items && saleDetails.items.length > 0) {
            console.log('Setting products from items:', saleDetails.items);
            const products = saleDetails.items.map((item: SaleItem) => ({
              product: {
                id: item.product,
                name: item.product_name || 'N/A',
                reference: '',
                description: '',
                category: 0,
                unit: 0,
                min_stock_level: 0,
                purchase_price: 0,
                selling_price: item.unit_price,
                is_raw_material: false,
                is_active: true
              },
              quantity: item.quantity
            }));
            updateSaleDialog({ selectedProducts: products });
            console.log('Products set:', products);
          } else {
            console.log('No items found in sale details');
          }
        } catch (error) {
          console.error('Error fetching sale details:', error);
          onError('Erreur lors de la récupération des détails de la vente');
        }
      } else if (!open) {
        // Reset when closing
        console.log('Dialog closed, resetting state');
        setLoadedSale(null);
        updateSaleDialog({
          selectedClient: null,
          selectedZone: null,
          selectedProducts: [],
          currentProduct: null,
          currentQuantity: 1
        });
        setStockError('');
      }
    };
    
    fetchSaleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sale?.id, mode]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate total
  const calculateTotal = (): number => {
    return selectedProducts.reduce((sum, item) => {
      const price = item.product.selling_price || 0;
      return sum + (price * item.quantity);
    }, 0);
  };

  // Shared function to add product to cart with stock validation
  const addProductToCart = (product: Product, quantity: number): boolean => {
    if (!product || quantity <= 0) {
      return false;
    }

    // Check if zone is selected
    if (!selectedZone) {
      setStockError('Veuillez sélectionner une zone avant d\'ajouter des produits');
      return false;
    }

    const existingIndex = selectedProducts.findIndex(
      item => item.product.id === product.id
    );
    const currentStock = availableStock[product.id!] || 0;
    const existingQuantity = existingIndex >= 0 ? selectedProducts[existingIndex].quantity : 0;
    const newTotalQuantity = existingQuantity + quantity;

    if (newTotalQuantity > currentStock) {
      setStockError(`Stock insuffisant pour ${product.name}. Stock disponible: ${currentStock}, déjà dans le panier: ${existingQuantity}`);
      return false;
    }

    setStockError('');

    if (existingIndex >= 0) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantity: newTotalQuantity,
      };
      updateSaleDialog({ selectedProducts: updatedProducts });
    } else {
      updateSaleDialog({ 
        selectedProducts: [...selectedProducts, { product, quantity }]
      });
    }

    return true;
  };

  // Handle add product to cart
  const handleAddProduct = () => {
    if (!currentProduct) {
      return;
    }

    const success = addProductToCart(currentProduct, currentQuantity);
    
    if (success) {
      updateSaleDialog({ 
        currentProduct: null,
        currentQuantity: 1
      });
    }
  };

  // Handle remove product from cart
  const handleRemoveProduct = (index: number) => {
    updateSaleDialog({ 
      selectedProducts: selectedProducts.filter((_, i) => i !== index)
    });
  };

  // Handle save sale
  const handleSaveSale = async () => {
    try {
      if (!selectedClient || selectedProducts.length === 0) {
        onError('Veuillez sélectionner un client et ajouter des produits');
        return;
      }

      if (!selectedZone) {
        onError('Veuillez sélectionner une zone');
        return;
      }

      const subtotal = Number(calculateTotal().toFixed(2));
      const tax_amount = Number((subtotal * 0.00).toFixed(2));
      const total_amount = Number((subtotal + tax_amount).toFixed(2));
      const remaining_amount = total_amount;
      const paid_amount = 0;


      const saleData = {
        client: selectedClient.id!,
        zone: selectedZone,
        date: new Date().toISOString().split('T')[0],
        status: sale?.status || 'pending',
        subtotal,
        tax_amount,
        total_amount,
        remaining_amount,
        paid_amount,
        items: selectedProducts.map(item => ({
          product: item.product.id!,
          quantity: item.quantity,
          unit_price: item.product.selling_price || 0,
          discount_percentage: 0,
          total_price: (item.product.selling_price || 0) * item.quantity
        }))
      };

      if (mode === 'edit' && sale?.id) {
        await SalesAPI.updateSale(sale.id, saleData);
        onSuccess(`Vente ${sale.reference || sale.id} modifiée avec succès`);
      } else {
        await SalesAPI.createSale(saleData);
        onSuccess('Vente créée avec succès');
      }

      if (refreshData) {
        await refreshData();
      }

      onClose();
      
      // Reset state
      updateSaleDialog({
        selectedClient: null,
        selectedZone: 1,
        selectedProducts: [],
        currentProduct: null,
        currentQuantity: 1
      });
      setStockError('');
    } catch (error: unknown) {
      console.error('Error saving sale:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ?
        String((error as { response: { data: { error: string } } }).response.data.error) :
        'Erreur lors de l\'enregistrement de la vente';
      onError(errorMessage);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'edit' ? 'Modifier la vente' : 'Nouvelle vente'}
        </DialogTitle>
        <DialogContent>
          {/* Show workflow only in edit mode */}
          {mode === 'edit' && currentSale && (
            <Box sx={{ mb: 3 }}>
              <SalesWorkflow
                status={currentSale.status as SalesStatus}
                reference={currentSale.reference || ''}
                allowedTransitions={getAllowedTransitions(currentSale.status)}
                onStatusChange={async (newStatus) => {
                  try {
                    await SalesAPI.updateSale(currentSale.id!, { status: newStatus });
                    onSuccess(`Statut de la vente mis à jour: ${newStatus}`);
                    if (refreshData) await refreshData();
                    onClose(); // Close dialog after status update
                  } catch (error) {
                    onError('Erreur lors de la mise à jour du statut');
                  }
                }}
              />
            </Box>
          )}

          {/* EDIT MODE: Show sale details (read-only) */}
          {mode === 'edit' && currentSale && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Référence"
                  value={currentSale.reference || ''}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  value={currentSale.date || ''}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client"
                  value={selectedClient?.name || currentSale.client_name || 'Chargement...'}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Zone"
                  value={selectedZone ? zones?.find(z => z.id === selectedZone)?.name : currentSale.zone_name || 'Chargement...'}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Articles
                </Typography>
                {currentSale.items && currentSale.items.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Produit</TableCell>
                          <TableCell align="right">Prix unitaire</TableCell>
                          <TableCell align="right">Quantité</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentSale.items?.map((item: SaleItem & { product_name?: string; total?: number }, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name || 'N/A'}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Chargement des articles...
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {/* CREATE MODE: Show full form */}
          {mode !== 'edit' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={clients || []}
                  getOptionLabel={(option) => option.name}
                  value={selectedClient}
                  onChange={(event, newValue) => {
                    updateSaleDialog({ selectedClient: newValue });
                  }}
                  renderInput={(params) => (
                    <TextField {...params}
                      label="Client"
                      variant="outlined"
                      fullWidth
                      required
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={`client-${option.id}`}>
                      {option.name}
                    </li>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    value={selectedZone}
                    onChange={(e) => updateSaleDialog({ selectedZone: e.target.value as number | null }) }
                    label="Zone"
                  >
                    <MenuItem value="">Sélectionner une zone</MenuItem>
                    {(zones || []).map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Ajouter des produits
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <Autocomplete
                    options={productsWithStock || []}
                    getOptionLabel={(option) => `${option.name} (Stock: ${availableStock[option.id!] || 0})`}
                    value={currentProduct}
                    onChange={(event, newValue) => {
                      updateSaleDialog({ currentProduct: newValue, currentQuantity: 1 });
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
                        {option.name} - Stock disponible: {availableStock[option.id!] || 0}
                      </li>
                    )}
                    sx={{ flexGrow: 1 }} 
                  />
                  
                  <TextField
                    label="Quantité"
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => updateSaleDialog({ currentQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    sx={{ width: 100 }}
                    inputProps={{ min: 1 }}
                  />
                  <IconButton
                    color="primary"
                    onClick={qrScanner.openScanner}
                    title="Scanner QR"
                    sx={{ height: 'fit-content' }}
                  >
                    <QrCodeScannerIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    onClick={handleAddProduct}
                    disabled={!currentProduct || currentQuantity <= 0}
                    sx={{ height: 'fit-content' }}
                  >
                    Ajouter
                  </Button>
                </Box>
                {stockError && (
                  <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                    {stockError}
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Panier ({selectedProducts.length} produit{selectedProducts.length !== 1 ? 's' : ''})
                </Typography>
                {selectedProducts.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Produit</TableCell>
                          <TableCell align="right">Prix unitaire</TableCell>
                          <TableCell align="right">Quantité</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedProducts.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell align="right">{formatCurrency(item.product.selling_price)}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.product.selling_price * item.quantity)}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveProduct(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(calculateTotal())}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucun produit sélectionné
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose}>
            Annuler
          </Button>
          {mode !== 'edit' && (
            <Button
              variant="contained"
              onClick={handleSaveSale}
              disabled={!selectedClient || selectedProducts.length === 0}
              startIcon={<AddIcon />}
            >
              Créer la vente
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* QR Scanner Dialog */}
      <QRScanner scanner={qrScanner} stockError={stockError} />
    </>
  );
};

export default SaleDialog;
