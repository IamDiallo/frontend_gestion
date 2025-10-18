/**
 * SaleDialogManager Component  
 * Complete implementation of all sale-related dialogs
 * Migrated from Sales.BACKUP.txt to work with hooks architecture
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
  TableFooter,
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
import { StatusChip, DeleteDialog, SalesWorkflow } from '../common';
import * as SalesAPI from '../../services/api/sales.api';
import type { SalesStatus } from '../common/SalesWorkflow';

interface SaleDialogManagerProps {
  dialogs: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  data: any;    // eslint-disable-line @typescript-eslint/no-explicit-any
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SaleDialogManager: React.FC<SaleDialogManagerProps> = ({
  dialogs,
  data,
  onSuccess,
  onError
}) => {
  const {
    saleDialog,
    invoiceDialog,
    quoteDialog,
    quoteConversionDialog,
    deleteDialog,
    closeSaleDialog,
    closeInvoiceDialog,
    closeQuoteDialog,
    closeQuoteConversionDialog,
    closeDeleteDialog
  } = dialogs;

  const { clients, zones, sales, productsWithStock, availableStock } = data;

  // Local state for Sale dialog
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [stockError, setStockError] = useState('');

  // Local state for Invoice dialog
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [newInvoiceData, setNewInvoiceData] = useState<any>({});

  // Local state for Quote dialog
  const [newQuoteData, setNewQuoteData] = useState<any>({
    status: 'draft'
  });

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
        // partially_paid can only transition to paid or cancelled
        // It cannot be manually set - it's automatically set when payment is made
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
      if (saleDialog?.open && saleDialog?.sale && saleDialog?.mode === 'edit') {
        try {
          // Fetch full sale details from API
          const saleDetails = await SalesAPI.fetchSale(saleDialog.sale.id!);
          console.log('Sale details fetched:', saleDetails);
          
          // Set client from sale data
          if (saleDetails.client && clients) {
            const client = clients.find((c: any) => c.id === saleDetails.client);
            if (client) setSelectedClient(client);
          }
          
          // Set zone
          if (saleDetails.zone) setSelectedZone(saleDetails.zone);
          
          // Set products from sale items
          if (saleDetails.items && saleDetails.items.length > 0) {
            console.log('Setting products from items:', saleDetails.items);
            const products = saleDetails.items.map((item: any) => ({
              product: {
                id: item.product,
                name: item.product_name || 'N/A',
                selling_price: item.unit_price,
                reference: item.product_reference || '',
              },
              quantity: item.quantity
            }));
            setSelectedProducts(products);
            console.log('Products set:', products);
          } else {
            console.log('No items found in sale details');
          }
        } catch (error) {
          console.error('Error fetching sale details:', error);
          onError('Erreur lors de la récupération des détails de la vente');
        }
      } else if (!saleDialog?.open) {
        // Reset when closing
        setSelectedClient(null);
        setSelectedZone(0);
        setSelectedProducts([]);
        setCurrentProduct(null);
        setCurrentQuantity(1);
        setStockError('');
      }
    };
    
    fetchSaleDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleDialog?.open, saleDialog?.sale, saleDialog?.mode, clients]);

  // Initialize Invoice dialog data when opening in edit mode
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (invoiceDialog?.open && invoiceDialog?.invoice && invoiceDialog?.mode === 'edit') {
        try {
          // Fetch full invoice details from API
          const invoiceDetails = await SalesAPI.fetchInvoice(invoiceDialog.invoice.id!);
          console.log('Invoice details fetched:', invoiceDetails);
          
          // Valid invoice statuses: draft, sent, paid, overdue, cancelled
          const validInvoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
          const invoiceStatus = validInvoiceStatuses.includes(invoiceDetails.status) 
            ? invoiceDetails.status 
            : 'draft';
          
          setNewInvoiceData({
            date: invoiceDetails.date || '',
            due_date: invoiceDetails.due_date || '',
            notes: invoiceDetails.notes || '',
            status: invoiceStatus
          });
          
          // Set related sale if available
          if (invoiceDetails.sale && sales) {
            const sale = sales.find((s: any) => s.id === invoiceDetails.sale);
            if (sale) setSelectedSale(sale);
          }
        } catch (error) {
          console.error('Error fetching invoice details:', error);
          onError('Erreur lors de la récupération des détails de la facture');
        }
      } else if (!invoiceDialog?.open) {
        // Reset when closing
        setSelectedSale(null);
        setNewInvoiceData({});
      }
    };
    
    fetchInvoiceDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceDialog?.open, invoiceDialog?.invoice, invoiceDialog?.mode, sales]);

  // Initialize Quote dialog data when opening in edit mode
  useEffect(() => {
    const fetchQuoteDetails = async () => {
      if (quoteDialog?.open && quoteDialog?.quote && quoteDialog?.mode === 'edit') {
        try {
          // Fetch full quote details from API
          const quoteDetails = await SalesAPI.fetchQuote(quoteDialog.quote.id!);
          console.log('Quote details fetched:', quoteDetails);
          
          // Set client from quote data
          if (quoteDetails.client && clients) {
            const client = clients.find((c: any) => c.id === quoteDetails.client);
            if (client) setSelectedClient(client);
          }
          
          // Note: Quotes don't have zones - zone is selected during conversion to sale
          
          // Set quote data
          setNewQuoteData({
            status: quoteDetails.status || 'draft',
            date: quoteDetails.date || '',
            expiry_date: quoteDetails.expiry_date || '',
            notes: quoteDetails.notes || ''
          });
          
          // Set products from quote items
          if (quoteDetails.items && quoteDetails.items.length > 0) {
            const products = quoteDetails.items.map((item: any) => ({
              product: {
                id: item.product,
                name: item.product_name,
                selling_price: item.unit_price,
                reference: item.product_reference || '',
              },
              quantity: item.quantity
            }));
            setSelectedProducts(products);
          }
        } catch (error) {
          console.error('Error fetching quote details:', error);
          onError('Erreur lors de la récupération des détails du devis');
        }
      } else if (!quoteDialog?.open) {
        // Reset when closing
        setSelectedClient(null);
        setSelectedZone(0);
        setSelectedProducts([]);
        setCurrentProduct(null);
        setCurrentQuantity(1);
        setNewQuoteData({ status: 'draft' });
        setStockError('');
      }
    };
    
    fetchQuoteDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteDialog?.open, quoteDialog?.quote, quoteDialog?.mode, clients]);

  // Note: Quotes don't require zone-specific stock checking
  // Products can be added to quotes without stock validation
  // Stock will be checked when the quote is converted to a sale

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
      return sum + (item.product.selling_price * item.quantity);
    }, 0);
  };

  // Handle add product to cart
  const handleAddProduct = () => {
    if (!currentProduct || currentQuantity <= 0) {
      return;
    }

    const availStock = availableStock[currentProduct.id!] || 0;
    
    // Check if product already exists in cart
    const existingIndex = selectedProducts.findIndex(
      item => item.product.id === currentProduct.id
    );

    let newTotalQuantity = currentQuantity;
    if (existingIndex >= 0) {
      // Add to existing quantity
      newTotalQuantity = selectedProducts[existingIndex].quantity + currentQuantity;
    }

    // Check if total quantity exceeds available stock
    if (newTotalQuantity > availStock) {
      setStockError(`Stock insuffisant! Disponible: ${availStock}`);
      return;
    }

    setStockError('');

    if (existingIndex >= 0) {
      // Update existing product quantity
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantity: newTotalQuantity,
      };
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product to cart
      setSelectedProducts([...selectedProducts, { product: currentProduct, quantity: currentQuantity }]);
    }

    setCurrentProduct(null);
    setCurrentQuantity(1);
  };

  // Handle remove product
  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  // Handle save sale (create or update)
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

      const saleData = {
        client: selectedClient.id!,
        zone: selectedZone,
        date: new Date().toISOString().split('T')[0],
        status: saleDialog?.sale?.status || 'pending',
        subtotal,
        tax_amount,
        total_amount,
        discount_amount: 0,
        notes: '',
        items: selectedProducts.map((item) => ({
          product: item.product.id!,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          discount_percentage: 0,
          total_price: item.product.selling_price * item.quantity,
        })),
      };

      if (saleDialog?.mode === 'edit' && saleDialog?.sale?.id) {
        // Update existing sale
        const updatedSale = await SalesAPI.updateSale(saleDialog.sale.id, saleData);
        onSuccess(`Vente ${updatedSale.reference} mise à jour avec succès`);
        
        // Refresh data if available
        if (data.refreshAllData) {
          await data.refreshAllData();
        }
      } else {
        // Create new sale
        const createdSale = await SalesAPI.createSale(saleData);
        onSuccess(`Vente ${createdSale.reference} créée avec succès`);
        
        // Refresh data if available
        if (data.refreshAllData) {
          await data.refreshAllData();
        }
      }

      closeSaleDialog();
      
      // Reset state
      setSelectedClient(null);
      setSelectedZone(0);
      setSelectedProducts([]);
      setCurrentProduct(null);
      setCurrentQuantity(1);
      setStockError('');
    } catch (error: any) {
      console.error('Error saving sale:', error);
      const errorMessage = error?.response?.data?.error || 'Erreur lors de l\'enregistrement de la vente';
      onError(errorMessage);
    }
  };

  // Handle save invoice (create or update)
  const handleSaveInvoice = async () => {
    try {
      if (!selectedSale && invoiceDialog?.mode !== 'edit') {
        onError('Veuillez sélectionner une vente');
        return;
      }

      if (invoiceDialog?.mode === 'edit' && invoiceDialog?.invoice?.id) {
        // Update existing invoice
        const updatedInvoice = await SalesAPI.updateInvoice(invoiceDialog.invoice.id, {
          date: newInvoiceData.date || invoiceDialog.invoice.date,
          due_date: newInvoiceData.due_date || invoiceDialog.invoice.due_date,
          notes: newInvoiceData.notes || invoiceDialog.invoice.notes,
          status: newInvoiceData.status || invoiceDialog.invoice.status,
        });
        onSuccess(`Facture ${updatedInvoice.reference} mise à jour avec succès`);
        
        // Refresh data if available
        if (data.refreshAllData) {
          await data.refreshAllData();
        }
      } else {
        // Create new invoice
        if (!selectedSale) {
          onError('Veuillez sélectionner une vente');
          return;
        }

        const invoiceData = {
          sale: selectedSale.id!,
          date: newInvoiceData.date || new Date().toISOString().split('T')[0],
          due_date: newInvoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft' as const,
          notes: newInvoiceData.notes || `Facture pour la vente ${selectedSale.reference}`,
        };

        const createdInvoice = await SalesAPI.createInvoice(invoiceData);
        onSuccess(`Facture ${createdInvoice.reference} créée avec succès`);
        
        // Refresh data if available
        if (data.refreshAllData) {
          await data.refreshAllData();
        }
      }

      closeInvoiceDialog();
      
      // Reset state
      setSelectedSale(null);
      setNewInvoiceData({});
    } catch (error: unknown) {
      console.error('Error saving invoice:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Erreur lors de l\'enregistrement de la facture';
      onError(errorMessage);
    }
  };

  // Handle save quote (create or update)
  const handleSaveQuote = async () => {
    try {
      if (!selectedClient || selectedProducts.length === 0) {
        onError('Veuillez sélectionner un client et ajouter des produits');
        return;
      }

      // Note: Quotes don't require zones - zone is selected during conversion to sale

      const subtotal = Number(calculateTotal().toFixed(2));
      const tax_amount = Number((subtotal * 0.00).toFixed(2));
      const total_amount = Number((subtotal + tax_amount).toFixed(2));

      const quoteData = {
        client: selectedClient.id!,
        date: newQuoteData.date || new Date().toISOString().split('T')[0],
        expiry_date: newQuoteData.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: newQuoteData.status || 'draft' as const,
        subtotal,
        tax_amount,
        total_amount,
        notes: newQuoteData.notes || `Devis pour ${selectedClient.name}`,
        items: selectedProducts.map((item) => ({
          product: item.product.id!,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          discount_percentage: 0,
          total_price: item.product.selling_price * item.quantity,
        })),
      };

      if (quoteDialog?.mode === 'edit' && quoteDialog?.quote?.id) {
        // Update existing quote
        const updatedQuote = await SalesAPI.updateQuote(quoteDialog.quote.id, quoteData);
        onSuccess(`Devis ${updatedQuote.reference} mis à jour avec succès`);
        
        // Refresh data if available
        if (data.refreshAllData) {
          await data.refreshAllData();
        }
      } else {
        // Create new quote
        const createdQuote = await SalesAPI.createQuote(quoteData);
        onSuccess(`Devis ${createdQuote.reference} créé avec succès`);
        
        // Refresh data if available
        if (data.refreshAllData) {
          await data.refreshAllData();
        }
      }

      closeQuoteDialog();
      
      // Reset state
      setSelectedClient(null);
      setSelectedZone(0);
      setSelectedProducts([]);
      setCurrentProduct(null);
      setCurrentQuantity(1);
      setNewQuoteData({ status: 'draft' });
      setStockError('');
    } catch (error: unknown) {
      console.error('Error saving quote:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Erreur lors de l\'enregistrement du devis';
      onError(errorMessage);
    }
  };

  return (
    <>
      {/* ===================== Sale Dialog ===================== */}
      <Dialog open={saleDialog?.open || false} onClose={closeSaleDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {saleDialog?.mode === 'edit' ? 'Modifier la vente' : 'Nouvelle vente'}
        </DialogTitle>
        <DialogContent>
          {/* Show workflow only in edit mode */}
          {saleDialog?.mode === 'edit' && saleDialog?.sale && (
            <Box sx={{ mb: 3 }}>
              <SalesWorkflow
                status={saleDialog.sale.status as SalesStatus}
                reference={saleDialog.sale.reference || ''}
                allowedTransitions={getAllowedTransitions(saleDialog.sale.status)}
                onStatusChange={async (newStatus: SalesStatus) => {
                  try {
                    if (!saleDialog?.sale?.id) {
                      onError('ID de vente manquant');
                      return;
                    }

                    // Update sale status via API
                    await SalesAPI.updateSale(saleDialog.sale.id, { status: newStatus });
                    onSuccess(`Statut mis à jour vers: ${newStatus}`);
                    
                    // Refresh data if available
                    if (data.refreshAllData) {
                      await data.refreshAllData();
                    }
                    
                    // Close dialog to refresh parent view
                    closeSaleDialog();
                  } catch (error: unknown) {
                    console.error('Error updating status:', error);
                    const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Erreur lors de la mise à jour du statut';
                    onError(errorMessage);
                  }
                }}
              />
            </Box>
          )}

          {/* EDIT MODE: Show simplified summary */}
          {saleDialog?.mode === 'edit' && saleDialog?.sale && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Summary Cards */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Paper sx={{ 
                    flex: '1 0 200px', 
                    p: 2, 
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                    <Typography variant="body1" fontWeight="bold" align="center">
                      {selectedClient?.name || 'N/A'}
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ 
                    flex: '1 0 140px', 
                    p: 2, 
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {saleDialog.sale.date ? new Date(saleDialog.sale.date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Paper>
                  
                  <Paper sx={{ 
                    flex: '1 0 140px', 
                    p: 2, 
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">Montant total</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      {formatCurrency(saleDialog.sale.total_amount || 0)}
                    </Typography>
                  </Paper>
                </Box>

                {/* Payment Information */}
                {saleDialog.sale.paid_amount !== undefined && (
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 3, 
                      mb: 3, 
                      border: '2px solid',
                      borderColor: saleDialog.sale.payment_status === 'paid' ? 'success.main' : 
                                   saleDialog.sale.payment_status === 'partially_paid' ? 'warning.main' : 'error.main',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        Statut des Paiements
                      </Typography>
                      <Box sx={{ ml: 'auto' }}>
                        <StatusChip 
                          status={saleDialog.sale.payment_status || 'unpaid'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            Montant Total
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                            {formatCurrency(saleDialog.sale.total_amount || 0)}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            Montant Payé
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mt: 1 }}>
                            {formatCurrency(saleDialog.sale.paid_amount || 0)}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            Solde Restant
                          </Typography>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: (saleDialog.sale.total_amount || 0) - (saleDialog.sale.paid_amount || 0) > 0 ? 'error.main' : 'success.main',
                              mt: 1 
                            }}
                          >
                            {formatCurrency((saleDialog.sale.total_amount || 0) - (saleDialog.sale.paid_amount || 0))}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Grid>

              {/* Items table */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <Typography variant="subtitle1" fontWeight="medium">Articles de la vente</Typography>
                  </Box>
                  
                  {selectedProducts.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Produit</TableCell>
                            <TableCell align="right">Quantité</TableCell>
                            <TableCell align="right">Prix unitaire</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedProducts.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.product.name}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(item.product.selling_price)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.product.selling_price * item.quantity)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatCurrency(calculateTotal())}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Chargement des articles...
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* CREATE MODE: Show full form */}
          {saleDialog?.mode !== 'edit' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={clients || []}
                  getOptionLabel={(option) => option.name}
                  value={selectedClient}
                  onChange={(event, newValue) => {
                    setSelectedClient(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField  {...params}
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
                    onChange={(e) => setSelectedZone(Number(e.target.value))}
                    label="Zone"
                  >
                    {(zones || []).map((zone: any) => (
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
                    setCurrentProduct(newValue);
                    setCurrentQuantity(1);
                  }}
                  renderInput={(params) => (
                    <TextField  {...params}
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
                  onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  sx={{ width: 100 }}
                  inputProps={{ min: 1 }}
                />
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
                Produits sélectionnés
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
        <DialogActions>
          <Button onClick={closeSaleDialog}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSaveSale}
            disabled={!selectedClient || selectedProducts.length === 0}
          >
            {saleDialog?.mode === 'edit' ? 'Enregistrer' : 'Créer la vente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Invoice Dialog ===================== */}
      <Dialog open={invoiceDialog?.open || false} onClose={closeInvoiceDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
            {invoiceDialog?.mode === 'edit' ? 'Modifier la facture' : 'Nouvelle facture'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={(sales || []).filter((sale: any) => 
                  (sale.status === 'payment_pending' || sale.status === 'confirmed' || sale.status === 'completed')
                )}
                getOptionLabel={(option) => {
                  const client = (clients || []).find((c: any) => c.id === option.client);
                  return `${option.reference} - ${client?.name || 'N/A'} (${formatCurrency(option.total_amount)})`;
                }}
                value={selectedSale}
                onChange={(event, newValue) => {
                  setSelectedSale(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Vente associée *"
                    variant="outlined"
                    fullWidth
                    helperText="Sélectionnez une vente confirmée ou livrée sans facture existante"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`sale-${option.id}`}>
                    <Box>
                      <Typography variant="body1">
                        {option.reference} - {(clients || []).find((c: any) => c.id === option.client)?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Montant: {formatCurrency(option.total_amount)} • Date: {new Date(option.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </li>
                )}
                noOptionsText="Aucune vente éligible pour facturation"
              />
            </Grid>
            
            {selectedSale && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>Détails de la vente</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Client:</Typography>
                        <Typography variant="body1">
                          {(clients || []).find((c: any) => c.id === selectedSale.client)?.name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Date de vente:</Typography>
                        <Typography variant="body1">
                          {new Date(selectedSale.date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Montant total:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(selectedSale.total_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Statut:</Typography>
                        <StatusChip 
                          status={selectedSale.status}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date d'émission"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => setNewInvoiceData({...newInvoiceData, date: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date d'échéance"
                    type="date"
                    defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => setNewInvoiceData({...newInvoiceData, due_date: e.target.value})}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Notes additionnelles pour la facture..."
                    onChange={(e) => setNewInvoiceData({...newInvoiceData, notes: e.target.value})}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => {
            closeInvoiceDialog();
            setSelectedSale(null);
            setNewInvoiceData({});
          }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveInvoice}
            disabled={!selectedSale && invoiceDialog?.mode !== 'edit'}
            startIcon={<AddIcon />}
          >
            {invoiceDialog?.mode === 'edit' ? 'Enregistrer' : 'Créer la facture'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Quote Dialog ===================== */}
      <Dialog open={quoteDialog?.open || false} onClose={closeQuoteDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
            {quoteDialog?.mode === 'edit' ? 'Modifier le devis' : 'Nouveau devis'}
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
                  setSelectedClient(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Client *"
                    variant="outlined"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`client-${option.id}`}>
                    <Box>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email && `Email: ${option.email} • `}
                        {option.phone && `Tél: ${option.phone}`}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Date du devis"
                type="date"
                value={newQuoteData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewQuoteData({...newQuoteData, date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date d'expiration"
                type="date"
                value={newQuoteData.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setNewQuoteData({...newQuoteData, expiry_date: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Date limite de validité du devis"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={newQuoteData.status || 'draft'}
                  onChange={(e) => setNewQuoteData({...newQuoteData, status: e.target.value})}
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
                  newQuoteData.expiry_date 
                    ? `${Math.max(0, Math.ceil((new Date(newQuoteData.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} jours`
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
                  options={productsWithStock || []}
                  getOptionLabel={(option) => `${option.name} (Stock: ${availableStock[option.id!] || 0})`}
                  value={currentProduct}
                  onChange={(event, newValue) => {
                    setCurrentProduct(newValue);
                    setCurrentQuantity(1);
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
                          Prix: {formatCurrency(option.selling_price)} • Stock: {availableStock[option.id!] || 0}
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
                  onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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

            <Grid item xs={12}>
              <TextField
                label="Notes"
                multiline
                rows={3}
                fullWidth
                placeholder="Notes additionnelles pour le devis..."
                onChange={(e) => setNewQuoteData({...newQuoteData, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={closeQuoteDialog}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuote}
            disabled={!selectedClient || selectedProducts.length === 0}
            startIcon={<AddIcon />}
          >
            {quoteDialog?.mode === 'edit' ? 'Enregistrer' : 'Créer le devis'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Quote Conversion Dialog ===================== */}
      <Dialog 
        open={quoteConversionDialog?.open || false} 
        onClose={closeQuoteConversionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Convertir un devis en vente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1">
                Convertir le devis {quoteConversionDialog?.quote?.reference} en vente.
              </Typography>
              {quoteConversionDialog?.quote?.is_converted && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Ce devis a déjà été converti en vente.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={quoteConversionDialog?.quote?.is_converted}>
                <InputLabel>Zone</InputLabel>
                <Select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(Number(e.target.value))}
                  label="Zone"
                >
                  {(zones || []).map((zone: any) => (
                    <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeQuoteConversionDialog}>Annuler</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (!quoteConversionDialog?.quote) {
                  onError('Aucun devis sélectionné');
                  return;
                }

                if (quoteConversionDialog.quote.is_converted) {
                  onError('Ce devis a déjà été converti en vente');
                  return;
                }

                if (!selectedZone) {
                  onError('Veuillez sélectionner une zone');
                  return;
                }

                // Call API to convert quote to sale
                const createdSale = await SalesAPI.convertQuoteToSale(quoteConversionDialog.quote.id!, selectedZone);
                
                // Refresh data if available
                if (data.refreshAllData) {
                  await data.refreshAllData();
                }
                
                onSuccess(`Devis ${quoteConversionDialog.quote.reference} converti en vente avec succès! Référence: ${createdSale.reference}`);
                closeQuoteConversionDialog();
                setSelectedZone(0);
              } catch (error: unknown) {
                console.error('Error converting quote to sale:', error);
                const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Erreur lors de la conversion du devis en vente';
                onError(errorMessage);
              }
            }}
            disabled={!quoteConversionDialog?.quote || quoteConversionDialog?.quote?.is_converted || !selectedZone}
          >
            Convertir
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Delete Dialog ===================== */}
      <DeleteDialog
        open={deleteDialog?.open || false}
        onClose={closeDeleteDialog}
        onConfirm={async () => {
          try {
            if (!deleteDialog?.item?.id) {
              onError('ID de l\'élément manquant');
              return;
            }

            const itemId = deleteDialog.item.id;
            const type = deleteDialog.type;

            // Delete based on type
            if (type === 'sale') {
              await SalesAPI.deleteSale(itemId);
              onSuccess(`Vente ${deleteDialog.item.reference || itemId} supprimée avec succès`);
            } else if (type === 'invoice') {
              await SalesAPI.deleteInvoice(itemId);
              onSuccess(`Facture ${deleteDialog.item.reference || itemId} supprimée avec succès`);
            } else if (type === 'quote') {
              await SalesAPI.deleteQuote(itemId);
              onSuccess(`Devis ${deleteDialog.item.reference || itemId} supprimé avec succès`);
            } else {
              onError('Type d\'élément non reconnu');
              return;
            }

            // Refresh data if available
            if (data.refreshAllData) {
              await data.refreshAllData();
            }

            closeDeleteDialog();
          } catch (error: unknown) {
            console.error('Error deleting item:', error);
            const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Erreur lors de la suppression de l\'élément';
            onError(errorMessage);
          }
        }}
        type={deleteDialog?.type}
        item={deleteDialog?.item}
        confirmationInfo={deleteDialog?.confirmationInfo}
      />
    </>
  );
};

export default SaleDialogManager;
