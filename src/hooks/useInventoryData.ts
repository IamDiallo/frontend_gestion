/**
 * Custom Hook: useInventoryData
 * Manages all data fetching and CRUD operations for inventory management
 */

import { useState, useCallback } from 'react';
import * as InventoryAPI from '../services/api/inventory.api';
import * as CoreAPI from '../services/api/core.api';
import * as PartnersAPI from '../services/api/partners.api';
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
  prepareSupplyData,
  prepareTransferData,
  prepareInventoryData,
  type SupplyFormData,
  type TransferFormData,
  type InventoryFormData
} from '../utils/inventoryUtils';

interface UseInventoryDataReturn {
  // State
  stocks: Stock[];
  supplies: StockSupply[];
  transfers: StockTransfer[];
  inventories: InventoryType[];
  stockCards: StockMovement[];
  zones: Zone[];
  products: Product[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;

  // Data fetching
  fetchStocks: () => Promise<void>;
  fetchSupplies: () => Promise<void>;
  fetchTransfers: () => Promise<void>;
  fetchInventories: () => Promise<void>;
  fetchStockCards: () => Promise<void>;
  fetchZones: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Supply operations
  createSupply: (data: SupplyFormData) => Promise<StockSupply>;
  updateSupply: (id: number, data: SupplyFormData) => Promise<StockSupply>;
  deleteSupply: (id: number) => Promise<void>;

  // Transfer operations
  createTransfer: (data: TransferFormData) => Promise<StockTransfer>;
  updateTransfer: (id: number, data: TransferFormData) => Promise<StockTransfer>;
  deleteTransfer: (id: number) => Promise<void>;

  // Inventory operations
  createInventory: (data: InventoryFormData) => Promise<InventoryType>;
  updateInventory: (id: number, data: InventoryFormData) => Promise<InventoryType>;
  deleteInventory: (id: number) => Promise<void>;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useInventoryData = (): UseInventoryDataReturn => {
  // State management
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [supplies, setSupplies] = useState<StockSupply[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [inventories, setInventories] = useState<InventoryType[]>([]);
  const [stockCards, setStockCards] = useState<StockMovement[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchStocks = useCallback(async () => {
    try {
      const data = await InventoryAPI.getStocks();
      setStocks(data);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Erreur lors du chargement des stocks');
      throw err;
    }
  }, []);

  const fetchSupplies = useCallback(async () => {
    try {
      const data = await InventoryAPI.getStockSupplies();
      setSupplies(data);
    } catch (err) {
      console.error('Error fetching supplies:', err);
      setError('Erreur lors du chargement des approvisionnements');
      throw err;
    }
  }, []);

  const fetchTransfers = useCallback(async () => {
    try {
      const data = await InventoryAPI.getStockTransfers();
      setTransfers(data);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Erreur lors du chargement des transferts');
      throw err;
    }
  }, []);

  const fetchInventories = useCallback(async () => {
    try {
      const data = await InventoryAPI.getInventories();
      setInventories(data);
    } catch (err) {
      console.error('Error fetching inventories:', err);
      setError('Erreur lors du chargement des inventaires');
      throw err;
    }
  }, []);

  const fetchStockCards = useCallback(async () => {
    try {
      const data = await InventoryAPI.getStockCards();
      setStockCards(data);
    } catch (err) {
      console.error('Error fetching stock cards:', err);
      setError('Erreur lors du chargement des fiches de stock');
      throw err;
    }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      const data = await CoreAPI.fetchZones();
      setZones(data);
    } catch (err) {
      console.error('Error fetching zones:', err);
      setError('Erreur lors du chargement des emplacements');
      throw err;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await InventoryAPI.fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erreur lors du chargement des produits');
      throw err;
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await PartnersAPI.fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Erreur lors du chargement des fournisseurs');
      throw err;
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchStocks(),
        fetchSupplies(),
        fetchTransfers(),
        fetchInventories(),
        fetchStockCards(),
        fetchZones(),
        fetchProducts(),
        fetchSuppliers()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setLoading(false);
    }
  }, [
    fetchStocks,
    fetchSupplies,
    fetchTransfers,
    fetchInventories,
    fetchStockCards,
    fetchZones,
    fetchProducts,
    fetchSuppliers
  ]);

  // ============================================================================
  // SUPPLY OPERATIONS
  // ============================================================================

  const createSupply = useCallback(async (formData: SupplyFormData): Promise<StockSupply> => {
    try {
      const preparedData = prepareSupplyData(formData);
      const newSupply = await InventoryAPI.createStockSupply(preparedData);
      
      // Refresh supplies and stocks
      await Promise.all([fetchSupplies(), fetchStocks()]);
      
      return newSupply;
    } catch (err) {
      console.error('Error creating supply:', err);
      setError('Erreur lors de la création de l\'approvisionnement');
      throw err;
    }
  }, [fetchSupplies, fetchStocks]);

  const updateSupply = useCallback(async (id: number, formData: SupplyFormData): Promise<StockSupply> => {
    try {
      const preparedData = prepareSupplyData(formData);
      const updatedSupply = await InventoryAPI.updateStockSupply(id, preparedData);
      
      // Refresh supplies and stocks
      await Promise.all([fetchSupplies(), fetchStocks()]);
      
      return updatedSupply;
    } catch (err) {
      console.error('Error updating supply:', err);
      setError('Erreur lors de la modification de l\'approvisionnement');
      throw err;
    }
  }, [fetchSupplies, fetchStocks]);

  const deleteSupply = useCallback(async (id: number): Promise<void> => {
    try {
      // Note: API method needs to be added
      console.warn(`deleteStockSupply API not available yet for id ${id}`);
      // await InventoryAPI.deleteStockSupply(id);
      
      // Refresh supplies and stocks
      await Promise.all([fetchSupplies(), fetchStocks()]);
    } catch (err) {
      console.error('Error deleting supply:', err);
      setError('Erreur lors de la suppression de l\'approvisionnement');
      throw err;
    }
  }, [fetchSupplies, fetchStocks]);

  // ============================================================================
  // TRANSFER OPERATIONS
  // ============================================================================

  const createTransfer = useCallback(async (formData: TransferFormData): Promise<StockTransfer> => {
    try {
      const preparedData = prepareTransferData(formData);
      const newTransfer = await InventoryAPI.createStockTransfer(preparedData);
      
      // Refresh transfers and stocks
      await Promise.all([fetchTransfers(), fetchStocks()]);
      
      return newTransfer;
    } catch (err) {
      console.error('Error creating transfer:', err);
      setError('Erreur lors de la création du transfert');
      throw err;
    }
  }, [fetchTransfers, fetchStocks]);

  const updateTransfer = useCallback(async (id: number, formData: TransferFormData): Promise<StockTransfer> => {
    try {
      const preparedData = prepareTransferData(formData);
      const updatedTransfer = await InventoryAPI.updateStockTransfer(id, preparedData);
      
      // Refresh transfers and stocks
      await Promise.all([fetchTransfers(), fetchStocks()]);
      
      return updatedTransfer;
    } catch (err) {
      console.error('Error updating transfer:', err);
      setError('Erreur lors de la modification du transfert');
      throw err;
    }
  }, [fetchTransfers, fetchStocks]);

  const deleteTransfer = useCallback(async (id: number): Promise<void> => {
    try {
      // Note: API method needs to be added
      console.warn(`deleteStockTransfer API not available yet for id ${id}`);
      // await InventoryAPI.deleteStockTransfer(id);
      
      // Refresh transfers and stocks
      await Promise.all([fetchTransfers(), fetchStocks()]);
    } catch (err) {
      console.error('Error deleting transfer:', err);
      setError('Erreur lors de la suppression du transfert');
      throw err;
    }
  }, [fetchTransfers, fetchStocks]);

  // ============================================================================
  // INVENTORY OPERATIONS
  // ============================================================================

  const createInventory = useCallback(async (formData: InventoryFormData): Promise<InventoryType> => {
    try {
      const preparedData = prepareInventoryData(formData);
      const newInventory = await InventoryAPI.createInventory(preparedData);
      
      // Refresh inventories and stocks
      await Promise.all([fetchInventories(), fetchStocks()]);
      
      return newInventory;
    } catch (err) {
      console.error('Error creating inventory:', err);
      setError('Erreur lors de la création de l\'inventaire');
      throw err;
    }
  }, [fetchInventories, fetchStocks]);

  const updateInventory = useCallback(async (id: number, formData: InventoryFormData): Promise<InventoryType> => {
    try {
      const preparedData = prepareInventoryData(formData);
      const updatedInventory = await InventoryAPI.updateInventory(id, preparedData);
      
      // Refresh inventories and stocks
      await Promise.all([fetchInventories(), fetchStocks()]);
      
      return updatedInventory;
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError('Erreur lors de la modification de l\'inventaire');
      throw err;
    }
  }, [fetchInventories, fetchStocks]);

  const deleteInventory = useCallback(async (id: number): Promise<void> => {
    try {
      await InventoryAPI.deleteInventory(id);
      
      // Refresh inventories and stocks
      await Promise.all([fetchInventories(), fetchStocks()]);
    } catch (err) {
      console.error('Error deleting inventory:', err);
      setError('Erreur lors de la suppression de l\'inventaire');
      throw err;
    }
  }, [fetchInventories, fetchStocks]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    stocks,
    supplies,
    transfers,
    inventories,
    stockCards,
    zones,
    products,
    suppliers,
    loading,
    error,

    // Data fetching
    fetchStocks,
    fetchSupplies,
    fetchTransfers,
    fetchInventories,
    fetchStockCards,
    fetchZones,
    fetchProducts,
    fetchSuppliers,
    refreshAllData,

    // Supply operations
    createSupply,
    updateSupply,
    deleteSupply,

    // Transfer operations
    createTransfer,
    updateTransfer,
    deleteTransfer,

    // Inventory operations
    createInventory,
    updateInventory,
    deleteInventory,

    // Utility
    setError,
    setLoading
  };
};
