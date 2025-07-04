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
  initial_balance: number;
  current_balance: number;
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
  debit: number;
  credit: number;
  balance: number;
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

export interface ClientDeposit {
  client: number | null;
  account: number | null;
  amount: number;
  payment_method: {id: number, name: string} | null;
  date: string;
  description: string;
}