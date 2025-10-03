// Business entities like clients, suppliers, zones
export interface Client {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  price_group?: number;
  account?: number;
  is_active: boolean;
}

export interface Supplier {
  id?: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  account?: number;
  is_active: boolean;
}

export interface Zone {
  id?: number;
  name: string;
  address: string;
  description?: string;
  is_active: boolean;
}

export interface Account {
  id?: number;
  name: string;
  account_number?: string;
  account_type?: string;
  currency?: number;
  initial_balance: number | string;
  current_balance: number | string;
  description?: string;
  is_active: boolean;
}

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

export interface AccountStatement {
  id: number;
  date: string;
  transaction_type: string;
  transaction_type_display: string;
  reference: string;
  description: string;
  debit: number | string;
  credit: number | string;
  balance: number | string;
  account: number; // Account ID that this statement belongs to
  account_name?: string; // Added to match backend serializer
}

export interface OutstandingSale {
  id: number;
  reference: string;
  date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_status: string;
}

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