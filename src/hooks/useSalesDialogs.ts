/**
 * Custom Hook: useSalesDialogs
 * Manages dialog state and form operations for sales, invoices, and quotes
 */

import { useState, useCallback } from 'react';
import { ExtendedSale, SaleItem } from './useSalesData';
import { Client, ApiQuote, ExtendedInvoice } from '../interfaces/sales';
import { Product } from '../interfaces/products';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SaleDialogState {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  sale: ExtendedSale | null;
  saleItems: SaleItem[];
  selectedClient: Client | null;
  selectedZone: number;
  selectedProducts: {product: Product, quantity: number}[];
  currentProduct: Product | null;
  currentQuantity: number;
}

export interface InvoiceDialogState {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  invoice: ExtendedInvoice | null;
  selectedSale: ExtendedSale | null;
  date: string;
  due_date: string;
  notes: string;
}

export interface QuoteDialogState {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  quote: ApiQuote | null;
  selectedClient: Client | null;
  selectedZone: number;
  selectedProducts: {product: Product, quantity: number}[];
  currentProduct: Product | null;
  currentQuantity: number;
  date: string;
  expiry_date: string;
  notes: string;
}

export interface QuoteConversionDialogState {
  open: boolean;
  quote: ApiQuote | null;
}

export interface DeleteDialogState {
  open: boolean;
  type: 'sale' | 'invoice' | 'quote' | null;
  item: ExtendedSale | ExtendedInvoice | ApiQuote | null;
  confirmationInfo: {
    willRestoreStock: boolean;
    willRefundAmount: number;
    hasPayments: boolean;
    invoiceId?: number;
    quoteId?: number;
  } | null;
}

export type DeleteConfirmationInfo = DeleteDialogState['confirmationInfo'];

export interface UseSalesDialogsReturn {
  // Sale dialog
  saleDialog: SaleDialogState;
  openSaleDialog: (mode: 'add' | 'edit' | 'view', sale?: ExtendedSale) => void;
  closeSaleDialog: () => void;
  updateSaleDialog: (data: Partial<SaleDialogState>) => void;
  addProductToSale: () => boolean;
  removeProductFromSale: (index: number) => void;
  
  // Invoice dialog
  invoiceDialog: InvoiceDialogState;
  openInvoiceDialog: (mode: 'add' | 'edit' | 'view', invoice?: ExtendedInvoice, sale?: ExtendedSale) => void;
  closeInvoiceDialog: () => void;
  updateInvoiceDialog: (data: Partial<InvoiceDialogState>) => void;
  
  // Quote dialog
  quoteDialog: QuoteDialogState;
  openQuoteDialog: (mode: 'add' | 'edit' | 'view', quote?: ApiQuote) => void;
  closeQuoteDialog: () => void;
  updateQuoteDialog: (data: Partial<QuoteDialogState>) => void;
  addProductToQuote: () => boolean;
  removeProductFromQuote: (index: number) => void;
  
  // Quote conversion dialog
  quoteConversionDialog: QuoteConversionDialogState;
  openQuoteConversionDialog: (quote: ApiQuote) => void;
  closeQuoteConversionDialog: () => void;
  
  // Delete dialog
  deleteDialog: DeleteDialogState;
  openDeleteDialog: (
    type: 'sale' | 'invoice' | 'quote', 
    item: ExtendedSale | ExtendedInvoice | ApiQuote, 
    confirmationInfo?: DeleteConfirmationInfo
  ) => void;
  closeDeleteDialog: () => void;
}

