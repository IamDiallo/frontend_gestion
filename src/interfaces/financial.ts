// Financial operations interfaces
export interface PaymentMethod {
  id?: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface ClientPayment {
  id?: number;
  reference: string;
  client: number;
  account: number;
  date: string;
  amount: number;
  notes?: string;
  created_by?: number;
  created_at?: string;
}

export interface SupplierPayment {
  id?: number;
  reference: string;
  supplier: number;
  account: number;
  date: string;
  amount: number;
  notes?: string;
  created_by?: number;
  created_at?: string;
}

export interface Expense {
  id?: number;
  category: number;
  amount: number;
  expense_date: string;
  payment_method: number;
  reference_number?: string;
  notes?: string;
  account: number;
}

export interface AccountTransfer {
  id?: number;
  from_account: number;
  to_account: number;
  amount: number;
  transfer_date: string;
  reference_number?: string;
  notes?: string;
}

export interface CashReceipt {
  id?: number;
  reference: string;
  account: number;
  sale?: number;
  client?: number;
  date: string;
  amount: number;
  description?: string;
  payment_method?: number;
  created_by?: number;
  created_at?: string;
  
  // Populated relations (for display purposes)
  account_name?: string;
  client_name?: string;
  sale_reference?: string;
  payment_method_name?: string;
}

export interface CashPayment {
  id?: number;
  recipient: string;
  amount: number;
  payment_date: string;
  account: number;
  reference_number?: string;
  notes?: string;
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

export interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  is_active: boolean;
}