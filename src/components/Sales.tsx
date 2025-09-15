import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Autocomplete,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Snackbar,
  InputAdornment,
  Tooltip,
  Card,
  LinearProgress,
  styled
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  StandardDataGrid, 
  StatusChip,
  DeleteDialog 
} from './common';
import { t } from '../utils/translations';
import { 
  validateIntegerInput, 
  validateDecimalInput, 
  formatNumberDisplay, 
  getValidationError
} from '../utils/inputValidation';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Payments as PaymentsIcon,
  QrCodeScanner as QrCodeScannerIcon,
  LocalShipping,
  ShoppingCart,
  ReceiptLong,
  AttachMoney,
  Check,
  Cancel,
  CheckCircle,
  ElectricBolt,
  Payments,
  Warning
} from '@mui/icons-material';
import { SalesAPI, ClientsAPI, ProductsAPI, InventoryAPI, ZonesAPI, InvoicesAPI, QuotesAPI } from '../services/api';
import { Sale, Client, Zone, ApiSaleItem, ApiInvoice, ApiQuote, ExtendedInvoice } from '../interfaces/sales';
import { Product } from '../interfaces/products';
import { usePermissionCheck } from '../hooks/usePermissionCheck';
import { Html5Qrcode } from 'html5-qrcode';
import PermissionButton from './common/PermissionButton';
import PermissionGuard from './PermissionGuard';
import { SalesStatus } from './common/SalesWorkflow';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Define the ExtendedSale interface with client as Client object instead of number
interface ExtendedSale extends Omit<Sale, 'client'> {
  client: number;
  paid_amount?: number;
  remaining_amount?: number;
  balance?: number;
}

// Define a local SaleItem interface that includes product_name
interface SaleItem extends ApiSaleItem {
  product_name?: string;
}

