/**
 * Custom Hook: useInventoryFilters
 * Manages filter state and provides filtered data for all inventory tabs
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Stock,
  StockSupply,
  StockTransfer,
  Inventory as InventoryType,
  StockMovement
} from '../interfaces/inventory';
import { Zone, Supplier } from '../interfaces/business';
import { Product } from '../interfaces/products';
import {
  filterStocks,
  filterSupplies,
  filterTransfers,
  filterInventories,
  filterStockCards
} from '../utils/inventoryUtils';

interface StockFilters {
  searchTerm: string;
  productFilter: number | '';
  zoneFilter: number | '';
  statusFilter: string;
  onSearchChange: (term: string) => void;
  onProductFilterChange: (id: number | '') => void;
  onZoneFilterChange: (id: number | '') => void;
  onStatusFilterChange: (status: string) => void;
}

interface SupplyFilters {
  searchTerm: string;
  statusFilter: string;
  zoneFilter: number | '';
  supplierFilter: number | '';
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onZoneFilterChange: (id: number | '') => void;
  onSupplierFilterChange: (id: number | '') => void;
}

interface TransferFilters {
  searchTerm: string;
  statusFilter: string;
  fromZoneFilter: number | '';
  toZoneFilter: number | '';
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onFromZoneFilterChange: (id: number | '') => void;
  onToZoneFilterChange: (id: number | '') => void;
}

interface InventoryFilters {
  searchTerm: string;
  statusFilter: string;
  zoneFilter: number | '';
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onZoneFilterChange: (id: number | '') => void;
}

interface StockCardFilters {
  searchTerm: string;
  zoneFilter: number | '';
  typeFilter: string;
  onSearchChange: (term: string) => void;
  onZoneFilterChange: (id: number | '') => void;
  onTypeFilterChange: (type: string) => void;
}

interface UseInventoryFiltersProps {
  stocks: Stock[];
  supplies: StockSupply[];
  transfers: StockTransfer[];
  inventories: InventoryType[];
  stockCards: StockMovement[];
  zones: Zone[];
  products: Product[];
  suppliers: Supplier[];
}

interface UseInventoryFiltersReturn {
  // Filtered data
  filteredStocks: Stock[];
  filteredSupplies: StockSupply[];
  filteredTransfers: StockTransfer[];
  filteredInventories: InventoryType[];
  filteredStockCards: StockMovement[];

  // Filter props for each tab
  stockFilters: StockFilters;
  supplyFilters: SupplyFilters;
  transferFilters: TransferFilters;
  inventoryFilters: InventoryFilters;
  stockCardFilters: StockCardFilters;

  // Reset functions
  resetStockFilters: () => void;
  resetSupplyFilters: () => void;
  resetTransferFilters: () => void;
  resetInventoryFilters: () => void;
  resetStockCardFilters: () => void;
  resetAllFilters: () => void;
}

export const useInventoryFilters = ({
  stocks,
  supplies,
  transfers,
  inventories,
  stockCards,
  zones,
  products,
  suppliers
}: UseInventoryFiltersProps): UseInventoryFiltersReturn => {
  // ============================================================================
  // STOCK FILTERS
  // ============================================================================

  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<number | ''>('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<number | ''>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('');

  const filteredStocks = useMemo(() => {
    return filterStocks(
      stocks,
      stockSearchTerm,
      selectedProductFilter,
      selectedZoneFilter,
      stockStatusFilter,
      products,
      zones
    );
  }, [stocks, stockSearchTerm, selectedProductFilter, selectedZoneFilter, stockStatusFilter, products, zones]);

  const resetStockFilters = useCallback(() => {
    setStockSearchTerm('');
    setSelectedProductFilter('');
    setSelectedZoneFilter('');
    setStockStatusFilter('');
  }, []);

  // ============================================================================
  // SUPPLY FILTERS
  // ============================================================================

  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [supplyStatusFilter, setSupplyStatusFilter] = useState<string>('');
  const [supplyZoneFilter, setSupplyZoneFilter] = useState<number | ''>('');
  const [supplySupplierFilter, setSupplySupplierFilter] = useState<number | ''>('');

  const filteredSupplies = useMemo(() => {
    return filterSupplies(
      supplies,
      supplySearchTerm,
      supplyStatusFilter,
      supplyZoneFilter,
      supplySupplierFilter,
      zones,
      suppliers
    );
  }, [supplies, supplySearchTerm, supplyStatusFilter, supplyZoneFilter, supplySupplierFilter, zones, suppliers]);

  const resetSupplyFilters = useCallback(() => {
    setSupplySearchTerm('');
    setSupplyStatusFilter('');
    setSupplyZoneFilter('');
    setSupplySupplierFilter('');
  }, []);

  // ============================================================================
  // TRANSFER FILTERS
  // ============================================================================

  const [transferSearchTerm, setTransferSearchTerm] = useState('');
  const [transferStatusFilter, setTransferStatusFilter] = useState<string>('');
  const [transferFromZoneFilter, setTransferFromZoneFilter] = useState<number | ''>('');
  const [transferToZoneFilter, setTransferToZoneFilter] = useState<number | ''>('');

  const filteredTransfers = useMemo(() => {
    return filterTransfers(
      transfers,
      transferSearchTerm,
      transferStatusFilter,
      transferFromZoneFilter,
      transferToZoneFilter,
      zones
    );
  }, [transfers, transferSearchTerm, transferStatusFilter, transferFromZoneFilter, transferToZoneFilter, zones]);

  const resetTransferFilters = useCallback(() => {
    setTransferSearchTerm('');
    setTransferStatusFilter('');
    setTransferFromZoneFilter('');
    setTransferToZoneFilter('');
  }, []);

  // ============================================================================
  // INVENTORY FILTERS
  // ============================================================================

  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>('');
  const [inventoryZoneFilter, setInventoryZoneFilter] = useState<number | ''>('');

  const filteredInventories = useMemo(() => {
    return filterInventories(
      inventories,
      inventorySearchTerm,
      inventoryStatusFilter,
      inventoryZoneFilter,
      zones
    );
  }, [inventories, inventorySearchTerm, inventoryStatusFilter, inventoryZoneFilter, zones]);

  const resetInventoryFilters = useCallback(() => {
    setInventorySearchTerm('');
    setInventoryStatusFilter('');
    setInventoryZoneFilter('');
  }, []);

  // ============================================================================
  // STOCK CARD FILTERS
  // ============================================================================

  const [stockCardSearchTerm, setStockCardSearchTerm] = useState('');
  const [stockCardZoneFilter, setStockCardZoneFilter] = useState<number | ''>('');
  const [stockCardTypeFilter, setStockCardTypeFilter] = useState<string>('');

  const filteredStockCards = useMemo(() => {
    return filterStockCards(
      stockCards, 
      stockCardSearchTerm, 
      stockCardZoneFilter,
      stockCardTypeFilter,
      products,
      zones
    );
  }, [stockCards, stockCardSearchTerm, stockCardZoneFilter, stockCardTypeFilter, products, zones]);

  const resetStockCardFilters = useCallback(() => {
    setStockCardSearchTerm('');
    setStockCardZoneFilter('');
    setStockCardTypeFilter('');
  }, []);

  // ============================================================================
  // RESET ALL
  // ============================================================================

  const resetAllFilters = useCallback(() => {
    resetStockFilters();
    resetSupplyFilters();
    resetTransferFilters();
    resetInventoryFilters();
    resetStockCardFilters();
  }, [
    resetStockFilters,
    resetSupplyFilters,
    resetTransferFilters,
    resetInventoryFilters,
    resetStockCardFilters
  ]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Filtered data
    filteredStocks,
    filteredSupplies,
    filteredTransfers,
    filteredInventories,
    filteredStockCards,

    // Filter props
    stockFilters: {
      searchTerm: stockSearchTerm,
      productFilter: selectedProductFilter,
      zoneFilter: selectedZoneFilter,
      statusFilter: stockStatusFilter,
      onSearchChange: setStockSearchTerm,
      onProductFilterChange: setSelectedProductFilter,
      onZoneFilterChange: setSelectedZoneFilter,
      onStatusFilterChange: setStockStatusFilter
    },
    supplyFilters: {
      searchTerm: supplySearchTerm,
      statusFilter: supplyStatusFilter,
      zoneFilter: supplyZoneFilter,
      supplierFilter: supplySupplierFilter,
      onSearchChange: setSupplySearchTerm,
      onStatusFilterChange: setSupplyStatusFilter,
      onZoneFilterChange: setSupplyZoneFilter,
      onSupplierFilterChange: setSupplySupplierFilter
    },
    transferFilters: {
      searchTerm: transferSearchTerm,
      statusFilter: transferStatusFilter,
      fromZoneFilter: transferFromZoneFilter,
      toZoneFilter: transferToZoneFilter,
      onSearchChange: setTransferSearchTerm,
      onStatusFilterChange: setTransferStatusFilter,
      onFromZoneFilterChange: setTransferFromZoneFilter,
      onToZoneFilterChange: setTransferToZoneFilter
    },
    inventoryFilters: {
      searchTerm: inventorySearchTerm,
      statusFilter: inventoryStatusFilter,
      zoneFilter: inventoryZoneFilter,
      onSearchChange: setInventorySearchTerm,
      onStatusFilterChange: setInventoryStatusFilter,
      onZoneFilterChange: setInventoryZoneFilter
    },
    stockCardFilters: {
      searchTerm: stockCardSearchTerm,
      zoneFilter: stockCardZoneFilter,
      typeFilter: stockCardTypeFilter,
      onSearchChange: setStockCardSearchTerm,
      onZoneFilterChange: setStockCardZoneFilter,
      onTypeFilterChange: setStockCardTypeFilter
    },

    // Reset functions
    resetStockFilters,
    resetSupplyFilters,
    resetTransferFilters,
    resetInventoryFilters,
    resetStockCardFilters,
    resetAllFilters
  };
};
