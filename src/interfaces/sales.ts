// Sales related interfaces
export interface SaleItem {
  id?: number;
  sale?: number;
  product: number;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  product_name?: string;
}

export interface Sale {
  id?: number;
  reference?: string;
  client: number;
  zone: number;
  date: string;  status: string;
  payment_status?: 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';
  workflow_state?: 'draft' | 'pending' | 'confirmed' | 'payment_pending' | 'partially_paid' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  remaining_amount?: number;
  notes?: string;
  created_by?: number;
  items?: SaleItem[]; // Making items optional to support update operations
}

export interface ExtendedSale extends Omit<Sale, 'client'> {
  client: number;
  client_name?: string;
  zone_name?: string;
  paid_amount?: number;
  remaining_amount?: number;
  balance?: number;
}

// OutstandingSale interface for sales with payment information
export interface OutstandingSale {
  id: number;
  reference: string;
  date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_status: string;
}

// Define Invoice types
export interface Invoice {
  id?: number;
  reference: string;
  sale: number;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  paid_amount: number;
  balance: number;
  notes?: string;
  client_name?: string;
  sale_reference?: string;
}

export interface ExtendedInvoice {
  id?: number;
  reference: string;
  sale: number;
  sale_reference?: string;
  client_name?: string;
  date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  paid_amount: number;
  balance: number;
  notes?: string;
}

// Define Quote types
export interface QuoteItem {
  id?: number;
  quote?: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
}

export interface Quote {
  id?: number;
  reference: string;
  client: number;
  client_name?: string;
  date: string;
  expiry_date: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  is_converted?: boolean;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items?: QuoteItem[];
}

// API compatibility types
export type ApiSaleItem = SaleItem;
export type ApiInvoice = Invoice;
export type ApiQuote = Quote;

// Client interface
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
}

// Zone interface
export interface Zone {
  id?: number;
  name: string;
  address: string;
  description?: string;
}

// Sale deletion interfaces
export interface SaleDeletionSummary {
  sale_reference: string;
  client_name: string;
  total_amount: number;
  paid_amount: number;
  stock_restored: Array<{
    product: string;
    quantity: number;
    zone: string;
  }>;
  payment_refunded: number;
  deleted_at: string;
}

export interface SaleDeletionResponse {
  success: boolean;
  message: string;
  deletion_summary: SaleDeletionSummary;
}

export interface SaleCanDeleteResponse {
  can_delete: boolean;
  sale_reference: string;
  current_status: string;
  current_status_display: string;
  reason: string;
  will_restore_stock?: boolean;
  will_refund_amount?: number;
  has_payments?: boolean;
}
