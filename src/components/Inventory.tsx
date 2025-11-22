import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Snackbar, Alert, Paper, useTheme } from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { useInventoryData } from '../hooks/useInventoryData';
import { useInventoryFilters } from '../hooks/useInventoryFilters';
import { useInventoryDialog } from '../hooks/useInventoryDialog';
import { useQRScanner } from '../hooks/useQRScanner';
import { StockTab, SuppliesTab, TransfersTab, InventoriesTab, StockCardsTab, InventoryDialogManager, QRScanner } from './inventory/index';
import PermissionGuard from './PermissionGuard';
import type { SupplyFormData, TransferFormData, InventoryFormData } from '../utils/inventoryUtils';

const Inventory: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0])); // Track which tabs have been loaded
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track initial loading
  
  const inventoryData = useInventoryData();
  const inventoryFilters = useInventoryFilters({ stocks: inventoryData.stocks, supplies: inventoryData.supplies, transfers: inventoryData.transfers, inventories: inventoryData.inventories, stockCards: inventoryData.stockCards, zones: inventoryData.zones, products: inventoryData.products, suppliers: inventoryData.suppliers });
  const inventoryDialog = useInventoryDialog({ products: inventoryData.products, onSuccess: (m) => setSnackbar({ open: true, message: m, severity: 'success' }), onError: (m) => setSnackbar({ open: true, message: m, severity: 'error' }) });
  const qrScanner = useQRScanner(inventoryData.products, (p, q) => { inventoryDialog.addItem(p, q); });
  
  // Initial load - only essential data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('📦 Loading initial inventory data...');
        setIsInitialLoading(true);
        // Set loading to false in inventoryData to prevent spinner
        inventoryData.setLoading(false);
        
        // Load only essential data for the first tab (Stock)
        await Promise.all([
          inventoryData.fetchStocks(),
          inventoryData.fetchZones(),
          inventoryData.fetchProducts()
        ]);
        console.log('✅ Initial inventory data loaded');
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Lazy load data when tab changes
  useEffect(() => {
    if (loadedTabs.has(activeTab)) {
      console.log(`📋 Tab ${activeTab} already loaded, skipping`);
      return; // Already loaded
    }
    
    const loadTabData = async () => {
      try {
        console.log(`📦 Loading data for tab ${activeTab}...`);
        switch (activeTab) {
          case 1: // Réceptions
            await Promise.all([
              inventoryData.fetchSupplies(),
              inventoryData.fetchSuppliers() // Only needed for Supplies tab
            ]);
            console.log('✅ Supplies and suppliers loaded');
            break;
          case 2: // Transferts
            await inventoryData.fetchTransfers();
            console.log('✅ Transfers loaded');
            break;
          case 3: // Inventaires
            await inventoryData.fetchInventories();
            console.log('✅ Inventories loaded');
            break;
          case 4: // Fiches de Stock
            await inventoryData.fetchStockCards();
            console.log('✅ Stock cards loaded');
            break;
        }
        setLoadedTabs(prev => new Set(prev).add(activeTab));
      } catch (error) {
        console.error(`❌ Error loading data for tab ${activeTab}:`, error);
      }
    };
    
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  
  return (
    <PermissionGuard requiredPermission="view_stock" fallbackPath="/dashboard">
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.primary.main,
              borderBottom: `2px solid ${theme.palette.primary.light}`,
              pb: 1,
              width: 'fit-content',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <InventoryIcon />
            Gestion de Stock
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les stocks, réceptions, transferts et inventaires
          </Typography>
        </Box>
        
        <Paper sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                px: 3,
                pt: 2,
                '& .MuiTab-root': {
                  fontWeight: 'medium',
                  py: 2
                }
              }}
            >
              <Tab label="Stock Actuel" />
              <Tab label="Réceptions" />
              <Tab label="Transferts" />
              <Tab label="Inventaires" />
              <Tab label="Fiches de Stock" />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <StockTab 
                stocks={inventoryFilters.filteredStocks} 
                loading={isInitialLoading}
                zones={inventoryData.zones}
                {...inventoryFilters.stockFilters}
              />
            )}
            
            {activeTab === 1 && (
              <SuppliesTab 
                supplies={inventoryFilters.filteredSupplies} 
                loading={isInitialLoading}
                zones={inventoryData.zones}
                suppliers={inventoryData.suppliers}
                {...inventoryFilters.supplyFilters}
                onAdd={() => inventoryDialog.openDialog('supply')} 
                onEdit={(s) => inventoryDialog.openDialog('supply', s)} 
                onDelete={(id) => inventoryData.deleteSupply(id)} 
              />
            )}
            
            {activeTab === 2 && (
              <TransfersTab 
                transfers={inventoryFilters.filteredTransfers} 
                loading={isInitialLoading}
                zones={inventoryData.zones}
                {...inventoryFilters.transferFilters}
                onAdd={() => inventoryDialog.openDialog('transfer')} 
                onEdit={(t) => inventoryDialog.openDialog('transfer', t)} 
                onDelete={(id) => inventoryData.deleteTransfer(id)} 
              />
            )}
            
            {activeTab === 3 && (
              <InventoriesTab 
                inventories={inventoryFilters.filteredInventories} 
                loading={isInitialLoading}
                zones={inventoryData.zones}
                {...inventoryFilters.inventoryFilters}
                onAdd={() => inventoryDialog.openDialog('inventory')} 
                onEdit={(i) => inventoryDialog.openDialog('inventory', i)} 
                onDelete={(id) => inventoryData.deleteInventory(id)} 
              />
            )}
            
            {activeTab === 4 && (
              <StockCardsTab 
                stockCards={inventoryFilters.filteredStockCards} 
                loading={isInitialLoading}
                zones={inventoryData.zones}
                {...inventoryFilters.stockCardFilters}
              />
            )}
          </Box>
        </Paper>
        
        <InventoryDialogManager 
          dialog={inventoryDialog} 
          products={inventoryData.products} 
          zones={inventoryData.zones} 
          suppliers={inventoryData.suppliers} 
          isViewMode={
            inventoryDialog.editMode && inventoryDialog.selectedItem && (
              inventoryDialog.selectedItem.status === 'received' || 
              inventoryDialog.selectedItem.status === 'completed'
            )
          }
          onOpenScanner={qrScanner.openScanner}
          onSubmit={async (operation, editMode, formData, selectedItemId) => {
            try {
              if (operation === 'supply') {
                if (editMode && selectedItemId) {
                  await inventoryData.updateSupply(selectedItemId, formData as SupplyFormData);
                  setSnackbar({ open: true, message: 'Réception mise à jour avec succès', severity: 'success' });
                } else {
                  await inventoryData.createSupply(formData as SupplyFormData);
                  setSnackbar({ open: true, message: 'Réception créée avec succès', severity: 'success' });
                }
              } else if (operation === 'transfer') {
                if (editMode && selectedItemId) {
                  await inventoryData.updateTransfer(selectedItemId, formData as TransferFormData);
                  setSnackbar({ open: true, message: 'Transfert mis à jour avec succès', severity: 'success' });
                } else {
                  await inventoryData.createTransfer(formData as TransferFormData);
                  setSnackbar({ open: true, message: 'Transfert créé avec succès', severity: 'success' });
                }
              } else if (operation === 'inventory') {
                if (editMode && selectedItemId) {
                  await inventoryData.updateInventory(selectedItemId, formData as InventoryFormData);
                  setSnackbar({ open: true, message: 'Inventaire mis à jour avec succès', severity: 'success' });
                } else {
                  await inventoryData.createInventory(formData as InventoryFormData);
                  setSnackbar({ open: true, message: 'Inventaire créé avec succès', severity: 'success' });
                }
              }
            } catch (error: unknown) {
              const err = error as {response?: {data?: {error?: string}}, message?: string};
              const errorMessage = err?.response?.data?.error || err?.message || 'Une erreur est survenue';
              setSnackbar({ open: true, message: errorMessage, severity: 'error' });
              throw error; // Re-throw to prevent dialog from closing
            }
          }}
        />
        
        <QRScanner scanner={qrScanner} />
        
        <Snackbar 
          open={snackbar.open} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </PermissionGuard>
  );
};
export default Inventory;
