import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  SelectChangeEvent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Inventory as InventoryIcon,
  LocalShipping as SupplyIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';

// Imports standardisés
import {
  StandardButton,
  StandardDataGrid,
  StandardTextField,
  StandardSelect,
  StatusChip,
  getStandardFilterBoxStyles,
  getStandardFilterGroupStyles,
  getStandardActionGroupStyles,
  getStandardPrimaryButtonStyles,
  getStandardSecondaryButtonStyles,
  GENERAL_TRANSLATIONS,
  INVENTORY_TRANSLATIONS,
  STATUS_TRANSLATIONS,
  FILTER_TRANSLATIONS,
  CONTACTS_TRANSLATIONS,
  InventoryDialog,
  InventoryOperationType,
  InventoryDialogFormData,
  InventoryDialogStatus
} from './common';

import {
  InventoryAPI, ZonesAPI, ProductsAPI, SuppliersAPI
} from '../services/api';
import { Stock, EnhancedStock, StockSupply, StockTransfer, Inventory as InventoryType, StockMovement, CreateInventory, UpdateInventory } from '../interfaces/inventory';
import { Zone, Supplier } from '../interfaces/business';
import { Product } from '../interfaces/products';
import { usePermissions } from '../context/PermissionContext';
import { Html5Qrcode } from 'html5-qrcode';
import {
  validateIntegerInput,
  formatNumberDisplay,
  getValidationError
} from '../utils/inputValidation';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

