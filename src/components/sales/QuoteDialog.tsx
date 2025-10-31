/**
 * QuoteDialog Component
 * Handles quote (devis) creation and editing
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
  ReceiptLong
} from '@mui/icons-material';
import type { QuoteDialogState } from '../../hooks/useSalesDialogs';
import type { Client, Zone } from '../../interfaces/sales';
import type { Product } from '../../interfaces/products';
import * as SalesAPI from '../../services/api/sales.api';

import type { ApiQuote, QuoteItem } from '../../interfaces/sales';

interface QuoteDialogProps {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  quote: ApiQuote | null;
  quoteDialog: QuoteDialogState;
  clients: Client[];
  zones: Zone[];
  products: Product[];
  onClose: () => void;
  updateQuoteDialog: (data: Partial<QuoteDialogState>) => void;
  addProductToQuote: () => boolean;
  removeProductFromQuote: (index: number) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refreshData?: () => Promise<void>;
}

const QuoteDialog: React.FC<QuoteDialogProps> = ({
  open,
  mode,
  quote,
  quoteDialog,
  clients,
  products,
  onClose,
  updateQuoteDialog,
  addProductToQuote,
  removeProductFromQuote,
  onSuccess,
  onError,
  refreshData
}) => {
  const [newQuoteData, setNewQuoteData] = useState<{ 
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled'; 
    date?: string; 
    expiry_date?: string; 
    notes?: string 
  }>({ status: 'draft' });
  const [stockError, setStockError] = useState('');

  const selectedClient = quoteDialog.selectedClient;
  const selectedProducts = quoteDialog.selectedProducts;
  const currentProduct = quoteDialog.currentProduct;
  const currentQuantity = quoteDialog.currentQuantity;

  // Initialize Quote dialog data when opening in edit mode
  useEffect(() => {
    const fetchQuoteDetails = async () => {
      if (open && quote && mode === 'edit') {
        try {
          // Fetch full quote details from API
          const quoteDetails = await SalesAPI.fetchQuote(quote.id!);
          console.log('Quote details fetched:', quoteDetails);
          
          // Set client from quote data
          if (quoteDetails.client && clients) {
            const client = clients.find((c) => c.id === quoteDetails.client);
            if (client) updateQuoteDialog({ selectedClient: client });
          }
          
          // Set quote data
          setNewQuoteData({
            status: quoteDetails.status || 'draft',
            date: quoteDetails.date || '',
            expiry_date: quoteDetails.expiry_date || '',
            notes: quoteDetails.notes || ''
          });
          
          // Update dialog state with dates
          updateQuoteDialog({
            date: quoteDetails.date || '',
            expiry_date: quoteDetails.expiry_date || '',
            notes: quoteDetails.notes || ''
          });
          
          // Set products from quote items
          if (quoteDetails.items && quoteDetails.items.length > 0) {
            console.log('Quote items found:', quoteDetails.items);
            console.log('All products available:', products?.length);
            
            const quoteProducts = quoteDetails.items.map((item: QuoteItem) => {
              // Try to find the full product from products list
              const fullProduct = products?.find((p) => p.id === item.product);
              
              if (fullProduct) {
                console.log('Found full product for item:', fullProduct.name);
              } else {
                console.log('Using fallback product data for item:', item.product_name);
              }
              
              return {
                product: fullProduct || {
                  id: item.product,
                  name: item.product_name,
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
              };
            });
            
            console.log('Setting products to dialog:', quoteProducts);
            updateQuoteDialog({ selectedProducts: quoteProducts });
          } else {
            console.log('No items found in quote details');
            console.log('Items array:', quoteDetails.items);
            console.log('Items length:', quoteDetails.items?.length);
            // Don't reset selectedProducts here - it might already have products
          }
        } catch (error) {
          console.error('Error fetching quote details:', error);
          onError('Erreur lors de la récupération des détails du devis');
        }
      } else if (!open) {
        // Reset when closing
        console.log('Quote dialog closed, resetting state');
        setNewQuoteData({ status: 'draft' });
        setStockError('');
        // Reset dialog state
        updateQuoteDialog({
          selectedClient: null,
          selectedProducts: [],
          currentProduct: null,
          currentQuantity: 1,
          date: '',
          expiry_date: '',
          notes: ''
        });
      }
    };
    
    fetchQuoteDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quote?.id, mode]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
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

  // Handle add product
  const handleAddProduct = () => {
    const success = addProductToQuote();
    if (!success) {
      setStockError('Veuillez sélectionner un produit et une quantité valide');
    } else {
      setStockError('');
    }
  };

  // Handle save quote
  const handleSaveQuote = async () => {
    try {
      if (!selectedClient || selectedProducts.length === 0) {
        onError('Veuillez sélectionner un client et ajouter des produits');
        return;
      }

      const subtotal = Number(calculateTotal().toFixed(2));
      const tax_amount = Number((subtotal * 0.00).toFixed(2));
      const total_amount = Number((subtotal + tax_amount).toFixed(2));

      const quoteData = {
        client: selectedClient.id!,
        date: quoteDialog.date,
        expiry_date: quoteDialog.expiry_date,
        status: newQuoteData.status || 'draft',
        subtotal,
        tax_amount,
        total_amount,
        notes: newQuoteData.notes || quoteDialog.notes,
        items: selectedProducts.map(item => ({
          product: item.product.id!,
          quantity: item.quantity,
          unit_price: item.product.selling_price || 0,
          discount_percentage: 0,
          total_price: (item.product.selling_price || 0) * item.quantity
        }))
      };

      if (mode === 'edit' && quote?.id) {
        await SalesAPI.updateQuote(quote.id, quoteData);
        onSuccess(`Devis ${quote.reference} modifié avec succès`);
      } else {
        await SalesAPI.createQuote(quoteData);
        onSuccess('Devis créé avec succès');
      }

      if (refreshData) {
        await refreshData();
      }

      onClose();
      setNewQuoteData({ status: 'draft' });
      setStockError('');
    } catch (error: unknown) {
      console.error('Error saving quote:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ?
        String((error as { response: { data: { error: string } } }).response.data.error) :
        'Erreur lors de l\'enregistrement du devis';
      onError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
          {mode === 'edit' ? 'Modifier le devis' : 'Nouveau devis'}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={clients || []}
              getOptionLabel={(option) => option.name}
              value={selectedClient}
              onChange={(event, newValue) => {
                updateQuoteDialog({ selectedClient: newValue });
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

          <Grid item xs={12} sm={6}>
            <TextField
              label="Date du devis"
              type="date"
              fullWidth
              value={quoteDialog.date}
              onChange={(e) => updateQuoteDialog({ date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Date d'expiration"
              type="date"
              fullWidth
              value={quoteDialog.expiry_date}
              onChange={(e) => updateQuoteDialog({ expiry_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Date limite de validité du devis"
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={newQuoteData.status || 'draft'}
                onChange={(e) => setNewQuoteData({ ...newQuoteData, status: e.target.value as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled' })}
                label="Statut"
              >
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="sent">Envoyé</MenuItem>
                <MenuItem value="accepted">Accepté</MenuItem>
                <MenuItem value="rejected">Rejeté</MenuItem>
                <MenuItem value="expired">Expiré</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Validité du devis"
              value={
                quoteDialog.expiry_date
                  ? `${Math.max(0, Math.ceil((new Date(quoteDialog.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} jours`
                  : '30 jours'
              }
              fullWidth
              disabled
              helperText="Jours restants de validité"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Produits du devis
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Autocomplete
                options={products || []}
                getOptionLabel={(option: Product) => `${option.name} (Prix: ${formatCurrency(option.selling_price)})`}
                value={currentProduct}
                onChange={(event, newValue) => {
                  updateQuoteDialog({ currentProduct: newValue, currentQuantity: 1 });
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Sélectionner un produit"
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`product-${option.id}`}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prix: {formatCurrency(option.selling_price)} • Réf: {option.reference}
                      </Typography>
                    </Box>
                  </li>
                )}
                sx={{ flexGrow: 1 }}
              />

              <TextField
                label="Quantité"
                type="number"
                value={currentQuantity}
                onChange={(e) => updateQuoteDialog({ currentQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                sx={{ width: 120 }}
                inputProps={{ min: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleAddProduct}
                disabled={!currentProduct || currentQuantity <= 0}
                sx={{ height: 'fit-content', px: 3 }}
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
              Produits ({selectedProducts.length})
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
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{item.product.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Réf: {item.product.reference}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.product.selling_price)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.product.selling_price * item.quantity)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeProductFromQuote(index)}
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

          <Grid item xs={12}>
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              placeholder="Notes additionnelles pour le devis..."
              value={newQuoteData.notes || ''}
              onChange={(e) => setNewQuoteData({ ...newQuoteData, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveQuote}
          disabled={!selectedClient || selectedProducts.length === 0}
          startIcon={<AddIcon />}
        >
          {mode === 'edit' ? 'Enregistrer' : 'Créer le devis'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuoteDialog;
