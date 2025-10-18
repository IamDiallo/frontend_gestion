/**
 * Custom Hook: useSalesFilters
 * Manages filtering logic for sales, invoices, and quotes
 */

import { useState, useMemo } from 'react';
import { ExtendedSale } from './useSalesData';
import { Client } from '../interfaces/sales';
import { ApiQuote, ExtendedInvoice } from '../interfaces/sales';

interface UseSalesFiltersProps {
  sales: ExtendedSale[];
  invoices: ExtendedInvoice[];
  quotes: ApiQuote[];
  clients: Client[];
}

interface SalesFilters {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  resetSalesFilters: () => void;
}

interface InvoiceFilters {
  invoiceSearchTerm: string;
  setInvoiceSearchTerm: (term: string) => void;
  invoiceStatusFilter: string;
  setInvoiceStatusFilter: (status: string) => void;
  invoiceDateFilter: string;
  setInvoiceDateFilter: (date: string) => void;
  resetInvoiceFilters: () => void;
}

interface QuoteFilters {
  quoteSearchTerm: string;
  setQuoteSearchTerm: (term: string) => void;
  quoteStatusFilter: string;
  setQuoteStatusFilter: (status: string) => void;
  quoteDateFilter: string;
  setQuoteDateFilter: (date: string) => void;
  resetQuoteFilters: () => void;
}

interface UseSalesFiltersReturn {
  // Filtered data
  filteredSales: ExtendedSale[];
  filteredInvoices: ExtendedInvoice[];
  filteredQuotes: ApiQuote[];

  // Sales filters
  salesFilters: SalesFilters;

  // Invoice filters
  invoiceFilters: InvoiceFilters;

  // Quote filters
  quoteFilters: QuoteFilters;
}

export const useSalesFilters = ({
  sales,
  invoices,
  quotes,
  clients
}: UseSalesFiltersProps): UseSalesFiltersReturn => {
  // ============================================================================
  // SALES FILTERS STATE
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ============================================================================
  // INVOICE FILTERS STATE
  // ============================================================================
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');

  // ============================================================================
  // QUOTE FILTERS STATE
  // ============================================================================
  const [quoteSearchTerm, setQuoteSearchTerm] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('');
  const [quoteDateFilter, setQuoteDateFilter] = useState('');

  // ============================================================================
  // FILTER LOGIC
  // ============================================================================

  // Helper function for date filtering
  const matchesDateFilter = (dateString: string, filterType: string): boolean => {
    if (!filterType) return true;
    
    const date = new Date(dateString);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (filterType) {
      case 'today':
        return date >= startOfDay;
      case 'week': {
        const weekAgo = new Date(startOfDay);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(startOfDay);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      }
      case 'quarter': {
        const quarterAgo = new Date(startOfDay);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        return date >= quarterAgo;
      }
      case 'year': {
        const yearAgo = new Date(startOfDay);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return date >= yearAgo;
      }
      default:
        return true;
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const clientId = Number(sale.client);
      const client = clients.find(c => c.id === clientId);
      
      const matchesSearch = 
        sale.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesStatus = statusFilter === '' || sale.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [sales, clients, searchTerm, statusFilter]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: ExtendedInvoice) => {
      const matchesSearch = 
        invoice.reference.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
        (invoice.client_name?.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || false) ||
        (invoice.sale_reference?.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) || false);
      const matchesStatus = invoiceStatusFilter === '' || invoice.status === invoiceStatusFilter;
      const matchesDate = matchesDateFilter(invoice.date, invoiceDateFilter);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, invoiceSearchTerm, invoiceStatusFilter, invoiceDateFilter]);

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote: ApiQuote) => {
      const clientId = Number(quote.client);
      const client = clients.find(c => c.id === clientId);
      
      const matchesSearch = 
        quote.reference.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
        (client?.name?.toLowerCase().includes(quoteSearchTerm.toLowerCase()) || false);
      const matchesStatus = quoteStatusFilter === '' || quote.status === quoteStatusFilter;
      const matchesDate = matchesDateFilter(quote.date, quoteDateFilter);
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [quotes, clients, quoteSearchTerm, quoteStatusFilter, quoteDateFilter]);

  // ============================================================================
  // RESET FUNCTIONS
  // ============================================================================

  const resetSalesFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const resetInvoiceFilters = () => {
    setInvoiceSearchTerm('');
    setInvoiceStatusFilter('');
    setInvoiceDateFilter('');
  };

  const resetQuoteFilters = () => {
    setQuoteSearchTerm('');
    setQuoteStatusFilter('');
    setQuoteDateFilter('');
  };

  return {
    // Filtered data
    filteredSales,
    filteredInvoices,
    filteredQuotes,

    // Sales filters
    salesFilters: {
      searchTerm,
      setSearchTerm,
      statusFilter,
      setStatusFilter,
      resetSalesFilters
    },

    // Invoice filters
    invoiceFilters: {
      invoiceSearchTerm,
      setInvoiceSearchTerm,
      invoiceStatusFilter,
      setInvoiceStatusFilter,
      invoiceDateFilter,
      setInvoiceDateFilter,
      resetInvoiceFilters
    },

    // Quote filters
    quoteFilters: {
      quoteSearchTerm,
      setQuoteSearchTerm,
      quoteStatusFilter,
      setQuoteStatusFilter,
      quoteDateFilter,
      setQuoteDateFilter,
      resetQuoteFilters
    }
  };
};
