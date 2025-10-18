/**
 * Legacy Compatibility Layer
 * Provides backward-compatible API wrappers for components not yet migrated to domain-driven structure
 * 
 * @deprecated This file will be removed once all components are migrated
 * Migration Guide: Use domain-specific imports instead
 * - ClientsAPI → PartnersAPI.fetchClients
 * - ProductsAPI → InventoryAPI.fetchProducts
 * - SalesAPI → SalesAPI.fetchSales
 */

import * as CoreAPI from './core.api';
import * as SettingsAPI from './settings.api';
import * as PartnersAPI from './partners.api';
import * as InventoryAPI from './inventory.api';
import * as SalesAPI from './sales.api';
import * as ProductionAPI from './production.api';
import * as TreasuryAPI from './treasury.api';

// ============================================================================
// LEGACY WRAPPERS - PARTNERS
// ============================================================================

export const ClientsAPI = {
  getAll: PartnersAPI.fetchClients,
  get: async (id: number) => {
    const clients = await PartnersAPI.fetchClients();
    return clients.find(c => c.id === id);
  },
  create: PartnersAPI.createClient,
  update: PartnersAPI.updateClient,
  delete: PartnersAPI.deleteClient,
  getOutstanding: PartnersAPI.fetchOutstandingClients,
};

export const SuppliersAPI = {
  getAll: PartnersAPI.fetchSuppliers,
  get: async (id: number) => {
    const suppliers = await PartnersAPI.fetchSuppliers();
    return suppliers.find(s => s.id === id);
  },
  create: PartnersAPI.createSupplier,
  update: PartnersAPI.updateSupplier,
  delete: PartnersAPI.deleteSupplier,
  getOutstanding: PartnersAPI.fetchOutstandingSuppliers,
};

// ============================================================================
// LEGACY WRAPPERS - INVENTORY
// ============================================================================

export const ProductsAPI = {
  getAll: InventoryAPI.fetchProducts,
  get: InventoryAPI.fetchProduct,
  create: InventoryAPI.createProduct,
  update: InventoryAPI.updateProduct,
  delete: InventoryAPI.deleteProduct,
  getQRCode: InventoryAPI.fetchProductQRCode,
};

export const InventoryAPILegacy = {
  getStock: InventoryAPI.fetchStock,
  getLowStock: InventoryAPI.fetchLowStock,
  getStockCards: InventoryAPI.fetchStockCards,
  getStockCardsByProduct: InventoryAPI.fetchStockCardsByProduct,
  getStockSupplies: InventoryAPI.fetchStockSupplies,
  getStockTransfers: InventoryAPI.fetchStockTransfers,
  getInventories: InventoryAPI.fetchInventories,
};

// ============================================================================
// LEGACY WRAPPERS - SALES
// ============================================================================

export const InvoicesAPI = {
  getAll: SalesAPI.fetchInvoices,
  get: SalesAPI.fetchInvoice,
  create: SalesAPI.createInvoice,
  update: SalesAPI.updateInvoice,
  delete: SalesAPI.deleteInvoice,
  generatePDF: SalesAPI.generateInvoicePDF,
};

export const QuotesAPI = {
  getAll: SalesAPI.fetchQuotes,
  get: SalesAPI.fetchQuote,
  create: SalesAPI.createQuote,
  update: SalesAPI.updateQuote,
  delete: SalesAPI.deleteQuote,
  convertToSale: SalesAPI.convertQuoteToSale,
};

// ============================================================================
// LEGACY WRAPPERS - CORE
// ============================================================================

export const UserAPI = {
  getCurrentUser: CoreAPI.fetchCurrentUser,
  changePassword: CoreAPI.changePassword,
};

export const UsersAPI = {
  getAll: CoreAPI.fetchUsers,
  get: CoreAPI.fetchUser,
  create: CoreAPI.createUser,
  update: CoreAPI.updateUser,
  delete: CoreAPI.deleteUser,
};

export const ZonesAPI = {
  getAll: CoreAPI.fetchZones,
  create: CoreAPI.createZone,
  update: CoreAPI.updateZone,
  delete: CoreAPI.deleteZone,
};

// ============================================================================
// LEGACY WRAPPERS - TREASURY
// ============================================================================

export const AccountsAPI = {
  getAll: TreasuryAPI.fetchAccounts,
  getByType: TreasuryAPI.getAccountsByType,
  create: TreasuryAPI.createAccount,
  update: TreasuryAPI.updateAccount,
  delete: TreasuryAPI.deleteAccount,
  getBalance: TreasuryAPI.getAccountBalance,
  getInfo: TreasuryAPI.getAccountInfo,
  getStatements: TreasuryAPI.fetchAccountStatements,
};

// ============================================================================
// LEGACY WRAPPERS - SETTINGS
// ============================================================================

export const PriceGroupsAPI = {
  getAll: SettingsAPI.fetchPriceGroups,
  get: async (id: number) => {
    const groups = await SettingsAPI.fetchPriceGroups();
    return groups.find(g => g.id === id);
  },
  create: SettingsAPI.createPriceGroup,
  update: SettingsAPI.updatePriceGroup,
  delete: async (id: number) => {
    await SettingsAPI.deletePriceGroup(id);
    return true;
  },
};

export const SettingsAPILegacy = {
  getCategories: SettingsAPI.fetchProductCategories,
  createCategory: SettingsAPI.createProductCategory,
  updateCategory: SettingsAPI.updateProductCategory,
  deleteCategory: SettingsAPI.deleteProductCategory,
  
  getUnits: SettingsAPI.fetchUnitsOfMeasure,
  createUnit: SettingsAPI.createUnitOfMeasure,
  updateUnit: SettingsAPI.updateUnitOfMeasure,
  deleteUnit: SettingsAPI.deleteUnitOfMeasure,
  
  getCurrencies: SettingsAPI.fetchCurrencies,
  getPaymentMethods: SettingsAPI.fetchPaymentMethods,
  getPriceGroups: SettingsAPI.fetchPriceGroups,
  getChargeTypes: SettingsAPI.fetchChargeTypes,
  getExpenseCategories: SettingsAPI.fetchExpenseCategories,
};

// ============================================================================
// LEGACY WRAPPERS - PRODUCTION
// ============================================================================

export const ProductionAPILegacy = {
  getProductions: ProductionAPI.fetchProductions,
  createProduction: ProductionAPI.createProduction,
  updateProduction: ProductionAPI.updateProduction,
  deleteProduction: ProductionAPI.deleteProduction,
  approveProduction: ProductionAPI.approveProduction,
};
