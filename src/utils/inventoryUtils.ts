/**
 * Inventory Utilities
 * Helper functions, validators, and constants for inventory operations
 */

import { Product } from '../interfaces/products';
import { Zone, Supplier } from '../interfaces/business';
import {
  Stock,
  StockSupply,
  StockTransfer,
  Inventory as InventoryType,
  StockMovement
} from '../interfaces/inventory';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type InventoryTabType = 'stock' | 'supplies' | 'transfers' | 'inventories' | 'stockCards';

export const INVENTORY_TAB_TYPES = ['stock', 'supplies', 'transfers', 'inventories', 'stockCards'] as const;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface SupplyFormData {
  supplier: number | null;
  zone: number | null;
  status?: string;
  items: Array<{
    product: number;
    quantity: number;
    unit_price?: number;
  }>;
}

export interface TransferFormData {
  sourceZone: number | null;
  targetZone: number | null;
  status?: string;
  items: Array<{
    product: number;
    quantity: number;
    unit_price?: number;
    total_price?: number;
  }>;
}

export interface InventoryFormData {
  inventoryZone: number | null;
  status?: string;
  items: Array<{
    product: number;
    physical_quantity: number;
    theoretical_quantity?: number;
  }>;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate supply form data
 */
export const validateSupplyForm = (data: SupplyFormData): ValidationResult => {
  if (!data.supplier) {
    return {
      isValid: false,
      message: 'Veuillez sélectionner un fournisseur'
    };
  }
  
  if (data.items.length === 0) {
    return {
      isValid: false,
      message: 'Veuillez ajouter au moins un produit'
    };
  }

  // Validate each item
  for (const item of data.items) {
    if (!item.product || item.quantity <= 0) {
      return {
        isValid: false,
        message: 'Tous les produits doivent avoir une quantité valide'
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Validate transfer form data
 */
export const validateTransferForm = (data: TransferFormData): ValidationResult => {
  if (!data.sourceZone) {
    return {
      isValid: false,
      message: 'Veuillez sélectionner un emplacement source'
    };
  }
  
  if (!data.targetZone) {
    return {
      isValid: false,
      message: 'Veuillez sélectionner un emplacement cible'
    };
  }
  
  if (data.sourceZone === data.targetZone) {
    return {
      isValid: false,
      message: 'Les emplacements source et cible doivent être différents'
    };
  }
  
  if (data.items.length === 0) {
    return {
      isValid: false,
      message: 'Veuillez ajouter au moins un produit'
    };
  }

  // Validate each item
  for (const item of data.items) {
    if (!item.product || item.quantity <= 0) {
      return {
        isValid: false,
        message: 'Tous les produits doivent avoir une quantité valide'
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Validate inventory form data
 */
export const validateInventoryForm = (data: InventoryFormData): ValidationResult => {
  if (!data.inventoryZone) {
    return {
      isValid: false,
      message: 'Veuillez sélectionner un emplacement'
    };
  }
  
  if (data.items.length === 0) {
    return {
      isValid: false,
      message: 'Veuillez ajouter au moins un produit'
    };
  }

  // Validate each item
  for (const item of data.items) {
    if (!item.product || item.physical_quantity < 0) {
      return {
        isValid: false,
        message: 'Tous les produits doivent avoir une quantité physique valide'
      };
    }
  }
  
  return { isValid: true };
};

// ============================================================================
// STATUS HELPERS
// ============================================================================

/**
 * Get color for supply status
 */
export const getSupplyStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'received':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get label for supply status
 */
export const getSupplyStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'received':
      return 'Reçu';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Get color for transfer status
 */
export const getTransferStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'in_transit':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get label for transfer status
 */
export const getTransferStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'En attente';
    case 'in_transit':
      return 'En transit';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Get color for inventory status
 */
export const getInventoryStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'in_progress':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get label for inventory status
 */
export const getInventoryStatusLabel = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'Brouillon';
    case 'in_progress':
      return 'En cours';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Get stock level indicator color
 */
export const getStockLevelColor = (currentQuantity: number, minQuantity: number): 'success' | 'warning' | 'error' => {
  if (currentQuantity === 0) return 'error';
  if (currentQuantity <= minQuantity) return 'warning';
  return 'success';
};

/**
 * Get stock level label
 */
export const getStockLevelLabel = (currentQuantity: number, minQuantity: number): string => {
  if (currentQuantity === 0) return 'Rupture';
  if (currentQuantity <= minQuantity) return 'Stock faible';
  return 'Normal';
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Prepare supply data for API submission
 */
export const prepareSupplyData = (formData: SupplyFormData) => {
  const today = new Date();
  const date = today.toISOString().split('T')[0];
  
  return {
    supplier: formData.supplier!,
    zone: formData.zone!,
    date,
    status: (formData.status || 'pending') as 'pending' | 'received' | 'partial' | 'cancelled',
    items: formData.items.map(item => ({
      product: item.product,
      quantity: Number(item.quantity),
      unit_price: item.unit_price ? Number(item.unit_price) : 0,
      total_price: item.unit_price ? Number(item.unit_price) * Number(item.quantity) : 0
    }))
  };
};

/**
 * Prepare transfer data for API submission
 */
export const prepareTransferData = (formData: TransferFormData) => {
  const today = new Date();
  const date = today.toISOString().split('T')[0];
  
  return {
    from_zone: formData.sourceZone!,
    to_zone: formData.targetZone!,
    date,
    status: (formData.status || 'pending') as 'pending' | 'completed' | 'partial' | 'cancelled',
    items: formData.items.map(item => ({
      product: item.product,
      quantity: Number(item.quantity)
    }))
  };
};

/**
 * Prepare inventory data for API submission
 */
export const prepareInventoryData = (formData: InventoryFormData) => {
  const today = new Date();
  const date = today.toISOString().split('T')[0];
  
  return {
    zone: formData.inventoryZone!,
    date,
    status: (formData.status || 'draft') as 'draft' | 'in_progress' | 'completed' | 'cancelled',
    items: formData.items.map(item => {
      const theoretical = item.theoretical_quantity || 0;
      const physical = Number(item.physical_quantity);
      
      return {
        product: item.product,
        expected_quantity: theoretical,
        actual_quantity: physical,
        difference: physical - theoretical
      };
    })
  };
};

// ============================================================================
// FILTER HELPERS
// ============================================================================

/**
 * Filter stocks based on search term and filters
 */
export const filterStocks = (
  stocks: Stock[],
  searchTerm: string,
  productFilter: number | '',
  zoneFilter: number | '',
  statusFilter: string,
  products: Product[],
  zones: Zone[]
): Stock[] => {
  return stocks.filter(stock => {
    // Search filter
    if (searchTerm) {
      const product = products.find(p => p.id === stock.product);
      const zone = zones.find(z => z.id === stock.zone);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        product?.name.toLowerCase().includes(searchLower) ||
        zone?.name.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Product filter
    if (productFilter && stock.product !== productFilter) return false;
    
    // Zone filter
    if (zoneFilter && stock.zone !== zoneFilter) return false;
    
    // Status filter (based on quantity)
    if (statusFilter) {
      if (statusFilter === 'rupture' && stock.quantity > 0) return false;
      if (statusFilter === 'faible' && (stock.quantity <= 0 || stock.quantity > 10)) return false;
      if (statusFilter === 'normal' && stock.quantity <= 10) return false;
    }
    
    return true;
  });
};

/**
 * Filter supplies based on search term and filters
 */
export const filterSupplies = (
  supplies: StockSupply[],
  searchTerm: string,
  statusFilter: string,
  zoneFilter: number | '',
  supplierFilter: number | '',
  zones: Zone[],
  suppliers: Supplier[]
): StockSupply[] => {
  return supplies.filter(supply => {
    // Search filter
    if (searchTerm) {
      const zone = zones.find(z => z.id === supply.zone);
      const supplier = suppliers.find(s => s.id === supply.supplier);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        supply.reference?.toLowerCase().includes(searchLower) ||
        zone?.name.toLowerCase().includes(searchLower) ||
        supplier?.name.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter && supply.status !== statusFilter) return false;
    
    // Zone filter
    if (zoneFilter && supply.zone !== zoneFilter) return false;
    
    // Supplier filter
    if (supplierFilter && supply.supplier !== supplierFilter) return false;
    
    return true;
  });
};

/**
 * Filter transfers based on search term and filters
 */
export const filterTransfers = (
  transfers: StockTransfer[],
  searchTerm: string,
  statusFilter: string,
  fromZoneFilter: number | '',
  toZoneFilter: number | '',
  zones: Zone[]
): StockTransfer[] => {
  return transfers.filter(transfer => {
    // Search filter
    if (searchTerm) {
      const fromZone = zones.find(z => z.id === transfer.from_zone);
      const toZone = zones.find(z => z.id === transfer.to_zone);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        transfer.reference?.toLowerCase().includes(searchLower) ||
        fromZone?.name.toLowerCase().includes(searchLower) ||
        toZone?.name.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter && transfer.status !== statusFilter) return false;
    
    // From zone filter
    if (fromZoneFilter && transfer.from_zone !== fromZoneFilter) return false;
    
    // To zone filter
    if (toZoneFilter && transfer.to_zone !== toZoneFilter) return false;
    
    return true;
  });
};

/**
 * Filter inventories based on search term and filters
 */
export const filterInventories = (
  inventories: InventoryType[],
  searchTerm: string,
  statusFilter: string,
  zoneFilter: number | '',
  zones: Zone[]
): InventoryType[] => {
  return inventories.filter(inventory => {
    // Search filter
    if (searchTerm) {
      const zone = zones.find(z => z.id === inventory.zone);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = 
        inventory.reference?.toLowerCase().includes(searchLower) ||
        zone?.name.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter && inventory.status !== statusFilter) return false;
    
    // Zone filter
    if (zoneFilter && inventory.zone !== zoneFilter) return false;
    
    return true;
  });
};

/**
 * Filter stock cards based on search term, zone, and transaction type
 */
export const filterStockCards = (
  stockCards: StockMovement[],
  searchTerm: string,
  zoneFilter: number | '',
  typeFilter: string,
  products: Product[],
  _zones: Zone[] // eslint-disable-line @typescript-eslint/no-unused-vars
): StockMovement[] => {
  return stockCards.filter(card => {
    // Search term filter
    if (searchTerm) {
      const product = products.find(p => p.id === card.product);
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = (
        product?.name.toLowerCase().includes(searchLower) ||
        card.reference?.toLowerCase().includes(searchLower) ||
        card.notes?.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }
    
    // Zone filter
    if (zoneFilter && card.zone !== zoneFilter) {
      return false;
    }
    
    // Transaction type filter
    if (typeFilter && card.transaction_type !== typeFilter) {
      return false;
    }
    
    return true;
  });
};

// ============================================================================
// FORMAT HELPERS
// ============================================================================

/**
 * Format quantity with unit
 */
export const formatQuantity = (quantity: number, unit?: string): string => {
  return `${quantity} ${unit || ''}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Calculate variance between physical and theoretical quantities
 */
export const calculateVariance = (physical: number, theoretical: number): number => {
  return physical - theoretical;
};

/**
 * Calculate variance percentage
 */
export const calculateVariancePercentage = (physical: number, theoretical: number): number => {
  if (theoretical === 0) return 0;
  return ((physical - theoretical) / theoretical) * 100;
};

/**
 * Format variance display
 */
export const formatVariance = (physical: number, theoretical: number): string => {
  const variance = calculateVariance(physical, theoretical);
  const percentage = calculateVariancePercentage(physical, theoretical);
  
  const sign = variance >= 0 ? '+' : '';
  return `${sign}${variance} (${sign}${percentage.toFixed(1)}%)`;
};

/**
 * Get variance color
 */
export const getVarianceColor = (physical: number, theoretical: number): 'success' | 'error' | 'default' => {
  const variance = calculateVariance(physical, theoretical);
  if (variance > 0) return 'success';
  if (variance < 0) return 'error';
  return 'default';
};
