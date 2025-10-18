/**
 * Sales Domain API
 * Handles: Sales, Invoices, Quotes, DeliveryNotes, SaleCharges
 * Base path: /api/sales/
 */

import { api } from './config';
import type { Sale, Invoice, Quote, OutstandingSale, SaleDeletionResponse, SaleCanDeleteResponse } from '../../interfaces/sales';
import type { AccountPaymentResponse } from '../../interfaces/payment';

// ============================================================================
// SALES
// ============================================================================

export const fetchSales = async (): Promise<Sale[]> => {
  const response = await api.get('/sales/sales/');
  return response.data.results || response.data;
};

export const fetchSale = async (id: number): Promise<Sale> => {
  const response = await api.get(`/sales/sales/${id}/`);
  return response.data;
};

export const createSale = async (data: Partial<Sale>): Promise<Sale> => {
  const response = await api.post('/sales/sales/', data);
  return response.data;
};

export const updateSale = async (id: number, data: Partial<Sale>): Promise<Sale> => {
  const response = await api.patch(`/sales/sales/${id}/`, data);
  return response.data;
};

export const deleteSale = async (id: number): Promise<SaleDeletionResponse> => {
  const response = await api.delete(`/sales/sales/${id}/`);
  return response.data;
};

export const canDeleteSale = async (id: number): Promise<SaleCanDeleteResponse> => {
  const response = await api.get(`/sales/sales/${id}/can_delete/`);
  return response.data;
};

export const fetchOutstandingSales = async (): Promise<OutstandingSale[]> => {
  const response = await api.get('/sales/sales/outstanding/');
  return response.data;
};

export const recalculateSalePaymentAmounts = async (): Promise<{ message: string; updated_count: number }> => {
  const response = await api.post('/sales/sales/recalculate_payment_amounts/');
  return response.data;
};

export const fetchOutstandingSalesByClient = async (clientId: number): Promise<OutstandingSale[]> => {
  const response = await api.get(`/sales/sales/outstanding_by_client/?client_id=${clientId}`);
  return Array.isArray(response.data) ? response.data : (response.data?.results || []);
};

export const fetchOutstandingSalesBySupplier = async (supplierId: number): Promise<OutstandingSale[]> => {
  const response = await api.get(`/sales/sales/outstanding_by_supplier/?supplier_id=${supplierId}`);
  return Array.isArray(response.data) ? response.data : (response.data?.results || []);
};

export const payFromAccount = async (
  saleId: number, 
  paymentData: { amount: number; description?: string; company_account?: number | null }
): Promise<AccountPaymentResponse> => {
  const response = await api.post(`/sales/sales/${saleId}/pay_from_account/`, paymentData);
  
  // If payment results in fully paid status, auto-update sale status
  if (response.data.sale?.payment_status === 'paid') {
    const saleResponse = await api.get(`/sales/sales/${saleId}/`);
    if (saleResponse.data.status === 'payment_pending' || saleResponse.data.status === 'confirmed') {
      await api.patch(`/sales/sales/${saleId}/`, { status: 'paid' });
      response.data.sale.status = 'paid';
    }
  }
  
  return response.data;
};

// ============================================================================
// INVOICES
// ============================================================================

export const fetchInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get('/sales/invoices/');
  return response.data.results || response.data;
};

export const fetchInvoice = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/sales/invoices/${id}/`);
  return response.data;
};

export const createInvoice = async (data: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.post('/sales/invoices/', data);
  return response.data;
};

export const updateInvoice = async (id: number, data: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.patch(`/sales/invoices/${id}/`, data);
  return response.data;
};

export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`/sales/invoices/${id}/`);
};

export const generateInvoicePDF = async (id: number): Promise<Blob> => {
  const response = await api.get(`/sales/invoices/${id}/pdf/`, {
    responseType: 'blob',
  });
  return response.data;
};

// ============================================================================
// QUOTES
// ============================================================================

export const fetchQuotes = async (): Promise<Quote[]> => {
  const response = await api.get('/sales/quotes/');
  return response.data.results || response.data;
};

export const fetchQuote = async (id: number): Promise<Quote> => {
  const response = await api.get(`/sales/quotes/${id}/`);
  return response.data;
};

export const createQuote = async (data: Partial<Quote>): Promise<Quote> => {
  const response = await api.post('/sales/quotes/', data);
  return response.data;
};

export const updateQuote = async (id: number, data: Partial<Quote>): Promise<Quote> => {
  const response = await api.patch(`/sales/quotes/${id}/`, data);
  return response.data;
};

export const deleteQuote = async (id: number): Promise<void> => {
  await api.delete(`/sales/quotes/${id}/`);
};

export const convertQuoteToSale = async (id: number, zone: number): Promise<Sale> => {
  const response = await api.post(`/sales/quotes/${id}/convert_to_sale/`, { zone });
  return response.data;
};

export const generateQuotePDF = async (id: number): Promise<Blob> => {
  const response = await api.get(`/sales/quotes/${id}/pdf/`, {
    responseType: 'blob',
  });
  return response.data;
};

// ============================================================================
// DELIVERY NOTES
// ============================================================================

export const fetchDeliveryNotes = async (): Promise<unknown[]> => {
  const response = await api.get('/sales/delivery-notes/');
  return response.data.results || response.data;
};

export const createDeliveryNote = async (data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.post('/sales/delivery-notes/', data);
  return response.data;
};

export const updateDeliveryNote = async (id: number, data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.patch(`/sales/delivery-notes/${id}/`, data);
  return response.data;
};

// ============================================================================
// SALE CHARGES
// ============================================================================

export const fetchSaleCharges = async (): Promise<unknown[]> => {
  const response = await api.get('/sales/sale-charges/');
  return response.data.results || response.data;
};

export const createSaleCharge = async (data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.post('/sales/sale-charges/', data);
  return response.data;
};

export const deleteSaleCharge = async (id: number): Promise<void> => {
  await api.delete(`/sales/sale-charges/${id}/`);
};
