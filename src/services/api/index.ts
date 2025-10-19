/**
 * Domain-Driven API Services
 * Centralized export of all domain-specific API functions
 * 
 * Domain Structure:
 * - Auth: Login, Logout, Token Management, Authentication
 * - Core: Users, Zones, Groups, Permissions
 * - Settings: Categories, Units, Currencies, PaymentMethods, PriceGroups
 * - Partners: Clients, Suppliers, Employees
 * - Inventory: Products, Stock, Supplies, Transfers, Inventories
 * - Sales: Sales, Invoices, Quotes, DeliveryNotes
 * - Production: Productions, Materials
 * - Treasury: Accounts, Expenses, Payments, Transfers, Receipts
 * - Dashboard: Stats, Reports, Analytics
 */

// Re-export all domain APIs
export * as AuthAPI from './auth.api';
export * as CoreAPI from './core.api';
export * as SettingsAPI from './settings.api';
export * as PartnersAPI from './partners.api';
export * as InventoryAPI from './inventory.api';
export * as SalesAPI from './sales.api';
export * as ProductionAPI from './production.api';
export * as TreasuryAPI from './treasury.api';
export * as DashboardAPI from './dashboard.api';

// Export config and utilities
export { api, debugAPI } from './config';
export { api as default } from './config';
export * as UtilsAPI from './utils.api';

// Export legacy compatibility wrappers for existing components
export {
  ClientsAPI,
  SuppliersAPI,
  ProductsAPI,
  InvoicesAPI,
  QuotesAPI,
  UserAPI,
  UsersAPI,
  ZonesAPI,
  AccountsAPI,
  PriceGroupsAPI,
  InventoryAPILegacy,
  ProductionAPILegacy,
  SettingsAPILegacy
} from './legacy.compat';

// ============================================================================
// TYPE RE-EXPORTS FOR CONVENIENCE
// ============================================================================

// Core types
export type { User, UserProfile, UserCreateRequest, Group, Permission, Zone } from '../../interfaces/core';

// Partners types
export type { Client, Supplier, Employee, ClientGroup } from '../../interfaces/partners';

// Settings types
export type {
  ProductCategory,
  ExpenseCategory,
  UnitOfMeasure,
  Currency,
  PaymentMethod,
  PriceGroup,
  ChargeType
} from '../../interfaces/settings';

// Products types
export type { Product } from '../../interfaces/products';

// Inventory types
export type {
  Stock,
  StockSupply,
  StockTransfer,
  Inventory,
  StockMovement,
  CreateStockSupply,
  CreateStockTransfer,
  CreateInventory,
  UpdateInventory
} from '../../interfaces/inventory';

// Sales types
export type {
  Sale,
  Invoice,
  Quote,
  OutstandingSale,
  SaleDeletionResponse,
  SaleCanDeleteResponse
} from '../../interfaces/sales';

// Production types
export type { Production } from '../../interfaces/production';

// Treasury types
export type {
  Account,
  Expense,
  ClientPayment,
  SupplierPayment,
  SupplierCashPayment,
  AccountTransfer,
  CashReceipt,
  AccountStatement,
  AccountPaymentResponse,
  SupplierPaymentResponse
} from '../../interfaces/treasury';

// Dashboard types
export interface DashboardStats {
  total_sales: number;
  total_revenue: number;
  total_clients: number;
  total_products: number;
  total_suppliers: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  zone: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
}

export interface ProductStockValue {
  product_id: number;
  product_name: string;
  zone_name: string;
  quantity: number;
  unit_price: number;
  stock_value: number;
  unit_symbol: string;
}

export interface InventoryStats {
  total_value: number;
  low_stock_count: number;
  inventory_value: number;
  low_stock_products: LowStockProduct[];
  product_stock_values: ProductStockValue[];
  inflow: number;
  outflow: number;
  category_data: { category: string; value: number; }[];
  zone_data: { zone: string; value: number; }[];
  historical_value?: { name: string; value: number; }[];
}

export interface ClientWithAccount {
  id: number;
  name: string;
  balance: number;
  account: number;
  account_balance: number;
  last_transaction_date?: string;
}

export interface SalesData {
  month: string;
  amount: number;
}

