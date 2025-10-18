/**
 * Treasury Domain API
 * Handles: Accounts, Expenses, ClientPayments, SupplierPayments, Transfers, CashReceipts
 * Base path: /api/treasury/
 */

import { api } from './config';
import type {
  Account,
  Expense,
  ClientPayment,
  SupplierPayment,
  SupplierCashPayment,
  AccountTransfer,
  CashReceipt,
  AccountStatement,
  AccountPaymentResponse
} from '../../interfaces/treasury';

// ============================================================================
// ACCOUNTS
// ============================================================================

export const fetchAccounts = async (): Promise<Account[]> => {
  const response = await api.get('/treasury/accounts/');
  return response.data.results || response.data;
};

export const getAccountsByType = async (accountType: string): Promise<Account[]> => {
  const response = await api.get(`/treasury/accounts/?account_type=${accountType}`);
  return response.data.results || response.data;
};

export const createAccount = async (data: Partial<Account>): Promise<Account> => {
  const response = await api.post('/treasury/accounts/', data);
  return response.data;
};

export const updateAccount = async (id: number, data: Partial<Account>): Promise<Account> => {
  const response = await api.patch(`/treasury/accounts/${id}/`, data);
  return response.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/treasury/accounts/${id}/`);
};

// ============================================================================
// EXPENSES
// ============================================================================

export const fetchExpenses = async (): Promise<Expense[]> => {
  const response = await api.get('/treasury/expenses/');
  return response.data.results || response.data;
};

export const createExpense = async (data: Partial<Expense>): Promise<Expense> => {
  const response = await api.post('/treasury/expenses/', data);
  return response.data;
};

export const updateExpense = async (id: number, data: Partial<Expense>): Promise<Expense> => {
  const response = await api.patch(`/treasury/expenses/${id}/`, data);
  return response.data;
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(`/treasury/expenses/${id}/`);
};

// ============================================================================
// CLIENT PAYMENTS
// ============================================================================

export const fetchClientPayments = async (): Promise<ClientPayment[]> => {
  const response = await api.get('/treasury/client-payments/');
  return response.data.results || response.data;
};

export const createClientPayment = async (data: Partial<ClientPayment>): Promise<ClientPayment> => {
  const response = await api.post('/treasury/client-payments/', data);
  return response.data;
};

export const updateClientPayment = async (id: number, data: Partial<ClientPayment>): Promise<ClientPayment> => {
  const response = await api.patch(`/treasury/client-payments/${id}/`, data);
  return response.data;
};

export const deleteClientPayment = async (id: number): Promise<void> => {
  await api.delete(`/treasury/client-payments/${id}/`);
};

// ============================================================================
// SUPPLIER PAYMENTS
// ============================================================================

export const fetchSupplierPayments = async (): Promise<SupplierPayment[]> => {
  const response = await api.get('/treasury/supplier-payments/');
  return response.data.results || response.data;
};

export const createSupplierPayment = async (data: Partial<SupplierPayment>): Promise<SupplierPayment> => {
  const response = await api.post('/treasury/supplier-payments/', data);
  return response.data;
};

export const updateSupplierPayment = async (id: number, data: Partial<SupplierPayment>): Promise<SupplierPayment> => {
  const response = await api.patch(`/treasury/supplier-payments/${id}/`, data);
  return response.data;
};

export const deleteSupplierPayment = async (id: number): Promise<void> => {
  await api.delete(`/treasury/supplier-payments/${id}/`);
};

// ============================================================================
// SUPPLIER CASH PAYMENTS
// ============================================================================

export const fetchSupplierCashPayments = async (): Promise<SupplierCashPayment[]> => {
  const response = await api.get('/treasury/supplier-cash-payments/');
  return response.data.results || response.data;
};

export const createSupplierCashPayment = async (data: Partial<SupplierCashPayment>): Promise<SupplierCashPayment> => {
  const response = await api.post('/treasury/supplier-cash-payments/', data);
  return response.data;
};

// ============================================================================
// ACCOUNT TRANSFERS
// ============================================================================

export const fetchAccountTransfers = async (): Promise<AccountTransfer[]> => {
  const response = await api.get('/treasury/account-transfers/');
  return response.data.results || response.data;
};

export const createAccountTransfer = async (data: Partial<AccountTransfer>): Promise<AccountTransfer> => {
  const response = await api.post('/treasury/account-transfers/', data);
  return response.data;
};

export const updateAccountTransfer = async (id: number, data: Partial<AccountTransfer>): Promise<AccountTransfer> => {
  const response = await api.patch(`/treasury/account-transfers/${id}/`, data);
  return response.data;
};

export const deleteAccountTransfer = async (id: number): Promise<void> => {
  await api.delete(`/treasury/account-transfers/${id}/`);
};

// ============================================================================
// CASH RECEIPTS
// ============================================================================

export const fetchCashReceipts = async (): Promise<CashReceipt[]> => {
  const response = await api.get('/treasury/cash-receipts/');
  return response.data.results || response.data;
};

export const createCashReceipt = async (data: Partial<CashReceipt>): Promise<CashReceipt> => {
  const response = await api.post('/treasury/cash-receipts/', data);
  return response.data;
};

export const createCashReceiptFromSale = async (data: { sale_id: number; amount: number; account?: number }): Promise<AccountPaymentResponse> => {
  const response = await api.post('/treasury/cash-receipts/from_sale/', data);
  return response.data;
};

export const updateCashReceipt = async (id: number, data: Partial<CashReceipt>): Promise<CashReceipt> => {
  const response = await api.patch(`/treasury/cash-receipts/${id}/`, data);
  return response.data;
};

export const deleteCashReceipt = async (id: number): Promise<void> => {
  await api.delete(`/treasury/cash-receipts/${id}/`);
};

// ============================================================================
// ACCOUNT STATEMENTS
// ============================================================================

export const fetchAccountStatements = async (accountId?: number): Promise<AccountStatement[]> => {
  const url = accountId 
    ? `/treasury/account-statements/?account=${accountId}`
    : '/treasury/account-statements/';
  const response = await api.get(url);
  return response.data.results || response.data;
};

export const getAccountBalance = async (accountId: number): Promise<{ balance: number; account_id: number }> => {
  const response = await api.get(`/treasury/account-statements/balance/?account_id=${accountId}`);
  return response.data;
};

export const getAccountInfo = async (
  accountId: number,
  entityType: 'client' | 'supplier'
): Promise<{
  balance: number;
  statements: AccountStatement[];
  outstanding_sales?: unknown[];
  outstanding_supplies?: unknown[];
}> => {
  const response = await api.get(
    `/treasury/account-statements/account_info/?account_id=${accountId}&type=${entityType}`
  );
  return response.data;
};

// ============================================================================
// CASH PAYMENTS (Generic)
// ============================================================================

export const fetchCashPayments = async (): Promise<unknown[]> => {
  const response = await api.get('/treasury/cash-payments/');
  return response.data.results || response.data;
};

export const createCashPayment = async (data: Record<string, unknown>): Promise<unknown> => {
  const response = await api.post('/treasury/cash-payments/', data);
  return response.data;
};

export const fetchCashReceiptsBySale = async (saleId: number): Promise<CashReceipt[]> => {
  const response = await api.get(`/treasury/cash-receipts/?sale=${saleId}`);
  return Array.isArray(response.data) ? response.data : (response.data?.results || []);
};

