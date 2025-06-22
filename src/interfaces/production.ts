// Production related interfaces
export interface Production {
  id?: number;
  reference: string;
  product: number;
  quantity: number;
  zone: number;
  date: string;
  notes?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductionMaterial {
  id?: number;
  production: number;
  product: number;
  quantity: number;
  unit_price?: number;
  product_name?: string;
}

export interface ProductionCost {
  id?: number;
  production: number;
  cost_type: string;
  amount: number;
  description?: string;
}