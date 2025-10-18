/**
 * Inventory Domain API
 * Handles: Products, Stock, StockSupplies, StockCards, StockTransfers, Inventories, StockReturns
 * Base path: /api/inventory/
 */

import { api } from './config';
import type { Product } from '../../interfaces/products';
import type {
  Stock,
  StockSupply,
  StockTransfer,
  Inventory,
  CreateStockSupply,
  CreateStockTransfer,
  CreateInventory,
  UpdateInventory
} from '../../interfaces/inventory';
import type { StockMovement } from '../../interfaces/inventory';
import type { SupplierPaymentResponse } from '../../interfaces/business';

export interface OutstandingSupplySummary {
  supplier_id: number;
  supplier_name: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  supply_count: number;
}

// ============================================================================
// PRODUCTS
// ============================================================================

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await api.get('/inventory/products/');
  return response.data.results || response.data;
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/inventory/products/${id}/`);
  return response.data;
};

export const createProduct = async (data: FormData | Partial<Product>): Promise<Product> => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const response = await api.post('/inventory/products/', data, { headers });
  return response.data;
};

export const updateProduct = async (id: number, data: FormData | Partial<Product>): Promise<Product> => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  const response = await api.patch(`/inventory/products/${id}/`, data, { headers });
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/inventory/products/${id}/`);
};

export const fetchProductQRCode = async (productId: number): Promise<Blob> => {
  const response = await api.get(`/inventory/products/${productId}/qr_code/`, {
    responseType: 'blob',
  });
  return response.data;
};

// ============================================================================
// STOCK
// ============================================================================

export const fetchStock = async (): Promise<Stock[]> => {
  const response = await api.get('/inventory/stock/');
  return response.data.results || response.data;
};

export const fetchLowStock = async (): Promise<Stock[]> => {
  const response = await api.get('/inventory/stock/low_stock/');
  return response.data.results || response.data;
};

// ============================================================================
// STOCK CARDS
// ============================================================================

export const fetchStockCards = async (): Promise<StockMovement[]> => {
  const response = await api.get('/inventory/stock-cards/');
  return response.data.results || response.data;
};

export const fetchStockCardsByProduct = async (productId: number): Promise<StockMovement[]> => {
  const response = await api.get(`/inventory/stock-cards/?product=${productId}`);
  return response.data.results || response.data;
};

// ============================================================================
// STOCK SUPPLIES
// ============================================================================

export const fetchStockSupplies = async (): Promise<StockSupply[]> => {
  const response = await api.get('/inventory/stock-supplies/');
  return response.data.results || response.data;
};

export const fetchStockSupply = async (id: number): Promise<StockSupply> => {
  const response = await api.get(`/inventory/stock-supplies/${id}/`);
  return response.data;
};

export const createStockSupply = async (data: CreateStockSupply): Promise<StockSupply> => {
  const response = await api.post('/inventory/stock-supplies/', data);
  return response.data;
};

export const updateStockSupply = async (id: number, data: Partial<StockSupply>): Promise<StockSupply> => {
  const response = await api.patch(`/inventory/stock-supplies/${id}/`, data);
  return response.data;
};

export const deleteStockSupply = async (id: number): Promise<void> => {
  await api.delete(`/inventory/stock-supplies/${id}/`);
};

export const confirmStockSupply = async (id: number): Promise<StockSupply> => {
  const response = await api.post(`/inventory/stock-supplies/${id}/confirm/`);
  return response.data;
};

export const fetchOutstandingSupplies = async (): Promise<OutstandingSupplySummary[]> => {
  const response = await api.get('/inventory/stock-supplies/outstanding_by_supplier/');
  return Array.isArray(response.data) ? response.data : (response.data?.results || []);
};

// ============================================================================
// STOCK TRANSFERS
// ============================================================================

export const fetchStockTransfers = async (): Promise<StockTransfer[]> => {
  const response = await api.get('/inventory/stock-transfers/');
  return response.data.results || response.data;
};

