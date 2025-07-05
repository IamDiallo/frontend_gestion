// Inventory management interfaces
export interface Stock {
  id: number;
  product: number;
  product_name: string;
  zone: number;
  zone_name: string;
  quantity: number;
  unit_symbol: string | null;
  updated_at: string;
}

export interface LowStockItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  zone: string;
  unit: string;
}

export interface InventoryDashboardData {
  inventory_value: number;
  low_stock_products: LowStockItem[];
  inflow: number;
  outflow: number;
  category_data: CategoryData[];
  zone_data: ZoneData[];
}

interface CategoryData {
  category: string;
  value: number;
}

interface ZoneData {
  zone: string;
  value: number;
}

export interface StockSupplyItem {
  id?: number; // Optional if not always present
  product: number;
  quantity: number;
  unit_price: number; // Add unit price
  total_price: number; // Add total price
  // Add other fields if they exist in your backend response (e.g., product_name)
  product_name?: string;
}

export interface StockSupply {
  id: number;
  reference: string;
  supplier: number;
  zone: number;
  date: string;
  status: 'pending' | 'received' | 'partial' | 'cancelled';
  items: StockSupplyItem[]; // Use the updated item interface
  created_at?: string;
  updated_at?: string;
  // Add other fields like supplier_name, zone_name if needed
  supplier_name?: string;
  zone_name?: string;
}

export interface StockTransferItem {
  id?: number;
  // transfer: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_symbol?: string;
}

export interface StockTransfer {
  id?: number;
  reference: string;
  from_zone: number;
  from_zone_name?: string;
  to_zone: number;
  to_zone_name?: string;
  date: string;
  status: 'pending' | 'completed' | 'partial' | 'cancelled';
  notes?: string;
  items?: StockTransferItem[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id?: number;
  inventory: number;
  product: number;
  product_name?: string;
  expected_quantity: number; // Changed from system_quantity to match backend
  actual_quantity: number;   // Changed from counted_quantity to match backend
  difference: number;
  notes?: string;            // Added notes field to match backend
  unit_symbol?: string;
}

export interface Inventory {
  id?: number;
  reference?: string;        // Made reference optional to match backend
  zone: number;
  zone_name?: string;
  date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  items?: InventoryItem[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Creation types that omit auto-generated fields
export type CreateStockSupply = Omit<StockSupply, 'id' | 'reference'>;

// Custom CreateStockTransfer type that properly handles items
export interface CreateStockTransfer {
  from_zone: number;
  to_zone: number;
  date: string;
  status: 'pending' | 'completed' | 'partial' | 'cancelled';
  notes?: string;
  items?: CreateStockTransferItem[];
  created_by?: number;
}

// Custom CreateInventory type that properly handles items
export interface CreateInventory {
  zone: number;
  date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  items?: CreateInventoryItem[];
  created_by?: number;
}

// Custom UpdateInventory type that properly handles items for updates
export interface UpdateInventory {
  id?: number;
  reference?: string;
  zone: number;
  date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  items?: CreateInventoryItem[]; // Use CreateInventoryItem for updates too (without inventory field)
  created_by?: number;
}

// Creation item types for completeness
export type CreateStockSupplyItem = Omit<StockSupplyItem, 'id'>;
export type CreateStockTransferItem = Omit<StockTransferItem, 'id' | 'transfer'>;
export type CreateInventoryItem = Omit<InventoryItem, 'id' | 'inventory'>;

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  zone: number;
  zone_name: string;
  date: string;
  transaction_type: 'supply' | 'sale' | 'transfer_in' | 'transfer_out' | 'inventory' | 'production' | 'return';
  reference: string;
  quantity_in: number;
  quantity_out: number;
  unit_price: number | null;
  balance: number;
  unit_symbol: string | null;
  notes: string;
}