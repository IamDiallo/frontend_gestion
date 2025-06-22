// Product management related interfaces
export interface Product {
  id?: number;
  name: string;
  reference: string;
  description: string;
  category: number;
  unit: number;
  min_stock_level: number;
  purchase_price: number;
  selling_price: number;
  is_raw_material: boolean;
  is_active: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  symbol: string;
  description?: string;
  is_active?: boolean;
}

export interface PriceGroup {
  id: number;
  name: string;
  discount_percentage?: number;
  is_base?: boolean;
  description?: string;
  is_active?: boolean;
}