// Fix the duplicate sales state and related state variables
const Sales = () => {
  // Add permission check hooks
  const { canPerform } = usePermissionCheck();
  const canEditSale = canPerform('change_sale');
  const canDeleteSale = canPerform('delete_sale');

  const [tabValue, setTabValue] = useState(0);
  const [sales, setSales] = useState<ExtendedSale[]>([]);  const [clients, setClients] = useState<Client[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Remove duplicate declarations of sales, clients, products, loading, searchTerm, and statusFilter
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{product: Product, quantity: number}[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [editingSale, setEditingSale] = useState<ExtendedSale | null>(null);
  const [editingSaleItems, setEditingSaleItems] = useState<SaleItem[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  
  // New state variables for stock availability
  const [availableStock, setAvailableStock] = useState<{[productId: number]: number}>({});
  const [stockError, setStockError] = useState<string | null>(null);
  const [productsWithStock, setProductsWithStock] = useState<Product[]>([]);
  
  // New state variables for invoices and quotes
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [quoteDateFilter, setQuoteDateFilter] = useState('');
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ExtendedSale | null>(null);  const [editingInvoice, setEditingInvoice] = useState<ExtendedInvoice | null>(null);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
    // Add the missing state variables
  const [selectedQuoteForConversion, setSelectedQuoteForConversion] = useState<ApiQuote | null>(null);
  const [showQuoteConversionModal, setShowQuoteConversionModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<ApiQuote | null>(null);
  const [showEditQuoteModal, setShowEditQuoteModal] = useState(false);
  
  // Add delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<ExtendedSale | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<ExtendedInvoice | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<ApiQuote | null>(null);

  const [deleteConfirmationInfo, setDeleteConfirmationInfo] = useState<{
    willRestoreStock: boolean;
    willRefundAmount: number;
    hasPayments: boolean;
    invoiceId?: number;
    quoteId?: number;
  } | null>(null);
  
  // Add new state variables for improved invoice and quote forms
  const [newInvoiceData, setNewInvoiceData] = useState<{
    date?: string;
    due_date?: string;
    notes?: string;
  }>({});
  const [newQuoteData, setNewQuoteData] = useState<{
    date?: string;
    expiry_date?: string;
    notes?: string;
  }>({});
  
  // Styled components for better visuals
const PaymentInfoCard = styled(Card)(() => ({
  borderRadius: 12,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
  },
}));

  // QR Code scanner states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedQuantity, setScannedQuantity] = useState<number>(1);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean, 
    message: string, 
    severity: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Add pagination model state for each grid
  const [salesPaginationModel, setSalesPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  
  const [invoicePaginationModel, setInvoicePaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
    const [quotePaginationModel, setQuotePaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // These functions are no longer needed with the simplified interface  // Get allowed transitions based on current status
  const getAllowedTransitions = (status: string): SalesStatus[] => {
    // These transitions must match the backend validation rules
    // Note: 'fast_track' is not a real status but a UI option that triggers
    // sequential transitions through multiple valid statuses
    switch (status) {
      case 'pending':
        return ['confirmed', 'cancelled', 'fast_track' as SalesStatus];
      case 'confirmed':
        // Skip showing payment_pending since it's automatic - show next transitions
        return ['partially_paid', 'paid', 'cancelled', 'fast_track' as SalesStatus];
      case 'payment_pending':
        return ['partially_paid', 'paid', 'cancelled', 'fast_track' as SalesStatus];
      case 'partially_paid':
        return ['paid', 'cancelled', 'fast_track' as SalesStatus];
      case 'paid':
        return ['shipped', 'cancelled', 'fast_track' as SalesStatus];
      case 'shipped':
        return ['delivered', 'cancelled', 'fast_track' as SalesStatus];
      case 'delivered':
        return ['completed', 'cancelled'];      case 'completed':
        return [];
      case 'cancelled':
        return [];
      default:
        return [];
    }
  };
  const fetchZones = async () => {
    const data = await ZonesAPI.getAll();
    setZones(data);
  };
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [salesData, clientsData, productsData] = await Promise.all([
        SalesAPI.getAll(),
        ClientsAPI.getAll(),
        ProductsAPI.getAll()
      ]);
      
      setSales(salesData);
      setClients(clientsData);
      setProducts(productsData);
      setLoading(false);
      
      // Also fetch invoices and quotes when the component loads
      fetchInvoices();
      fetchQuotes();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setError(null);
    fetchZones();
    fetchData();
  }, [fetchData]); // Now fetchData is memoized and safe to include

  // New effect to fetch available products with stock when zone changes
  useEffect(() => {
    const fetchProductsWithStock = async () => {
      try {
        if (!selectedZone) return;
        
        setLoading(true);
        // Get stock for the selected zone
        const stockData = await InventoryAPI.getStockByZone(selectedZone);
        
        // Filter original products list to only include products with stock > 0
        const productsInStock = products.filter(product => {
          const stockItem = stockData.find(item => item.product === product.id);
          return stockItem && stockItem.quantity > 0;
        });
        
        // Create a mapping of product IDs to their available stock quantities
        const stockMap = stockData.reduce((acc, item) => {
          acc[item.product] = item.quantity;
          return acc;
        }, {} as {[productId: number]: number});
        
        setProductsWithStock(productsInStock);
        setAvailableStock(stockMap);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Erreur lors de la récupération des données de stock.');
        setLoading(false);
      }
    };
      fetchProductsWithStock();
  }, [selectedZone, products]);

  // Function to fetch invoices
  const fetchInvoices = async () => {
    try {
      setInvoiceLoading(true);
      // Use the real API instead of mock data
      const invoicesData = await InvoicesAPI.getAll();
      setInvoices(invoicesData);
      setInvoiceLoading(false);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setInvoiceLoading(false);
      setError('Erreur lors du chargement des factures. Veuillez réessayer plus tard.');
    }
  };

  // Function to fetch quotes
  const fetchQuotes = async () => {
    try {
      setQuoteLoading(true);
      // Use the real API instead of mock data
      const quotesData = await QuotesAPI.getAll();
      setQuotes(quotesData);
      setQuoteLoading(false);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setQuoteLoading(false);
      setError('Erreur lors du chargement des devis. Veuillez réessayer plus tard.');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredSales = sales.filter((sale) => {
    const clientId = Number(sale.client);
    const client = clients.find(c => c.id === clientId);
    
    const matchesSearch = sale.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === '' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter invoices based on search term, status filter, and date filter
  const filteredInvoices = invoices.filter((invoice: ExtendedInvoice) => {
    const matchesSearch = 
      invoice.reference.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      (invoice.client_name?.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || false) ||
      (invoice.sale_reference?.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || false);
    const matchesStatus = invoiceStatusFilter === '' || invoice.status === invoiceStatusFilter;
    
    // Date filtering
    let matchesDate = true;
    if (invoiceDateFilter) {
      const invoiceDate = new Date(invoice.date);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      switch (invoiceDateFilter) {
        case 'today':
          matchesDate = invoiceDate >= startOfDay;
          break;
        case 'week': {
          const weekAgo = new Date(startOfDay);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = invoiceDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(startOfDay);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = invoiceDate >= monthAgo;
          break;
        }
        case 'quarter': {
          const quarterAgo = new Date(startOfDay);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          matchesDate = invoiceDate >= quarterAgo;
          break;
        }
        case 'year': {
          const yearAgo = new Date(startOfDay);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          matchesDate = invoiceDate >= yearAgo;
          break;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filter quotes based on search term, status filter, and date filter
  const filteredQuotes = quotes.filter((quote: ApiQuote) => {
    const clientId = Number(quote.client);
    const client = clients.find(c => c.id === clientId);
    const matchesSearch = 
      quote.reference.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
      (client?.name?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || false);
    const matchesStatus = quoteStatusFilter === '' || quote.status === quoteStatusFilter;
    
    // Date filtering
    let matchesDate = true;
    if (quoteDateFilter) {
      const quoteDate = new Date(quote.date);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      switch (quoteDateFilter) {
        case 'today':
          matchesDate = quoteDate >= startOfDay;
          break;
        case 'week': {
          const weekAgo = new Date(startOfDay);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = quoteDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(startOfDay);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = quoteDate >= monthAgo;
          break;
        }
        case 'quarter': {
          const quarterAgo = new Date(startOfDay);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          matchesDate = quoteDate >= quarterAgo;
          break;
        }
        case 'year': {
          const yearAgo = new Date(startOfDay);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          matchesDate = quoteDate >= yearAgo;
          break;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Update useEffect hooks to reset page in pagination models
  useEffect(() => {
    setSalesPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setInvoicePaginationModel(prev => ({ ...prev, page: 0 }));
  }, [invoiceSearchTerm, invoiceStatusFilter]);

  useEffect(() => {
    setQuotePaginationModel(prev => ({ ...prev, page: 0 }));
  }, [quoteSearchTerm, quoteStatusFilter]);

  const handleAddProduct = async () => {
    if (!currentProduct || currentQuantity <= 0 || !selectedZone) {
      return;
    }

    setError(null);
    setStockError(null);

    try {
      // Check stock availability in selected zone
      const stockAvailability = await InventoryAPI.checkStockAvailability(
        currentProduct.id,
        selectedZone,
        currentQuantity
      );

      if (!stockAvailability.available) {
        setStockError('Stock insuffisant pour ce produit dans la zone sélectionnée.');
        return;
      }

      setSelectedProducts(prevProducts => {
        const existingIndex = prevProducts.findIndex(
          item => item.product.id === currentProduct.id
        );

        if (existingIndex >= 0) {
          // If product already exists, increment quantity
          const updatedProducts = [...prevProducts];
          const existingItem = updatedProducts[existingIndex];
          const newQuantity = existingItem.quantity + currentQuantity;

          updatedProducts[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
          };

          return updatedProducts;
        } else {
          // Add as a new product line
          return [
            ...prevProducts,
            { product: currentProduct, quantity: currentQuantity },
          ];
        }
      });

      setAvailableStock(prev => ({
        ...prev,
        [currentProduct.id!]: (prev[currentProduct.id!] || 0) - currentQuantity,
      }));

      // Reset state
      setCurrentProduct(null);
      setCurrentQuantity(1);
      setStockError(null);
    } catch (err) {
      console.error('Error checking stock availability:', err);
      setStockError('Erreur lors de la vérification du stock disponible.');
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce(
      (total, item) => total + item.product.selling_price * item.quantity,
      0
    );
  };

  const handleCreateSale = async () => {
    if (!selectedClient) {
      setError('Veuillez sélectionner un client');
      return;
    }

    if (selectedProducts.length === 0) {
      setError('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      setError(null);
      const subtotal = Number(calculateTotal().toFixed(2));
      const tax_amount = Number((subtotal * 0.20).toFixed(2)); 
      const total_amount = Number((subtotal + tax_amount).toFixed(2));      
      const newSale: Sale = {
        client: selectedClient.id!,
        zone: selectedZone,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',  // Initial status is pending, changes to payment_pending when confirmed
        subtotal,
        discount_amount: 0,
        tax_amount,
        total_amount,
        remaining_amount: total_amount,
        notes: 'Créé depuis l\'application',
        items: selectedProducts.map((item) => ({
          product: item.product.id!,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
          discount_percentage: 0,
          total_price: item.product.selling_price * item.quantity,
        })),
      };

      console.log('Creating sale:', newSale);
      const createdSale = await SalesAPI.create(newSale);
      console.log('Sale created:', createdSale);
      
      await fetchData(); // Refresh the list
      setShowAddModal(false);
      setSelectedClient(null);
      setSelectedProducts([]);
      setSelectedZone(1); // Reset to default zone
    } catch (err: unknown) {
      console.error('Error creating sale:', err);
      setError('Erreur lors de la création de la vente. Veuillez réessayer.');
    }
  };

  const handleEditSale = async (sale: ExtendedSale) => {
    try {
      setError(null);

      if (!sale.id) {
        setError('ID de la vente manquant');
        return;
      }

      // Fetch sale items
      const saleDetails = await SalesAPI.get(sale.id);
      console.log('Sale details:', saleDetails);
      setEditingSaleItems(saleDetails.items); // Populate editingSaleItems with fetched items

      setEditingSale(sale);
      setShowEditModal(true);
    } catch (err) {
      console.error('Error fetching sale items:', err);
      setError('Erreur lors de la récupération des articles de vente. Veuillez réessayer plus tard.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      setError(null);

      if (!editingSale) {
        setError('Données de vente manquantes');
        return;
      }

      if (!editingSale.id) {
        setError('ID de la vente manquant');
        return;
      }

      // Include items in the saleToUpdate object
      const saleToUpdate: Sale = {
        id: editingSale.id,
        reference: editingSale.reference,
        client: editingSale.client,
        zone: editingSale.zone,
        date: editingSale.date,
        status: editingSale.status,
        subtotal: editingSale.subtotal,
        discount_amount: editingSale.discount_amount,
        tax_amount: editingSale.tax_amount,
        total_amount: editingSale.total_amount,
        notes: editingSale.notes || '',
        items: editingSaleItems.map((item) => ({
          id: item.id,
          sale: item.sale,
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          total_price: item.total_price,
        })),
        // Don't include created_by field when updating
      };

      console.log('Updating sale:', saleToUpdate);
      const updatedSale = await SalesAPI.update(editingSale.id, saleToUpdate);
      console.log('Sale updated:', updatedSale);

      // Update the local state
      setSales(sales.map((s) => (s.id === editingSale.id ? { ...s, ...updatedSale, client: editingSale.client } : s)));
      setShowEditModal(false);
      setEditingSale(null);
      setEditingSaleItems([]);
    } catch (err: unknown) {
      console.error('Error updating sale:', err);
      let errorMessage = 'Erreur lors de la mise à jour de la vente. Veuillez réessayer plus tard.';

      // Check for specific error messages from the API
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data
      ) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Display specific error messages
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage = `Erreur: ${errorMessages}`;
        }
      }

      setError(errorMessage);
    }
  };

  const handleDeleteSale = async (sale: ExtendedSale) => {
    try {
      setError(null);

      if (!sale.id) {
        setError('ID de la vente manquant');
        return;
      }

      // Only show confirmation dialog, do not delete yet
      setSaleToDelete(sale);
      setDeleteConfirmationInfo(null); // Optionally fetch info for dialog if needed
      setShowDeleteDialog(true);
    } catch (err: unknown) {
      console.error('Error checking delete eligibility:', err);
      
      let errorMessage = 'Erreur lors de la vérification de suppression.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      
      setError(errorMessage);
    }
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!saleToDelete?.id && !invoiceToDelete?.id && !quoteToDelete?.id) {
      setError('Aucun élément sélectionné pour suppression');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (saleToDelete?.id) {
          console.log('Deleting sale:', saleToDelete);
          const deletionResult = await SalesAPI.delete(saleToDelete.id);
          console.log('Sale deleted:', deletionResult);

          // Show success message with details
          if (deletionResult.deletion_summary) {
            const summary = deletionResult.deletion_summary;
            let successMessage = `Vente ${summary.sale_reference} supprimée avec succès.`;
            
            if (summary.stock_restored && summary.stock_restored.length > 0) {
              successMessage += '\n\nStock restauré:';
              summary.stock_restored.forEach((item: { product: string; quantity: number; zone: string }) => {
                successMessage += `\n• ${item.product}: ${item.quantity} unités dans ${item.zone}`;
              });
            }
            
            if (summary.payment_refunded > 0) {
              successMessage += `\n\nMontant remboursé: ${formatCurrency(summary.payment_refunded)}`;
            }
            
            setSuccessMessage(successMessage);
            setTimeout(() => setSuccessMessage(null), 8000); // Show for 8 seconds due to more content
          }

          // Update the local state
          setSales(sales.filter(s => s.id !== saleToDelete.id));
          
          // Close dialog and reset state
          setShowDeleteDialog(false);
          setSaleToDelete(null);
          setDeleteConfirmationInfo(null);
      }else if (invoiceToDelete?.id) {
          console.log('Deleting invoice:', invoiceToDelete);
          const deletionResult = await InvoicesAPI.delete(invoiceToDelete.id);
          console.log('Invoice deleted:', deletionResult);

          // Show success message with details
          if (deletionResult) {
            setSuccessMessage(`Facture supprimée avec succès.`);
            setTimeout(() => setSuccessMessage(null), 8000); // Show for 8 seconds due to more content
          }

          // Update the local state
          setInvoices(invoices.filter(i => i.id !== invoiceToDelete.id));

          // Close dialog and reset state
          setShowDeleteDialog(false);
          setInvoiceToDelete(null);
      }else if (quoteToDelete?.id) {
          console.log('Deleting quote:', quoteToDelete);
          const deletionResult = await QuotesAPI.delete(quoteToDelete.id);
          console.log('Quote deleted:', deletionResult);

          // Show success message with details
          if (deletionResult) {
            setSuccessMessage(`Devis ${deletionResult} supprimé avec succès.`);
            setTimeout(() => setSuccessMessage(null), 8000); // Show for 8 seconds due to more content
          }

          // Update the local state
          setQuotes(quotes.filter(q => q.id !== quoteToDelete.id));

          // Close dialog and reset state
          setShowDeleteDialog(false);
          setQuoteToDelete(null);
      }

    } catch (err: unknown) {
      console.error('Error deleting sale:', err);
      
      let errorMessage = 'Erreur lors de la suppression de la vente.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel deletion
  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setSaleToDelete(null);
    setQuoteToDelete(null);
    setDeleteConfirmationInfo(null);
    setInvoiceToDelete(null); // Reset invoice deletion state
  };

  // Add the formatCurrency function
  const formatCurrency = (amount: number | null | undefined): string => {
    // Handle NaN, null, and undefined values
    if (amount == null || isNaN(amount)) {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0
      }).format(0);
    }
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle creating a new invoice - improved version
  const handleCreateInvoice = async () => {
    if (!selectedSale) {
      setSnackbarState({
        open: true,
        message: 'Veuillez sélectionner une vente',
        severity: 'error'
      });
      return;
    }

    try {
      setError(null);
      const client = clients.find(c => c.id === selectedSale.client);
      const newInvoice: ApiInvoice = {
        reference: `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
        sale: selectedSale.id!,
        date: newInvoiceData.date || new Date().toISOString().split('T')[0],
        due_date: newInvoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        amount: selectedSale.total_amount,
        paid_amount: 0,
        balance: selectedSale.total_amount,
        notes: newInvoiceData.notes || `Facture pour la vente ${selectedSale.reference}`,
        sale_reference: selectedSale.reference,
        client_name: client?.name
      };

      // Call the real API
      const createdInvoice = await InvoicesAPI.create(newInvoice);
      
      // Update the local state with the created invoice
      setInvoices([...invoices, createdInvoice]);
      setShowAddInvoiceModal(false);
      setSelectedSale(null);
      setNewInvoiceData({});
      
      setSnackbarState({
        open: true,
        message: `Facture ${createdInvoice.reference} créée avec succès`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating invoice:', err);
      setSnackbarState({
        open: true,
        message: 'Erreur lors de la création de la facture. Veuillez réessayer.',
        severity: 'error'
      });
    }
  };

  // Handle creating a new quote - improved version
  const handleCreateQuote = async () => {
    if (!selectedClient) {
      setSnackbarState({
        open: true,
        message: 'Veuillez sélectionner un client',
        severity: 'error'
      });
      return;
    }

    if (selectedProducts.length === 0) {
      setSnackbarState({
        open: true,
        message: 'Veuillez ajouter au moins un produit',
        severity: 'error'
      });
      return;
    }

    if (!selectedZone) {
      setSnackbarState({
        open: true,
        message: 'Veuillez sélectionner une zone',
        severity: 'error'
      });
      return;
    }

    try {
      setError(null);
      const subtotal = Number(calculateTotal().toFixed(2));
      const tax_amount = Number((subtotal * 0.20).toFixed(2)); 
      const total_amount = Number((subtotal + tax_amount).toFixed(2));
      
      const newQuote: ApiQuote = {
        reference: `DEV-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(4, '0')}`,
        client: selectedClient.id!,
        date: newQuoteData.date || new Date().toISOString().split('T')[0],
        expiry_date: newQuoteData.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
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

      // Call the real API
      const createdQuote = await QuotesAPI.create(newQuote);
      
      // Update the local state with the created quote
      setQuotes([...quotes, createdQuote]); 
      setShowAddQuoteModal(false);
      setSelectedClient(null);
      setSelectedProducts([]);
      setNewQuoteData({});
      setSelectedZone(0);
      
      setSnackbarState({
        open: true,
        message: `Devis ${createdQuote.reference} créé avec succès`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating quote:', err);
      setSnackbarState({
        open: true,
        message: 'Erreur lors de la création du devis. Veuillez réessayer.',
        severity: 'error'
      });
    }
  };

  // Handle editing an invoice - clean up the mixed code
  const handleEditInvoice = async (invoice: ExtendedInvoice) => {
    try {
      setError(null);
      // Get the latest invoice data from the API
      const invoiceData = await InvoicesAPI.get(invoice.id!);
      setEditingInvoice(invoiceData);
      setShowEditInvoiceModal(true);
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError('Erreur lors de la récupération des détails de la facture. Veuillez réessayer plus tard.');
    }
  };

  // Handle saving edited invoice - improved version
  const handleSaveEditInvoice = async () => {
    try {
      if (!editingInvoice || !editingInvoice.id) return;
      
      // Validate data
      if (editingInvoice.paid_amount < 0) {
        setSnackbarState({
          open: true,
          message: 'Le montant payé ne peut pas être négatif',
          severity: 'error'
        });
        return;
      }
      
      if (editingInvoice.paid_amount > editingInvoice.amount) {
        setSnackbarState({
          open: true,
          message: 'Le montant payé ne peut pas dépasser le montant total',
          severity: 'error'
        });
        return;
      }
      
      // Update balance
      const updatedInvoice = {
        ...editingInvoice,
        balance: editingInvoice.amount - editingInvoice.paid_amount
      };
      
      // Call the real API to update the invoice
      const savedInvoice = await InvoicesAPI.update(editingInvoice.id, updatedInvoice);
      
      // Update the local state
      setInvoices(invoices.map(i => i.id === editingInvoice.id ? savedInvoice : i));
      setShowEditInvoiceModal(false);
      setEditingInvoice(null);
      
      setSnackbarState({
        open: true,
        message: `Facture ${savedInvoice.reference} mise à jour avec succès`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating invoice:', err);
      setSnackbarState({
        open: true,
        message: 'Erreur lors de la mise à jour de la facture. Veuillez réessayer.',
        severity: 'error'
      });
    }
  };

  // Handle deleting an invoice - improved version
  const handleDeleteInvoice = async (invoice: ExtendedInvoice) => {
    
    try {
      setError(null);

      if (!invoice.id) {
        setError('ID de la vente manquant');
        return;
      }

      // Only show confirmation dialog, do not delete yet
      setInvoiceToDelete(invoice);
      setDeleteConfirmationInfo(null); // Optionally fetch info for dialog if needed
      setShowDeleteDialog(true);
    } catch (err: unknown) {
      console.error('Error checking delete eligibility:', err);
      
      let errorMessage = 'Erreur lors de la vérification de suppression.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      
      setError(errorMessage);
    }
    
  };

  // Handle deleting a quote
  const handleDeleteQuote = async (quote: ApiQuote) => {
    try {
      setError(null);

      if (!quote.id) {
        setError('ID de la vente manquant');
        return;
      }

      // Only show confirmation dialog, do not delete yet
      setQuoteToDelete(quote);
      setDeleteConfirmationInfo(null); // Optionally fetch info for dialog if needed
      setShowDeleteDialog(true);
    } catch (err: unknown) {
      console.error('Error checking delete eligibility:', err);
      
      let errorMessage = 'Erreur lors de la vérification de suppression.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      
      setError(errorMessage);
    }
  };

  // Handle editing a quote
  const handleEditQuote = async (quote: ApiQuote) => {
    try {
      setError(null);
      // Get the latest quote data from the API
      const quoteData = await QuotesAPI.get(quote.id!);
      setEditingQuote(quoteData);
      setShowEditQuoteModal(true);
    } catch (err) {
      console.error('Error fetching quote details:', err);
      setSnackbarState({
        open: true,
        message: 'Erreur lors de la récupération des détails du devis.',
        severity: 'error'
      });
    }
  };

  // Add a function to convert quote to sale
  const handleConvertQuoteToSale = async (quote: ApiQuote) => {
    try {
      if (!quote.id) return;
      
      // Check if quote is already converted
      if (quote.is_converted) {
        setSnackbarState({
          open: true,
          message: 'Ce devis a déjà été converti en vente',
          severity: 'warning'
        });
        return;
      }
      
      // Set the quote for conversion and show modal for zone selection
      setSelectedQuoteForConversion(quote);
      setShowQuoteConversionModal(true);
    } catch (err) {
      console.error('Error preparing quote conversion:', err);
      setSnackbarState({
        open: true,
        message: 'Erreur lors de la préparation de la conversion du devis.',
        severity: 'error'
      });
    }
  };

  // Perform the actual conversion
  const confirmQuoteConversion = async () => {
    try {
      if (!selectedQuoteForConversion || !selectedQuoteForConversion.id) return;
      
      // Double-check if quote is already converted
      if (selectedQuoteForConversion.is_converted) {
        setSnackbarState({
          open: true,
          message: 'Ce devis a déjà été converti en vente',
          severity: 'warning'
        });
        setShowQuoteConversionModal(false);
        return;
      }
      
      if (!selectedZone) {
        setSnackbarState({
          open: true,
          message: 'Veuillez sélectionner une zone',
          severity: 'error'
        });
        return;
      }
      
      // Call the API to convert the quote to a sale with the selected zone
      const createdSale = await QuotesAPI.convertToSale(selectedQuoteForConversion.id, selectedZone);
      
      // Refresh the data
      await Promise.all([fetchData(), fetchQuotes()]);
      setShowQuoteConversionModal(false);
      setSelectedQuoteForConversion(null);
      setSelectedZone(0);
      
      // Show success message
      setSnackbarState({
        open: true,
        message: `Devis ${selectedQuoteForConversion.reference} converti en vente avec succès. Référence: ${createdSale.reference}`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error converting quote to sale:', err);
      
      // Handle specific error types
      let errorMessage = 'Erreur lors de la conversion du devis en vente. Veuillez réessayer.';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string; type?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      
      setSnackbarState({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Handle close snackbar for notifications
  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setSnackbarState({
      ...snackbarState,
      open: false
    });
  };

   // Sales columns definition with proper value getters
  const salesColumns: GridColDef<ExtendedSale>[] = [
    { field: 'reference', headerName: t('reference'), flex: 1 },
    { 
      field: 'client', 
      headerName: t('client'), 
      flex: 1,      valueGetter: (value, row) => {
        // Add safety check for undefined params
        if (!row) return 'N/A';        
        // Ensure client ID is compared as a number
        const clientId = Number(row.client);
        // Find the client object using the client ID from the sale
        const client = clients.find(c => c.id === clientId);
        
        // Add debug logging to help identify the issue
        if (!client) {
          console.log('Client not found for sale:', {
            saleClientId: clientId,
            availableClients: clients.map(c => ({ id: c.id, name: c.name }))
          });
        }
        return client ? client.name : 'N/A';
      }
    },
    { 
      field: 'date', 
      headerName: t('date'), 
      flex: 1,      valueGetter: (value, row) => {
        if (!row || !row.date) return '';
        return new Date(row.date).toLocaleDateString();
      }
    },
    { 
      field: 'total_amount', 
      headerName: t('totalAmount'), 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.total_amount === undefined || row.total_amount === null) return '';
        return formatCurrency(row.total_amount);
      },
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              color="primary.main"
            >
              {formatCurrency(params.row.total_amount)}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'paid_amount', 
      headerName: t('paidAmount'), 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.paid_amount === undefined) return '';
        return formatCurrency(row.paid_amount || 0);
      },
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        const paidAmount = params.row.paid_amount || 0;
        const totalAmount = params.row.total_amount || 0;
        const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
        
        return (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <Typography 
              variant="body2" 
              fontWeight="medium"
              color="success.main"
              sx={{ mb: 0.5 }}
            >
              {formatCurrency(paidAmount)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              sx={{ 
                width: '100%', 
                height: 4, 
                borderRadius: 2,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  backgroundColor: percentage === 100 ? 'success.main' : 
                                   percentage > 0 ? 'warning.main' : 'error.main'
                }
              }} 
            />
            <Typography variant="caption" color="text.secondary">
              {percentage.toFixed(0)}%
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'remaining_amount',
      headerName: t('remainingAmount'),
      flex: 1,
      valueGetter: (value, row) => {
        if (!row) return '';
        const remaining = row.remaining_amount !== undefined ? 
          row.remaining_amount : 
          (row.total_amount || 0) - (row.paid_amount || 0);
        return formatCurrency(remaining);
      },
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        const remaining = params.row.remaining_amount !== undefined ? 
          params.row.remaining_amount : 
          (params.row.total_amount || 0) - (params.row.paid_amount || 0);
        
        const isOverdue = remaining > 0 && new Date(params.row.date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <Typography 
              variant="body2" 
              fontWeight="medium"
              color={remaining > 0 ? (isOverdue ? "error.main" : "warning.main") : "success.main"}
              sx={{ mr: 1 }}
            >
              {formatCurrency(remaining)}
            </Typography>
            {isOverdue && remaining > 0 && (
              <Tooltip title={t('overduePayment')}>
                <Warning color="error" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    { 
      field: 'status', 
      headerName: t('status'), 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params.row || !params.row.status) return <></>;
        
        const isDeletable = params.row.status === 'pending' || params.row.status === 'cancelled';
        
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            height: '100%',
            gap: 1
          }}>
            <StatusChip status={params.row.status} />
            {isDeletable && (
              <Tooltip title={t('safeDeletable')}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'warning.main',
                    ml: 0.5,
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    },
                    animation: 'pulse 2s infinite'
                  }} 
                />
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      field: 'payment_status',
      headerName: t('payment'),
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.payment_status) return <></>;
        
        return <StatusChip status={params.row.payment_status} />;
      }
    },
    {
      field: 'actions',
      headerName: t('actions'),
      flex: 1,
      sortable: false,      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params.row) return <></>;
        
        const canDelete = params.row.status === 'pending' || params.row.status === 'cancelled';
        
          return (
          <Box>
            <Tooltip title={t('edit')}>
              <IconButton 
                size="small" 
                color="primary" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSale(params.row);
                }}
                disabled={!canEditSale}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canDelete && (
              <Tooltip title={t('delete')}>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSale(params.row);
                  }}
                  disabled={!canDeleteSale}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    },
  ];

  // Define columns for the Invoices DataGrid with safety checks
  const invoiceColumns: GridColDef[] = [
    { field: 'reference', headerName: 'Référence', flex: 1 },
    { 
      field: 'client_name', 
      headerName: 'Client', 
      flex: 1
    },
    { 
      field: 'sale_reference', 
      headerName: 'Vente', 
      flex: 1,
      
    },    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || !row.date) return '';
        return new Date(row.date).toLocaleDateString();
      }
    },    { 
      field: 'due_date', 
      headerName: 'Échéance', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || !row.due_date) return '';
        return new Date(row.due_date).toLocaleDateString();
      }
    },    { 
      field: 'amount', 
      headerName: 'Montant', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.amount === undefined || row.amount === null) return '';
        return formatCurrency(row.amount);
      }
    },    { 
      field: 'paid_amount', 
      headerName: 'Payé', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.paid_amount === undefined || row.paid_amount === null) return '';
        return formatCurrency(row.paid_amount);
      }
    },    { 
      field: 'balance', 
      headerName: 'Solde', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.balance === undefined || row.balance === null) return '';
        return formatCurrency(row.balance);
      }
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.status) return <></>;        return <StatusChip status={params.row.status} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              color="primary" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditInvoice(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="secondary" 
              size="small"
              onClick={(e) => e.stopPropagation()}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="error" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteInvoice(params.row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      }
    },
  ];

  // Define columns for the Quotes DataGrid with safety checks
  const quoteColumns: GridColDef[] = [
    { field: 'reference', headerName: 'Référence', flex: 1 },
    { 
      field: 'client', 
      headerName: 'Client', 
      flex: 1,
            valueGetter: (value, row) => {
        if (!row || !row.client) return 'N/A';
        const clientId = Number(row.client);
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : 'N/A';
      }
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1,      valueGetter: (value, row) => {
        if (!row || !row.date) return '';
        return new Date(row.date).toLocaleDateString();
      }
    },
    { 
      field: 'expiry_date', 
      headerName: 'Expiration', 
      flex: 1,      valueGetter: (value, row) => {
        if (!row || !row.expiry_date) return '';
        return new Date(row.expiry_date).toLocaleDateString();
      }
    },
    { 
      field: 'total_amount', 
      headerName: 'Montant', 
      flex: 1,      valueGetter: (value, row) => {
        if (!row || row.total_amount === undefined || row.total_amount === null) return '';
        return formatCurrency(row.total_amount);
      }
    },
    {
      field: 'is_converted',
      headerName: 'Converti',
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        return (
          <Chip
            label={params.row.is_converted ? 'Oui' : 'Non'}
            color={params.row.is_converted ? 'success' : 'default'}
            size="small"
            variant={params.row.is_converted ? 'filled' : 'outlined'}
          />
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.status) return <></>;        return <StatusChip status={params.row.status} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              color="primary" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditQuote(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="secondary" 
              size="small"
              onClick={(e) => e.stopPropagation()}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="error" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteQuote(params.row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="success" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleConvertQuoteToSale(params.row);
              }}
              disabled={
                !params.row.status || 
                params.row.is_converted ||
                (params.row.status !== 'draft' && params.row.status !== 'sent' && params.row.status !== 'accepted')
              }
              title={
                params.row.is_converted 
                  ? "Ce devis a déjà été converti en vente" 
                  : "Convertir en vente"
              }
            >
              <PaymentsIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      }
    },
  ];

  // QR Code scanner functions
  // Start camera for QR code scanning
  const startScanner = async () => {
    // Check if scanner already exists and is running
    if (html5QrCode && cameraStarted) {
      return;
    }
    if (!scannerRef.current) {
      setSnackbarState({
        open: true,
        message: 'Scanner container not ready',
        severity: 'error'
      });
      return;
    }
    try {
      // Create instance of scanner and store in state
      const scanner = new Html5Qrcode('scanner-container');
      setHtml5QrCode(scanner);
      // Get list of cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        // Start the camera with the first camera ID
        await scanner.start(
          { facingMode: "environment" }, // prefer back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        );
        setCameraStarted(true);
      } else {
        setSnackbarState({
          open: true,
          message: 'No camera devices found',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setSnackbarState({
        open: true,
        message: `Error starting camera: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Add function to handle adding scanned product
  const handleAddScannedProduct = (product: Product) => {
    // Check if product already exists in selected products
    const existingIndex = selectedProducts.findIndex(item => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Update existing product quantity
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantity: updatedProducts[existingIndex].quantity + scannedQuantity
      };
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product
      setSelectedProducts([
        ...selectedProducts,
        { product, quantity: scannedQuantity }
      ]);
    }
    
    // Reset scanned product
    setScannedProduct(null);
    setScannedQuantity(1);
  };

  // Handle successful QR code scan
  const onScanSuccess = async (decodedText: string) => {
    try {
      if (!html5QrCode || !cameraStarted) return;
      
      let productId: number | null = null;
      
      // First try to parse JSON data (modern QR format)
      try {
        const jsonData = JSON.parse(decodedText);
        if (jsonData && jsonData.id) {
          productId = jsonData.id;
        }
      } catch (e) {
        // Not JSON, try the legacy formats
        if (decodedText.includes('product-id:')) {
          productId = parseInt(decodedText.split('product-id:')[1], 10);
        } else if (!isNaN(parseInt(decodedText, 10))) {
          productId = parseInt(decodedText, 10);
        }
      }
      
      if (!productId) {
        setSnackbarState({
          open: true,
          message: `Invalid QR code: ${decodedText}`,
          severity: 'error'
        });
        return;
      }
      
      // Pause scanning temporarily to avoid multiple scans
      await html5QrCode.pause();
      
      // Fetch product details
      const product = await ProductsAPI.get(productId);
      setScannedProduct(product);
      
      // Check stock availability
      const zoneId = selectedZone;
      if (!zoneId) {
        setSnackbarState({
          open: true,
          message: 'Veuillez d\'abord sélectionner une zone',
          severity: 'warning'
        });
        return;
      }      const response = await InventoryAPI.checkStockAvailability(
        productId, 
        zoneId,
        scannedQuantity
      );

      if (response && response.available) {
        // Add product to sale items with default quantity = 1
        handleAddScannedProduct(product);
      } else {
        // Show warning for insufficient stock
        setSnackbarState({
          open: true,
          message: `Stock insuffisant pour ${product.name} dans la zone sélectionnée`,
          severity: 'warning'
        });
      }
      
      // Play a success sound if available
      const successAudio = new Audio('/sounds/beep-success.mp3');
      successAudio.play().catch(() => {
        // Ignore audio errors - not critical
      });
    } catch (err) {
      console.error('Error processing scan:', err);
      setSnackbarState({
        open: true,
        message: `Error processing scan: ${err.message}`,
        severity: 'error'
      });
    } finally {
      // Resume scanning after a short delay
      setTimeout(() => {
        if (html5QrCode && cameraStarted) {
          html5QrCode.resume();
        }
      }, 2000);
    }
  };

  // Handle QR scan failure
  const onScanFailure = (error: string) => {
    // We don't need to show every scan failure to the user
    // Only log it for debugging
    console.debug('QR scan error:', error);
  };
  
  // Helper function to stop the scanner safely
  const stopScanner = async () => {
    if (html5QrCode && cameraStarted) {
      try {
        await html5QrCode.stop();
        setCameraStarted(false);
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };
  
  // Open scanner 
  const openScanner = () => {
    setScannerOpen(true);
    // Start scanner in next tick after dialog is open
    setTimeout(() => startScanner(), 500);
  };
  
  // New function to fetch sale items - called when a sale row is clicked
  const fetchSaleItems = async (saleId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!saleId) {
        setError('ID de la vente manquant');
        return;
      }

      // Fetch sale items
      const saleDetails = await SalesAPI.get(saleId);
      console.log('Sale details:', saleDetails);
      
      // Make sure items exist before setting state
      if (saleDetails && saleDetails.items) {
        setEditingSaleItems(saleDetails.items); // Populate editingSaleItems with fetched items
      } else {
        setEditingSaleItems([]); // Set empty array if no items
      }
    } catch (err) {
      console.error('Error fetching sale items:', err);
      setError('Erreur lors de la récupération des articles de vente. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard requiredPermission="view_sale" fallbackPath="/">
      <Box>
        {/* Header with improved styling */}
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
              Gestion des Ventes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez vos ventes, factures et devis
            </Typography>
          </Box>
          {/* Enhanced quick stats section with payment information */}
          {tabValue === 0 && (
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                mt: { xs: 2, sm: 0 },
                backgroundColor: 'background.paper',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Total Ventes</Typography>
                <Typography variant="h6" color="primary.main">{sales.length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>En attente</Typography>
                <Typography variant="h6" color="warning.main">{sales.filter(s => s.status === 'pending').length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Non payé</Typography>
                <Typography variant="h6" color="error.main">{sales.filter(s => s.payment_status === 'unpaid').length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Partiellement payé</Typography>
                <Typography variant="h6" color="warning.main">{sales.filter(s => s.payment_status === 'partially_paid').length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Payé</Typography>
                <Typography variant="h6" color="success.main">{sales.filter(s => s.payment_status === 'paid').length}</Typography>
              </Box>
            </Box>
          )}

          {/* Invoice Statistics */}
          {tabValue === 1 && (
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                mt: { xs: 2, sm: 0 },
                backgroundColor: 'background.paper',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Total Factures</Typography>
                <Typography variant="h6" color="primary.main">{filteredInvoices.length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Payées</Typography>
                <Typography variant="h6" color="success.main">{filteredInvoices.filter(inv => inv.status === 'paid').length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>En retard</Typography>
                <Typography variant="h6" color="warning.main">{filteredInvoices.filter(inv => inv.status === 'overdue').length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Montant Total</Typography>
                <Typography variant="h6" color="info.main">{formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0))}</Typography>
              </Box>
            </Box>
          )}

          {/* Quote Statistics */}
          {tabValue === 2 && (
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                mt: { xs: 2, sm: 0 },
                backgroundColor: 'background.paper',
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ textAlign: 'center', px: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Total Devis</Typography>
                <Typography variant="h6" color="primary.main">{filteredQuotes.length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Acceptés</Typography>
                <Typography variant="h6" color="success.main">{filteredQuotes.filter(quote => quote.status === 'accepted').length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Expirés</Typography>
                <Typography variant="h6" color="warning.main">{filteredQuotes.filter(quote => {
                  const expiryDate = new Date(quote.expiry_date);
                  const today = new Date();
                  return expiryDate < today && quote.status !== 'accepted' && quote.status !== 'rejected';
                }).length}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Valeur Totale</Typography>
                <Typography variant="h6" color="info.main">{formatCurrency(filteredQuotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0))}</Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Main content with tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            variant="fullWidth"
            sx={{
              backgroundColor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.light',
              '& .MuiTab-root': {
                fontWeight: 'medium',
                py: 2
              }
            }}
          >
            <Tab label="Ventes" id="sales-tab-0" aria-controls="sales-tabpanel-0" />
            <Tab label="Factures" id="sales-tab-1" aria-controls="sales-tabpanel-1" />
            <Tab label="Devis" id="sales-tab-2" aria-controls="sales-tabpanel-2" />
          </Tabs>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'flex-end' },
              mb: 3,
              px: 3,
              py: 2,
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
                  placeholder="Référence ou client"
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VisibilityIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="status-filter-label">Statut</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous les statuts</MenuItem>
                    <MenuItem value="pending">En attente</MenuItem>
                    <MenuItem value="confirmed">Confirmée</MenuItem>
                    <MenuItem value="payment_pending">Paiement en attente</MenuItem>
                    <MenuItem value="partially_paid">Partiellement payée</MenuItem>
                    <MenuItem value="paid">Payée</MenuItem>
                    <MenuItem value="shipped">Expédiée</MenuItem>
                    <MenuItem value="delivered">Livrée</MenuItem>
                    <MenuItem value="completed">Terminée</MenuItem>
                    <MenuItem value="cancelled">Annulée</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <PermissionButton
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowAddModal(true)}
                requiredPermission="add_sale"
              >
                Nouvelle vente
              </PermissionButton>
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                <StandardDataGrid
                  rows={filteredSales}
                  columns={salesColumns}
                  paginationModel={salesPaginationModel}
                  onPaginationModelChange={setSalesPaginationModel}
                  onRowClick={(params) => {
                    setEditingSale(params.row as ExtendedSale);
                    setShowEditModal(true);
                    // Fetch sale items when a sale is clicked
                    fetchSaleItems(params.row.id);
                  }}
                  loading={loading}
                  getRowId={(row) => {
                    // Safely handle undefined or null rows
                    if (!row || row.id === undefined) return Math.random();
                    return row.id;
                  }}
                />
              </>
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'flex-end' },
              mb: 3,
              px: 3,
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
                  placeholder="Référence, client ou vente"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VisibilityIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="invoice-status-filter-label">Statut</InputLabel>
                  <Select
                    labelId="invoice-status-filter-label"
                    id="invoice-status-filter"
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous les statuts</MenuItem>
                    <MenuItem value="draft">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Brouillon" color="default" size="small" sx={{ mr: 1 }} />
                        Brouillon
                      </Box>
                    </MenuItem>
                    <MenuItem value="sent">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Envoyée" color="info" size="small" sx={{ mr: 1 }} />
                        Envoyée
                      </Box>
                    </MenuItem>
                    <MenuItem value="paid">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Payée" color="success" size="small" sx={{ mr: 1 }} />
                        Payée
                      </Box>
                    </MenuItem>
                    <MenuItem value="overdue">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="En retard" color="error" size="small" sx={{ mr: 1 }} />
                        En retard
                      </Box>
                    </MenuItem>
                    <MenuItem value="cancelled">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Annulée" color="error" size="small" sx={{ mr: 1 }} />
                        Annulée
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Période</InputLabel>
                  <Select
                    value={invoiceDateFilter}
                    onChange={(e) => setInvoiceDateFilter(e.target.value)}
                    label="Période"
                  >
                    <MenuItem value="">Toutes les périodes</MenuItem>
                    <MenuItem value="today">Aujourd'hui</MenuItem>
                    <MenuItem value="week">Cette semaine</MenuItem>
                    <MenuItem value="month">Ce mois</MenuItem>
                    <MenuItem value="quarter">Ce trimestre</MenuItem>
                    <MenuItem value="year">Cette année</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowAddInvoiceModal(true)}
                sx={{ 
                  borderRadius: 2, 
                  px: 3,
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                Nouvelle facture
              </Button>
            </Box>

            {invoiceLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                <StandardDataGrid
                  rows={filteredInvoices}
                  columns={invoiceColumns}
                  paginationModel={invoicePaginationModel}
                  onPaginationModelChange={setInvoicePaginationModel}
                  loading={invoiceLoading}
                  getRowId={(row) => {
                    // Safely handle undefined or null rows
                    if (!row || row.id === undefined) return Math.random();
                    return row.id;
                  }}
                />
              </>
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' }, 
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'flex-end' },
              mb: 3,
              px: 3,
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
                  placeholder="Référence, client ou devis"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={quoteSearchTerm}
                  onChange={(e) => setQuoteSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VisibilityIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="quote-status-filter-label">Statut</InputLabel>
                  <Select
                    labelId="quote-status-filter-label"
                    id="quote-status-filter"
                    value={quoteStatusFilter}
                    onChange={(e) => setQuoteStatusFilter(e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous les statuts</MenuItem>
                    <MenuItem value="draft">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Brouillon" color="default" size="small" sx={{ mr: 1 }} />
                        Brouillon
                      </Box>
                    </MenuItem>
                    <MenuItem value="sent">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Envoyé" color="info" size="small" sx={{ mr: 1 }} />
                        Envoyé
                      </Box>
                    </MenuItem>
                    <MenuItem value="accepted">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Accepté" color="success" size="small" sx={{ mr: 1 }} />
                        Accepté
                      </Box>
                    </MenuItem>
                    <MenuItem value="rejected">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Rejeté" color="error" size="small" sx={{ mr: 1 }} />
                        Rejeté
                      </Box>
                    </MenuItem>
                    <MenuItem value="expired">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Expiré" color="warning" size="small" sx={{ mr: 1 }} />
                        Expiré
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Période</InputLabel>
                  <Select
                    value={quoteDateFilter}
                    onChange={(e) => setQuoteDateFilter(e.target.value)}
                    label="Période"
                  >
                    <MenuItem value="">Toutes les périodes</MenuItem>
                    <MenuItem value="today">Aujourd'hui</MenuItem>
                    <MenuItem value="week">Cette semaine</MenuItem>
                    <MenuItem value="month">Ce mois</MenuItem>
                    <MenuItem value="quarter">Ce trimestre</MenuItem>
                    <MenuItem value="year">Cette année</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowAddQuoteModal(true)}
                sx={{ 
                  borderRadius: 2, 
                  px: 3,
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                Nouveau devis
              </Button>
            </Box>

            {quoteLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                <StandardDataGrid
                  rows={filteredQuotes}
                  columns={quoteColumns}
                  paginationModel={quotePaginationModel}
                  onPaginationModelChange={setQuotePaginationModel}
                  loading={quoteLoading}
                  getRowId={(row) => {
                    // Safely handle undefined or null rows
                    if (!row || row.id === undefined) return Math.random();
                    return row.id;
                  }}
                />
              </>
            )}
          </TabPanel>
        </Paper>
        {/* Add Sale Dialog */}
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nouvelle vente</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}> {/* Added margin top */}
              <Grid item xs={12}>
                <Autocomplete
                  options={clients}
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
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Ajouter des produits
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}> {/* Align items vertically */}
                  <Autocomplete
                    options={productsWithStock}
                    getOptionLabel={(option) => `${option.name} (Stock: ${availableStock[option.id!] || 0})`}
                    value={currentProduct}
                    onChange={(event, newValue) => {
                      setCurrentProduct(newValue);
                      // Reset quantity when product changes
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
                    type="text"
                    value={formatNumberDisplay(currentQuantity)}
                    onChange={(e) => {
                      const newValue = validateIntegerInput(e.target.value, currentQuantity);
                      setCurrentQuantity(newValue);
                    }}
                    error={currentQuantity < 1 && currentQuantity !== 0}
                    helperText={getValidationError(currentQuantity, 'quantity')}
                    sx={{ width: 100 }} // Fixed width for quantity
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddProduct}
                    disabled={!currentProduct || currentQuantity <= 0} // Disable if no product or quantity <= 0
                    sx={{ height: 'fit-content' }} // Adjust button height
                  >
                    Ajouter
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={openScanner}
                    sx={{ height: 'fit-content' }} // Adjust button height
                  >
                    Scanner
                  </Button>
                </Box>
                {/* Removed duplicate product selection section */}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleCreateSale}
              disabled={!selectedClient || selectedProducts.length === 0}
            >
              Créer la vente
            </Button>
          </DialogActions>
        </Dialog>        
        {/* Edit Sale Dialog - Simplified and user-friendly */}
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <ShoppingCart sx={{ mr: 1, color: 'primary.main' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="h5">Modifier la vente {editingSale?.reference}</Typography>
              <StatusChip 
                status={editingSale?.status || 'pending'}
                size="medium"
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            {editingSale && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Sale information summary card - Enhanced with payment information */}
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
                        {clients.find(c => c.id === editingSale.client)?.name || 'N/A'}
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
                        {new Date(editingSale.date).toLocaleDateString()}
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
                        {formatCurrency(editingSale.total_amount)}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {/* Enhanced Payment Information Card */}
                  <PaymentInfoCard 
                    elevation={3}
                    sx={{ 
                      p: 3, 
                      mb: 3, 
                      border: '2px solid',
                      borderColor: (editingSale.payment_status === 'partially_paid') ? 
                        'warning.main' : 
                        (editingSale.payment_status === 'paid' ? 'success.main' : 'error.main'),
                      bgcolor: (editingSale.payment_status === 'partially_paid') ? 
                        'warning.50' : 
                        (editingSale.payment_status === 'paid' ? 'success.50' : 'error.50')
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PaymentsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        Statut des Paiements
                      </Typography>
                      <Chip
                        label={
                          editingSale.payment_status === 'paid' ? 'Payé' :
                          editingSale.payment_status === 'partially_paid' ? 'Partiellement payé' :
                          'Non payé'
                        }
                        color={
                          editingSale.payment_status === 'paid' ? 'success' :
                          editingSale.payment_status === 'partially_paid' ? 'warning' :
                          'error'
                        }
                        sx={{ ml: 'auto', fontWeight: 'bold' }}
                      />
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'primary.light'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Montant Total
                          </Typography>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: 'primary.main',
                              mt: 1
                            }}
                          >
                            {formatCurrency(editingSale.total_amount)}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'success.light'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Montant Payé
                          </Typography>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: 'success.main',
                              mt: 1
                            }}
                          >
                            {formatCurrency(editingSale.paid_amount || 0)}
                          </Typography>
                          
                          {/* Payment Progress Bar */}
                          <Box sx={{ mt: 2 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={editingSale.total_amount > 0 ? ((editingSale.paid_amount || 0) / editingSale.total_amount) * 100 : 0}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  backgroundColor: 
                                    editingSale.payment_status === 'paid' ? 'success.main' :
                                    editingSale.payment_status === 'partially_paid' ? 'warning.main' : 'error.main'
                                }
                              }} 
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {editingSale.total_amount > 0 ? (((editingSale.paid_amount || 0) / editingSale.total_amount) * 100).toFixed(1) : 0}% payé
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 
                              (editingSale.remaining_amount || editingSale.total_amount - (editingSale.paid_amount || 0)) > 0 
                                ? 'error.light' 
                                : 'success.light'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                            Solde Restant
                          </Typography>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: 
                                (editingSale.remaining_amount || editingSale.total_amount - (editingSale.paid_amount || 0)) > 0 
                                  ? 'error.main' 
                                  : 'success.main',
                              mt: 1
                            }}
                          >
                            {formatCurrency(
                              editingSale.remaining_amount || 
                              editingSale.total_amount - (editingSale.paid_amount || 0)
                            )}
                          </Typography>
                          
                          {/* Overdue Warning */}
                          {(editingSale.remaining_amount || editingSale.total_amount - (editingSale.paid_amount || 0)) > 0 && 
                           new Date(editingSale.date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Warning color="error" fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="caption" color="error.main" sx={{ fontWeight: 'bold' }}>
                                En retard
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    
                    {editingSale.payment_status === 'paid' && (
                      <Alert 
                        severity="success" 
                        sx={{ mt: 2 }}
                        icon={<CheckCircle />}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Paiement complet
                        </Typography>
                        <Typography variant="body2">
                          Cette vente a été entièrement payée.
                        </Typography>
                      </Alert>
                    )}
                  </PaymentInfoCard>
                </Grid>
                
                {/* Simplified status management with clear actions */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 3
                    }}
                  >
                    <Typography variant="h6" gutterBottom>Mise à jour du statut</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Statut actuel: <StatusChip 
                          status={editingSale.status}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {getAllowedTransitions(editingSale.status).map(transition => {
                        // Skip the fast_track special action
                        if (transition === 'fast_track') return null;                        // Map statuses to user-friendly buttons with colors
                        const getButtonProps = (transitionStatus: string): {
                          icon: React.ReactNode;
                          color: "primary" | "secondary" | "success" | "error" | "info" | "warning" | undefined;
                          label: string;
                        } => {
                          switch(transitionStatus) {
                            case 'confirmed':
                              return { 
                                icon: <ShoppingCart />, 
                                color: 'primary', 
                                label: 'Confirmer' 
                              };
                            case 'payment_pending':
                              return { 
                                icon: <ReceiptLong />, 
                                color: 'warning', 
                                label: 'Attente paiement' 
                              };
                            case 'partially_paid':
                              return { 
                                icon: <AttachMoney />, 
                                color: 'warning', 
                                label: 'Partiellement payé' 
                              };
                            case 'paid':
                              return { 
                                icon: <Payments />, 
                                color: 'success', 
                                label: 'Payé' 
                              };
                            case 'shipped':
                              return { 
                                icon: <LocalShipping />, 
                                color: 'info', 
                                label: 'Expédié' 
                              };
                            case 'delivered':
                              return { 
                                icon: <Check />, 
                                color: 'primary', 
                                label: 'Livré' 
                              };
                            case 'completed':
                              return { 
                                icon: <CheckCircle />, 
                                color: 'success', 
                                label: 'Terminé' 
                              };
                            case 'cancelled':
                              return { 
                                icon: <Cancel />, 
                                color: 'error', 
                                label: 'Annuler' 
                              };
                            default:
                              return { 
                                icon: null, 
                                color: 'primary', 
                                label: t(transition as string) 
                              };
                          }
                        };
                        
                        const buttonProps = getButtonProps(transition);
                        
                        return (
                          <Button
                            key={transition}
                            variant="contained"
                            color={buttonProps.color}
                            startIcon={buttonProps.icon}
                            onClick={() => {
                              // Special handling for confirmed status - automatically go to payment_pending
                              if (transition === 'confirmed') {
                                setEditingSale({
                                  ...editingSale,
                                  status: 'payment_pending'
                                });
                              } else {
                                setEditingSale({
                                  ...editingSale,
                                  status: transition as string
                                });
                              }
                            }}
                          >
                            {buttonProps.label}
                          </Button>
                        );
                      })}
                        {/* Optional fast-track button if applicable */}
                      {getAllowedTransitions(editingSale.status).includes('fast_track') && 
                      !['completed', 'cancelled'].includes(editingSale.status) && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<ElectricBolt />}
                          onClick={() => {
                            // Simply set status to completed regardless of current status
                            // This simplifies the logic while maintaining the functionality
                            setEditingSale({
                              ...editingSale,
                              status: 'completed'
                            });
                          }}
                        >
                          Compléter rapidement
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Items table - Simplified and cleaner */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Typography variant="subtitle1" fontWeight="medium">Articles</Typography>
                    </Box>
                    
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
                          {editingSaleItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_name || products.find(p => p.id === item.product)?.name as string || 'N/A'}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell align="right">{formatCurrency(item.total_price)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatCurrency(editingSale.total_amount)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={() => setShowEditModal(false)}
              variant="outlined"
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveEdit} 
              disabled={!editingSale}
              color="primary"
            >
              Enregistrer les modifications
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Invoice Dialog */}
        <Dialog open={showAddInvoiceModal} onClose={() => setShowAddInvoiceModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
              Nouvelle facture
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={sales.filter(sale => 
                    (sale.status === 'payment_pending' || sale.status === 'confirmed' || sale.status === 'completed') &&
                    !invoices.some(inv => inv.sale === sale.id)
                  )}
                  getOptionLabel={(option) => {
                    const client = clients.find(c => c.id === option.client);
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
                          {option.reference} - {clients.find(c => c.id === option.client)?.name || 'N/A'}
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
                            {clients.find(c => c.id === selectedSale.client)?.name || 'N/A'}
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
              setShowAddInvoiceModal(false);
              setSelectedSale(null);
              setNewInvoiceData({});
            }}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateInvoice}
              disabled={!selectedSale}
              startIcon={<AddIcon />}
            >
              Créer la facture
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog open={showEditInvoiceModal} onClose={() => setShowEditInvoiceModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
                Modifier la facture {editingInvoice?.reference}
              </Box>
              {editingInvoice && (
                <StatusChip 
                  status={editingInvoice.status}
                  size="medium"
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {editingInvoice && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>Informations de la facture</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Référence:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {editingInvoice.reference}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Vente associée:</Typography>
                        <Typography variant="body1">
                          {editingInvoice.sale_reference || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Client:</Typography>
                        <Typography variant="body1">
                          {editingInvoice.client_name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Montant total:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(editingInvoice.amount)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date d'émission"
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({...editingInvoice, date: e.target.value})}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date d'échéance"
                    type="date"
                    value={editingInvoice.due_date}
                    onChange={(e) => setEditingInvoice({...editingInvoice, due_date: e.target.value})}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={editingInvoice.status}
                      onChange={(e) => setEditingInvoice({...editingInvoice, status: e.target.value as ExtendedInvoice['status']})}
                      label="Statut"
                    >
                      <MenuItem value="draft">Brouillon</MenuItem>
                      <MenuItem value="sent">Envoyée</MenuItem>
                      <MenuItem value="unpaid">Impayée</MenuItem>
                      <MenuItem value="partially_paid">Partiellement payée</MenuItem>
                      <MenuItem value="paid">Payée</MenuItem>
                      <MenuItem value="overdue">En retard</MenuItem>
                      <MenuItem value="cancelled">Annulée</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Montant payé"
                    type="text"
                    value={formatNumberDisplay(editingInvoice.paid_amount)}
                    onChange={(e) => {
                      const newValue = validateDecimalInput(e.target.value, editingInvoice.paid_amount);
                      const balance = editingInvoice.amount - newValue;
                      setEditingInvoice({
                        ...editingInvoice, 
                        paid_amount: newValue,
                        balance: balance
                      });
                    }}
                    error={editingInvoice.paid_amount < 0 || editingInvoice.paid_amount > editingInvoice.amount}
                    helperText={
                      editingInvoice.paid_amount < 0 ? 'Le montant ne peut pas être négatif' :
                      editingInvoice.paid_amount > editingInvoice.amount ? 'Le montant payé ne peut pas dépasser le montant total' :
                      `Solde restant: ${formatCurrency(editingInvoice.balance)}`
                    }
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">GNF</InputAdornment>
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    fullWidth
                    value={editingInvoice.notes || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, notes: e.target.value})}
                    placeholder="Notes additionnelles..."
                  />
                </Grid>

                {/* Payment summary */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                    <Typography variant="subtitle1" gutterBottom>Résumé des paiements</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Montant total:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(editingInvoice.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Montant payé:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(editingInvoice.paid_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Solde restant:</Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium',
                            color: editingInvoice.balance > 0 ? 'error.main' : 'success.main'
                          }}
                        >
                          {formatCurrency(editingInvoice.balance)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setShowEditInvoiceModal(false)}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveEditInvoice}
              disabled={!editingInvoice}
              startIcon={<EditIcon />}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Quote Dialog */}
        <Dialog open={showEditQuoteModal} onClose={() => setShowEditQuoteModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EditIcon sx={{ mr: 1, color: 'primary.main' }} />
                Modifier le devis {editingQuote?.reference}
              </Box>
              {editingQuote && (
                <StatusChip 
                  status={editingQuote.status}
                  size="medium"
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {editingQuote && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>Informations du devis</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Référence:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {editingQuote.reference}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Client:</Typography>
                        <Typography variant="body1">
                          {clients.find(c => c.id === editingQuote.client)?.name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Montant total:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(editingQuote.total_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Créé le:</Typography>
                        <Typography variant="body1">
                          {new Date(editingQuote.date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date du devis"
                    type="date"
                    value={editingQuote.date}
                    onChange={(e) => setEditingQuote({...editingQuote, date: e.target.value})}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date d'expiration"
                    type="date"
                    value={editingQuote.expiry_date}
                    onChange={(e) => setEditingQuote({...editingQuote, expiry_date: e.target.value})}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    helperText="Date limite de validité"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={editingQuote.status}
                      onChange={(e) => setEditingQuote({...editingQuote, status: e.target.value as ApiQuote['status']})}
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
                    value={`${Math.ceil((new Date(editingQuote.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours`}
                    fullWidth
                    disabled
                    helperText="Jours restants de validité"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={4}
                    fullWidth
                    value={editingQuote.notes || ''}
                    onChange={(e) => setEditingQuote({...editingQuote, notes: e.target.value})}
                    placeholder="Notes ou conditions particulières..."
                  />
                </Grid>

                {/* Quote summary */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'info.lighter' }}>
                    <Typography variant="subtitle1" gutterBottom>Résumé du devis</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">Sous-total:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(editingQuote.subtotal)}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">TVA (20%):</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(editingQuote.tax_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">Total TTC:</Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(editingQuote.total_amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="text.secondary">Articles:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {editingQuote.items?.length || 0} produit(s)
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Action buttons for quotes */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.lighter' }}>
                    <Typography variant="subtitle2" gutterBottom>Actions disponibles</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {editingQuote.status === 'draft' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setEditingQuote({...editingQuote, status: 'sent'})}
                        >
                          Marquer comme envoyé
                        </Button>
                      )}
                      {editingQuote.status === 'sent' && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            onClick={() => setEditingQuote({...editingQuote, status: 'accepted'})}
                          >
                            Marquer comme accepté
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => setEditingQuote({...editingQuote, status: 'rejected'})}
                          >
                            Marquer comme rejeté
                          </Button>
                        </>
                      )}
                      {editingQuote.status === 'accepted' && (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedQuoteForConversion(editingQuote);
                            setShowQuoteConversionModal(true);
                          }}
                        >
                          Convertir en vente
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setShowEditQuoteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  if (!editingQuote || !editingQuote.id) return;
                  
                  // Call the real API to update the quote
                  const updatedQuote = await QuotesAPI.update(editingQuote.id, editingQuote);
                  
                  // Update the local state
                  setQuotes(quotes.map(q => q.id === editingQuote.id ? updatedQuote : q));
                  setShowEditQuoteModal(false);
                  setEditingQuote(null);
                  
                  setSnackbarState({
                    open: true,
                    message: 'Devis mis à jour avec succès',
                    severity: 'success'
                  });
                } catch (err) {
                  console.error('Error updating quote:', err);
                  setSnackbarState({
                    open: true,
                    message: 'Erreur lors de la mise à jour du devis',
                    severity: 'error'
                  });
                }
              }}
              disabled={!editingQuote}
              startIcon={<EditIcon />}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Quote Dialog */}
        <Dialog open={showAddQuoteModal} onClose={() => setShowAddQuoteModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
              Nouveau devis
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={clients}
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

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Zone *</InputLabel>
                  <Select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(Number(e.target.value))}
                    label="Zone *"
                  >
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Produits du devis
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <Autocomplete
                    options={productsWithStock}
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
                    type="text"
                    value={formatNumberDisplay(currentQuantity)}
                    onChange={(e) => {
                      const newValue = validateIntegerInput(e.target.value, currentQuantity);
                      setCurrentQuantity(newValue);
                    }}
                    error={currentQuantity < 1 && currentQuantity !== 0}
                    helperText={getValidationError(currentQuantity, 'quantity')}
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddProduct}
                    disabled={!currentProduct || currentQuantity <= 0}
                    sx={{ height: 'fit-content', px: 3 }}
                  >
                    Ajouter
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={openScanner}
                    sx={{ height: 'fit-content' }}
                  >
                    Scanner
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
                            <TableCell align="right">
                              <TextField
                                type="text"
                                value={formatNumberDisplay(item.product.selling_price)}
                                onChange={(e) => {
                                  const newPrice = validateDecimalInput(e.target.value, item.product.selling_price);
                                  const updatedProducts = [...selectedProducts];
                                  updatedProducts[index].product.selling_price = newPrice;
                                  setSelectedProducts(updatedProducts);
                                }}
                                size="small"
                                variant="standard"
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">GNF</InputAdornment>
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="text"
                                value={formatNumberDisplay(item.quantity)}
                                onChange={(e) => {
                                  const newQuantity = validateIntegerInput(e.target.value, item.quantity);
                                  const updatedProducts = [...selectedProducts];
                                  updatedProducts[index].quantity = newQuantity;
                                  setSelectedProducts(updatedProducts);
                                }}
                                size="small"
                                variant="standard"
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(item.product.selling_price * item.quantity)}
                              </Typography>
                            </TableCell>
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
                            Sous-total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(calculateTotal())}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            TVA (20%)
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(calculateTotal() * 0.20)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                            Total TTC
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1em', color: 'primary.main' }}>
                            {formatCurrency(calculateTotal() * 1.20)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucun produit ajouté au devis
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
                  value={newQuoteData.notes || ''}
                  onChange={(e) => setNewQuoteData({...newQuoteData, notes: e.target.value})}
                  placeholder="Notes ou conditions particulières du devis..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => {
              setShowAddQuoteModal(false);
              setSelectedClient(null);
              setSelectedProducts([]);
              setNewQuoteData({});
            }}>
              Annuler
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateQuote}
              disabled={!selectedClient || selectedProducts.length === 0 || !selectedZone}
              startIcon={<AddIcon />}
            >
              Créer le devis
            </Button>
          </DialogActions>
        </Dialog>

        {/* Quote Conversion Dialog */}
        <Dialog open={showQuoteConversionModal} onClose={() => setShowQuoteConversionModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Convertir un devis en vente</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Convertir le devis {selectedQuoteForConversion?.reference} en vente.
                </Typography>
                {selectedQuoteForConversion?.is_converted && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Ce devis a déjà été converti en vente.
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required disabled={selectedQuoteForConversion?.is_converted}>
                  <InputLabel>Zone</InputLabel>
                  <Select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(Number(e.target.value))}
                    label="Zone"
                  >
                    {zones.map((zone) => (
                      <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQuoteConversionModal(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={confirmQuoteConversion}
              disabled={!selectedQuoteForConversion || selectedQuoteForConversion?.is_converted}
            >
              Convertir
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Scanner Dialog */}
        <Dialog
          open={scannerOpen}
          onClose={() => {
            stopScanner(); // Call the safer stopScanner function
            setScannerOpen(false);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Scanner un produit</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Positionnez le code QR dans la vue de la caméra pour le scanner.
              </Typography>
            </Box>
            {/* Camera view for QR code scanner */}
            <Box
              ref={scannerRef}
              id="scanner-container"
              sx={{
                width: '100%',
                height: 300,
                mb: 2,
                border: '1px solid #ddd',
                borderRadius: 1,
                overflow: 'hidden',
                position: 'relative',
                '& video': { objectFit: 'cover' }
              }}
            />
            {/* Show scanned product if available */}
            {scannedProduct && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle1">Produit scanné :</Typography>
                <Typography variant="h6">{scannedProduct.name}</Typography>
                <Typography variant="body2">Référence : {scannedProduct.reference}</Typography>
                <Typography variant="body2">Prix : {formatCurrency(scannedProduct.selling_price)}</Typography>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Quantité"
                    type="text"
                    value={formatNumberDisplay(scannedQuantity)}
                    onChange={(e) => {
                      const newValue = validateIntegerInput(e.target.value, scannedQuantity);
                      setScannedQuantity(newValue);
                    }}
                    error={scannedQuantity < 1 && scannedQuantity !== 0}
                    helperText={getValidationError(scannedQuantity, 'quantity')}
                    fullWidth
                    size="small"
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              stopScanner(); // Call the safer stopScanner function
              setScannerOpen(false);
            }}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarState.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbarState.severity} sx={{ width: '100%' }}>
            {snackbarState.message}
          </Alert>
        </Snackbar>

        {/* Delete Confirmation Dialog (Reusable) */}
        <DeleteDialog
          open={showDeleteDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          loading={loading}
          type={invoiceToDelete ? 'invoice' : saleToDelete ? 'sale' : 'quote'}
          item={invoiceToDelete || saleToDelete || quoteToDelete}
          confirmationInfo={deleteConfirmationInfo}
        />

        {/* Success message snackbar */}
        {successMessage && (
          <Snackbar
            open={Boolean(successMessage)}
            autoHideDuration={8000}
            onClose={() => setSuccessMessage(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setSuccessMessage(null)} 
              severity="success" 
              sx={{ 
                width: '100%',
                maxWidth: 600,
                whiteSpace: 'pre-line' // This allows \n to create line breaks
              }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
        )}
      </Box>
    </PermissionGuard>
  );
};

export default Sales;