// Main Inventory Management component
const InventoryManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
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
  const [selectedZone, setSelectedZone] = useState<number | ''>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Unified dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogOperation, setDialogOperation] = useState<InventoryOperationType>('supply');
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockSupply | StockTransfer | InventoryType | null>(null);
  
  // Unified dialog form data
  const [dialogFormData, setDialogFormData] = useState<InventoryDialogFormData>({
    items: [],
    status: 'pending' as InventoryDialogStatus,
    supplier: '',
    zone: '',
    sourceZone: '',
    targetZone: '',
    inventoryZone: '',
    currentProduct: null,
    currentQuantity: 1,
    currentUnitPrice: 0,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: 'supply' | 'transfer' | 'inventory', name?: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // QR Code scanner states
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerConfig, setScannerConfig] = useState<{
    operationType: 'lookup' | 'receive' | 'transfer' | 'count',
    targetZone?: number,
    sourceZone?: number,
    inventoryId?: number
  }>({ operationType: 'lookup' });
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scannedQuantity, setScannedQuantity] = useState<number>(1);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  
  // Access user permissions
  const { hasPermission } = usePermissions();

  // State for Stock Cards filters
  const [selectedProductFilter, setSelectedProductFilter] = useState<number | ''>('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<number | ''>('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<InventoryType['status'] | ''>(''); // New state for status filter
  const [inventoryZoneFilter, setInventoryZoneFilter] = useState<number | ''>(''); // New state for zone filter

  // State for Stock Actuel filters
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  // State for Approvisionnements filters
  const [supplySearchTerm, setSupplySearchTerm] = useState('');
  const [supplyStatusFilter, setSupplyStatusFilter] = useState<StockSupply['status'] | ''>('');
  const [supplyZoneFilter, setSupplyZoneFilter] = useState<number | ''>('');
  const [supplySupplierFilter, setSupplySupplierFilter] = useState<number | ''>('');

  // State for Transferts filters
  const [transferSearchTerm, setTransferSearchTerm] = useState('');
  const [transferStatusFilter, setTransferStatusFilter] = useState<StockTransfer['status'] | ''>('');
  const [transferFromZoneFilter, setTransferFromZoneFilter] = useState<number | ''>('');
  const [transferToZoneFilter, setTransferToZoneFilter] = useState<number | ''>('');

  // State for Historique (Stock Cards) filters
  const [stockCardSearchTerm, setStockCardSearchTerm] = useState(''); // New state for search

  // Validation error states
  const [scannedQuantityError, setScannedQuantityError] = useState<string>('');
  const [dialogQuantityError, setDialogQuantityError] = useState<string>('');
  const [dialogPriceError, setDialogPriceError] = useState<string>('');


  // Add this function definition
  const handleInventorySearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInventorySearchTerm(event.target.value);
  };

  // New handler for status filter change
  const handleInventoryStatusFilterChange = (event: SelectChangeEvent<InventoryType['status'] | ''>) => {
    setInventoryStatusFilter(event.target.value as InventoryType['status'] | '');
  };

  // New handler for zone filter change
  const handleInventoryZoneFilterChange = (event: SelectChangeEvent<number | ''>) => {
    setInventoryZoneFilter(event.target.value as number | '');
  };

  // Handlers for Stock Actuel
  const handleStockSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStockSearchTerm(event.target.value);
  };

  // Handlers for Approvisionnements
  const handleSupplySearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSupplySearchTerm(event.target.value);
  };
  const handleSupplyStatusFilterChange = (event: SelectChangeEvent<StockSupply['status'] | ''>) => {
    setSupplyStatusFilter(event.target.value as StockSupply['status'] | '');
  };
  const handleSupplyZoneFilterChange = (event: SelectChangeEvent<number | ''>) => {
    setSupplyZoneFilter(event.target.value as number | '');
  };
  const handleSupplySupplierFilterChange = (event: SelectChangeEvent<number | ''>) => {
    setSupplySupplierFilter(event.target.value as number | '');
  };

  // Handlers for Transferts
  const handleTransferSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTransferSearchTerm(event.target.value);
  };
  const handleTransferStatusFilterChange = (event: SelectChangeEvent<StockTransfer['status'] | ''>) => {
    setTransferStatusFilter(event.target.value as StockTransfer['status'] | '');
  };
  const handleTransferFromZoneFilterChange = (event: SelectChangeEvent<number | ''>) => {
    setTransferFromZoneFilter(event.target.value as number | '');
  };
  const handleTransferToZoneFilterChange = (event: SelectChangeEvent<number | ''>) => {
    setTransferToZoneFilter(event.target.value as number | '');
  };

  // Handler for Stock Cards Search
  const handleStockCardSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStockCardSearchTerm(event.target.value);
  };


  // Enhanced form validation
  const validateSupplyForm = (): boolean => {
    if (!dialogFormData.supplier) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un fournisseur',
        severity: 'error'
      });
      return false;
    }
    
    if (dialogFormData.items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez ajouter au moins un produit',
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };

  // Enhanced transfer form validation
  const validateTransferForm = (): boolean => {
    if (!dialogFormData.sourceZone) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un emplacement source',
        severity: 'error'
      });
      return false;
    }
    
    if (!dialogFormData.targetZone) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un emplacement cible',
        severity: 'error'
      });
      return false;
    }
    
    if (dialogFormData.sourceZone === dialogFormData.targetZone) {
      setSnackbar({
        open: true,
        message: 'Les emplacements source et cible doivent être différents',
        severity: 'error'
      });
      return false;
    }
    
    if (dialogFormData.items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez ajouter au moins un produit',
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };

  // Validate inventory form
  const validateInventoryForm = (): boolean => {
    if (!dialogFormData.inventoryZone) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un emplacement',
        severity: 'error'
      });
      return false;
    }
    
    if (dialogFormData.items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez ajouter au moins un produit',
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };

  // Unified dialog handlers
  const openDialog = (operation: InventoryOperationType, item?: StockSupply | StockTransfer | InventoryType) => {
    setDialogOperation(operation);
    setEditMode(!!item);
    setSelectedItem(item || null);
    
    // Reset form data
    const resetFormData: InventoryDialogFormData = {
      items: [],
      status: operation === 'inventory' ? 'draft' : 'pending',
      supplier: '',
      zone: selectedZone || zones[0]?.id || '',
      sourceZone: selectedZone || zones[0]?.id || '',
      targetZone: zones.find(z => z.id !== (selectedZone || zones[0]?.id))?.id || '',
      inventoryZone: selectedZone || zones[0]?.id || '',
      currentProduct: null,
      currentQuantity: 1,
      currentUnitPrice: 0,
    };

    if (item) {
      // Populate form data based on operation type and item
      if (operation === 'supply' && 'supplier' in item) {
        resetFormData.supplier = item.supplier;
        resetFormData.zone = item.zone;
        resetFormData.status = item.status as InventoryDialogStatus;
        resetFormData.items = (item.items || []).map(i => ({
          id: i.id, // Preserve the original item ID for existing items
          product: i.product,
          quantity: i.quantity,
          unit_price: i.unit_price ?? 0,
          total_price: i.total_price ?? (i.quantity * (i.unit_price ?? 0))
        }));
      } else if (operation === 'transfer' && 'from_zone' in item) {
        resetFormData.sourceZone = item.from_zone;
        resetFormData.targetZone = item.to_zone;
        resetFormData.status = item.status as InventoryDialogStatus;
        resetFormData.items = (item.items || []).map(i => {
          const prod = products.find(p => p.id === i.product);
          const price = prod?.purchase_price ?? 0;
          return {
            id: i.id, // Preserve the original item ID for existing items
            product: i.product,
            quantity: i.quantity,
            unit_price: price,
            total_price: price * i.quantity
          };
        });
      } else if (operation === 'inventory' && 'zone' in item) {
        resetFormData.inventoryZone = item.zone;
        resetFormData.status = item.status as InventoryDialogStatus;
        resetFormData.items = (item.items || []).map(i => {
          const prod = products.find(p => p.id === i.product);
          const price = prod?.purchase_price ?? 0;
          const qty = i.actual_quantity ?? 0;
          return {
            id: i.id, // Preserve the original item ID for existing items
            product: i.product,
            quantity: qty,
            unit_price: price,
            total_price: price * qty
          };
        });
      }
    }

    setDialogFormData(resetFormData);
    setDialogQuantityError('');
    setDialogPriceError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setEditMode(false);
  };

  const handleDialogFormDataChange = (data: Partial<InventoryDialogFormData>) => {
    setDialogFormData(prev => ({ ...prev, ...data }));
  };

  const handleAddDialogItem = () => {
    if (!dialogFormData.currentProduct || 
        (dialogFormData.currentQuantity ?? 0) <= 0 || 
        (dialogFormData.currentUnitPrice ?? 0) < 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un produit, entrer une quantité valide (> 0) et un prix unitaire valide (>= 0).',
        severity: 'warning'
      });
      return;
    }

    // Ensure we have numbers, not strings
    const currentQuantity = Number(dialogFormData.currentQuantity ?? 0);
    const currentUnitPrice = Number(dialogFormData.currentUnitPrice ?? 0);
    const totalPrice = currentQuantity * currentUnitPrice;
    
    const newItem = {
      product: dialogFormData.currentProduct.id,
      quantity: currentQuantity,
      unit_price: currentUnitPrice,
      total_price: totalPrice
    };

    const existingItemIndex = dialogFormData.items.findIndex(item => item.product === dialogFormData.currentProduct!.id);
    const updatedItems = [...dialogFormData.items];
    
    if (existingItemIndex >= 0) {
      // Increment quantity instead of replacing the item
      const existingItem = updatedItems[existingItemIndex];
      const existingQuantity = Number(existingItem.quantity ?? 0);
      
      // Use the current unit price (allow user to update price)
      const finalUnitPrice = currentUnitPrice;
      const newQuantity = existingQuantity + currentQuantity;
      const newTotalPrice = newQuantity * finalUnitPrice;
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        unit_price: finalUnitPrice,
        total_price: newTotalPrice
      };
      
      setSnackbar({
        open: true,
        message: `Quantité de ${dialogFormData.currentProduct.name} mise à jour: ${newQuantity}`,
        severity: 'info'
      });
    } else {
      updatedItems.push(newItem);
    }

    setDialogFormData(prev => ({
      ...prev,
      items: updatedItems,
      currentProduct: null,
      currentQuantity: 1,
      currentUnitPrice: 0
    }));
    
    setDialogQuantityError('');
    setDialogPriceError('');
  };

  const handleRemoveDialogItem = (index: number) => {
    const updatedItems = [...dialogFormData.items];
    updatedItems.splice(index, 1);
    setDialogFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleOpenDialogScanner = () => {
    let operationType: 'lookup' | 'receive' | 'transfer' | 'count' = 'lookup';
    let targetZone: number | undefined;
    let sourceZone: number | undefined;

    switch (dialogOperation) {
      case 'supply':
        operationType = 'receive';
        targetZone = dialogFormData.zone as number;
        break;
      case 'transfer':
        operationType = 'transfer';
        sourceZone = dialogFormData.sourceZone as number;
        targetZone = dialogFormData.targetZone as number;
        break;
      case 'inventory':
        operationType = 'count';
        targetZone = dialogFormData.inventoryZone as number;
        break;
    }

    openScanner({ 
      operationType,
      targetZone,
      sourceZone
    });
  };

  // Function to specifically refresh current stock data
  const refreshCurrentStockData = async () => {
    try {
      // Always fetch all stocks; filtering is done client-side in renderCurrentStock
      const stocksData = await InventoryAPI.getStocks();
      setStocks(stocksData);
    } catch (err) {
      console.error('Error refreshing stock data:', err);
      // Optionally show a snackbar message for stock refresh failure
      setSnackbar({
        open: true,
        message: 'Échec de la mise à jour du stock actuel.',
        severity: 'warning',
      });
    }
  };

  const handleDialogSubmit = async () => {
    // Validate form based on operation type
    switch (dialogOperation) {
      case 'supply':
        if (!validateSupplyForm()) return;
        break;
      case 'transfer':
        if (!validateTransferForm()) return;
        break;
      case 'inventory':
        if (!validateInventoryForm()) return;
        break;
    }

    try {
      setLoading(true);

      if (dialogOperation === 'supply') {
        const supplyData = {
          supplier: dialogFormData.supplier,
          zone: dialogFormData.zone,
          items: dialogFormData.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
          status: mapToSupplyStatus(dialogFormData.status),
        };

        if (selectedItem && 'supplier' in selectedItem) {
          // Update existing supply
          const updateData = {
            ...selectedItem,
            ...supplyData,
            supplier: supplyData.supplier === "" ? selectedItem.supplier : supplyData.supplier,
            zone: supplyData.zone === "" ? selectedItem.zone : supplyData.zone
          };
          await InventoryAPI.updateStockSupply(selectedItem.id, updateData);
          const suppliesData = await InventoryAPI.getStockSupplies();
          setSupplies(suppliesData);
          setSnackbar({
            open: true,
            message: 'Approvisionnement mis à jour avec succès',
            severity: 'success'
          });
        } else {
          // Create new supply
          if (supplyData.supplier === "" || supplyData.zone === "") {
            throw new Error("Veuillez sélectionner un fournisseur et une zone");
          }
          const today = new Date();
          const date = today.toISOString().split('T')[0];
          const newSupply = {
            ...supplyData,
            supplier: supplyData.supplier as number,
            zone: supplyData.zone as number,
            date: date,
          };
          
          await InventoryAPI.createStockSupply(newSupply);
          const suppliesData = await InventoryAPI.getStockSupplies();
          setSupplies(suppliesData);
          setSnackbar({
            open: true,
            message: 'Approvisionnement créé avec succès',
            severity: 'success'
          });
        }
        await refreshCurrentStockData();
      } else if (dialogOperation === 'transfer') {
        const transferData = {
          from_zone: dialogFormData.sourceZone,
          to_zone: dialogFormData.targetZone,
          items: dialogFormData.items,
          status: mapToTransferStatus(dialogFormData.status),
        };

        if (selectedItem && 'from_zone' in selectedItem) {
          // Update existing transfer
          const updatedTransfer = await InventoryAPI.updateStockTransfer(selectedItem.id, {
            ...selectedItem,
            ...transferData,
            from_zone: transferData.from_zone as number,
            to_zone: transferData.to_zone as number,
          });
          setTransfers(transfers.map(t => t.id === selectedItem.id ? updatedTransfer : t));
          setSnackbar({
            open: true,
            message: 'Transfert mis à jour avec succès',
            severity: 'success'
          });
        } else {
          // Create new transfer
          if (transferData.from_zone === "" || transferData.to_zone === "") {
            throw new Error("Veuillez sélectionner les zones source et destination");
          }
          const today = new Date();
          const date = today.toISOString().split('T')[0];
          const newTransfer = {
            ...transferData,
            from_zone: transferData.from_zone as number,
            to_zone: transferData.to_zone as number,
            date: date
          };
          
          await InventoryAPI.createStockTransfer(newTransfer);
          const transfersData = await InventoryAPI.getStockTransfers();
          setTransfers(transfersData);
          setSnackbar({
            open: true,
            message: 'Transfert créé avec succès',
            severity: 'success'
          });
        }
        await refreshCurrentStockData();
      } else if (dialogOperation === 'inventory') {
        if (selectedItem && 'zone' in selectedItem) {
          // Update existing inventory
          const updateData: UpdateInventory = {
            id: selectedItem.id,
            reference: selectedItem.reference, 
            date: selectedItem.date,
            zone: dialogFormData.inventoryZone as number,
            status: mapToInventoryStatus(dialogFormData.status),
            items: dialogFormData.items.map(item => ({ 
              product: item.product, 
              actual_quantity: item.quantity,
              expected_quantity: 0,
              difference: 0
            }))
          };
          
          const updatedInventory = await InventoryAPI.updateInventory(selectedItem.id!, updateData);
          setInventories(inventories.map(i => i.id === selectedItem.id ? updatedInventory : i));
          setSnackbar({
            open: true,
            message: 'Inventaire mis à jour avec succès',
            severity: 'success'
          });
        } else {        
          // Create new inventory
          const today = new Date();
          const date = today.toISOString().split('T')[0];
          const newInventory: CreateInventory = {
            zone: dialogFormData.inventoryZone as number,
            date: date,
            status: mapToInventoryStatus(dialogFormData.status),
            items: dialogFormData.items.map(item => ({ 
              product: item.product, 
              actual_quantity: item.quantity,
              expected_quantity: 0,
              difference: 0
            }))
          };
          
          await InventoryAPI.createInventory(newInventory);
          const updatedInventories = await InventoryAPI.getInventories();
          setInventories(updatedInventories);
          setSnackbar({
            open: true,
            message: 'Inventaire créé avec succès',
            severity: 'success'
          });
        }
      }
      
      closeDialog();
    } catch (error) {
      console.error('Error submitting:', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  // Dialog handlers - now using unified dialog
  const handleOpenSupplyDialog = () => openDialog('supply');
  const handleOpenTransferDialog = () => openDialog('transfer');
  const handleOpenInventoryDialog = () => openDialog('inventory');

  // Handle product filter change in Stock Cards
  const handleProductFilterChange = (event: SelectChangeEvent<number>) => {
    const productId = event.target.value as number | '';
    setSelectedProductFilter(productId);
    // Data reloading will happen in the useEffect that depends on selectedProductFilter
  };

  // Handle zone filter change in Stock Cards
  const handleZoneFilterChange = (event: SelectChangeEvent<number>) => {
    const zoneId = event.target.value as number | '';
    setSelectedZoneFilter(zoneId);
    // Data reloading will happen in the useEffect that depends on selectedZoneFilter
  };

  // Delete confirmation handlers
  const handleOpenDeleteConfirm = (id: number, type: 'supply' | 'transfer' | 'inventory', name?: string) => {
    setItemToDelete({ id, type, name });
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteLoading(true);     
      switch (itemToDelete.type) {
        case 'supply': {
          await InventoryAPI.deleteSupply(itemToDelete.id);
          // Refresh supplies
          const updatedSupplies = await InventoryAPI.getStockSupplies();
          setSupplies(updatedSupplies);
          break;
        }
        case 'transfer': {
          await InventoryAPI.deleteTransfer(itemToDelete.id);
          // Refresh transfers
          const updatedTransfers = await InventoryAPI.getStockTransfers();
          setTransfers(updatedTransfers);
          break;
        }
        case 'inventory': {
          await InventoryAPI.deleteInventory(itemToDelete.id);
          // Refresh inventories
          const updatedInventories = await InventoryAPI.getInventories();
          setInventories(updatedInventories);
          break;
        }
      }
      setSnackbar({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success'
      });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (err: unknown) {
      console.error('Error deleting item:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSnackbar({
        open: true,
        message: `Failed to delete item: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // QR Code scanner functions
  // Start camera for QR code scanning
  const startScanner = async () => {
    // Check if scanner already exists and is running
    if (html5QrCode && cameraStarted) {
      return;
    }
    if (!scannerRef.current) {
      setSnackbar({
        open: true,
        message: 'Scanner container not ready',
        severity: 'error'
      });
      return;
    }
    try {
      // Create instance of scanner and store in state
      const scanner = new Html5Qrcode('scanner-container');
      setHtml5QrCode(scanner);
      // Get list of cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        // Start the camera with the first camera ID
        await scanner.start(
          { facingMode: "environment" }, // prefer back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        );
        setCameraStarted(true);
      } else {
        setSnackbar({
          open: true,
          message: 'No camera devices found',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setSnackbar({
        open: true,
        message: `Error starting camera: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Handle successful QR code scan
  const onScanSuccess = async (decodedText: string) => {
    try {
      if (!html5QrCode || !cameraStarted) return;
      
      let productId: number | null = null;
      
      // First try to parse JSON data (modern QR format)
      try {
        const jsonData = JSON.parse(decodedText);
        if (jsonData && jsonData.id) {
          productId = jsonData.id;
        }
      } catch (e) {
        // Not JSON, try the legacy formats
        if (decodedText.includes('product-id:')) {
          productId = parseInt(decodedText.split('product-id:')[1], 10);
        } else if (!isNaN(parseInt(decodedText, 10))) {
          productId = parseInt(decodedText, 10);
        }
      }
      
      if (!productId) {
        setSnackbar({
          open: true,
          message: `Invalid QR code: ${decodedText}`,
          severity: 'error'
        });
        return;
      }
      
      // Pause scanning temporarily to avoid multiple scans
      await html5QrCode.pause();
      
      // Fetch product details
      const product = await ProductsAPI.get(productId);
      setScannedProduct(product);
      setLoading(false);
      
      // Different actions based on scanner configuration
      handleScannedProduct(product);
      
      // Play a success sound if available
      const successAudio = new Audio('/sounds/beep-success.mp3');
      successAudio.play().catch(() => {
        // Ignore audio errors - not critical
      });
    } catch (err) {
      console.error('Error processing scan:', err);
      setSnackbar({
        open: true,
        message: `Error processing scan: ${err.message}`,
        severity: 'error'
      });
    } finally {
      // Resume scanning after a short delay
      setTimeout(() => {
        if (html5QrCode && cameraStarted) {
          html5QrCode.resume();
        }
      }, 2000);
    }
  };

  // Function to add a scanned product to the current operation via unified dialog
  const handleAddScannedProductToOperation = (product: Product) => {
    if (!product) return;
    
    // When adding via scanner, use purchase price or default
    const unitPrice = Number(product.purchase_price ?? 0);
    const quantity = Number(scannedQuantity ?? 1);
    const newItem = {
      product: product.id,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity
    };
    
    // Check if product already exists in the items
    const existingItemIndex = dialogFormData.items.findIndex(item => item.product === product.id);
    const updatedItems = [...dialogFormData.items];
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const existingItem = updatedItems[existingItemIndex];
      const existingQuantity = Number(existingItem.quantity ?? 0);
      const existingUnitPrice = Number(existingItem.unit_price ?? 0);
      
      // Keep existing unit price, only update quantity
      const newQuantity = existingQuantity + quantity;
      const newTotalPrice = newQuantity * existingUnitPrice;
      
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        total_price: newTotalPrice
      };
    } else {
      // Add new item
      updatedItems.push(newItem);
    }
    
    // Update dialog form data
    setDialogFormData(prev => ({ ...prev, items: updatedItems }));
    
    // Show success message
    setSnackbar({
      open: true,
      message: `Added ${quantity} units of ${product.name}`,
      severity: 'success'
    });
    
    // Reset scanned quantity for next scan
    setScannedQuantity(1);
    setScannedProduct(null);
  };



  // Handle QR scan failure
  const onScanFailure = (error: string) => {
    // We don't need to show every scan failure to the user
    // Only log it for debugging
    console.debug('QR scan error:', error);
  };
  
  // Helper function to stop the scanner safely
  const stopScanner = async () => {
    if (html5QrCode && cameraStarted) {
      try {
        await html5QrCode.stop();
        setCameraStarted(false);
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
  };
  
  // Open scanner with configuration
  const openScanner = (config: {
    operationType: 'lookup' | 'receive' | 'transfer' | 'count',
    targetZone?: number,
    sourceZone?: number,
    inventoryId?: number
  }) => {
    setScannerConfig(config);
    setScannerOpen(true);
    // Start scanner in next tick after dialog is open
    setTimeout(() => startScanner(), 500);
  };
  
  // Handle scanned product based on scanner configuration
  const handleScannedProduct = (product: Product) => {
    if (!product) return;
    
    switch (scannerConfig.operationType) {
      case 'receive':
      case 'transfer':
      case 'count':
        // For all dialog operations, add to the unified dialog
        handleAddScannedProductToOperation(product);
        break;
      case 'lookup':
      default:
        // Just display the product info
        break;
    }
  };
  
  // View functions for details - now using unified dialog
  const handleViewSupplyDetails = async (supplyId: number) => {
    try {
      setLoading(true);
      const supplyDetails = await InventoryAPI.getStockSupply(supplyId);
      openDialog('supply', supplyDetails);
    } catch (err) {
      console.error('Error fetching supply details:', err);
      setSnackbar({
        open: true,
        message: `Error fetching supply details: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewTransferDetails = async (transferId: number) => {
    try {
      setLoading(true);
      const transferDetails = await InventoryAPI.getStockTransfer(transferId);
      openDialog('transfer', transferDetails);
    } catch (err) {
      console.error('Error fetching transfer details:', err);
      setSnackbar({
        open: true,
        message: `Error fetching transfer details: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewInventoryDetails = async (inventoryId: number) => {
    try {
      setLoading(true);
      const inventoryDetails = await InventoryAPI.getInventory(inventoryId);
      openDialog('inventory', inventoryDetails);
    } catch (err) {
      console.error('Error fetching inventory details:', err);
      setSnackbar({
        open: true,
        message: `Error fetching inventory details: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get product name by ID
  const getProductName = (productId: number): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  // Get zone name by ID
  const getZoneName = (zoneId: number): string => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : 'Unknown Location';
  };

  // Get supplier name by ID
  const getSupplierName = (supplierId: number): string => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  // Status mapping helpers to convert between unified dialog status and API-specific statuses
  const mapToSupplyStatus = (status: InventoryDialogStatus): StockSupply['status'] => {
    if (['pending', 'received', 'partial', 'cancelled'].includes(status)) {
      return status as StockSupply['status'];
    }
    return 'pending'; // Default fallback
  };

  const mapToTransferStatus = (status: InventoryDialogStatus): StockTransfer['status'] => {
    if (['pending', 'partial', 'completed', 'cancelled'].includes(status)) {
      return status as StockTransfer['status'];
    }
    return 'pending'; // Default fallback
  };

  const mapToInventoryStatus = (status: InventoryDialogStatus): InventoryType['status'] => {
    if (['draft', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return status as InventoryType['status'];
    }
    return 'draft'; // Default fallback
  };

  // Helper functions to calculate totals for supplies, transfers, and inventories
  const calculateSupplyTotals = (supply: StockSupply) => {
    if (!supply.items || supply.items.length === 0) {
      return { totalQuantity: 0, totalValue: 0 };
    }
    
    const totalQuantity = supply.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalValue = supply.items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
    
    return { totalQuantity, totalValue };
  };

  const calculateTransferTotalQuantity = (transfer: StockTransfer) => {
    if (!transfer.items || transfer.items.length === 0) {
      return 0;
    }
    
    return transfer.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const calculateInventoryTotalQuantity = (inventory: InventoryType) => {
    if (!inventory.items || inventory.items.length === 0) {
      return 0;
    }
    
    return inventory.items.reduce((sum, item) => sum + (Number(item.actual_quantity) || 0), 0);
  };


  // Initial data loading
  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      try {
        // Fetch reference data first
        const [zonesData, productsData, suppliersData] = await Promise.all([
          ZonesAPI.getAll(),
          ProductsAPI.getAll(),
          SuppliersAPI.getAll()
        ]);
        
        setZones(zonesData);
        setProducts(productsData);
        setSuppliers(suppliersData);
        
        // Set default zone if available
        if (zonesData.length > 0) {
          setSelectedZone(zonesData[0].id || '');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('Failed to load inventory data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventoryData();
  }, []);

  // Load tab-specific data when tab changes
  useEffect(() => {
    const loadTabData = async () => {
      setLoading(true);
      try {        switch (tabValue) {
          case 0: {
            // Current Stock
            const stocksData = await InventoryAPI.getStocks();
            setStocks(stocksData);
            break;
          }
          case 1: {
            // Stock Supplies
            const suppliesData = await InventoryAPI.getStockSupplies();
            setSupplies(suppliesData);
            break;
          }
          case 2: {
            // Stock Transfers
            const transfersData = await InventoryAPI.getStockTransfers();
            setTransfers(transfersData);
            break;
          }
          case 3: {
            // Inventories
            const inventoriesData = await InventoryAPI.getInventories();
            setInventories(inventoriesData);
            break;
          }
          case 4: {
            // Stock Cards (History)
            const stockCardsData = await InventoryAPI.getStockCards();
            setStockCards(stockCardsData);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('Error loading tab data:', err);
        setError('Failed to load data for this tab. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTabData();
  }, [tabValue]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle refresh data
  const handleRefresh = async () => {
    try {
      setLoading(true);
      // Refresh data based on current tab
      switch (tabValue) {
        case 0: {
          // Use the dedicated function now
          await refreshCurrentStockData();
          break;
        }
        case 1: {
          const suppliesData = await InventoryAPI.getStockSupplies();
          setSupplies(suppliesData);
          break;
        }
        case 2: {
          const transfersData = await InventoryAPI.getStockTransfers();
          setTransfers(transfersData);
          break;
        }
        case 3: {
          const inventoriesData = await InventoryAPI.getInventories();
          setInventories(inventoriesData);
          break;
        }
        case 4: {
          const stockCardsData = await InventoryAPI.getStockCards();
          setStockCards(stockCardsData);
          break;
        }
      }
      setSnackbar({
        open: true,
        message: 'Data refreshed successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error refreshing data:', err);
      setSnackbar({
        open: true,
        message: 'Failed',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper function to enhance stock data with product pricing
  const enhanceStockWithPricing = (stocks: Stock[]): EnhancedStock[] => {
    return stocks.map(stock => {
      const product = products.find(p => p.id === stock.product);
      const unitPrice = product?.purchase_price ?? 0;
      const stockValue = unitPrice * stock.quantity;
      
      return {
        ...stock,
        unit_price: unitPrice,
        stock_value: stockValue
      };
    });
  };

  // Render current stock tab content
  const renderCurrentStock = () => {
    const filteredStocks = stocks.filter(stock => {
      const searchTermLower = stockSearchTerm.toLowerCase();
      const productNameMatch = stock.product_name?.toLowerCase().includes(searchTermLower);
      const zoneFilterMatch = !selectedZone || stock.zone === selectedZone;

      return productNameMatch && zoneFilterMatch;
    });

    // Enhance stocks with pricing information
    const enhancedStocks = enhanceStockWithPricing(filteredStocks);

    return (
      <>
        <Box sx={getStandardFilterBoxStyles()}>
          <Box sx={getStandardFilterGroupStyles()}>
            <StandardTextField
              label={FILTER_TRANSLATIONS.searchProduct}
              value={stockSearchTerm}
              onChange={handleStockSearchChange}
            />
            <StandardSelect
              label={FILTER_TRANSLATIONS.filterByLocation}
              value={selectedZone || ''}
              onChange={(e) => setSelectedZone(e.target.value as number)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">
                <em>Tous</em>
              </MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </StandardSelect>
          </Box>
          <Box sx={getStandardActionGroupStyles()}>
            <StandardButton
              standardVariant="secondary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              {GENERAL_TRANSLATIONS.refresh}
            </StandardButton>
          </Box>
        </Box>
        <StandardDataGrid
          title={INVENTORY_TRANSLATIONS.currentStock}
          rows={enhancedStocks}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          onPaginationChange={(newPage, newRowsPerPage) => {
            setPage(newPage);
            setRowsPerPage(newRowsPerPage);
          }}
          columns={[
            {
              field: 'product_name',
              headerName: INVENTORY_TRANSLATIONS.product,
              flex: 1.5,
              width: 150
            },
            {
              field: 'zone',
              headerName: INVENTORY_TRANSLATIONS.location,
              flex: 1,
              valueGetter: (params) => {
                if (!params) return '';
                return getZoneName(params);
              }
            },
            {
              field: 'quantity',
              headerName: INVENTORY_TRANSLATIONS.quantity,
              flex: 1,
              renderCell: (params: GridRenderCellParams) => {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {params.value} {params.row.unit_symbol || ''}
                    {params.value <= 0 && (
                      <Tooltip title={STATUS_TRANSLATIONS.out_of_stock}>
                        <WarningIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                );
              }
            },
            {
              field: 'unit_price',
              headerName: INVENTORY_TRANSLATIONS.unitPrice,
              flex: 1,
              renderCell: (params: GridRenderCellParams) => {
                const price = params.value || 0;
                return (
                  <Box sx={{ textAlign: 'right' }}>
                    {price.toLocaleString('fr-FR')} GNF
                  </Box>
                );
              }
            },
            {
              field: 'stock_value',
              headerName: INVENTORY_TRANSLATIONS.stockValue,
              flex: 1,
              renderCell: (params: GridRenderCellParams) => {
                const value = params.value || 0;
                return (
                  <Box sx={{ textAlign: 'right', fontWeight: 'medium' }}>
                    {value.toLocaleString('fr-FR')} GNF
                  </Box>
                );
              }
            },
            {
              field: 'updated_at',
              headerName: 'Dernière mise à jour',
              flex: 1,
              valueFormatter: (params) => {
                return params ? new Date(params).toLocaleDateString('fr-FR') : 'N/A';
              }
            }
          ]}
        />
      </>
    );
  };

  // Render stock supplies tab content
  const renderStockSupplies = () => {
    const filteredSupplies = supplies.filter(supply => {
      const searchTermLower = supplySearchTerm.toLowerCase();
      const refMatch = supply.reference?.toLowerCase().includes(searchTermLower);
      const supplierNameLower = getSupplierName(supply.supplier)?.toLowerCase();
      const supplierMatch = supplierNameLower?.includes(searchTermLower);
      const zoneNameLower = getZoneName(supply.zone)?.toLowerCase();
      const zoneMatch = zoneNameLower?.includes(searchTermLower);

      const statusFilterMatch = !supplyStatusFilter || supply.status === supplyStatusFilter;
      const zoneFilterMatch = !supplyZoneFilter || supply.zone === supplyZoneFilter;
      const supplierFilterMatch = !supplySupplierFilter || supply.supplier === supplySupplierFilter;

      return (refMatch || supplierMatch || zoneMatch) && statusFilterMatch && zoneFilterMatch && supplierFilterMatch;
    });

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1">{INVENTORY_TRANSLATIONS.supplies}</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <StandardTextField
              label={FILTER_TRANSLATIONS.searchByName}
              value={supplySearchTerm}
              onChange={handleSupplySearchChange}
              placeholder="Réf/Fourn./Zone"
              size="small"
            />
            <StandardSelect
              label={FILTER_TRANSLATIONS.filterByStatus}
              value={supplyStatusFilter}
              onChange={handleSupplyStatusFilterChange}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              <MenuItem value="pending">{STATUS_TRANSLATIONS.pending}</MenuItem>
              <MenuItem value="received">Reçu</MenuItem>
              <MenuItem value="partial">{STATUS_TRANSLATIONS.partial}</MenuItem>
              <MenuItem value="cancelled">{STATUS_TRANSLATIONS.cancelled}</MenuItem>
            </StandardSelect>
            <StandardSelect
              label={FILTER_TRANSLATIONS.filterByLocation}
              value={supplyZoneFilter}
              onChange={handleSupplyZoneFilterChange}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
              ))}
            </StandardSelect>
            <StandardSelect
              label={FILTER_TRANSLATIONS.filterBySupplier}
              value={supplySupplierFilter}
              onChange={handleSupplySupplierFilterChange}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=""><em>Tous</em></MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
              ))}
            </StandardSelect>
            <StandardButton
              standardVariant="secondary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="small"
            >
              {GENERAL_TRANSLATIONS.refresh}
            </StandardButton>
            {/* Add New Supply Button */}
            {hasPermission('add_stocksupply') && (
              <StandardButton
                standardVariant="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenSupplyDialog}
                size="small"
              >
                {GENERAL_TRANSLATIONS.add} {INVENTORY_TRANSLATIONS.supply}
              </StandardButton>
            )}
          </Box>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <StandardDataGrid
            rows={filteredSupplies}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onRowClick={(params) => handleViewSupplyDetails(params.row.id)}
            onPaginationChange={(newPage, newRowsPerPage) => {
              setPage(newPage);
              setRowsPerPage(newRowsPerPage);
            }}
            columns={[
              {
                field: 'reference',
                headerName: GENERAL_TRANSLATIONS.reference,
                flex: 1,
              },
              {
                field: 'supplier',
                headerName: CONTACTS_TRANSLATIONS.supplier,
                flex: 1,
                valueGetter: (params) => {
                  if (!params) return '';
                  return getSupplierName(params);
                }
              },
              {
                field: 'zone',
                headerName: INVENTORY_TRANSLATIONS.location,
                flex: 1,
                valueGetter: (params) => {
                  if (!params) return '';
                  return getZoneName(params);
                }
              },
              {
                field: 'date',
                headerName: GENERAL_TRANSLATIONS.date,
                flex: 1,
                valueFormatter: (params) => {
                  return params ? new Date(params).toLocaleDateString('fr-FR') : '';
                }
              },
              {
                field: 'status',
                headerName: GENERAL_TRANSLATIONS.status,
                flex: 1,
                renderCell: (params: GridRenderCellParams) => (
                  <StatusChip status={params.value} />
                )
              },
              {
                field: 'totalQuantity',
                headerName: INVENTORY_TRANSLATIONS.totalQuantity,
                flex: 1,
                valueGetter: (params, row) => {
                  const totals = calculateSupplyTotals(row);
                  return totals.totalQuantity;
                },
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={{ textAlign: 'right' }}>
                    {params.value}
                  </Box>
                )
              },
              {
                field: 'merchandiseValue',
                headerName: INVENTORY_TRANSLATIONS.merchandiseValue,
                flex: 1,
                valueGetter: (params, row) => {
                  const totals = calculateSupplyTotals(row);
                  return totals.totalValue;
                },
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={{ textAlign: 'right' }}>
                    {(params.value || 0).toLocaleString('fr-FR')} GNF
                  </Box>
                )
              },
              {
                field: 'actions',
                headerName: GENERAL_TRANSLATIONS.actions,
                flex: 1,
                sortable: false,
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={getStandardActionGroupStyles()}>
                    <Tooltip title={`${GENERAL_TRANSLATIONS.view} / ${GENERAL_TRANSLATIONS.edit}`}>
                      <StandardButton
                        standardVariant="action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSupplyDetails(params.row.id);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </StandardButton>
                    </Tooltip>
                    {hasPermission('delete_stocksupply') && params.row.status === 'pending' && (
                      <Tooltip title={GENERAL_TRANSLATIONS.delete}>
                        <StandardButton
                          standardVariant="action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteConfirm(params.row.id, 'supply', params.row.reference);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </StandardButton>
                      </Tooltip>
                    )}
                  </Box>
                )
              }
            ]}
          />
        )}
      </>
    );
  };

  // Render stock transfers tab content
  const renderStockTransfers = () => {
    const filteredTransfers = transfers.filter(transfer => {
      const searchTermLower = transferSearchTerm.toLowerCase();
      const refMatch = transfer.reference?.toLowerCase().includes(searchTermLower);
      const fromZoneNameLower = getZoneName(transfer.from_zone)?.toLowerCase();
      const fromZoneMatch = fromZoneNameLower?.includes(searchTermLower);
      const toZoneNameLower = getZoneName(transfer.to_zone)?.toLowerCase();
      const toZoneMatch = toZoneNameLower?.includes(searchTermLower);

      const statusFilterMatch = !transferStatusFilter || transfer.status === transferStatusFilter;
      const fromZoneFilterMatch = !transferFromZoneFilter || transfer.from_zone === transferFromZoneFilter;
      const toZoneFilterMatch = !transferToZoneFilter || transfer.to_zone === transferToZoneFilter;

      return (refMatch || fromZoneMatch || toZoneMatch) && statusFilterMatch && fromZoneFilterMatch && toZoneFilterMatch;
    });

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1">Transferts de Stock</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}> {/* Align items */}
             <TextField
              label="Rechercher (Réf/Zones)"
              variant="outlined"
              value={transferSearchTerm}
              onChange={handleTransferSearchChange}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={transferStatusFilter}
                label="Statut"
                onChange={handleTransferStatusFilterChange}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
                <MenuItem value="partial">Partiel</MenuItem>
                <MenuItem value="cancelled">Annulé</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>De Zone</InputLabel>
              <Select
                value={transferFromZoneFilter}
                label="De Zone"
                onChange={handleTransferFromZoneFilterChange}
              >
                <MenuItem value=""><em>Toutes</em></MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
             <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Vers Zone</InputLabel>
              <Select
                value={transferToZoneFilter}
                label="Vers Zone"
                onChange={handleTransferToZoneFilterChange}
              >
                <MenuItem value=""><em>Toutes</em></MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="medium"
            >
              Actualiser
            </Button>
            {/* Add New Transfer Button */}
            {hasPermission('add_stocktransfer') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenTransferDialog} // Existing handler works for creation
                size="medium" // Match height
              >
                Nouveau Transfert
              </Button>
            )}
          </Box>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <StandardDataGrid
            rows={filteredTransfers}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onRowClick={(params) => handleViewTransferDetails(params.row.id)}
            onPaginationChange={(newPage, newRowsPerPage) => {
              setPage(newPage);
              setRowsPerPage(newRowsPerPage);
            }}
            columns={[
              {
                field: 'reference',
                headerName: 'Référence',
                flex: 1,
              },
              {
                field: 'from_zone',
                headerName: 'De',
                flex: 1,
                valueGetter: (params) => {
                  if (!params) return '';
                  return getZoneName(params);
                }
              },
              {
                field: 'to_zone',
                headerName: 'Vers',
                flex: 1,
                valueGetter: (params) => {
                  if (!params) return '';
                  return getZoneName(params);
                }
              },
              {
                field: 'date',
                headerName: 'Date',
                flex: 1,
                valueFormatter: (params) => {
                  return params ? new Date(params).toLocaleDateString('fr-FR') : '';
                }
              },
              {
                field: 'status',
                headerName: 'Statut',
                flex: 1,
                renderCell: (params: GridRenderCellParams) => (
                  <StatusChip status={params.value} />
                )
              },
              {
                field: 'totalQuantity',
                headerName: INVENTORY_TRANSLATIONS.totalQuantity,
                flex: 1,
                valueGetter: (params, row) => {
                  return calculateTransferTotalQuantity(row);
                },
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={{ textAlign: 'right' }}>
                    {params.value}
                  </Box>
                )
              },
              {
                field: 'actions',
                headerName: 'Actions',
                flex: 1,
                sortable: false,
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={getStandardActionGroupStyles()}>
                    <Tooltip title={`${GENERAL_TRANSLATIONS.view} / ${GENERAL_TRANSLATIONS.edit}`}>
                      <StandardButton
                        standardVariant="action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTransferDetails(params.row.id);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </StandardButton>
                    </Tooltip>
                    {hasPermission('delete_stocktransfer') && params.row.status === 'pending' && (
                      <Tooltip title={GENERAL_TRANSLATIONS.delete}>
                        <StandardButton
                          standardVariant="action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteConfirm(params.row.id, 'transfer', params.row.reference);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </StandardButton>
                      </Tooltip>
                    )}
                  </Box>
                )
              }
            ]}
          />
        )}
      </>
    );
  };

  // Render inventories tab content
  const renderInventories = () => {
    const filteredInventories = inventories.filter(inv => {
      const searchTermLower = inventorySearchTerm.toLowerCase();
      const refMatch = inv.reference?.toLowerCase().includes(searchTermLower);
      const zoneNameLower = getZoneName(inv.zone)?.toLowerCase();
      const zoneMatch = zoneNameLower?.includes(searchTermLower);

      // Status filter logic
      const statusMatch = !inventoryStatusFilter || inv.status === inventoryStatusFilter;

      // Zone filter logic
      const zoneFilterMatch = !inventoryZoneFilter || inv.zone === inventoryZoneFilter;

      return (refMatch || zoneMatch) && statusMatch && zoneFilterMatch; // Combine search and filters
    });
    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1">Inventaires</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}> {/* Align items */}
            <TextField
              label="Rechercher (Réf/Zone)"
              variant="outlined"
              value={inventorySearchTerm}
              onChange={handleInventorySearchChange}
              size="small"
            />
            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={inventoryStatusFilter}
                label="Statut"
                onChange={handleInventoryStatusFilterChange}
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="in_progress">En cours</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
                <MenuItem value="cancelled">Annulé</MenuItem>
              </Select>
            </FormControl>
            {/* Zone Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Emplacement</InputLabel>
              <Select
                value={inventoryZoneFilter}
                label="Emplacement"
                onChange={handleInventoryZoneFilterChange}
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="medium" // Match height better
            >
              Actualiser
            </Button>
            {/* Add New Inventory Button */}
            {hasPermission('add_inventory') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenInventoryDialog} // Existing handler works for creation
                size="medium" // Match height
              >
                Nouvel Inventaire
              </Button>
            )}
          </Box>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <StandardDataGrid
            rows={filteredInventories}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onRowClick={(params) => handleViewInventoryDetails(params.row.id)}
            onPaginationChange={(newPage, newRowsPerPage) => {
              setPage(newPage);
              setRowsPerPage(newRowsPerPage);
            }}
            columns={[
              {
                field: 'reference',
                headerName: 'Référence',
                flex: 1,
              },
              {
                field: 'zone',
                headerName: 'Emplacement',
                flex: 1,
                valueGetter: (params) => {
                  if (!params) return '';
                  return getZoneName(params);
                }
              },
              {
                field: 'date',
                headerName: 'Date',
                flex: 1,
                valueFormatter: (params) => {
                  return params ? new Date(params).toLocaleDateString('fr-FR') : '';
                }
              },
              {
                field: 'status',
                headerName: 'Statut',
                flex: 1,
                renderCell: (params: GridRenderCellParams) => (
                  <StatusChip status={params.value} />
                )
              },
              {
                field: 'totalQuantity',
                headerName: INVENTORY_TRANSLATIONS.totalQuantity,
                flex: 1,
                valueGetter: (params, row) => {
                  return calculateInventoryTotalQuantity(row);
                },
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={{ textAlign: 'right' }}>
                    {params.value}
                  </Box>
                )
              },
              {
                field: 'actions',
                headerName: 'Actions',
                flex: 1,
                sortable: false,
                renderCell: (params: GridRenderCellParams) => (
                  <Box sx={getStandardActionGroupStyles()}>
                    <Tooltip title={`${GENERAL_TRANSLATIONS.view} / ${GENERAL_TRANSLATIONS.edit}`}>
                      <StandardButton
                        standardVariant="action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInventoryDetails(params.row.id);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </StandardButton>
                    </Tooltip>
                    {hasPermission('delete_inventory') &&
                      (params.row.status === 'draft' || params.row.status === 'in_progress') && (
                      <Tooltip title={GENERAL_TRANSLATIONS.delete}>
                        <StandardButton
                          standardVariant="action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteConfirm(params.row.id, 'inventory', params.row.reference);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </StandardButton>
                      </Tooltip>
                    )}
                  </Box>
                )
              }
            ]}
          />
        )}
      </>
    );
  };

  // Render stock cards tab content
  const renderStockCards = () => {
    const typeMap: { [key: string]: string } = { // Define typeMap here for use in filtering
      'supply': 'Approvisionnement',
      'sale': 'Vente',
      'transfer_in': 'Entrée par transfert',
      'transfer_out': 'Sortie par transfert',
      'inventory': 'Ajustement d\'inventaire',
      'production': 'Production',
      'return': 'Retour'
    };

    const filteredStockCards = stockCards.filter(card => {
      const searchTermLower = stockCardSearchTerm.toLowerCase();
      const refMatch = card.reference?.toLowerCase().includes(searchTermLower);
      const transactionTypeString = typeMap[card.transaction_type] || card.transaction_type;
      const typeMatch = transactionTypeString.toLowerCase().includes(searchTermLower);

      const productFilterMatch = !selectedProductFilter || card.product === selectedProductFilter;
      const zoneFilterMatch = !selectedZoneFilter || card.zone === selectedZoneFilter;

      return (refMatch || typeMatch) && productFilterMatch && zoneFilterMatch;
    });

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1">Historique des Mouvements</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
             <TextField
              label="Rechercher (Réf/Type)"
              variant="outlined"
              value={stockCardSearchTerm}
              onChange={handleStockCardSearchChange}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="product-select-label">Filtrer par Produit</InputLabel>
              <Select
                labelId="product-select-label"
                label="Filtrer par Produit"
                value={selectedProductFilter}
                onChange={handleProductFilterChange}
              >
                <MenuItem value="">
                  <em>Tous les Produits</em>
                </MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="zone-history-select-label">Filtrer par Emplacement</InputLabel>
              <Select
                labelId="zone-history-select-label"
                label="Filtrer par Emplacement"
                value={selectedZoneFilter}
                onChange={handleZoneFilterChange}
              >
                <MenuItem value="">
                  <em>Tous les Emplacements</em>
                </MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="medium"
            >
              Actualiser
            </Button>
          </Box>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <Box sx={{ height: 400, width: '100%'
          }}>
            <DataGrid
              rows={filteredStockCards} // Use filtered data
              getRowId={(row) => row.id || Math.random()}
              columns={[
                {
                  field: 'date',
                  headerName: 'Date',
                  flex: 1,
                  valueFormatter: (params) => {
                    return params ? new Date(params).toLocaleDateString() : '';
                  }
                },
                {
                  field: 'product',
                  headerName: 'Produit',
                  flex: 1,
                  valueGetter: (params) => {
                    if (!params) return '';
                    return getProductName(params);
                  }
                },
                {
                  field: 'zone',
                  headerName: 'Emplacement',
                  flex: 1,
                  valueGetter: (params) => {
                    if (!params) return '';
                    return getZoneName(params);
                  }
                },
                {
                  field: 'transaction_type',
                  headerName: 'Type',
                  flex: 1,
                  valueFormatter: (params) => {
                    // Use the typeMap defined above
                    return typeMap[params] || params;
                  }
                },
                {
                  field: 'reference',
                  headerName: 'Référence',
                  flex: 1
                },
                {
                  field: 'notes',
                  headerName: 'Détails',
                  flex: 1.2,
                
                  renderCell: (params: GridRenderCellParams) => {
                    const notes = params.value || '';
                    const transactionType = params.row.transaction_type;
                    
                    // Truncate long text for display
                    const truncateText = (text: string, maxLength: number = 80) => {
                      if (!text) return '-';
                      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
                    };
                    
                    // For inventory adjustments, show more details with tooltip
                    if (transactionType === 'inventory' && notes) {
                      return (
                        <Tooltip 
                          title={
                            <Box sx={{ maxWidth: 400, p: 1 }}>
                              <Typography variant="subtitle2" gutterBottom color="inherit">
                                Détails de l'inventaire
                              </Typography>
                              <Typography variant="body2" color="inherit" sx={{ whiteSpace: 'pre-line' }}>
                                {notes}
                              </Typography>
                            </Box>
                          }
                          arrow
                          placement="top"
                          enterDelay={300}
                          leaveDelay={200}
                        >
                          <Box sx={{ 
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            width: '100%',
                            cursor: 'help',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderRadius: 1,
                              transition: 'background-color 0.2s'
                            }
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: 'inherit', 
                              color: 'text.secondary',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {truncateText(notes, 50)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    }
                    
                    // For other transaction types, show simple tooltip if there are notes
                    if (notes && notes !== '-') {
                      return (
                        <Tooltip 
                          title={notes}
                          arrow
                          placement="top"
                          enterDelay={500}
                        >
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            width: '100%',
                            cursor: 'help',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderRadius: 1,
                              transition: 'background-color 0.2s'
                            }
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.875rem', 
                              color: 'text.secondary',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {truncateText(notes, 60)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    }
                    
                    return (
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          {notes || '-'}
                        </Typography>
                      </Box>
                    );
                  }
                },
                {
                  field: 'quantity_in',
                  headerName: 'Entrée',
                  flex: 0.7,
                  align: 'right',
                  headerAlign: 'right',
                  renderCell: (params: GridRenderCellParams) => {
                    if (params.value === null || params.value === undefined || params.value === '') {
                      return '';
                    }
                    // Use unit_symbol directly from the row data
                    const unitSymbol = params.row.unit_symbol || '';
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        color: 'success.main',
                        fontWeight: 'medium'
                      }}>
                        +{params.value} {unitSymbol}
                      </Box>
                    );
                  }
                },
                {
                  field: 'quantity_out',
                  headerName: 'Sortie',
                  flex: 0.7,
                  align: 'right',
                  headerAlign: 'right',
                  renderCell: (params: GridRenderCellParams) => {
                    if (params.value === null || params.value === undefined || params.value === '') {
                      return '';
                    }
                    // Use unit_symbol directly from the row data
                    const unitSymbol = params.row.unit_symbol || '';
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        color: 'error.main',
                        fontWeight: 'medium'
                      }}>
                        -{params.value} {unitSymbol}
                      </Box>
                    );
                  }
                },
                {
                  field: 'balance',
                  headerName: 'Solde',
                  flex: 0.7,
                  align: 'right',
                  headerAlign: 'right',
                  renderCell: (params: GridRenderCellParams) => {
                    if (params.value === null || params.value === undefined || params.value === '') {
                      return '';
                    }
                    // Balance should show FG instead of unit symbol
                    const isPositive = parseFloat(params.value) >= 0;
                    return (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        color: isPositive ? 'text.primary' : 'error.main',
                        fontWeight: 'bold',
                        backgroundColor: isPositive ? 'transparent' : 'error.light',
                        px: isPositive ? 0 : 1,
                        py: isPositive ? 0 : 0.5,
                        borderRadius: isPositive ? 0 : 1
                      }}>
                        {parseFloat(params.value).toLocaleString('fr-FR')} FG
                      </Box>
                    );
                  }
                }
              ]}
              pagination
              paginationModel={{
                pageSize: rowsPerPage,
                page: page
              }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setRowsPerPage(model.pageSize);
              }}
              pageSizeOptions={[5, 10, 25]}
              checkboxSelection={false}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '& .MuiDataGrid-columnHeader:focus': {
                  outline: 'none',
                },
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: 2,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '8px 8px 0 0',
                }
              }}
            />
          </Box>
        )}
      </>
    );
  };

  // Main component render
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Gestion des Stocks
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => openScanner({ operationType: 'lookup' })}
          sx={{ mr: 1 }}
        >
          Scanner un Produit
        </Button>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="inventory management tabs"
        >
          <Tab label="Stock Actuel" icon={<InventoryIcon />} iconPosition="start" />
          <Tab label="Approvisionnements" icon={<SupplyIcon />} iconPosition="start" />
          <Tab label="Transferts" icon={<TransferIcon />} iconPosition="start" />
          <Tab label="Inventaires" icon={<InventoryIcon />} iconPosition="start" />
          <Tab label="Historique" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      <TabPanel value={tabValue} index={0}>
        {renderCurrentStock()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderStockSupplies()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderStockTransfers()}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderInventories()}
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        {renderStockCards()}
      </TabPanel>
      {/* QR Code Scanner Dialog */}
      <Dialog
        open={scannerOpen}
        onClose={() => {
          stopScanner(); // Call the safer stopScanner function
          setScannerOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Scanner un Produit</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Positionnez le code QR dans la vue de la caméra pour le scanner.
            </Typography>
          </Box>
          {/* Camera view for QR code scanner */}
          <Box
            ref={scannerRef}
            id="scanner-container"
            sx={{
              width: '100%',
              height: 300,
              mb: 2,
              border: '1px solid #ddd',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
              '& video': { objectFit: 'cover' }
            }}
          />
          {/* Show scanned product if available */}
          {scannedProduct && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle1">Produit scanné :</Typography>
              <Typography variant="h6">{scannedProduct.name}</Typography>
              <Typography variant="body2">Référence : {scannedProduct.reference}</Typography>
              {scannerConfig.operationType !== 'lookup' && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Quantité"
                    type="text"
                    value={formatNumberDisplay(scannedQuantity)}
                    onChange={(e) => {
                      const validatedValue = validateIntegerInput(e.target.value, scannedQuantity);
                      setScannedQuantity(validatedValue);
                      setScannedQuantityError(getValidationError(validatedValue, 'quantity'));
                    }}
                    fullWidth
                    size="small"
                    error={!!scannedQuantityError}
                    helperText={scannedQuantityError || "Quantité pour l'opération"}
                  />
                </Box>
              )}
              {scannerConfig.operationType === 'receive' && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  fullWidth
                  onClick={() => handleAddScannedProductToOperation(scannedProduct)}
                >
                  Ajouter à l'approvisionnement
                </Button>
              )}
              {scannerConfig.operationType === 'transfer' && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  fullWidth
                  onClick={() => handleAddScannedProductToOperation(scannedProduct)}
                >
                  Ajouter au transfert
                </Button>
              )}
              {scannerConfig.operationType === 'count' && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  fullWidth
                  onClick={() => handleAddScannedProductToOperation(scannedProduct)}
                >
                  Ajouter à l'inventaire
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            stopScanner(); // Call the safer stopScanner function
            setScannerOpen(false);
          }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>




      {/* Standardized Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            backgroundColor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'error.main', 
          color: '#fff',
          fontWeight: 'bold'
        }}>
          Confirmation de suppression
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3, 
          mt: 2, 
          backgroundColor: 'background.paper' 
        }}>
          <DialogContentText color="text.primary" sx={{ mb: 2 }}>
            {itemToDelete?.type === 'supply' && (
              <>Êtes-vous sûr de vouloir supprimer l'approvisionnement <strong>{itemToDelete.name || `#${itemToDelete.id}`}</strong> ?</>
            )}
            {itemToDelete?.type === 'transfer' && (
              <>Êtes-vous sûr de vouloir supprimer le transfert <strong>{itemToDelete.name || `#${itemToDelete.id}`}</strong> ?</>
            )}
            {itemToDelete?.type === 'inventory' && (
              <>Êtes-vous sûr de vouloir supprimer l'inventaire <strong>{itemToDelete.name || `#${itemToDelete.id}`}</strong> ?</>
            )}
          </DialogContentText>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Cette action supprimera définitivement cet élément et ses données associées.
          </Alert>
          
          <Alert severity="error">
            Cette action est irréversible.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          backgroundColor: 'rgba(0,0,0,0.02)'
        }}>
          <Button 
            onClick={handleCloseDeleteConfirm} 
            disabled={deleteLoading}
            sx={getStandardSecondaryButtonStyles()}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={getStandardPrimaryButtonStyles()}
          >
            {deleteLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Unified Inventory Dialog */}
      <InventoryDialog
        open={dialogOpen}
        operationType={dialogOperation}
        editMode={editMode}
        formData={dialogFormData}
        products={products}
        zones={zones}
        suppliers={suppliers}
        loading={loading}
        quantityError={dialogQuantityError}
        priceError={dialogPriceError}
        onClose={closeDialog}
        onSubmit={handleDialogSubmit}
        onFormDataChange={handleDialogFormDataChange}
        onAddItem={handleAddDialogItem}
        onRemoveItem={handleRemoveDialogItem}
        onOpenScanner={handleOpenDialogScanner}
        getProductName={getProductName}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryManagement;