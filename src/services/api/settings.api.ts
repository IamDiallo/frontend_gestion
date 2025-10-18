/**
 * Settings Domain API  
 * Handles: Categories, Units, Currencies, PaymentMethods, PriceGroups, ChargeTypes
 * Base path: /api/settings/
 */

import { api } from './config';
import type {
  ProductCategory,
  ExpenseCategory,
  UnitOfMeasure,
  Currency,
  PaymentMethod,
  PriceGroup,
  ChargeType
} from '../../interfaces/settings';

// ============================================================================
// PRODUCT CATEGORIES
// ============================================================================

export const fetchProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await api.get('/settings/product-categories/');
  return response.data.results || response.data;
};

export const createProductCategory = async (data: Partial<ProductCategory>): Promise<ProductCategory> => {
  const response = await api.post('/settings/product-categories/', data);
  return response.data;
};

export const updateProductCategory = async (id: number, data: Partial<ProductCategory>): Promise<ProductCategory> => {
  const response = await api.patch(`/settings/product-categories/${id}/`, data);
  return response.data;
};

export const deleteProductCategory = async (id: number): Promise<void> => {
  await api.delete(`/settings/product-categories/${id}/`);
};

// ============================================================================
// EXPENSE CATEGORIES
// ============================================================================

export const fetchExpenseCategories = async (): Promise<ExpenseCategory[]> => {
  const response = await api.get('/settings/expense-categories/');
  return response.data.results || response.data;
};

export const createExpenseCategory = async (data: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
  const response = await api.post('/settings/expense-categories/', data);
  return response.data;
};

export const updateExpenseCategory = async (id: number, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
  const response = await api.patch(`/settings/expense-categories/${id}/`, data);
  return response.data;
};

export const deleteExpenseCategory = async (id: number): Promise<void> => {
  await api.delete(`/settings/expense-categories/${id}/`);
};

// ============================================================================
// UNITS OF MEASURE
// ============================================================================

export const fetchUnitsOfMeasure = async (): Promise<UnitOfMeasure[]> => {
  const response = await api.get('/settings/units-of-measure/');
  return response.data.results || response.data;
};

export const createUnitOfMeasure = async (data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> => {
  const response = await api.post('/settings/units-of-measure/', data);
  return response.data;
};

export const updateUnitOfMeasure = async (id: number, data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> => {
  const response = await api.patch(`/settings/units-of-measure/${id}/`, data);
  return response.data;
};

export const deleteUnitOfMeasure = async (id: number): Promise<void> => {
  await api.delete(`/settings/units-of-measure/${id}/`);
};

// ============================================================================
// CURRENCIES
// ============================================================================

export const fetchCurrencies = async (): Promise<Currency[]> => {
  const response = await api.get('/settings/currencies/');
  return response.data.results || response.data;
};

export const createCurrency = async (data: Partial<Currency>): Promise<Currency> => {
  const response = await api.post('/settings/currencies/', data);
  return response.data;
};

export const updateCurrency = async (id: number, data: Partial<Currency>): Promise<Currency> => {
  const response = await api.patch(`/settings/currencies/${id}/`, data);
  return response.data;
};

export const deleteCurrency = async (id: number): Promise<void> => {
  await api.delete(`/settings/currencies/${id}/`);
};

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await api.get('/settings/payment-methods/');
  return response.data.results || response.data;
};

export const createPaymentMethod = async (data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  const response = await api.post('/settings/payment-methods/', data);
  return response.data;
};

export const updatePaymentMethod = async (id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  const response = await api.patch(`/settings/payment-methods/${id}/`, data);
  return response.data;
};

export const deletePaymentMethod = async (id: number): Promise<void> => {
  await api.delete(`/settings/payment-methods/${id}/`);
};

// ============================================================================
// PRICE GROUPS
// ============================================================================

export const fetchPriceGroups = async (): Promise<PriceGroup[]> => {
  const response = await api.get('/settings/price-groups/');
  return response.data.results || response.data;
};

export const createPriceGroup = async (data: Partial<PriceGroup>): Promise<PriceGroup> => {
  const response = await api.post('/settings/price-groups/', data);
  return response.data;
};

export const updatePriceGroup = async (id: number, data: Partial<PriceGroup>): Promise<PriceGroup> => {
  const response = await api.patch(`/settings/price-groups/${id}/`, data);
  return response.data;
};

export const deletePriceGroup = async (id: number): Promise<void> => {
  await api.delete(`/settings/price-groups/${id}/`);
};

// ============================================================================
// CHARGE TYPES
// ============================================================================

export const fetchChargeTypes = async (): Promise<ChargeType[]> => {
  const response = await api.get('/settings/charge-types/');
  return response.data.results || response.data;
};

export const createChargeType = async (data: Partial<ChargeType>): Promise<ChargeType> => {
  const response = await api.post('/settings/charge-types/', data);
  return response.data;
};

export const updateChargeType = async (id: number, data: Partial<ChargeType>): Promise<ChargeType> => {
  const response = await api.patch(`/settings/charge-types/${id}/`, data);
  return response.data;
};

export const deleteChargeType = async (id: number): Promise<void> => {
  await api.delete(`/settings/charge-types/${id}/`);
};

// ============================================================================
// GENERIC SETTINGS API (Multi-Domain Support)
// ============================================================================

/**
 * Generic Settings API with smart domain routing
 * Handles settings across multiple domain apps (settings, treasury, partners, core)
 * Used by Settings component for unified settings management
 */

// Helper function to determine the correct API base path for an endpoint
const getBasePath = (endpoint: string): string => {
  // Map endpoints to their correct domain base paths
  const domainMap: Record<string, string> = {
    'accounts': 'treasury',
    'client-groups': 'partners',
    'zones': 'core',
    // All others belong to settings domain
  };
  
  return domainMap[endpoint] || 'settings';
};

/**
 * Fetch settings for any endpoint (generic method)
 * Automatically routes to correct domain based on endpoint name
 */
export const getSettings = async (endpoint: string): Promise<unknown[]> => {
  const basePath = getBasePath(endpoint);
  const fullPath = `/${basePath}/${endpoint}/`;
  const response = await api.get(fullPath);
  
  // Ensure response.data is an array
  const data = Array.isArray(response.data) ? response.data : 
    (response.data && response.data.results ? response.data.results : []);
  
  return data;
};

/**
 * Create a new setting (generic method)
 * Automatically routes to correct domain based on endpoint name
 */
export const createSetting = async (endpoint: string, data: unknown): Promise<unknown> => {
  const basePath = getBasePath(endpoint);
  const fullPath = `/${basePath}/${endpoint}/`;
  const response = await api.post(fullPath, data);
  return response.data;
};

/**
 * Update an existing setting (generic method)
 * Automatically routes to correct domain based on endpoint name
 */
export const updateSetting = async (endpoint: string, id: number, data: unknown): Promise<unknown> => {
  const basePath = getBasePath(endpoint);
  const fullPath = `/${basePath}/${endpoint}/${id}/`;
  const response = await api.put(fullPath, data);
  return response.data;
};

/**
 * Delete a setting (generic method)
 * Automatically routes to correct domain based on endpoint name
 */
export const deleteSetting = async (endpoint: string, id: number): Promise<boolean> => {
  const basePath = getBasePath(endpoint);
  const fullPath = `/${basePath}/${endpoint}/${id}/`;
  await api.delete(fullPath);
  return true;
};
