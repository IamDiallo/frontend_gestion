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

// Re-export from settings domain for backward compatibility
export type { ProductCategory, UnitOfMeasure, PriceGroup } from './settings';