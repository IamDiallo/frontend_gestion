/**
 * Custom Hook: useSalesData
 * Manages all data fetching and CRUD operations for sales management
 */

import { useState, useCallback } from 'react';
import { SalesAPI, PartnersAPI, InventoryAPI, CoreAPI } from '../services/api/index';
import { 
  Sale, 
  Client, 
  Zone, 
  ApiQuote, 
  ExtendedInvoice,
  Invoice,
  Quote
} from '../interfaces/sales';
import { Product } from '../interfaces/products';

export interface ExtendedSale extends Omit<Sale, 'client'> {
  client: number;
  paid_amount?: number;
  remaining_amount?: number;
  balance?: number;
}

export interface SaleItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateSaleData {
  client: number;
  zone: number;
  date: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  remaining_amount: number;
  notes: string;
  items: Array<{
    product: number;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    total_price: number;
  }>;
}

export interface CreateInvoiceData {
  reference: string;
  sale: number;
  date: string;
  due_date: string;
  status: string;
  amount: number;
  paid_amount: number;
  balance: number;
  notes: string;
  sale_reference: string;
  client_name?: string;
}

export interface CreateQuoteData {
  client: number;
  date: string;
  expiry_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string;
  items: Array<{
    product: number;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    total_price: number;
  }>;
}

interface UseSalesDataReturn {
  // State
  sales: ExtendedSale[];
  invoices: ExtendedInvoice[];
  quotes: ApiQuote[];
  clients: Client[];
  products: Product[];
  zones: Zone[];
  loading: boolean;
  invoiceLoading: boolean;
  quoteLoading: boolean;
  error: string | null;
  availableStock: {[productId: number]: number};
  productsWithStock: Product[];

  // Data fetching
  fetchSales: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchQuotes: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchZones: () => Promise<void>;
  fetchProductsWithStock: (zoneId: number) => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Sale operations
  createSale: (data: Partial<CreateSaleData>) => Promise<ExtendedSale>;
  updateSale: (id: number, data: Partial<Sale>) => Promise<ExtendedSale>;
  deleteSale: (id: number) => Promise<void>;
  updateSaleStatus: (id: number, status: string) => Promise<ExtendedSale>;

  // Invoice operations
  createInvoice: (data: Partial<CreateInvoiceData>) => Promise<ExtendedInvoice>;
  updateInvoice: (id: number, data: Partial<ExtendedInvoice>) => Promise<ExtendedInvoice>;
  deleteInvoice: (id: number) => Promise<void>;

  // Quote operations
  createQuote: (data: Partial<CreateQuoteData>) => Promise<ApiQuote>;
  updateQuote: (id: number, data: Partial<ApiQuote>) => Promise<ApiQuote>;
  deleteQuote: (id: number) => Promise<void>;
  convertQuoteToSale: (quoteId: number) => Promise<ExtendedSale>;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSalesData = (): UseSalesDataReturn => {
  // State management
  const [sales, setSales] = useState<ExtendedSale[]>([]);
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [quotes, setQuotes] = useState<ApiQuote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStock, setAvailableStock] = useState<{[productId: number]: number}>({});
  const [productsWithStock, setProductsWithStock] = useState<Product[]>([]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchSales = useCallback(async () => {
    try {
      const data = await SalesAPI.fetchSales();
      setSales(data);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Erreur lors du chargement des ventes');
      throw err;
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setInvoiceLoading(true);
      const data = await SalesAPI.fetchInvoices();
      setInvoices(data);
      setInvoiceLoading(false);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Erreur lors du chargement des factures');
      setInvoiceLoading(false);
      throw err;
    }
  }, []);

  const fetchQuotes = useCallback(async () => {
    try {
      setQuoteLoading(true);
      const data = await SalesAPI.fetchQuotes();
      setQuotes(data);
      setQuoteLoading(false);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Erreur lors du chargement des devis');
      setQuoteLoading(false);
      throw err;
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const data = await PartnersAPI.fetchClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Erreur lors du chargement des clients');
      throw err;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await InventoryAPI.fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erreur lors du chargement des produits');
      throw err;
    }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      const data = await CoreAPI.fetchZones();
      setZones(data);
    } catch (err) {
      console.error('Error fetching zones:', err);
      setError('Erreur lors du chargement des zones');
      throw err;
    }
  }, []);

