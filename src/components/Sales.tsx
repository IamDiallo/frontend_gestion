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
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
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
  Payments
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
  
  // Utility functions for UI components
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'confirmed': return 'Confirmée';
    case 'payment_pending': return 'Paiement en attente';
    case 'partially_paid': return 'Partiellement payée';
    case 'paid': return 'Payée';
    case 'shipped': return 'Expédiée';
    case 'delivered': return 'Livrée';
    case 'completed': return 'Terminée';
    case 'cancelled': return 'Annulée';
    default: return status;
  }
};

const getStatusChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (status) {
    case 'paid':
    case 'completed': 
      return "success";
    case 'confirmed':
    case 'delivered':
      return "primary";
    case 'partially_paid':
    case 'payment_pending':
      return "warning";
    case 'cancelled':
      return "error";
    case 'shipped':
      return "info";
    case 'pending':
    default:
      return "default";
  }
};

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

  // These functions are no longer needed with the simplified interface// Get allowed transitions based on current status
  const getAllowedTransitions = (status: string): SalesStatus[] => {
    // These transitions must match the backend validation rules
    // Note: 'fast_track' is not a real status but a UI option that triggers
    // sequential transitions through multiple valid statuses
    switch (status) {
      case 'pending':
        return ['confirmed', 'cancelled', 'fast_track' as SalesStatus];
      case 'confirmed':
        return ['payment_pending', 'cancelled', 'fast_track' as SalesStatus];
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

  // Filter invoices based on search term and status filter
  const filteredInvoices = invoices.filter((invoice: ExtendedInvoice) => {
    const matchesSearch = 
      invoice.reference.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      (invoice.client_name?.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || false);
    const matchesStatus = invoiceStatusFilter === '' || invoice.status === invoiceStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter quotes based on search term and status filter
  const filteredQuotes = quotes.filter((quote: ApiQuote) => {
    const clientId = Number(quote.client);
    const client = clients.find(c => c.id === clientId);
    const matchesSearch = 
      quote.reference.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
      (client?.name?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || false);
    const matchesStatus = quoteStatusFilter === '' || quote.status === quoteStatusFilter;
    return matchesSearch && matchesStatus;
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
      // Check if we have available stock for this product in the selected zone
      const stockAvailability = await InventoryAPI.checkStockAvailability(
        currentProduct.id!, 
        selectedZone,
        currentQuantity
      );
      
      if (!stockAvailability.available) {
        setStockError(`Stock insuffisant pour ${currentProduct.name}. Disponible: ${stockAvailability.stock}, Demandé: ${currentQuantity}`);
        return;
      }
      
      // If we get here, stock is available - add the product
      setSelectedProducts([
        ...selectedProducts,
        { product: currentProduct, quantity: currentQuantity },
      ]);
      
      // Decrease the available stock in our local state to prevent overselling in the same transaction
      setAvailableStock(prev => ({
        ...prev,
        [currentProduct.id!]: (prev[currentProduct.id!] || 0) - currentQuantity
      }));
      
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
      const total_amount = Number((subtotal + tax_amount).toFixed(2));      const newSale: Sale = {
        client: selectedClient.id!,
        zone: selectedZone,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',  // Changed from 'draft' to 'pending' to match backend
        subtotal,
        discount_amount: 0,
        tax_amount,
        total_amount,
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

      // Confirm deletion
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la vente ${sale.reference} ?`)) {
        return;
      }

      console.log('Deleting sale:', sale);
      await SalesAPI.delete(sale.id);
      console.log('Sale deleted');

      // Update the local state
      setSales(sales.filter(s => s.id !== sale.id));
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Erreur lors de la suppression de la vente. Veuillez réessayer plus tard.');
    }
  };    // Removed duplicate functions: getStatusChipColor and getStatusLabel are now defined at the top level

  // Get status chip color for invoices
  const getInvoiceStatusChipColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'error';
      case 'draft':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status label for invoices
  const getInvoiceStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'sent':
        return 'Envoyée';
      case 'overdue':
        return 'En retard';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Get status chip color for quotes
  const getQuoteStatusChipColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'sent':
        return 'info';
      case 'rejected':
        return 'error';
      case 'expired':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  // Get status label for quotes
  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepté';
      case 'sent':
        return 'Envoyé';
      case 'rejected':
        return 'Rejeté';
      case 'expired':
        return 'Expiré';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  // Add the formatCurrency function
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle creating a new invoice - fix the mixed code
  const handleCreateInvoice = async () => {
    if (!selectedSale) {
      setError('Veuillez sélectionner une vente');
      return;
    }

    try {
      setError(null);
      const newInvoice: ApiInvoice = {
        reference: `FACT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
        sale: selectedSale.id!,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Due in 30 days
        status: 'draft',
        amount: selectedSale.total_amount,
        paid_amount: 0,
        balance: selectedSale.total_amount,
        notes: 'Nouvelle facture',
        // These fields will be populated by the server, but we'll set them here for UI consistency
        sale_reference: selectedSale.reference
      };

      // Call the real API
      const createdInvoice = await InvoicesAPI.create(newInvoice);
      
      // Update the local state with the created invoice
      setInvoices([...invoices, createdInvoice]);
      setShowAddInvoiceModal(false);
      setSelectedSale(null);
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError('Erreur lors de la création de la facture. Veuillez réessayer.');
    }
  };

  // Handle creating a new quote - clean up the duplicate code
  const handleCreateQuote = async () => {
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
      
      const newQuote: ApiQuote = {
        reference: `DEV-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
        client: selectedClient.id!,
        date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Valid for 30 days
        status: 'draft',
        subtotal,
        tax_amount,
        total_amount,
        notes: 'Nouveau devis',
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
    } catch (err) {
      console.error('Error creating quote:', err);
      setError('Erreur lors de la création du devis. Veuillez réessayer.');
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

  // Handle saving edited invoice - clean up the mixed code
  const handleSaveEditInvoice = async () => {
    try {
      if (!editingInvoice || !editingInvoice.id) return;
      
      // Call the real API to update the invoice
      const updatedInvoice = await InvoicesAPI.update(editingInvoice.id, editingInvoice);
      
      // Update the local state
      setInvoices(invoices.map(i => i.id === editingInvoice.id ? updatedInvoice : i));
      setShowEditInvoiceModal(false);
      setEditingInvoice(null);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Erreur lors de la mise à jour de la facture. Veuillez réessayer.');
    }
  };

  // Handle deleting an invoice - clean up the mixed code
  const handleDeleteInvoice = async (invoice: ExtendedInvoice) => {
    try {
      if (!invoice.id) return;
      
      // Confirm deletion
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${invoice.reference} ?`)) {
        return;
      }

      // Call the real API to delete the invoice
      await InvoicesAPI.delete(invoice.id);
      
      // Update the local state
      setInvoices(invoices.filter(i => i.id !== invoice.id));
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError('Erreur lors de la suppression de la facture. Veuillez réessayer.');
    }
  };

  // Handle deleting a quote - clean up the mixed code
  const handleDeleteQuote = async (quote: ApiQuote) => {
    try {
      if (!quote.id) return;
      
      // Confirm deletion
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le devis ${quote.reference} ?`)) {
        return;
      }

      // Call the real API to delete the quote
      await QuotesAPI.delete(quote.id);
      
      // Update the local state
      setQuotes(quotes.filter(q => q.id !== quote.id));
    } catch (err) {
      console.error('Error deleting quote:', err);
      setError('Erreur lors de la suppression du devis. Veuillez réessayer.');
    }
  };

  // Add a function to convert quote to sale - clean up the mixed code
  const handleConvertQuoteToSale = async (quote: ApiQuote) => {
    try {
      if (!quote.id) return;
      
      // Confirm conversion
      if (!window.confirm(`Êtes-vous sûr de vouloir convertir le devis ${quote.reference} en vente ?`)) {
        return;
      }
      
      // Need to select a zone
      setSelectedQuoteForConversion(quote);
      setShowQuoteConversionModal(true);
    } catch (err) {
      console.error('Error preparing quote conversion:', err);
      setError('Erreur lors de la préparation de la conversion du devis. Veuillez réessayer.');
    }
  };

  // Perform the actual conversion - clean up the mixed code
  const confirmQuoteConversion = async () => {
    try {
      if (!selectedQuoteForConversion || !selectedQuoteForConversion.id) return;
        // Call the API to convert the quote to a sale
      const createdSale = await QuotesAPI.convertToSale(selectedQuoteForConversion.id);
      
      // Refresh the data
      await Promise.all([fetchData(), fetchQuotes()]);
      setShowQuoteConversionModal(false);
      setSelectedQuoteForConversion(null);
      setSelectedZone(1);
      
      // Show success message
      setSuccessMessage(`Le devis ${selectedQuoteForConversion.reference} a été converti en vente avec succès. Référence de la vente: ${createdSale.reference}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error converting quote to sale:', err);    setError('Erreur lors de la conversion du devis en vente. Veuillez réessayer.');
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
    { field: 'reference', headerName: 'Référence', flex: 1 },
    { 
      field: 'client', 
      headerName: 'Client', 
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
      headerName: 'Date', 
      flex: 1,      valueGetter: (value, row) => {
        if (!row || !row.date) return '';
        return new Date(row.date).toLocaleDateString();
      }
    },
    { 
      field: 'total_amount', 
      headerName: 'Montant', 
      flex: 1,      valueGetter: (value, row) => {
        if (!row || row.total_amount === undefined) return '';
        return formatCurrency(row.total_amount);
      }
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params.row || !params.row.status) return <></>;
        return (
          <Chip 
            label={getStatusLabel(params.row.status)} 
            color={getStatusChipColor(params.row.status)}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'payment_status',
      headerName: 'Paiement',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.payment_status) return <></>;
        let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
        let label = "Inconnu";
        
        switch(params.row.payment_status) {
          case 'paid':
            color = "success";
            label = "Payé";
            break;
          case 'partially_paid':
            color = "warning";
            label = "Partiellement payé";
            break;
          case 'unpaid':
            color = "error";
            label = "Non payé";
            break;
        }
        
        return (
          <Chip 
            label={label}
            color={color}
            size="small"
            variant="outlined"
          />
        );
      }
    },    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,      renderCell: (params: GridRenderCellParams) => {
        // Add safety check for undefined row
        if (!params.row) return <></>;
        
          return (
          <Box>
            <Tooltip title="Éditer">
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => handleEditSale(params.row)}
                disabled={!canEditSale}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleDeleteSale(params.row)}
                disabled={!canDeleteSale}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Voir détails">
              <IconButton 
                size="small" 
                color="info"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
        if (!row || row.amount === undefined) return '';
        return formatCurrency(row.amount);
      }
    },    { 
      field: 'paid_amount', 
      headerName: 'Payé', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.paid_amount === undefined) return '';
        return formatCurrency(row.paid_amount);
      }
    },    { 
      field: 'balance', 
      headerName: 'Solde', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row || row.balance === undefined) return '';
        return formatCurrency(row.balance);
      }
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.status) return <></>;
        return (
          <Chip 
            label={getInvoiceStatusLabel(params.row.status)} 
            color={getInvoiceStatusChipColor(params.row.status)}
            size="small"
            variant="outlined"
          />
        );
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
            <IconButton color="info" size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="primary" 
              size="small"
              onClick={() => handleEditInvoice(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="secondary" size="small">
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="error" 
              size="small"
              onClick={() => handleDeleteInvoice(params.row)}
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
        if (!row || row.total_amount === undefined) return '';
        return formatCurrency(row.total_amount);
      }
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.status) return <></>;
        return (
          <Chip 
            label={getQuoteStatusLabel(params.row.status)} 
            color={getQuoteStatusChipColor(params.row.status)}
            size="small"
            variant="outlined"
          />
        );
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
            <IconButton color="info" size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="primary" 
              size="small"
              onClick={() => handleEditQuote(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="secondary" size="small">
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="error" 
              size="small"
              onClick={() => handleDeleteQuote(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="success" 
              size="small"
              onClick={() => handleConvertQuoteToSale(params.row)}
              disabled={!params.row.status || (params.row.status !== 'draft' && params.row.status !== 'sent')}
            >
              <PaymentsIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      }
    },
  ];
  // Handle editing a quote
  const handleEditQuote = async (quote: ApiQuote) => {
    try {
      // Get the latest quote data from the API
      const quoteData = await QuotesAPI.get(quote.id!);
      setEditingQuote(quoteData);
      setShowEditQuoteModal(true);
    } catch (err) {
      console.error('Error fetching quote details:', err);
      setError('Erreur lors de la récupération des détails du devis. Veuillez réessayer plus tard.');
    }
  };

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
    <PermissionGuard requiredPermission="view_sales" fallbackPath="/">
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
          {/* Quick stats section */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mt: { xs: 2, sm: 0 },
              backgroundColor: 'background.paper',
              p: 1,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ textAlign: 'center', px: 2 }}>
              <Typography variant="caption" color="text.secondary">Ventes</Typography>
              <Typography variant="h6">{sales.length}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">En attente</Typography>
              <Typography variant="h6">{sales.filter(s => s.status === 'pending').length}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', px: 2 }}>
              <Typography variant="caption" color="text.secondary">Non payé</Typography>
              <Typography variant="h6">{sales.filter(s => s.payment_status === 'unpaid').length}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Main content with tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>          <Tabs
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
                )}                <Box sx={{ height: 500, width: '100%', boxShadow: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>                  <DataGrid
                    rows={filteredSales}
                    columns={salesColumns}
                    pagination
                    paginationModel={salesPaginationModel}
                    onPaginationModelChange={setSalesPaginationModel}
                    pageSizeOptions={[10, 25, 50]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick
                    onRowClick={(params) => {
                      setEditingSale(params.row as ExtendedSale);
                      setShowEditModal(true);
                      // Fetch sale items when a sale is clicked
                      fetchSaleItems(params.row.id);
                    }}
                    loading={loading}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter',
                        color: theme => theme.palette.text.primary,
                        fontWeight: 'bold'
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.875rem'
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
                        cursor: 'pointer'
                      }
                    }}
                    getRowId={(row) => {
                      // Safely handle undefined or null rows
                      if (!row || row.id === undefined) return Math.random();
                      return row.id;
                    }}
                  />
                </Box>
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
                  placeholder="Référence ou client"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
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
                    <MenuItem value="paid">Payée</MenuItem>
                    <MenuItem value="sent">Envoyée</MenuItem>
                    <MenuItem value="overdue">En retard</MenuItem>
                    <MenuItem value="draft">Brouillon</MenuItem>
                    <MenuItem value="cancelled">Annulée</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowAddInvoiceModal(true)}
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
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredInvoices}
                    columns={invoiceColumns}
                    pagination
                    paginationModel={invoicePaginationModel}
                    onPaginationModelChange={setInvoicePaginationModel}
                    pageSizeOptions={[5, 10, 25]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick
                    loading={invoiceLoading}
                    getRowId={(row) => {
                      // Safely handle undefined or null rows
                      if (!row || row.id === undefined) return Math.random();
                      return row.id;
                    }}
                  />
                </Box>
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
                  placeholder="Référence ou client"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={quoteSearchTerm}
                  onChange={(e) => setQuoteSearchTerm(e.target.value)}
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
                    <MenuItem value="accepted">Accepté</MenuItem>
                    <MenuItem value="sent">Envoyé</MenuItem>
                    <MenuItem value="rejected">Rejeté</MenuItem>
                    <MenuItem value="expired">Expiré</MenuItem>
                    <MenuItem value="draft">Brouillon</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowAddQuoteModal(true)}
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
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={filteredQuotes}
                    columns={quoteColumns}
                    pagination
                    paginationModel={quotePaginationModel}
                    onPaginationModelChange={setQuotePaginationModel}
                    pageSizeOptions={[5, 10, 25]}
                    checkboxSelection={false}
                    disableRowSelectionOnClick
                    loading={quoteLoading}
                    getRowId={(row) => {
                      // Safely handle undefined or null rows
                      if (!row || row.id === undefined) return Math.random();
                      return row.id;
                    }}
                  />
                </Box>
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
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1 } }}
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
        </Dialog>        {/* Edit Sale Dialog - Simplified and user-friendly */}
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5">Modifier la vente {editingSale?.reference}</Typography>
              <Chip 
                label={getStatusLabel(editingSale?.status || 'pending')} 
                color={getStatusChipColor(editingSale?.status || 'pending')}
                size="medium"
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            {editingSale && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Sale information summary card - Simplified */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Paper sx={{ 
                      flex: '1 0 200px', 
                      p: 2, 
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      bgcolor: 'background.default' 
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
                      bgcolor: 'background.default'
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
                      bgcolor: 'background.default'
                    }}>
                      <Typography variant="subtitle2" color="text.secondary">Montant</Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                        {formatCurrency(editingSale.total_amount)}
                      </Typography>
                    </Paper>
                  </Box>
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
                        Statut actuel: <Chip 
                          label={getStatusLabel(editingSale.status)} 
                          color={getStatusChipColor(editingSale.status)}
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
                                label: getStatusLabel(transition as string) 
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
                              setEditingSale({
                                ...editingSale,
                                status: transition as string
                              });
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

        {/* Add Invoice Dialog - Fixed opening/closing tags */}
        <Dialog open={showAddInvoiceModal} onClose={() => setShowAddInvoiceModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nouvelle facture</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={sales.filter(sale => sale.status === 'delivered' || sale.status === 'confirmed')}
                  getOptionLabel={(option) => {
                    const client = clients.find(c => c.id === option.client);
                    return `${option.reference} - ${client?.name || 'N/A'} (${formatCurrency(option.total_amount)})`;
                  }}
                  value={selectedSale}
                  onChange={(event, newValue) => {
                    setSelectedSale(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField  {...params}
                      label="Vente associée"
                      variant="outlined"
                      fullWidth
                      required
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={`sale-${option.id}`}>
                      {option.reference} - {clients.find(c => c.id === option.client)?.name || 'N/A'} ({formatCurrency(option.total_amount)})
                    </li>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date d'émission"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date d'échéance"
                  type="date"
                  defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddInvoiceModal(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleCreateInvoice}
              disabled={!selectedSale}
            >
              Créer la facture
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Invoice Dialog */}
        <Dialog open={showEditInvoiceModal} onClose={() => setShowEditInvoiceModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Modifier une facture</DialogTitle>
          <DialogContent>
            {editingInvoice && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Référence: {editingInvoice.reference}
                  </Typography>
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
                  <TextField
                    label="Montant payé"
                    type="number"
                    value={editingInvoice.paid_amount}
                    onChange={(e) => {
                      const paid = Number(e.target.value);
                      setEditingInvoice({
                        ...editingInvoice, 
                        paid_amount: paid,
                        balance: editingInvoice.amount - paid
                      });
                    }}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">GNF</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    fullWidth
                    value={editingInvoice.notes || ''}
                    onChange={(e) => setEditingInvoice({...editingInvoice, notes: e.target.value})}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditInvoiceModal(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleSaveEditInvoice}
              disabled={!editingInvoice}
            >
              Enregistrer
            </Button>
          </DialogActions>        </Dialog>

        {/* Edit Quote Dialog */}
        <Dialog open={showEditQuoteModal} onClose={() => setShowEditQuoteModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Modifier le devis</DialogTitle>
          <DialogContent>
            {editingQuote && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Référence: {editingQuote.reference}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Date"
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
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    fullWidth
                    value={editingQuote.notes || ''}
                    onChange={(e) => setEditingQuote({...editingQuote, notes: e.target.value})}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditQuoteModal(false)}>Annuler</Button>
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
                } catch (err) {
                  console.error('Error updating quote:', err);
                  setError('Erreur lors de la mise à jour du devis. Veuillez réessayer.');
                }
              }}
              disabled={!editingQuote}
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Quote Dialog */}
        <Dialog open={showAddQuoteModal} onClose={() => setShowAddQuoteModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nouveau devis</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
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
                <Typography variant="subtitle1" gutterBottom>
                  Produits
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}> {/* Added alignment */}
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
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                    InputProps={{ inputProps: { min: 1 } }}
                    sx={{ width: 100 }} // Fixed width
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddProduct}
                    disabled={!currentProduct || currentQuantity <= 0} // Disable if no product or quantity <= 0
                    sx={{ height: 'fit-content' }} // Adjust button height
                  >
                    Ajouter
                  </Button>
                </Box>
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
              <Grid item xs={12}>
                 <FormControl fullWidth required>
                   <InputLabel>Zone</InputLabel>
                   <Select
                     value={selectedZone} // Assuming selectedZone state is shared or reset appropriately
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
            <Button onClick={() => setShowAddQuoteModal(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={handleCreateQuote}
              disabled={!selectedClient || selectedProducts.length === 0}
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQuoteConversionModal(false)}>Annuler</Button>
            <Button
              variant="contained"
              onClick={confirmQuoteConversion}
              disabled={!selectedQuoteForConversion}
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
                    type="number"
                    value={scannedQuantity}
                    onChange={(e) => setScannedQuantity(Number(e.target.value))}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
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

        {/* Success message alert */}
        {successMessage && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          </Box>
        )}
      </Box>
    </PermissionGuard>
  );
};

export default Sales;