export const useSalesDialogs = (): UseSalesDialogsReturn => {
  
  // ============================================================================
  // SALE DIALOG STATE
  // ============================================================================
  
  const [saleDialog, setSaleDialog] = useState<SaleDialogState>({
    open: false,
    mode: 'add',
    sale: null,
    saleItems: [],
    selectedClient: null,
    selectedZone: 1,
    selectedProducts: [],
    currentProduct: null,
    currentQuantity: 1
  });

  const openSaleDialog = useCallback((mode: 'add' | 'edit' | 'view', sale?: ExtendedSale) => {
    setSaleDialog({
      open: true,
      mode,
      sale: sale || null,
      saleItems: [],
      selectedClient: null,
      selectedZone: 1,
      selectedProducts: [],
      currentProduct: null,
      currentQuantity: 1
    });
  }, []);

  const closeSaleDialog = useCallback(() => {
    setSaleDialog(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const updateSaleDialog = useCallback((data: Partial<SaleDialogState>) => {
    setSaleDialog(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const addProductToSale = useCallback((): boolean => {
    const { currentProduct, currentQuantity, selectedProducts } = saleDialog;
    
    if (!currentProduct || currentQuantity <= 0) {
      return false;
    }

    // Check if product is already added
    const existingIndex = selectedProducts.findIndex(
      item => item.product.id === currentProduct.id
    );

    if (existingIndex !== -1) {
      // Update quantity if product exists
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += currentQuantity;
      setSaleDialog(prev => ({
        ...prev,
        selectedProducts: updatedProducts,
        currentProduct: null,
        currentQuantity: 1
      }));
    } else {
      // Add new product
      setSaleDialog(prev => ({
        ...prev,
        selectedProducts: [
          ...prev.selectedProducts,
          { product: currentProduct, quantity: currentQuantity }
        ],
        currentProduct: null,
        currentQuantity: 1
      }));
    }

    return true;
  }, [saleDialog]);

  const removeProductFromSale = useCallback((index: number) => {
    setSaleDialog(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((_, i) => i !== index)
    }));
  }, []);

  // ============================================================================
  // INVOICE DIALOG STATE
  // ============================================================================
  
  const [invoiceDialog, setInvoiceDialog] = useState<InvoiceDialogState>({
    open: false,
    mode: 'add',
    invoice: null,
    selectedSale: null,
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: ''
  });

  const openInvoiceDialog = useCallback((
    mode: 'add' | 'edit' | 'view', 
    invoice?: ExtendedInvoice,
    sale?: ExtendedSale
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    setInvoiceDialog({
      open: true,
      mode,
      invoice: invoice || null,
      selectedSale: sale || null,
      date: invoice?.date || today,
      due_date: invoice?.due_date || dueDate.toISOString().split('T')[0],
      notes: invoice?.notes || ''
    });
  }, []);

  const closeInvoiceDialog = useCallback(() => {
    setInvoiceDialog(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const updateInvoiceDialog = useCallback((data: Partial<InvoiceDialogState>) => {
    setInvoiceDialog(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  // ============================================================================
  // QUOTE DIALOG STATE
  // ============================================================================
  
  const [quoteDialog, setQuoteDialog] = useState<QuoteDialogState>({
    open: false,
    mode: 'add',
    quote: null,
    selectedClient: null,
    selectedZone: 1,
    selectedProducts: [],
    currentProduct: null,
    currentQuantity: 1,
    date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: ''
  });

  const openQuoteDialog = useCallback((mode: 'add' | 'edit' | 'view', quote?: ApiQuote) => {
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    setQuoteDialog({
      open: true,
      mode,
      quote: quote || null,
      selectedClient: null,
      selectedZone: 1,
      selectedProducts: [],
      currentProduct: null,
      currentQuantity: 1,
      date: quote?.date || today,
      expiry_date: quote?.expiry_date || expiryDate.toISOString().split('T')[0],
      notes: quote?.notes || ''
    });
  }, []);

  const closeQuoteDialog = useCallback(() => {
    setQuoteDialog(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const updateQuoteDialog = useCallback((data: Partial<QuoteDialogState>) => {
    setQuoteDialog(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const addProductToQuote = useCallback((): boolean => {
    const { currentProduct, currentQuantity, selectedProducts } = quoteDialog;
    
    if (!currentProduct || currentQuantity <= 0) {
      return false;
    }

    // Check if product is already added
    const existingIndex = selectedProducts.findIndex(
      item => item.product.id === currentProduct.id
    );

    if (existingIndex !== -1) {
      // Update quantity if product exists
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += currentQuantity;
      setQuoteDialog(prev => ({
        ...prev,
        selectedProducts: updatedProducts,
        currentProduct: null,
        currentQuantity: 1
      }));
    } else {
      // Add new product
      setQuoteDialog(prev => ({
        ...prev,
        selectedProducts: [
          ...prev.selectedProducts,
          { product: currentProduct, quantity: currentQuantity }
        ],
        currentProduct: null,
        currentQuantity: 1
      }));
    }

    return true;
  }, [quoteDialog]);

  const removeProductFromQuote = useCallback((index: number) => {
    setQuoteDialog(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((_, i) => i !== index)
    }));
  }, []);

  // ============================================================================
  // QUOTE CONVERSION DIALOG STATE
  // ============================================================================
  
  const [quoteConversionDialog, setQuoteConversionDialog] = useState<QuoteConversionDialogState>({
    open: false,
    quote: null
  });

  const openQuoteConversionDialog = useCallback((quote: ApiQuote) => {
    setQuoteConversionDialog({
      open: true,
      quote
    });
  }, []);

  const closeQuoteConversionDialog = useCallback(() => {
    setQuoteConversionDialog({
      open: false,
      quote: null
    });
  }, []);

  // ============================================================================
  // DELETE DIALOG STATE
  // ============================================================================
  
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    type: null,
    item: null,
    confirmationInfo: null
  });

  const openDeleteDialog = useCallback((
    type: 'sale' | 'invoice' | 'quote',
    item: ExtendedSale | ExtendedInvoice | ApiQuote,
    confirmationInfo?: DeleteConfirmationInfo
  ) => {
    setDeleteDialog({
      open: true,
      type,
      item,
      confirmationInfo: confirmationInfo || null
    });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({
      open: false,
      type: null,
      item: null,
      confirmationInfo: null
    });
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    // Sale dialog
    saleDialog,
    openSaleDialog,
    closeSaleDialog,
    updateSaleDialog,
    addProductToSale,
    removeProductFromSale,
    
    // Invoice dialog
    invoiceDialog,
    openInvoiceDialog,
    closeInvoiceDialog,
    updateInvoiceDialog,
    
    // Quote dialog
    quoteDialog,
    openQuoteDialog,
    closeQuoteDialog,
    updateQuoteDialog,
    addProductToQuote,
    removeProductFromQuote,
    
    // Quote conversion dialog
    quoteConversionDialog,
    openQuoteConversionDialog,
    closeQuoteConversionDialog,
    
    // Delete dialog
    deleteDialog,
    openDeleteDialog,
    closeDeleteDialog
  };
};