  const fetchProductsWithStock = useCallback(async (zoneId: number) => {
    try {
      if (!zoneId) return;
      
      setLoading(true);
      const stockData = await InventoryAPI.getStockByZone(zoneId);
      
      const productsInStock = products.filter(product => {
        const stockItem = stockData.find(item => item.product === product.id);
        return stockItem && stockItem.quantity > 0;
      });
      
      const stockMap = stockData.reduce((acc, item) => {
        acc[item.product] = item.quantity;
        return acc;
      }, {} as {[productId: number]: number});
      
      setProductsWithStock(productsInStock);
      setAvailableStock(stockMap);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Erreur lors de la récupération des données de stock');
      setLoading(false);
      throw err;
    }
  }, [products]);

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchSales(),
        fetchInvoices(),
        fetchQuotes(),
        fetchClients(),
        fetchProducts(),
        fetchZones()
      ]);
      
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  }, [fetchSales, fetchInvoices, fetchQuotes, fetchClients, fetchProducts, fetchZones]);

  // ============================================================================
  // SALE OPERATIONS
  // ============================================================================

  const createSale = useCallback(async (data: Partial<CreateSaleData>): Promise<ExtendedSale> => {
    try {
      const newSale = await SalesAPI.createSale(data);
      await fetchSales();
      return newSale;
    } catch (err) {
      console.error('Error creating sale:', err);
      throw err;
    }
  }, [fetchSales]);

  const updateSale = useCallback(async (id: number, data: Partial<Sale>): Promise<ExtendedSale> => {
    try {
      const updatedSale = await SalesAPI.updateSale(id, data);
      await fetchSales();
      return updatedSale;
    } catch (err) {
      console.error('Error updating sale:', err);
      throw err;
    }
  }, [fetchSales]);

  const deleteSale = useCallback(async (id: number): Promise<void> => {
    try {
      await SalesAPI.deleteSale(id);
      await fetchSales();
    } catch (err) {
      console.error('Error deleting sale:', err);
      throw err;
    }
  }, [fetchSales]);

  const updateSaleStatus = useCallback(async (id: number, status: string): Promise<ExtendedSale> => {
    try {
      const updatedSale = await SalesAPI.updateSale(id, { status });
      await fetchSales();
      return updatedSale;
    } catch (err) {
      console.error('Error updating sale status:', err);
      throw err;
    }
  }, [fetchSales]);

  // ============================================================================
  // INVOICE OPERATIONS
  // ============================================================================

  const createInvoice = useCallback(async (data: Partial<CreateInvoiceData>): Promise<ExtendedInvoice> => {
    try {
      const newInvoice = await SalesAPI.createInvoice(data as unknown as Partial<Invoice>);
      await fetchInvoices();
      return newInvoice;
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: number, data: Partial<ExtendedInvoice>): Promise<ExtendedInvoice> => {
    try {
      const updatedInvoice = await SalesAPI.updateInvoice(id, data);
      await fetchInvoices();
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: number): Promise<void> => {
    try {
      await SalesAPI.deleteInvoice(id);
      await fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      throw err;
    }
  }, [fetchInvoices]);

  // ============================================================================
  // QUOTE OPERATIONS
  // ============================================================================

  const createQuote = useCallback(async (data: Partial<CreateQuoteData>): Promise<ApiQuote> => {
    try {
      const newQuote = await SalesAPI.createQuote(data as unknown as Partial<Quote>);
      await fetchQuotes();
      return newQuote;
    } catch (err) {
      console.error('Error creating quote:', err);
      throw err;
    }
  }, [fetchQuotes]);

  const updateQuote = useCallback(async (id: number, data: Partial<ApiQuote>): Promise<ApiQuote> => {
    try {
      const updatedQuote = await SalesAPI.updateQuote(id, data);
      await fetchQuotes();
      return updatedQuote;
    } catch (err) {
      console.error('Error updating quote:', err);
      throw err;
    }
  }, [fetchQuotes]);

  const deleteQuote = useCallback(async (id: number): Promise<void> => {
    try {
      await SalesAPI.deleteQuote(id);
      await fetchQuotes();
    } catch (err) {
      console.error('Error deleting quote:', err);
      throw err;
    }
  }, [fetchQuotes]);

  const convertQuoteToSale = useCallback(async (quoteId: number, zoneId: number = 1): Promise<ExtendedSale> => {
    try {
      const newSale = await SalesAPI.convertQuoteToSale(quoteId, zoneId);
      await Promise.all([fetchSales(), fetchQuotes()]);
      return newSale;
    } catch (err) {
      console.error('Error converting quote to sale:', err);
      throw err;
    }
  }, [fetchSales, fetchQuotes]);

  return {
    // State
    sales,
    invoices,
    quotes,
    clients,
    products,
    zones,
    loading,
    invoiceLoading,
    quoteLoading,
    error,
    availableStock,
    productsWithStock,

    // Data fetching
    fetchSales,
    fetchInvoices,
    fetchQuotes,
    fetchClients,
    fetchProducts,
    fetchZones,
    fetchProductsWithStock,
    refreshAllData,

    // Sale operations
    createSale,
    updateSale,
    deleteSale,
    updateSaleStatus,

    // Invoice operations
    createInvoice,
    updateInvoice,
    deleteInvoice,

    // Quote operations
    createQuote,
    updateQuote,
    deleteQuote,
    convertQuoteToSale,

    // Utility
    setError,
    setLoading
  };
};
