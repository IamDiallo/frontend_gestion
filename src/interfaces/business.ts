/**
 * Legacy Business Interfaces
 * @deprecated Use domain-specific interfaces instead
 * This file now re-exports from domain files for backward compatibility
 * 
 * Migration guide:
 * - Client → import from '../interfaces/partners'
 * - Supplier → import from '../interfaces/partners'
 * - Zone → import from '../interfaces/core'
 * - Account → import from '../interfaces/treasury'
 */

// Re-export from domain-specific interfaces
export type { Client, Supplier, Employee } from './partners';
export type { Zone } from './core';
export type { Account, AccountStatement } from './treasury';
export type { OutstandingSale } from './sales';

// Import types for use in local interfaces
import type { AccountStatement } from './treasury';
import type { OutstandingSale } from './sales';

// Re-export OutstandingSupply from inventory
export interface OutstandingSupply {
  id: number;
  reference: string;
  date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';
  supplier?: number;
  supplier_name?: string;
  status?: string;
}

// Keep only legacy UI types that don't belong to a domain
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface ClientAccountBalance {
  client: {
    id: number;
    name: string;
    account_id: number;
    account_name: string;
    current_balance: number;
  };
  statements: AccountStatement[];
  outstanding_sales: OutstandingSale[];
}

export interface SupplierPaymentResponse {
  success: boolean;
  message: string;
  payment: {
    id: number;
    reference: string;
    amount: string;
    date: string;
  };
  supply: {
    id: number;
    reference: string;
    payment_status: string;
    workflow_state: string;
    total_amount: string;
    paid_amount: string;
    remaining_amount: string;
  };
  supplier_balance: number;
  company_balance: number;
}

export interface ClientDeposit {
  client: number | null;
  account: number | null;
  amount: number;
  payment_method: {id: number, name: string} | null;
  date: string;
  description: string;
}

// Treasury-specific interfaces
export interface ActualClientBalanceResponse {
  client_id: number;
  client_name: string;
  total_sales: number;
  total_account_credits: number;
  sale_payments_from_account: number;
  balance: number;
  sales_count: number;
  payments_count: number;
  outstanding_sales?: OutstandingSale[];
  statements?: AccountStatement[];
}

export interface ActualSupplierBalanceResponse {
  supplier_id: number;
  supplier_name: string;    
  total_purchases: number;
  total_account_credits: number;
  purchase_payments_from_account: number;
  balance: number;
  purchases_count: number;
  payments_count: number;
  outstanding_purchases?: OutstandingSale[];
  outstanding_supplies?: OutstandingSupply[];
  statements?: AccountStatement[];
}

export interface AccountTransfer {
  id?: number;
  from_account: number;
  to_account: number;
  amount: number;
  transfer_date: string;
  reference_number: string;
  notes?: string;
}