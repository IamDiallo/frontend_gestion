/**
 * Treasury Domain Interfaces
 * Types for: Accounts, Expenses, Payments, Transfers, Receipts
 */

export interface Account {
  id: number;
  name: string;
  account_type: 'bank' | 'cash' | 'mobile_money' | 'client' | 'supplier' | 'internal' | 'other';
  account_number?: string;
  initial_balance?: number | string;
  current_balance?: number | string;
  balance: number;
  currency: number;
  currency_name?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Expense {
  id: number;
  category: number;
  category_name?: string;
  amount: number;
  expense_date: string;
  account?: number;
  account_name?: string;
  payment_method: number;
  payment_method_name?: string;
  reference?: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface ClientPayment {
  id: number;
  client: number;
  client_name?: string;
  amount: number;
  payment_date: string;
  payment_method: number;
  payment_method_name?: string;
  account?: number;
  account_name?: string;
  reference?: string;
  notes?: string;
  sale?: number;
  created_at: string;
  created_by?: number;
}

export interface SupplierPayment {
  id: number;
  supplier: number;
  supplier_name?: string;
  amount: number;
  payment_date: string;
  payment_method: number;
  payment_method_name?: string;
  account?: number;
  account_name?: string;
  reference?: string;
  notes?: string;
  supply?: number;
  created_at: string;
  created_by?: number;
}

export interface SupplierCashPayment {
  id: number;
  supplier: number;
  supplier_name?: string;
  amount: number;
  payment_date: string;
  reference?: string;
  notes?: string;
  created_at: string;
  created_by?: number;
}

export interface AccountTransfer {
  id: number;
  from_account: number;
  from_account_name?: string;
  to_account: number;
  to_account_name?: string;
  amount: number;
  transfer_date: string;
  reference?: string;
  notes?: string;
  created_at: string;
  created_by?: number;
}

export interface CashReceipt {
  id: number;
  amount: number;
  receipt_date: string;
  account?: number;
  account_name?: string;
  payment_method: number;
  payment_method_name?: string;
  reference?: string;
  description?: string;
  notes?: string;
  client?: number;
  client_name?: string;
  sale?: number;
  created_at: string;
  created_by?: number;
}

export interface AccountStatement {
  id: number;
  account: number;
  account_name?: string;
  date: string;
  transaction_date: string;
  transaction_type: 'credit' | 'debit' | 'sale' | 'client_payment' | 'supply' | 'supplier_payment' | 'expense' | 'transfer' | 'receipt' | 'cash_receipt' | 'supplier_cash_payment';
  transaction_type_display?: string;
  amount: number;
  debit: number | string;
  credit: number | string;
  balance: number | string;
  reference?: string;
  description?: string;
}

export interface SupplierPaymentResponse {
  id: number;
  supplier: number;
  amount: number;
  payment_date: string;
  reference?: string;
}

export interface AccountPaymentResponse {
  message: string;
  payment_id: number;
}
