/**
 * Partners Domain Interfaces
 * Types for: Clients, Suppliers, Employees, ClientGroups
 */

// ============================================================================
// CLIENTS
// ============================================================================

export interface Client {
  id: number;
  name: string;
  zone: number;
  zone_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  tax_id?: string;
  credit_limit?: number;
  price_group?: number;
  account?: number;
  balance?: number;
  is_active: boolean;
  notes?: string;
  client_group?: number;
  client_group_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface ClientGroup {
  id: number;
  name: string;
  description?: string;
  discount_percentage?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  tax_id?: string;
  account?: number;
  balance?: number;
  is_active: boolean;
  notes?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface OutstandingSupply {
  id: number;
  supplier: number;
  supplier_name: string;
  supply_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  reference?: string;
}

// ============================================================================
// EMPLOYEES
// ============================================================================

export interface Employee {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  position?: string;
  salary?: number;
  hire_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}
