/**
 * Custom Hook: useInventoryDialog
 * Manages dialog state and form operations for inventory operations
 */

import { useState, useCallback } from 'react';
import {
  StockSupply,
  StockTransfer,
  Inventory as InventoryType
} from '../interfaces/inventory';
import { Product } from '../interfaces/products';
import {
  InventoryOperationType,
  InventoryDialogFormData,
  InventoryDialogStatus
} from '../components/common';
import {
  validateSupplyForm,
  validateTransferForm,
  validateInventoryForm,
  type SupplyFormData,
  type TransferFormData,
  type InventoryFormData
} from '../utils/inventoryUtils';
import { InventoryAPI } from '../services/api';

interface UseInventoryDialogProps {
  products: Product[];
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface UseInventoryDialogReturn {
  // State
  dialogOpen: boolean;
  dialogOperation: InventoryOperationType;
  editMode: boolean;
  selectedItem: StockSupply | StockTransfer | InventoryType | null;
  dialogFormData: InventoryDialogFormData;
  dialogStatus: InventoryDialogStatus;
  dialogQuantityError: string;
  dialogPriceError: string;

  // Actions
  openDialog: (operation: InventoryOperationType, item?: StockSupply | StockTransfer | InventoryType) => void;
  closeDialog: () => void;
  setFormData: (data: Partial<InventoryDialogFormData>) => void;
  addItem: () => Promise<boolean>;
  removeItem: (index: number) => void;
  validateForm: () => boolean;
  getFormDataForSubmit: () => SupplyFormData | TransferFormData | InventoryFormData | null;
  
  // Error setters
  setDialogQuantityError: (error: string) => void;
  setDialogPriceError: (error: string) => void;
}

export const useInventoryDialog = ({
  products,
  onSuccess,
  onError
}: UseInventoryDialogProps): UseInventoryDialogReturn => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogOperation, setDialogOperation] = useState<InventoryOperationType>('supply');
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockSupply | StockTransfer | InventoryType | null>(null);
  const [dialogStatus, setDialogStatus] = useState<InventoryDialogStatus>('pending');
  const [dialogQuantityError, setDialogQuantityError] = useState<string>('');
  const [dialogPriceError, setDialogPriceError] = useState<string>('');
  
  const [dialogFormData, setDialogFormData] = useState<InventoryDialogFormData>({
    items: [],
    status: 'pending',
    supplier: '',
    zone: '',
    sourceZone: '',
    targetZone: '',
    inventoryZone: '',
    currentProduct: null,
    currentQuantity: 1,
    currentUnitPrice: 0,
  });

  // ============================================================================
  // OPEN DIALOG
  // ============================================================================

  const openDialog = useCallback((
    operation: InventoryOperationType,
    item?: StockSupply | StockTransfer | InventoryType
  ) => {
    setDialogOperation(operation);
    setEditMode(!!item);
    setSelectedItem(item || null);
    setDialogStatus('pending');
    setDialogQuantityError('');
    setDialogPriceError('');

    // Reset or populate form data based on operation type
    if (item) {
      // Edit mode - populate from existing item
      if (operation === 'supply' && 'supplier' in item) {
        const supplyItem = item as StockSupply;
        setDialogFormData({
          items: supplyItem.items?.map(i => {
            const prod = products.find(p => p.id === i.product);
            return {
              ...i,
              product_name: prod?.name || '',
              product_obj: prod
            };
          }) || [],
          status: supplyItem.status as InventoryDialogStatus,
          supplier: supplyItem.supplier || '',
          zone: supplyItem.zone || '',
          sourceZone: supplyItem.zone || '',
          targetZone: '',
          inventoryZone: '',
          currentProduct: null,
          currentQuantity: 1,
          currentUnitPrice: 0,
        });
      } else if (operation === 'transfer' && 'from_zone' in item) {
        const transferItem = item as StockTransfer;
        setDialogFormData({
          items: transferItem.items?.map(i => {
            const prod = products.find(p => p.id === i.product);
            return {
              product: i.product,
              quantity: i.quantity,
              product_name: prod?.name || '',
              product_obj: prod,
              unit_price: 0,
              total_price: 0
            };
          }) || [],
          status: transferItem.status as InventoryDialogStatus,
          supplier: '',
          zone: '',
          sourceZone: transferItem.from_zone || '',
          targetZone: transferItem.to_zone || '',
          inventoryZone: '',
          currentProduct: null,
          currentQuantity: 1,
          currentUnitPrice: 0,
        });
      } else if (operation === 'inventory' && 'zone' in item) {
        const inventoryItem = item as InventoryType;
        setDialogFormData({
          items: inventoryItem.items?.map(i => {
            const prod = products.find(p => p.id === i.product);
            return {
              product: i.product,
              quantity: i.actual_quantity,
              expected_quantity: i.expected_quantity,
              product_name: prod?.name || '',
              product_obj: prod,
              unit_price: 0,
              total_price: 0
            };
          }) || [],
          status: inventoryItem.status as InventoryDialogStatus,
          supplier: '',
          zone: inventoryItem.zone || '',
          sourceZone: '',
          targetZone: '',
          inventoryZone: inventoryItem.zone || '',
          currentProduct: null,
          currentQuantity: 1,
          currentUnitPrice: 0,
        });
      }
    } else {
      // New item - reset form with appropriate default status
      const defaultStatus = operation === 'inventory' ? 'draft' : 'pending';
      setDialogFormData({
        items: [],
        status: defaultStatus,
        supplier: '',
        zone: '',
        sourceZone: '',
        targetZone: '',
        inventoryZone: '',
        currentProduct: null,
        currentQuantity: 1,
        currentUnitPrice: 0,
      });
    }

    setDialogOpen(true);
  }, [products]);

  // ============================================================================
  // CLOSE DIALOG
  // ============================================================================

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedItem(null);
    setDialogStatus('pending');
    setDialogQuantityError('');
    setDialogPriceError('');
    setDialogFormData({
      items: [],
      status: 'pending',
      supplier: '',
      zone: '',
      sourceZone: '',
      targetZone: '',
      inventoryZone: '',
      currentProduct: null,
      currentQuantity: 1,
      currentUnitPrice: 0,
    });
  }, []);

  // ============================================================================
  // SET FORM DATA
  // ============================================================================

  const setFormData = useCallback((data: Partial<InventoryDialogFormData>) => {
    setDialogFormData(prev => ({ ...prev, ...data }));
  }, []);

  // ============================================================================
  // ADD ITEM
  // ============================================================================

  const addItem = useCallback(async (): Promise<boolean> => {
    // Clear previous errors
    setDialogQuantityError('');
    setDialogPriceError('');

    // Validate current product and quantity
    if (!dialogFormData.currentProduct) {
      onError?.('Veuillez sélectionner un produit');
      return false;
    }

    const currentQuantity = Number(dialogFormData.currentQuantity ?? 0);
    if (currentQuantity <= 0) {
      setDialogQuantityError('La quantité doit être supérieure à 0');
      return false;
    }

    const currentUnitPrice = Number(dialogFormData.currentUnitPrice ?? 0);
    if (dialogOperation === 'supply' && currentUnitPrice <= 0) {
      setDialogPriceError('Le prix unitaire doit être supérieur à 0');
      return false;
    }

    // For transfers, validate quantity against available stock and get pricing
    let unitPrice = currentUnitPrice;
    let totalPrice = currentQuantity * currentUnitPrice;
    
    if (dialogOperation === 'transfer' && dialogFormData.sourceZone) {
      try {
        const stockData = await InventoryAPI.getStockByZone(Number(dialogFormData.sourceZone));
        const stockItem = stockData.find(item => item.product === dialogFormData.currentProduct!.id);
        
        if (!stockItem || stockItem.quantity <= 0) {
          onError?.('Ce produit n\'est pas disponible dans la zone source');
          return false;
        }
        
        if (currentQuantity > stockItem.quantity) {
          setDialogQuantityError(`Quantité disponible: ${stockItem.quantity}`);
          return false;
        }
        
        // Use the product's purchase price for valuation
        unitPrice = dialogFormData.currentProduct.purchase_price || 0;
        totalPrice = currentQuantity * unitPrice;
      } catch (error) {
        console.error('Error fetching stock data:', error);
        onError?.('Erreur lors de la vérification du stock');
        return false;
      }
    }

    // Check if product already exists in items
    const existingItemIndex = dialogFormData.items.findIndex(
      item => item.product === dialogFormData.currentProduct!.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...dialogFormData.items];
      const existingItem = updatedItems[existingItemIndex];
      const existingQuantity = Number(existingItem.quantity ?? 0);
      
      // For transfers, validate total quantity against available stock
      if (dialogOperation === 'transfer' && dialogFormData.sourceZone) {
        try {
          const stockData = await InventoryAPI.getStockByZone(Number(dialogFormData.sourceZone));
          const stockItem = stockData.find(item => item.product === dialogFormData.currentProduct!.id);
          
          if (stockItem && (existingQuantity + currentQuantity) > stockItem.quantity) {
            setDialogQuantityError(`Quantité disponible: ${stockItem.quantity}`);
            return false;
          }
        } catch (error) {
          console.error('Error fetching stock data:', error);
        }
      }
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingQuantity + currentQuantity,
        unit_price: dialogOperation === 'supply' ? currentUnitPrice : (dialogOperation === 'transfer' ? unitPrice : existingItem.unit_price),
        total_price: dialogOperation === 'supply' 
          ? (existingQuantity + currentQuantity) * currentUnitPrice 
          : (dialogOperation === 'transfer' 
            ? (existingQuantity + currentQuantity) * unitPrice 
            : existingItem.total_price)
      };

      setDialogFormData(prev => ({
        ...prev,
        items: updatedItems,
        currentProduct: null,
        currentQuantity: 1,
        currentUnitPrice: 0
      }));
    } else {
      // Add new item
      const newItem = {
        product: dialogFormData.currentProduct.id,
        product_name: dialogFormData.currentProduct.name,
        product_obj: dialogFormData.currentProduct,
        quantity: currentQuantity,
        unit_price: dialogOperation === 'supply' ? currentUnitPrice : (dialogOperation === 'transfer' ? unitPrice : undefined),
        total_price: dialogOperation === 'supply' ? currentQuantity * currentUnitPrice : (dialogOperation === 'transfer' ? totalPrice : undefined)
      };

      setDialogFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        currentProduct: null,
        currentQuantity: 1,
        currentUnitPrice: 0
      }));
    }

    onSuccess?.('Produit ajouté');
    return true;
  }, [dialogFormData, dialogOperation, onSuccess, onError]);

  // ============================================================================
  // REMOVE ITEM
  // ============================================================================

  const removeItem = useCallback((index: number) => {
    setDialogFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  // ============================================================================
  // VALIDATE FORM
  // ============================================================================

  const validateForm = useCallback((): boolean => {
    let result;

    if (dialogOperation === 'supply') {
      const formData: SupplyFormData = {
        supplier: dialogFormData.supplier ? Number(dialogFormData.supplier) : null,
        zone: dialogFormData.zone ? Number(dialogFormData.zone) : null,
        items: dialogFormData.items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined
        }))
      };
      result = validateSupplyForm(formData);
    } else if (dialogOperation === 'transfer') {
      const formData: TransferFormData = {
        sourceZone: dialogFormData.sourceZone ? Number(dialogFormData.sourceZone) : null,
        targetZone: dialogFormData.targetZone ? Number(dialogFormData.targetZone) : null,
        items: dialogFormData.items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity)
        }))
      };
      result = validateTransferForm(formData);
    } else if (dialogOperation === 'inventory') {
      const formData: InventoryFormData = {
        inventoryZone: dialogFormData.inventoryZone ? Number(dialogFormData.inventoryZone) : null,
        items: dialogFormData.items.map(item => ({
          product: item.product,
          physical_quantity: Number(item.quantity),
        }))
      };
      result = validateInventoryForm(formData);
    } else {
      result = { isValid: false, message: 'Type d\'opération invalide' };
    }

    if (!result.isValid && result.message) {
      onError?.(result.message);
    }

    return result.isValid;
  }, [dialogOperation, dialogFormData, onError]);

  // ============================================================================
  // GET FORM DATA FOR SUBMIT
  // ============================================================================

  const getFormDataForSubmit = useCallback((): SupplyFormData | TransferFormData | InventoryFormData | null => {
    if (dialogOperation === 'supply') {
      return {
        supplier: dialogFormData.supplier ? Number(dialogFormData.supplier) : null,
        zone: dialogFormData.zone ? Number(dialogFormData.zone) : null,
        status: dialogFormData.status,
        items: dialogFormData.items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined
        }))
      };
    } else if (dialogOperation === 'transfer') {
      return {
        sourceZone: dialogFormData.sourceZone ? Number(dialogFormData.sourceZone) : null,
        targetZone: dialogFormData.targetZone ? Number(dialogFormData.targetZone) : null,
        status: dialogFormData.status,
        items: dialogFormData.items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? Number(item.unit_price) : undefined,
          total_price: item.total_price ? Number(item.total_price) : undefined
        }))
      };
    } else if (dialogOperation === 'inventory') {
      return {
        inventoryZone: dialogFormData.inventoryZone ? Number(dialogFormData.inventoryZone) : null,
        status: dialogFormData.status,
        items: dialogFormData.items.map(item => ({
          product: item.product,
          physical_quantity: Number(item.quantity),
        }))
      };
    }

    return null;
  }, [dialogOperation, dialogFormData]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    dialogOpen,
    dialogOperation,
    editMode,
    selectedItem,
    dialogFormData,
    dialogStatus,
    dialogQuantityError,
    dialogPriceError,

    // Actions
    openDialog,
    closeDialog,
    setFormData,
    addItem,
    removeItem,
    validateForm,
    getFormDataForSubmit,

    // Error setters
    setDialogQuantityError,
    setDialogPriceError
  };
};