export const fetchStockTransfer = async (id: number): Promise<StockTransfer> => {
  const response = await api.get(`/inventory/stock-transfers/${id}/`);
  return response.data;
};

export const createStockTransfer = async (data: CreateStockTransfer): Promise<StockTransfer> => {
  const response = await api.post('/inventory/stock-transfers/', data);
  return response.data;
};

export const updateStockTransfer = async (id: number, data: Partial<StockTransfer>): Promise<StockTransfer> => {
  const response = await api.patch(`/inventory/stock-transfers/${id}/`, data);
  return response.data;
};

export const deleteStockTransfer = async (id: number): Promise<void> => {
  await api.delete(`/inventory/stock-transfers/${id}/`);
};

export const approveStockTransfer = async (id: number): Promise<StockTransfer> => {
  const response = await api.post(`/inventory/stock-transfers/${id}/approve/`);
  return response.data;
};

// ============================================================================
// INVENTORIES
// ============================================================================

export const fetchInventories = async (): Promise<Inventory[]> => {
  const response = await api.get('/inventory/inventories/');
  return response.data.results || response.data;
};

export const fetchInventory = async (id: number): Promise<Inventory> => {
  const response = await api.get(`/inventory/inventories/${id}/`);
  return response.data;
};

export const createInventory = async (data: CreateInventory): Promise<Inventory> => {
  const response = await api.post('/inventory/inventories/', data);
  return response.data;
};

export const updateInventory = async (id: number, data: UpdateInventory): Promise<Inventory> => {
  const response = await api.patch(`/inventory/inventories/${id}/`, data);
  return response.data;
};

export const deleteInventory = async (id: number): Promise<void> => {
  await api.delete(`/inventory/inventories/${id}/`);
};

export const approveInventory = async (id: number): Promise<Inventory> => {
  const response = await api.post(`/inventory/inventories/${id}/approve/`);
  return response.data;
};

// ============================================================================
// STOCK RETURNS
// ============================================================================

export const fetchStockReturns = async (): Promise<unknown[]> => {
  const response = await api.get('/inventory/stock-returns/');
  return response.data.results || response.data;
};

export const createStockReturn = async (data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.post('/inventory/stock-returns/', data);
  return response.data;
};

export const approveStockReturn = async (id: number): Promise<unknown> => {
  const response = await api.post(`/inventory/stock-returns/${id}/approve/`);
  return response.data;
};

// ============================================================================
// STOCK QUERIES
// ============================================================================

export const getStockByZone = async (zoneId: number): Promise<Stock[]> => {
  const response = await api.get(`/inventory/stock/?zone=${zoneId}`);
  return response.data.results || response.data;
};

export const checkStockAvailability = async (productId: number, zoneId: number, quantity: number): Promise<{available: boolean; current_stock: number}> => {
  const response = await api.get(`/inventory/stock/check_availability/?product=${productId}&zone=${zoneId}&quantity=${quantity}`);
  return response.data;
};

export const paySupplierFromAccount = async (
  supplyId: number,
  paymentData: { amount: number; description?: string; company_account: number }
): Promise<SupplierPaymentResponse> => {
  const response = await api.post(`/inventory/stock-supplies/${supplyId}/pay_from_account/`, paymentData);
  return response.data;
};

// Legacy aliases (to ease migration)
export const getStocks = fetchStock;
export const getLowStock = fetchLowStock;
export const getStockCards = fetchStockCards;
export const getStockCardsByProduct = fetchStockCardsByProduct;
export const getStockSupplies = fetchStockSupplies;
export const getStockSupply = fetchStockSupply;
export const getStockTransfers = fetchStockTransfers;
export const getStockTransfer = fetchStockTransfer;
export const getInventories = fetchInventories;
export const getInventory = fetchInventory;
export const getOutstandingSupplies = fetchOutstandingSupplies;