export interface CategoryData {
  name: string;
  value: number;
  category?: string;
  amount?: number;
}

export interface TopProduct {
  id: number;
  name: string;
  quantity: number;
  revenue: number;
}

export interface ReportData {
  monthly_data: SalesData[];
  category_data: CategoryData[];
  top_products: TopProduct[];
}

// Re-export for backward compatibility (will be deprecated)
import * as CoreAPI from './core.api';
import * as SettingsAPI from './settings.api';
import * as PartnersAPI from './partners.api';
import * as InventoryAPI from './inventory.api';
import * as SalesAPI from './sales.api';
import * as ProductionAPI from './production.api';
import * as TreasuryAPI from './treasury.api';
import * as DashboardAPIModule from './dashboard.api';

/**
 * Backward compatibility layer
 * @deprecated Use domain-specific API imports instead
 * Example: import { CoreAPI } from '@/services/api'
 *          CoreAPI.fetchUsers()
 */
export const api_compat = {
  // Core
  fetchUsers: CoreAPI.fetchUsers,
  fetchCurrentUser: CoreAPI.fetchCurrentUser,
  createUser: CoreAPI.createUser,
  updateUser: CoreAPI.updateUser,
  deleteUser: CoreAPI.deleteUser,
  changePassword: CoreAPI.changePassword,
  
  fetchZones: CoreAPI.fetchZones,
  createZone: CoreAPI.createZone,
  updateZone: CoreAPI.updateZone,
  deleteZone: CoreAPI.deleteZone,
  fetchUserProfiles: CoreAPI.fetchUserProfiles,
  updateUserProfile: CoreAPI.updateUserProfile,
  
  fetchGroups: CoreAPI.fetchGroups,
  createGroup: CoreAPI.createGroup,
  updateGroup: CoreAPI.updateGroup,
  deleteGroup: CoreAPI.deleteGroup,
  
  fetchPermissions: CoreAPI.fetchPermissions,
  fetchCategorizedPermissions: CoreAPI.fetchCategorizedPermissions,
  
  // Settings
  fetchProductCategories: SettingsAPI.fetchProductCategories,
  createProductCategory: SettingsAPI.createProductCategory,
  updateProductCategory: SettingsAPI.updateProductCategory,
  deleteProductCategory: SettingsAPI.deleteProductCategory,
  
  fetchUnitsOfMeasure: SettingsAPI.fetchUnitsOfMeasure,
  createUnitOfMeasure: SettingsAPI.createUnitOfMeasure,
  updateUnitOfMeasure: SettingsAPI.updateUnitOfMeasure,
  deleteUnitOfMeasure: SettingsAPI.deleteUnitOfMeasure,
  
  fetchCurrencies: SettingsAPI.fetchCurrencies,
  createCurrency: SettingsAPI.createCurrency,
  updateCurrency: SettingsAPI.updateCurrency,
  deleteCurrency: SettingsAPI.deleteCurrency,
  
  fetchPaymentMethods: SettingsAPI.fetchPaymentMethods,
  createPaymentMethod: SettingsAPI.createPaymentMethod,
  updatePaymentMethod: SettingsAPI.updatePaymentMethod,
  deletePaymentMethod: SettingsAPI.deletePaymentMethod,
  
  fetchPriceGroups: SettingsAPI.fetchPriceGroups,
  fetchChargeTypes: SettingsAPI.fetchChargeTypes,
  fetchExpenseCategories: SettingsAPI.fetchExpenseCategories,
  
  // Partners
  fetchClients: PartnersAPI.fetchClients,
  createClient: PartnersAPI.createClient,
  updateClient: PartnersAPI.updateClient,
  deleteClient: PartnersAPI.deleteClient,
  fetchOutstandingClients: PartnersAPI.fetchOutstandingClients,
  
  fetchSuppliers: PartnersAPI.fetchSuppliers,
  createSupplier: PartnersAPI.createSupplier,
  updateSupplier: PartnersAPI.updateSupplier,
  deleteSupplier: PartnersAPI.deleteSupplier,
  fetchOutstandingSuppliers: PartnersAPI.fetchOutstandingSuppliers,
  
  fetchEmployees: PartnersAPI.fetchEmployees,
  createEmployee: PartnersAPI.createEmployee,
  updateEmployee: PartnersAPI.updateEmployee,
  deleteEmployee: PartnersAPI.deleteEmployee,
  fetchClientGroups: PartnersAPI.fetchClientGroups,
  
  // Inventory
  fetchProducts: InventoryAPI.fetchProducts,
  createProduct: InventoryAPI.createProduct,
  updateProduct: InventoryAPI.updateProduct,
  deleteProduct: InventoryAPI.deleteProduct,
  fetchProductQRCode: InventoryAPI.fetchProductQRCode,
  
  fetchStock: InventoryAPI.fetchStock,
  fetchLowStock: InventoryAPI.fetchLowStock,
  fetchStockCards: InventoryAPI.fetchStockCards,
  fetchStockCardsByProduct: InventoryAPI.fetchStockCardsByProduct,
  getStockByZone: InventoryAPI.getStockByZone,
  checkStockAvailability: InventoryAPI.checkStockAvailability,
  
  fetchStockSupplies: InventoryAPI.fetchStockSupplies,
  fetchStockSupply: InventoryAPI.fetchStockSupply,
  createStockSupply: InventoryAPI.createStockSupply,
  updateStockSupply: InventoryAPI.updateStockSupply,
  deleteStockSupply: InventoryAPI.deleteStockSupply,
  confirmStockSupply: InventoryAPI.confirmStockSupply,
  fetchOutstandingSupplies: InventoryAPI.fetchOutstandingSupplies,
  paySupplierFromAccount: InventoryAPI.paySupplierFromAccount,
  
  fetchStockTransfers: InventoryAPI.fetchStockTransfers,
  fetchStockTransfer: InventoryAPI.fetchStockTransfer,
  createStockTransfer: InventoryAPI.createStockTransfer,
  updateStockTransfer: InventoryAPI.updateStockTransfer,
  deleteStockTransfer: InventoryAPI.deleteStockTransfer,
  approveStockTransfer: InventoryAPI.approveStockTransfer,
  
  fetchInventories: InventoryAPI.fetchInventories,
  fetchInventory: InventoryAPI.fetchInventory,
  createInventory: InventoryAPI.createInventory,
  updateInventory: InventoryAPI.updateInventory,
  deleteInventory: InventoryAPI.deleteInventory,
  approveInventory: InventoryAPI.approveInventory,
  
  getStocks: InventoryAPI.getStocks,
  getStockSupplies: InventoryAPI.getStockSupplies,
  getStockTransfers: InventoryAPI.getStockTransfers,
  getInventories: InventoryAPI.getInventories,
  getStockCards: InventoryAPI.getStockCards,
  getStockCardsByProduct: InventoryAPI.getStockCardsByProduct,
  getStockSupply: InventoryAPI.getStockSupply,
  getStockTransfer: InventoryAPI.getStockTransfer,
  getInventory: InventoryAPI.getInventory,
  getOutstandingSupplies: InventoryAPI.getOutstandingSupplies,
  
  // Sales
  fetchSales: SalesAPI.fetchSales,
  createSale: SalesAPI.createSale,
  updateSale: SalesAPI.updateSale,
  deleteSale: SalesAPI.deleteSale,
  canDeleteSale: SalesAPI.canDeleteSale,
  fetchOutstandingSales: SalesAPI.fetchOutstandingSales,
  recalculateSalePaymentAmounts: SalesAPI.recalculateSalePaymentAmounts,
  fetchSale: SalesAPI.fetchSale,
  fetchOutstandingSalesByClient: SalesAPI.fetchOutstandingSalesByClient,
  fetchOutstandingSalesBySupplier: SalesAPI.fetchOutstandingSalesBySupplier,
  payFromAccount: SalesAPI.payFromAccount,
  
  fetchInvoices: SalesAPI.fetchInvoices,
  createInvoice: SalesAPI.createInvoice,
  updateInvoice: SalesAPI.updateInvoice,
  deleteInvoice: SalesAPI.deleteInvoice,
  generateInvoicePDF: SalesAPI.generateInvoicePDF,
  fetchInvoice: SalesAPI.fetchInvoice,
  
  fetchQuotes: SalesAPI.fetchQuotes,
  createQuote: SalesAPI.createQuote,
  updateQuote: SalesAPI.updateQuote,
  deleteQuote: SalesAPI.deleteQuote,
  convertQuoteToSale: SalesAPI.convertQuoteToSale,
  generateQuotePDF: SalesAPI.generateQuotePDF,
  fetchQuote: SalesAPI.fetchQuote,
  fetchDeliveryNotes: SalesAPI.fetchDeliveryNotes,
  createDeliveryNote: SalesAPI.createDeliveryNote,
  updateDeliveryNote: SalesAPI.updateDeliveryNote,
  fetchSaleCharges: SalesAPI.fetchSaleCharges,
  createSaleCharge: SalesAPI.createSaleCharge,
  deleteSaleCharge: SalesAPI.deleteSaleCharge,
  
  // Production
  fetchProductions: ProductionAPI.fetchProductions,
  createProduction: ProductionAPI.createProduction,
  updateProduction: ProductionAPI.updateProduction,
  deleteProduction: ProductionAPI.deleteProduction,
  approveProduction: ProductionAPI.approveProduction,
  
  // Treasury
  fetchAccounts: TreasuryAPI.fetchAccounts,
  getAccountsByType: TreasuryAPI.getAccountsByType,
  createAccount: TreasuryAPI.createAccount,
  updateAccount: TreasuryAPI.updateAccount,
  deleteAccount: TreasuryAPI.deleteAccount,
  
  fetchExpenses: TreasuryAPI.fetchExpenses,
  createExpense: TreasuryAPI.createExpense,
  updateExpense: TreasuryAPI.updateExpense,
  deleteExpense: TreasuryAPI.deleteExpense,
  
  fetchClientPayments: TreasuryAPI.fetchClientPayments,
  createClientPayment: TreasuryAPI.createClientPayment,
  updateClientPayment: TreasuryAPI.updateClientPayment,
  deleteClientPayment: TreasuryAPI.deleteClientPayment,
  
  fetchSupplierPayments: TreasuryAPI.fetchSupplierPayments,
  createSupplierPayment: TreasuryAPI.createSupplierPayment,
  updateSupplierPayment: TreasuryAPI.updateSupplierPayment,
  deleteSupplierPayment: TreasuryAPI.deleteSupplierPayment,
  fetchSupplierCashPayments: TreasuryAPI.fetchSupplierCashPayments,
  createSupplierCashPayment: TreasuryAPI.createSupplierCashPayment,
  
  fetchAccountTransfers: TreasuryAPI.fetchAccountTransfers,
  createAccountTransfer: TreasuryAPI.createAccountTransfer,
  updateAccountTransfer: TreasuryAPI.updateAccountTransfer,
  deleteAccountTransfer: TreasuryAPI.deleteAccountTransfer,
  
  fetchCashReceipts: TreasuryAPI.fetchCashReceipts,
  createCashReceipt: TreasuryAPI.createCashReceipt,
  createCashReceiptFromSale: TreasuryAPI.createCashReceiptFromSale,
  updateCashReceipt: TreasuryAPI.updateCashReceipt,
  deleteCashReceipt: TreasuryAPI.deleteCashReceipt,
  fetchCashReceiptsBySale: TreasuryAPI.fetchCashReceiptsBySale,
  fetchCashPayments: TreasuryAPI.fetchCashPayments,
  createCashPayment: TreasuryAPI.createCashPayment,
  
  fetchAccountStatements: TreasuryAPI.fetchAccountStatements,
  getAccountBalance: TreasuryAPI.getAccountBalance,
  getAccountInfo: TreasuryAPI.getAccountInfo,
};

// Dashboard convenience (legacy naming)
export const DashboardAPICompat = {
  getStats: DashboardAPIModule.getStats,
  getInventoryStats: DashboardAPIModule.getInventoryStats,
  getLowStockProducts: DashboardAPIModule.getLowStockProducts,
  getSalesReport: DashboardAPIModule.getSalesReport,
  getClientAccountStatements: DashboardAPIModule.getClientAccountStatements,
  getSupplierAccountStatements: DashboardAPIModule.getSupplierAccountStatements,
};
