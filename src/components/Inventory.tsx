import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent, // Add SelectChangeEvent
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
import {
  InventoryAPI, ZonesAPI, ProductsAPI, SuppliersAPI
} from '../services/api';
import { Stock, StockSupply, StockTransfer, Inventory as InventoryType, StockMovement, CreateInventory, UpdateInventory } from '../interfaces/inventory';
import { Zone, Supplier } from '../interfaces/business'; // Import from business interfaces
import { Product } from '../interfaces/products'; // Import Product from products interface
import { usePermissions } from '../context/PermissionContext';
import { Html5Qrcode } from 'html5-qrcode'; // Correct the import path
import { AxiosError } from 'axios'; // Add AxiosError import for proper error handling
import {
  validateIntegerInput,
  validateDecimalInput,
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
  
  // New state for supply dialog
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<StockSupply | null>(null);
  // Update supplyItems state structure
  const [supplyItems, setSupplyItems] = useState<{product: number, quantity: number, unit_price: number, total_price: number}[]>([]);
  const [currentSupplyProduct, setCurrentSupplyProduct] = useState<Product | null>(null);
  const [currentSupplyQuantity, setCurrentSupplyQuantity] = useState<number>(1);
  // Unit price will now be potentially auto-filled
  const [currentSupplyUnitPrice, setCurrentSupplyUnitPrice] = useState<number>(0);
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: number, type: 'supply' | 'transfer' | 'inventory'} | null>(null);
  const [supplyStatus, setSupplyStatus] = useState<StockSupply['status']>('pending');

  // New transfer dialog states and handlers
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [transferItems, setTransferItems] = useState<{product: number, quantity: number, unit_price: number, total_price: number}[]>([]);
  const [currentTransferProduct, setCurrentTransferProduct] = useState<Product | null>(null);
  const [currentTransferQuantity, setCurrentTransferQuantity] = useState<number>(1);
  const [currentTransferUnitPrice, setCurrentTransferUnitPrice] = useState<number>(0);
  const [sourceZone, setSourceZone] = useState<number | ''>('');
  const [targetZone, setTargetZone] = useState<number | ''>('');
  const [transferStatus, setTransferStatus] = useState<StockTransfer['status']>('pending');

  // New inventory count dialog states and handlers
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryType | null>(null);
  const [inventoryItems, setInventoryItems] = useState<{product: number, quantity: number, unit_price: number, total_price: number}[]>([]);
  const [currentInventoryProduct, setCurrentInventoryProduct] = useState<Product | null>(null);
  const [currentInventoryQuantity, setCurrentInventoryQuantity] = useState<number>(1);
  const [currentInventoryUnitPrice, setCurrentInventoryUnitPrice] = useState<number>(0);
  const [inventoryZone, setInventoryZone] = useState<number | ''>('');
  const [inventoryStatus, setInventoryStatus] = useState<InventoryType['status']>('draft');

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
  const [supplyQuantityError, setSupplyQuantityError] = useState<string>('');
  const [supplyPriceError, setSupplyPriceError] = useState<string>('');
  const [transferQuantityError, setTransferQuantityError] = useState<string>('');
  const [transferPriceError, setTransferPriceError] = useState<string>('');
  const [inventoryQuantityError, setInventoryQuantityError] = useState<string>('');
  const [inventoryPriceError, setInventoryPriceError] = useState<string>('');


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
    if (!selectedSupplier) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un fournisseur',
        severity: 'error'
      });
      return false;
    }
    
    if (supplyItems.length === 0) {
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
    if (!sourceZone) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un emplacement source',
        severity: 'error'
      });
      return false;
    }
    
    if (!targetZone) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un emplacement cible',
        severity: 'error'
      });
      return false;
    }
    
    if (sourceZone === targetZone) {
      setSnackbar({
        open: true,
        message: 'Les emplacements source et cible doivent être différents',
        severity: 'error'
      });
      return false;
    }
    
    if (transferItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez ajouter au moins un produit',
        severity: 'error'
      });
      return false;
    }
    
    return true;
  };

  // New supply dialog open handler for creation
  const handleOpenSupplyDialog = () => {
    setSupplyItems([]);
    setCurrentSupplyProduct(null);
    setCurrentSupplyQuantity(1);
    setCurrentSupplyUnitPrice(0); // Reset unit price initially
    setSelectedSupplier(''); // Reset supplier
    setSelectedZone(selectedZone || zones[0]?.id || ''); // Default to current or first zone
    setSelectedSupply(null); // Ensure no supply is selected for creation
    setSupplyStatus('pending'); // Reset status to default for creation
    // Reset error states
    setSupplyQuantityError('');
    setSupplyPriceError('');
    setSupplyDialogOpen(true);
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

  const handleCloseSupplyDialog = () => {
    setSupplyDialogOpen(false);
    setSelectedSupply(null); // Clear selection on close
  };   

  const handleAddSupplyItem = () => {
    // Assuming currentSupplyUnitPrice is correctly set (either auto-filled or manually entered)
    if (!currentSupplyProduct || (currentSupplyQuantity ?? 0) <= 0 || (currentSupplyUnitPrice ?? 0) < 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un produit, entrer une quantité valide (> 0) et un prix unitaire valide (>= 0).',
        severity: 'warning'
      });
      return;
    }
    const totalPrice = (currentSupplyQuantity ?? 0) * (currentSupplyUnitPrice ?? 0);
    const newItem = {
      product: currentSupplyProduct.id,
      quantity: currentSupplyQuantity ?? 0,
      unit_price: currentSupplyUnitPrice ?? 0,
      total_price: totalPrice
    };

    const existingItemIndex = supplyItems.findIndex(item => item.product === currentSupplyProduct.id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...supplyItems];
      updatedItems[existingItemIndex] = newItem;
      setSupplyItems(updatedItems);
       setSnackbar({
        open: true,
        message: `Produit ${currentSupplyProduct.name} mis à jour.`,
        severity: 'info'
      });
    } else {
      setSupplyItems([...supplyItems, newItem]);
    }
    // Reset inputs for next item
    setCurrentSupplyProduct(null);
    setCurrentSupplyQuantity(1);
    setCurrentSupplyUnitPrice(0); // Reset unit price for the next selection
    // Reset error states
    setSupplyQuantityError('');
    setSupplyPriceError('');
  };

  // New function to open scanner specifically for supplies
  const openSupplyScanner = () => {
    openScanner({ 
      operationType: 'receive',
      targetZone: selectedZone as number 
    });
  };

  const handleRemoveSupplyItem = (index: number) => {
    const updatedItems = [...supplyItems];
    updatedItems.splice(index, 1);
    setSupplyItems(updatedItems);
  };

  const handleSubmitSupply = async () => {
    if (!validateSupplyForm()) return;
    try {
      setLoading(true);
      // Ensure items sent to API include required price fields
      const supplyData = {
        supplier: selectedSupplier,
        zone: selectedZone,
        // Explicitly map to ensure structure matches backend expectations
        items: supplyItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price, // Ensure non-null
          total_price: item.total_price, // Ensure non-null
        })),
        status: supplyStatus,
      };

      // Validate again just before sending (optional, but safer)
      if (supplyData.items.some(item => item.unit_price == null || item.total_price == null)) {
          throw new Error("Certains articles n'ont pas de prix unitaire ou total défini.");
      }      if (selectedSupply) {
        // Update existing supply - filter out empty supplier/zone
        const updateData = {
          ...selectedSupply,
          ...supplyData,
          supplier: supplyData.supplier === "" ? selectedSupply.supplier : supplyData.supplier,
          zone: supplyData.zone === "" ? selectedSupply.zone : supplyData.zone
        };
        await InventoryAPI.updateStockSupply(selectedSupply.id, updateData);
        // Refresh supplies list - fetch updated list
        const suppliesData = await InventoryAPI.getStockSupplies();
        setSupplies(suppliesData);
        setSnackbar({
          open: true,
          message: 'Approvisionnement mis à jour avec succès',
          severity: 'success'
        });
        await refreshCurrentStockData();      } else {
        // Create new supply - validate required fields
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
        
        // Create the supply
        await InventoryAPI.createStockSupply(newSupply);
        
        // Refresh supplies list
        const suppliesData = await InventoryAPI.getStockSupplies();
        setSupplies(suppliesData);
        setSnackbar({
          open: true,
          message: 'Approvisionnement créé avec succès',
          severity: 'success'
        });
        await refreshCurrentStockData();
      }
      
      // Close dialog and reset form 
      handleCloseSupplyDialog();
    } catch (error) {
      console.error('Error submitting stock supply:', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message || 'Une erreur est survenue'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // New transfer dialog
  const handleOpenTransferDialog = () => {
    setTransferItems([]);
    setCurrentTransferProduct(null);
    setCurrentTransferQuantity(1);
    setCurrentTransferUnitPrice(0);
    setSourceZone(selectedZone || zones[0]?.id || '');
    // Set target zone to a different zone than source
    const otherZone = zones.find(z => z.id !== (selectedZone || zones[0]?.id))?.id || '';
    setTargetZone(otherZone);
    setSelectedTransfer(null);
    setTransferStatus('pending'); // Reset status on open
    // Reset error states
    setTransferQuantityError('');
    setTransferPriceError('');
    setTransferDialogOpen(true);
  };

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false);
    setSelectedTransfer(null); // Clear selection on close
  };

  const handleAddTransferItem = () => {
    if (!currentTransferProduct) return;
    const existingItemIndex = transferItems.findIndex(item => item.product === currentTransferProduct.id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...transferItems];
      updatedItems[existingItemIndex].quantity += (currentTransferQuantity ?? 1);
      updatedItems[existingItemIndex].unit_price = (currentTransferUnitPrice ?? 0);
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * (currentTransferUnitPrice ?? 0);
      setTransferItems(updatedItems);
    } else {
      setTransferItems([...transferItems, {
        product: currentTransferProduct.id,
        quantity: currentTransferQuantity ?? 1,
        unit_price: currentTransferUnitPrice ?? 0,
        total_price: (currentTransferQuantity ?? 1) * (currentTransferUnitPrice ?? 0)
      }]);
    }
    // Reset inputs for next item
    setCurrentTransferProduct(null);
    setCurrentTransferQuantity(1);
    setCurrentTransferUnitPrice(0);
    // Reset error states
    setTransferQuantityError('');
    setTransferPriceError('');
  };

  // New function to open scanner specifically for transfers
  const openTransferScanner = () => {
    openScanner({ 
      operationType: 'transfer',
      sourceZone: sourceZone as number,
      targetZone: targetZone as number 
    });
  };

  const handleRemoveTransferItem = (index: number) => {
    const updatedItems = [...transferItems];
    updatedItems.splice(index, 1);
    setTransferItems(updatedItems);
  };

  const handleSubmitTransfer = async () => {
    if (!validateTransferForm()) return; // Use enhanced validation
    try {
      setLoading(true);
      const transferData = {
        from_zone: sourceZone,
        to_zone: targetZone,
        items: transferItems,
        status: transferStatus, // Use state for status
      };
      if (selectedTransfer) {
        // Ensure zones are numbers before updating transfer
        const fromZoneNumber = transferData.from_zone as number;
        const toZoneNumber = transferData.to_zone as number;
        // Update existing transfer
        const updatedTransfer = await InventoryAPI.updateStockTransfer(selectedTransfer.id, {
          ...selectedTransfer, // Include existing data
          ...transferData, // Overwrite with form data
          from_zone: fromZoneNumber,
          to_zone: toZoneNumber,
        });
        setTransfers(transfers.map(t => t.id === selectedTransfer.id ? updatedTransfer : t));
        setSnackbar({
          open: true,
          message: 'Transfert mis à jour avec succès',
          severity: 'success'
        });
        // Refresh current stock after update
        await refreshCurrentStockData();
      } else {
        // Create new transfer - validate required fields
        if (transferData.from_zone === "" || transferData.to_zone === "") {
          throw new Error("Veuillez sélectionner les zones source et destination");
        }
        // Ensure zones are numbers before creating transfer
        const fromZoneNumber = transferData.from_zone as number;
        const toZoneNumber = transferData.to_zone as number;
        const today = new Date();
        const date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const newTransfer = {
          ...transferData,
          from_zone: fromZoneNumber,
          to_zone: toZoneNumber,
          date: date // Only provide the date, let the backend handle the reference
        };
        // API call to create new transfer
        await InventoryAPI.createStockTransfer(newTransfer);        
        // Update the transfers state with a new array to ensure proper rendering
        const transfersData = await InventoryAPI.getStockTransfers();
        setTransfers(transfersData);
        
        setSnackbar({
          open: true,
          message: 'Transfert créé avec succès',
          severity: 'success'
        });
        // Refresh current stock after creation
        await refreshCurrentStockData();
      }
      
      handleCloseTransferDialog();    } catch (err) {
      console.error('Error saving transfer:', err);
      const errorMessage = err instanceof AxiosError 
        ? err.response?.data?.detail || err.message 
        : err instanceof Error 
        ? err.message 
        : 'Erreur inconnue';
      setSnackbar({
        open: true,
        message: `Échec de sauvegarde du transfert: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // New inventory count dialog
  const handleOpenInventoryDialog = () => {
    setInventoryItems([]);
    setCurrentInventoryProduct(null);
    setCurrentInventoryQuantity(1);
    setCurrentInventoryUnitPrice(0);
    setInventoryZone(selectedZone || zones[0]?.id || '');
    setSelectedInventory(null); // Ensure no inventory is selected for creation
    setInventoryStatus('draft'); // Reset status to default for creation
    // Reset error states
    setInventoryQuantityError('');
    setInventoryPriceError('');
    setInventoryDialogOpen(true);
  };

  const handleCloseInventoryDialog = () => {
    setInventoryDialogOpen(false);
    setSelectedInventory(null); // Clear selection on close
  };

  const handleAddInventoryItem = () => {
    if (!currentInventoryProduct) return;
    const existingItemIndex = inventoryItems.findIndex(item => item.product === currentInventoryProduct.id);
    if (existingItemIndex >= 0) {
      const updatedItems = [...inventoryItems];
      updatedItems[existingItemIndex].quantity = currentInventoryQuantity ?? 1;
      updatedItems[existingItemIndex].unit_price = currentInventoryUnitPrice ?? 0;
      updatedItems[existingItemIndex].total_price = (currentInventoryQuantity ?? 1) * (currentInventoryUnitPrice ?? 0);
      setInventoryItems(updatedItems);
    } else {
      setInventoryItems([...inventoryItems, {
        product: currentInventoryProduct.id,
        quantity: currentInventoryQuantity ?? 1,
        unit_price: currentInventoryUnitPrice ?? 0,
        total_price: (currentInventoryQuantity ?? 1) * (currentInventoryUnitPrice ?? 0)
      }]);
    }
    // Reset inputs for next item
    setCurrentInventoryProduct(null);
    setCurrentInventoryQuantity(1);
    setCurrentInventoryUnitPrice(0);
    // Reset error states
    setInventoryQuantityError('');
    setInventoryPriceError('');
  };

  // New function to open scanner specifically for inventories
  const openInventoryScanner = () => {
    openScanner({ 
      operationType: 'count',
      targetZone: inventoryZone as number 
    });
  };

  const handleRemoveInventoryItem = (index: number) => {
    const updatedItems = [...inventoryItems];
    updatedItems.splice(index, 1);
    setInventoryItems(updatedItems);
  };

  const handleSubmitInventory = async () => {
    if (!inventoryZone || inventoryItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select a location and add at least one product',
        severity: 'error'
      });
      return;
    }    try {
      setLoading(true);
      
      if (selectedInventory) {// Update existing inventory
        // When updating, don't include the inventory field in items to prevent conflicts
        const updateData: UpdateInventory = {
          id: selectedInventory.id,
          reference: selectedInventory.reference, 
          date: selectedInventory.date,
          zone: inventoryZone as number,
          status: inventoryStatus,
          items: inventoryItems.map(item => ({ 
            product: item.product, 
            actual_quantity: item.quantity,
            expected_quantity: 0, // Default value
            difference: 0 // Will be calculated
            // Don't include inventory field - backend will set it automatically
          }))
        };
        
        const updatedInventory = await InventoryAPI.updateInventory(selectedInventory.id!, updateData);
        
        setInventories(inventories.map(i => i.id === selectedInventory.id ? updatedInventory : i));
        console.log("Inventory updated with items:", inventoryItems);
        setSnackbar({
          open: true,
          message: 'Inventaire mis à jour avec succès',
          severity: 'success'
        });      } else {        
        // Create new inventory count - let the backend generate the reference
        const today = new Date();
        const date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const newInventory: CreateInventory = {
          zone: inventoryZone as number,
          date: date,
          status: inventoryStatus,
          items: inventoryItems.map(item => ({ 
            product: item.product, 
            actual_quantity: item.quantity,
            expected_quantity: 0, // Default value, will be set by backend
            difference: 0 // Will be calculated by backend
            // Don't include inventory field for new items - backend will set it
          }))
        };
        // API call to create new inventory count
        await InventoryAPI.createInventory(newInventory);
        
        // Update inventories state with a fresh copy to ensure proper rendering
        const updatedInventories = await InventoryAPI.getInventories();
        setInventories(updatedInventories);
        
        setSnackbar({
          open: true,
          message: 'Inventaire créé avec succès',
          severity: 'success'
        });
      }
      
      handleCloseInventoryDialog();
    } catch (err) {
      console.error('Error saving inventory count:', err);
      setSnackbar({
        open: true,
        message: `Échec de sauvegarde de l'inventaire: ${err.response?.data?.detail || err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete confirmation handlers
  const handleOpenDeleteConfirm = (id: number, type: 'supply' | 'transfer' | 'inventory') => {
    setItemToDelete({ id, type });
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);      switch (itemToDelete.type) {
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
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('Error deleting item:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete item: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
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

  // Function to add a scanned product to the current supply
  const handleAddScannedProductToSupply = (product: Product) => {
    if (!product) return;
    // When adding via scanner, prompt for price or use a default/lookup?
    // For now, let's add with a default price of 0 and let the user edit.
    const newItem = {
      product: product.id,
      quantity: scannedQuantity ?? 1,
      unit_price: 0, // Default or fetch price later
      total_price: 0 // Default or fetch price later
    };
    // Check if product already exists in the supply items
    const existingItemIndex = supplyItems.findIndex(item => item.product === product.id);
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...supplyItems];
      updatedItems[existingItemIndex].quantity += (scannedQuantity ?? 1);
      setSupplyItems(updatedItems);
    } else {
      // Add new item
      setSupplyItems([...supplyItems, newItem]);
    }
    // Show success message
    setSnackbar({
      open: true,
      message: `Added ${scannedQuantity ?? 1} units of ${product.name} to the supply`,
      severity: 'success'
    });
    // Reset scanned quantity for next scan
    setScannedQuantity(1);
    setScannedProduct(null);
  };

  // Function to add a scanned product to the current transfer
  const handleAddScannedProductToTransfer = (product: Product) => {
    if (!product) return;
    // Create a transfer item with the scanned product including pricing defaults
    const newItem = {
      product: product.id,
      quantity: scannedQuantity ?? 1,
      unit_price: 0,
      total_price: 0
    };
    // Check if product already exists in the transfer items
    const existingItemIndex = transferItems.findIndex(item => item.product === product.id);
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...transferItems];
      updatedItems[existingItemIndex].quantity += (scannedQuantity ?? 1);
      // Keep unit_price and recalc total price
      updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price;
      setTransferItems(updatedItems);
    } else {
      // Add new item
      setTransferItems([...transferItems, newItem]);
    }
    // Show success message
    setSnackbar({
      open: true,
      message: `Added ${scannedQuantity ?? 1} units of ${product.name} to the transfer`,
      severity: 'success'
    });
    // Reset scanned quantity for next scan
    setScannedQuantity(1);
    setScannedProduct(null);
  };

  // Function to add a scanned product to the current inventory
  const handleAddScannedProductToInventory = (product: Product) => {
    if (!product) return;
    // Create an inventory item with the scanned product including pricing defaults
    const newItem = {
      product: product.id,
      quantity: scannedQuantity ?? 1,
      unit_price: 0,
      total_price: 0
    };
    // Check if product already exists in the inventory items
    const existingItemIndex = inventoryItems.findIndex(item => item.product === product.id);
    if (existingItemIndex >= 0) {
      // Update quantity if product already exists
      const updatedItems = [...inventoryItems];
      updatedItems[existingItemIndex].quantity = (scannedQuantity ?? 1); // Replace quantity
      updatedItems[existingItemIndex].total_price = (scannedQuantity ?? 1) * updatedItems[existingItemIndex].unit_price;
      setInventoryItems(updatedItems);
    } else {
      // Add new item
      setInventoryItems([...inventoryItems, newItem]);
    }
    // Show success message
    setSnackbar({
      open: true,
      message: `Counted ${scannedQuantity ?? 1} units of ${product.name}`,
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
        handleAddScannedProductToSupply(product);
        break;
      case 'transfer':
        handleAddScannedProductToTransfer(product);
        break;
      case 'count':
        handleAddScannedProductToInventory(product);
        break;
      case 'lookup':
      default:
        // Just display the product info
        break;
    }
  };
  
  // View functions for details
  const handleViewSupplyDetails = async (supplyId: number) => {
    try {
      setLoading(true);
      const supplyDetails = await InventoryAPI.getStockSupply(supplyId);
      setSelectedSupply(supplyDetails);
      // Set form state from supply details
      setSelectedSupplier(supplyDetails.supplier);
      setSelectedZone(supplyDetails.zone);
      setSupplyStatus(supplyDetails.status);
      // Ensure items loaded include prices, provide defaults (0) if missing/null from API
      setSupplyItems((supplyDetails.items || []).map(item => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price ?? 0, // Default to 0 if null/undefined
        total_price: item.total_price ?? (item.quantity * (item.unit_price ?? 0)) // Recalculate total if missing, based on unit price (or 0)
      })));
      setSupplyDialogOpen(true);
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
      setSelectedTransfer(transferDetails);
      // Set form state
      setSourceZone(transferDetails.from_zone);
      setTargetZone(transferDetails.to_zone);
      setTransferStatus(transferDetails.status);
      setTransferItems((transferDetails.items || []).map(item => {
        // Use product purchase price if available
        const prod = products.find(p => p.id === item.product);
        const price = prod?.purchase_price ?? 0;
        return {
          product: item.product,
          quantity: item.quantity,
          unit_price: price,
          total_price: price * item.quantity
        };
      }));
      setTransferDialogOpen(true);
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
      setSelectedInventory(inventoryDetails);
      setInventoryZone(inventoryDetails.zone);
      setInventoryStatus(inventoryDetails.status);
      setInventoryItems((inventoryDetails.items || []).map(item => {
        const prod = products.find(p => p.id === item.product);
        const price = prod?.purchase_price ?? 0;
        const qty = item.actual_quantity ?? 0;
        return {
          product: item.product,
          quantity: qty,
          unit_price: price,
          total_price: price * qty
        };
      }));
      setInventoryDialogOpen(true);
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

  // Render current stock tab content
  const renderCurrentStock = () => {
    const filteredStocks = stocks.filter(stock => {
      const searchTermLower = stockSearchTerm.toLowerCase();
      const productNameMatch = stock.product_name?.toLowerCase().includes(searchTermLower);
      const zoneFilterMatch = !selectedZone || stock.zone === selectedZone;

      return productNameMatch && zoneFilterMatch;
    });

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Rechercher Produit"
              variant="outlined"
              value={stockSearchTerm}
              onChange={handleStockSearchChange}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="zone-select-label">Filtrer par Emplacement</InputLabel>
              <Select
                labelId="zone-select-label"
                value={selectedZone || ''}
                label="Filtrer par Emplacement"
                onChange={(e) => setSelectedZone(e.target.value as number)}
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
          </Box>
          <Box>
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
        <Box sx={{ height: 500, width: '100%', boxShadow: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
          <DataGrid
            rows={filteredStocks} // Use filtered data
            getRowId={(row) => row.id || Math.random()}
            columns={[
              {
                field: 'product_name',
                headerName: 'Produit',
                flex: 1,
                width: 120
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
                field: 'quantity',
                headerName: 'Quantité',
                flex: 1,
                renderCell: (params: GridRenderCellParams) => {
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {params.value} {params.row.unit_symbol || ''}
                      {params.value <= 0 && (
                        <Tooltip title="Rupture de stock">
                          <WarningIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                        </Tooltip>
                      )}
                    </Box>
                  );
                }
              },
              {
                field: 'updated_at',
                headerName: 'Dernière mise à jour',
                flex: 1,
                valueFormatter: (params) => {
                  return params ? new Date(params).toLocaleDateString() : 'N/A';
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
            loading={loading}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter',
                color: theme => theme.palette.text.primary,
                fontWeight: 'bold'
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontSize: '0.875rem'
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
                cursor: 'pointer'
              }
            }}
          />
        </Box>
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
          <Typography variant="subtitle1">Approvisionnements</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}> {/* Align items */}
            <TextField
              label="Rechercher (Réf/Fourn./Zone)"
              variant="outlined"
              value={supplySearchTerm}
              onChange={handleSupplySearchChange}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={supplyStatusFilter}
                label="Statut"
                onChange={handleSupplyStatusFilterChange}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
                <MenuItem value="pending">En attente</MenuItem>
                <MenuItem value="received">Reçu</MenuItem>
                <MenuItem value="partial">Partiel</MenuItem>
                <MenuItem value="cancelled">Annulé</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Emplacement</InputLabel>
              <Select
                value={supplyZoneFilter}
                label="Emplacement"
                onChange={handleSupplyZoneFilterChange}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Fournisseur</InputLabel>
              <Select
                value={supplySupplierFilter}
                label="Fournisseur"
                onChange={handleSupplySupplierFilterChange}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
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
            {/* Add New Supply Button */}
            {hasPermission('add_stocksupply') && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenSupplyDialog} // Use the new handler
                size="medium" // Match height
              >
                Nouvel Approvisionnement
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
          <Box sx={{ height: 500, width: '100%', boxShadow: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <DataGrid
              rows={filteredSupplies} // Use filtered data
              getRowId={(row) => row.id || Math.random()}
              columns={[
                {
                  field: 'reference',
                  headerName: 'Référence',
                  flex: 1,
                },
                {
                  field: 'supplier',
                  headerName: 'Fournisseur',
                  flex: 1,
                  valueGetter: (params) => {
                    if (!params) return '';
                    return getSupplierName(params);
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
                  field: 'date',
                  headerName: 'Date',
                  flex: 1,
                  valueFormatter: (params) => {
                    return params ? new Date(params).toLocaleDateString() : '';
                  }
                },
                {
                  field: 'status',
                  headerName: 'Statut',
                  flex: 1,
                  renderCell: (params: GridRenderCellParams) => (
                    <>
                      {params.value === 'pending' && <Alert severity="warning" sx={{ py: 0 }}>En attente</Alert>}
                      {params.value === 'received' && <Alert severity="success" sx={{ py: 0 }}>Reçu</Alert>}
                      {params.value === 'partial' && <Alert severity="info" sx={{ py: 0 }}>Partiel</Alert>}
                      {params.value === 'cancelled' && <Alert severity="error" sx={{ py: 0 }}>Annulé</Alert>}
                    </>
                  )
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  flex: 1,
                  sortable: false,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box>                      <Tooltip title="Voir les détails / Modifier">
                        <IconButton size="small" color="primary" onClick={() => {
                          handleViewSupplyDetails(params.row.id);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {hasPermission('delete_stocksupply') && params.row.status === 'pending' && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(params.row.id, 'supply')}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )
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
              loading={loading}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter',
                  color: theme => theme.palette.text.primary,
                  fontWeight: 'bold'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.875rem'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
                  cursor: 'pointer'
                }
              }}
            />
          </Box>
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
          <Box sx={{ height: 500, width: '100%', boxShadow: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <DataGrid
              rows={filteredTransfers} // Use filtered data
              getRowId={(row) => row.id || Math.random()}
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
                    return params ? new Date(params).toLocaleDateString() : '';
                  }
                },
                {
                  field: 'status',
                  headerName: 'Statut',
                  flex: 1,
                  renderCell: (params: GridRenderCellParams) => (
                    <>
                      {params.value === 'pending' && <Alert severity="warning" sx={{ py: 0 }}>En attente</Alert>}
                      {params.value === 'completed' && <Alert severity="success" sx={{ py: 0 }}>Terminé</Alert>}
                      {params.value === 'partial' && <Alert severity="info" sx={{ py: 0 }}>Partiel</Alert>}
                      {params.value === 'cancelled' && <Alert severity="error" sx={{ py: 0 }}>Annulé</Alert>}
                    </>
                  )
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  flex: 1,
                  sortable: false,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box>
                      <Tooltip title="Voir les détails">
                        <IconButton size="small" color="primary" onClick={() => {
                          handleViewTransferDetails(params.row.id);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {hasPermission('delete_stocktransfer') && params.row.status === 'pending' && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(params.row.id, 'transfer')}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )
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
              loading={loading}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter',
                  color: theme => theme.palette.text.primary,
                  fontWeight: 'bold'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.875rem'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
                  cursor: 'pointer'
                }
              }}
            />
          </Box>
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
          <Box sx={{ height: 500, width: '100%', boxShadow: 2, borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <DataGrid
              rows={filteredInventories} // Use filtered data
              getRowId={(row) => row.id || Math.random()}
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
                    return params ? new Date(params).toLocaleDateString() : '';
                  }
                },
                {
                  field: 'status',
                  headerName: 'Statut',
                  flex: 1,
                  renderCell: (params: GridRenderCellParams) => (
                    <>
                      {params.value === 'draft' && <Alert severity="info" sx={{ py: 0 }}>Brouillon</Alert>}
                      {params.value === 'in_progress' && <Alert severity="warning" sx={{ py: 0 }}>En cours</Alert>}
                      {params.value === 'completed' && <Alert severity="success" sx={{ py: 0 }}>Terminé</Alert>}
                      {params.value === 'cancelled' && <Alert severity="error" sx={{ py: 0 }}>Annulé</Alert>}
                    </>
                  )
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  flex: 1,
                  sortable: false,
                  renderCell: (params: GridRenderCellParams) => (
                    <Box>
                      <Tooltip title="Voir les détails">
                        <IconButton size="small" color="primary" onClick={() => {
                          handleViewInventoryDetails(params.row.id);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {hasPermission('delete_inventory') &&
                        (params.row.status === 'draft' || params.row.status === 'in_progress') && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(params.row.id, 'inventory')}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )
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
              loading={loading}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter',
                  color: theme => theme.palette.text.primary,
                  fontWeight: 'bold'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.875rem'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
                  cursor: 'pointer'
                }
              }}
            />
          </Box>
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
      'inventory': 'Ajustement',
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
                  field: 'quantity_in',
                  headerName: 'Entrée',
                  flex: 0.7,
                  align: 'right',
                  headerAlign: 'right',
                  valueFormatter: (params) => {
                    return params === null || params === undefined ? '' : params;
                  }
                },
                {
                  field: 'quantity_out',
                  headerName: 'Sortie',
                  flex: 0.7,
                  align: 'right',
                  headerAlign: 'right',
                  valueFormatter: (params) => {
                    return params === null || params === undefined ? '' : params;
                  }
                },
                {
                  field: 'balance',
                  headerName: 'Solde',
                  flex: 0.7,
                  align: 'right',
                  headerAlign: 'right',
                  valueFormatter: (params) => {
                    return params === null || params === undefined ? ''                    : params;
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
                  onClick={() => handleAddScannedProductToSupply(scannedProduct)}
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
                  onClick={() => handleAddScannedProductToTransfer(scannedProduct)}
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
                  onClick={() => handleAddScannedProductToInventory(scannedProduct)}
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
      {/* Supply Dialog */}
      <Dialog
        open={supplyDialogOpen}
        onClose={handleCloseSupplyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedSupply ? 'Modifier' : 'Nouvel'} Approvisionnement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Fournisseur</InputLabel>
                <Select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value as number)}
                  label="Fournisseur"
                >
                  <MenuItem value="">
                    <em>Sélectionner un fournisseur</em>
                  </MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Emplacement</InputLabel>
                <Select
                  value={selectedZone || ''}
                  onChange={(e) => setSelectedZone(e.target.value as number)}
                  label="Emplacement"
                >
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}> {/* Add Status Field */}
              <FormControl fullWidth required>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={supplyStatus}
                  onChange={(e) => setSupplyStatus(e.target.value as StockSupply['status'])}
                  label="Statut"
                >
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="received">Reçu</MenuItem>
                  <MenuItem value="partial">Partiel</MenuItem>
                  <MenuItem value="cancelled">Annulé</MenuItem> {/* Add cancelled option */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Produits</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth sx={{ flexGrow: 1 }}>
                  <InputLabel>Produit</InputLabel>
                  <Select
                    value={currentSupplyProduct?.id || ''}
                    onChange={(e) => {
                      const productId = e.target.value as number;
                      const product = products.find(p => p.id === productId);
                      setCurrentSupplyProduct(product || null);
                      // Auto-fill unit price from product purchase price
                      setCurrentSupplyUnitPrice(product?.purchase_price ?? 0);
                    }}
                    label="Produit"
                  >
                    <MenuItem value="">
                      <em>Sélectionner un produit</em>
                    </MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} { `(${product.purchase_price})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Quantité"
                  type="text"
                  value={formatNumberDisplay(currentSupplyQuantity)}
                  onChange={(e) => {
                    const validatedValue = validateIntegerInput(e.target.value, currentSupplyQuantity);
                    setCurrentSupplyQuantity(validatedValue);
                    setSupplyQuantityError(getValidationError(validatedValue, 'quantity'));
                  }}
                  sx={{ width: 120 }}
                  error={!!supplyQuantityError}
                  helperText={supplyQuantityError}
                />
                {/* Unit Price Field - Value is now managed by state, potentially auto-filled */}
                <TextField
                  label="Prix Unitaire"
                  type="text"
                  value={formatNumberDisplay(currentSupplyUnitPrice)}
                  onChange={(e) => {
                    const validatedValue = validateDecimalInput(e.target.value, currentSupplyUnitPrice);
                    setCurrentSupplyUnitPrice(validatedValue);
                    setSupplyPriceError(getValidationError(validatedValue, 'price'));
                  }}
                  sx={{ width: 120 }}
                  error={!!supplyPriceError}
                  helperText={supplyPriceError}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddSupplyItem}
                  disabled={!currentSupplyProduct || (currentSupplyQuantity ?? 0) <= 0 || (currentSupplyUnitPrice ?? 0) < 0 || !!supplyQuantityError || !!supplyPriceError}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  Ajouter
                </Button>
              </Box>
              {supplyItems.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produit</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Prix Unitaire</TableCell>
                        <TableCell align="right">Prix Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {supplyItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.product)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{(item.unit_price)}</TableCell>
                          <TableCell align="right">{item.total_price}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleRemoveSupplyItem(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucun produit ajouté. Utilisez le formulaire ci-dessus pour ajouter des produits à cet approvisionnement.
                </Alert>
              )}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={openSupplyScanner}
                >
                  Scanner un Produit
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSupplyDialog}>Annuler</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitSupply}
            disabled={!selectedSupplier || supplyItems.length === 0 || loading}
          >
            {loading ? <CircularProgress size={24} /> : (selectedSupply ? 'Mettre à jour' : 'Créer')} l'Approvisionnement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={handleCloseTransferDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedTransfer ? 'Modifier' : 'Nouveau'} Transfert de Stock</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Emplacement Source</InputLabel>
                <Select
                  value={sourceZone}
                  onChange={(e) => setSourceZone(e.target.value as number)}
                  label="Emplacement Source"
                >
                  <MenuItem value="">
                    <em>Sélectionner l'emplacement source</em>
                  </MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Emplacement Cible</InputLabel>
                <Select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value as number)}
                  label="Emplacement Cible"
                >
                  <MenuItem value="">
                    <em>Sélectionner l'emplacement cible</em>
                  </MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}> {/* Add Status Field */}
              <FormControl fullWidth required>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={transferStatus}
                  onChange={(e) => setTransferStatus(e.target.value as StockTransfer['status'])}
                  label="Statut"
                >
                  <MenuItem value="pending">En attente</MenuItem>
                  <MenuItem value="partial">Partiel</MenuItem>
                  <MenuItem value="completed">Terminé</MenuItem>
                  <MenuItem value="cancelled">Annulé</MenuItem> {/* Add cancelled option */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Produits
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth sx={{ flexGrow: 1 }}>
                  <InputLabel>Produit</InputLabel>
                  <Select
                    value={currentTransferProduct?.id || ''}
                    onChange={(e) => {
                      const productId = e.target.value as number;
                      const product = products.find(p => p.id === productId);
                      setCurrentTransferProduct(product || null);
                      // Auto-fill unit price from product purchase price
                      setCurrentTransferUnitPrice(product?.purchase_price ?? 0);
                    }}
                    label="Produit"
                  >
                    <MenuItem value="">
                      <em>Sélectionner un produit</em>
                    </MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Quantité"
                  type="text"
                  value={formatNumberDisplay(currentTransferQuantity)}
                  onChange={(e) => {
                    const validatedValue = validateIntegerInput(e.target.value, currentTransferQuantity);
                    setCurrentTransferQuantity(validatedValue);
                    setTransferQuantityError(getValidationError(validatedValue, 'quantity'));
                  }}
                  sx={{ width: 120 }}
                  error={!!transferQuantityError}
                  helperText={transferQuantityError}
                />
                <TextField
                  label="Prix Unitaire"
                  type="text"
                  value={formatNumberDisplay(currentTransferUnitPrice)}
                  onChange={(e) => {
                    const validatedValue = validateDecimalInput(e.target.value, currentTransferUnitPrice);
                    setCurrentTransferUnitPrice(validatedValue);
                    setTransferPriceError(getValidationError(validatedValue, 'price'));
                  }}
                  sx={{ width: 120 }}
                  error={!!transferPriceError}
                  helperText={transferPriceError}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddTransferItem}
                  disabled={!currentTransferProduct || !!transferQuantityError || !!transferPriceError}
                >
                  Ajouter
                </Button>
              </Box>
              {transferItems.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produit</TableCell>
                        <TableCell align="right">Quantité</TableCell>
                        <TableCell align="right">Prix Unitaire</TableCell>
                        <TableCell align="right">Prix Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transferItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.product)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.unit_price}</TableCell>
                          <TableCell align="right">{item.total_price}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleRemoveTransferItem(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucun produit ajouté. Utilisez le formulaire ci-dessus pour ajouter des produits à ce transfert.
                </Alert>
              )}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={openTransferScanner}
                >
                  Scanner un Produit
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferDialog}>Annuler</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitTransfer}
            disabled={!sourceZone || !targetZone || sourceZone === targetZone || transferItems.length === 0}
          >
            {selectedTransfer ? 'Mettre à jour' : 'Créer'} le Transfert
          </Button>
        </DialogActions>
      </Dialog>
      {/* Inventory Count Dialog */}
      <Dialog
        open={inventoryDialogOpen}
        onClose={handleCloseInventoryDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedInventory ? 'Modifier' : 'Nouvel'} Inventaire</DialogTitle> {/* Dynamic Title */}
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}> {/* Adjust grid size */}
              <FormControl fullWidth required>
                <InputLabel>Emplacement</InputLabel>
                <Select
                  value={inventoryZone}
                  onChange={(e) => setInventoryZone(e.target.value as number)}
                  label="Emplacement"
                >
                  <MenuItem value="">
                    <em>Sélectionner un emplacement</em>
                  </MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}> {/* Add Status Field */}
              <FormControl fullWidth required>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={inventoryStatus}
                  onChange={(e) => setInventoryStatus(e.target.value as InventoryType['status'])}
                  label="Statut"
                >
                  <MenuItem value="draft">Brouillon</MenuItem>
                  <MenuItem value="in_progress">En cours</MenuItem>
                  <MenuItem value="completed">Terminé</MenuItem>
                  <MenuItem value="cancelled">Annulé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Produits et Quantités
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth sx={{ flexGrow: 1 }}>
                  <InputLabel>Produit</InputLabel>
                  <Select
                    value={currentInventoryProduct?.id || ''}
                    onChange={(e) => {
                      const productId = e.target.value as number;
                      const product = products.find(p => p.id === productId);
                      setCurrentInventoryProduct(product || null);
                      // Auto-fill unit price for inventory from product purchase price
                      setCurrentInventoryUnitPrice(product?.purchase_price ?? 0);
                    }}
                    label="Produit"
                  >
                    <MenuItem value="">
                      <em>Sélectionner un produit</em>
                    </MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Quantité"
                  type="text"
                  value={formatNumberDisplay(currentInventoryQuantity)}
                  onChange={(e) => {
                    const validatedValue = validateIntegerInput(e.target.value, currentInventoryQuantity);
                    setCurrentInventoryQuantity(validatedValue);
                    setInventoryQuantityError(getValidationError(validatedValue, 'quantity'));
                  }}
                  sx={{ width: 120 }}
                  error={!!inventoryQuantityError}
                  helperText={inventoryQuantityError}
                />
                <TextField
                  label="Prix Unitaire"
                  type="text"
                  value={formatNumberDisplay(currentInventoryUnitPrice)}
                  onChange={(e) => {
                    const validatedValue = validateDecimalInput(e.target.value, currentInventoryUnitPrice);
                    setCurrentInventoryUnitPrice(validatedValue);
                    setInventoryPriceError(getValidationError(validatedValue, 'price'));
                  }}
                  sx={{ width: 120 }}
                  error={!!inventoryPriceError}
                  helperText={inventoryPriceError}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddInventoryItem}
                  disabled={!currentInventoryProduct || !!inventoryQuantityError || !!inventoryPriceError}
                >
                  Ajouter
                </Button>
              </Box>
              {inventoryItems.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produit</TableCell>
                        <TableCell align="right">Quantité comptée</TableCell>
                        <TableCell align="right">Prix Unitaire</TableCell>
                        <TableCell align="right">Prix Total</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.product)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.unit_price}</TableCell>
                          <TableCell align="right">{item.total_price}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleRemoveInventoryItem(index)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Aucun produit ajouté. Utilisez le formulaire ci-dessus pour ajouter des produits à cet inventaire.
                </Alert>
              )}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={openInventoryScanner}
                >
                  Scanner un Produit
                </Button>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Note : Pour les produits non trouvés lors du scan, vous pouvez les ajouter manuellement. Les articles avec une quantité de 0 seront enregistrés comme étant en rupture de stock.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInventoryDialog}>Annuler</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitInventory}
            disabled={!inventoryZone || inventoryItems.length === 0}
          >
            {selectedInventory ? 'Mettre à jour' : 'Créer'} l'Inventaire {/* Dynamic Button Text */}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            {itemToDelete?.type === 'supply' && 'Êtes-vous sûr de vouloir supprimer cet approvisionnement ? Cette action ne peut pas être annulée.'}
            {itemToDelete?.type === 'transfer' && 'Êtes-vous sûr de vouloir supprimer ce transfert ? Cette action ne peut pas être annulée.'}
            {itemToDelete?.type === 'inventory' && 'Êtes-vous sûr de vouloir supprimer cet inventaire ? Cette action ne peut pas être annulée.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Annuler</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
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