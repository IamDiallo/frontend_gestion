/**
 * Settings Domain Interfaces
 * Types for: Categories, Units, Currencies, PaymentMethods, PriceGroups, ChargeTypes
 */

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  description?: string;
  requires_account: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceGroup {
  id: number;
  name: string;
  description?: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChargeType {
  id: number;
  name: string;
  description?: string;
  default_amount?: number;
  is_percentage: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
