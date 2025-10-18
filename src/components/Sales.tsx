/**
 * Sales Component - Refactorisé
 * Gestion des ventes : ventes, factures, devis
 * 
 * Architecture :
 * - Hooks personnalisés pour la logique métier
 * - Composants modulaires pour l'UI
 * - Séparation claire des responsabilités
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import { ShoppingCart as SalesIcon } from '@mui/icons-material';

// Hooks personnalisés
import { useSalesData } from '../hooks/useSalesData';
import { useSalesFilters } from '../hooks/useSalesFilters';
import { useSalesDialogs } from '../hooks/useSalesDialogs';

// Composants modulaires  
import SalesTab from './sales/SalesTab';
import InvoicesTab from './sales/InvoicesTab';
import QuotesTab from './sales/QuotesTab';
import SaleDialogManager from './sales/SaleDialogManager';  

// Services et utilitaires
import PermissionGuard from './PermissionGuard';

const Sales: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // =============================================================================
  // HOOKS PERSONNALISÉS
  // =============================================================================

  // Gestion des données (API calls, CRUD operations)
  const salesData = useSalesData();

  // Gestion des filtres
  const salesFilters = useSalesFilters({
    sales: salesData.sales,
    invoices: salesData.invoices,
    quotes: salesData.quotes,
    clients: salesData.clients
  });

  // Gestion des dialogues (modals, forms)
  const salesDialogs = useSalesDialogs();

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    salesData.refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products with stock when zone changes
  useEffect(() => {
    if (salesDialogs.saleDialog.selectedZone) {
      salesData.fetchProductsWithStock(salesDialogs.saleDialog.selectedZone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesDialogs.saleDialog.selectedZone]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSuccess = (message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const handleError = (message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <PermissionGuard requiredPermission="view_sale" fallbackPath="/dashboard">
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
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
            <SalesIcon />
            Gestion des Ventes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les ventes, factures et devis
          </Typography>
        </Box>

        {/* Main Content */}
        <Paper sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={(_, v) => setCurrentTab(v)}
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
              <Tab label="Ventes" />
              <Tab label="Factures" />
              <Tab label="Devis" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 0 && (
              <SalesTab
                sales={salesFilters.filteredSales}
                loading={salesData.loading}
                clients={salesData.clients}
                zones={salesData.zones}
                searchTerm={salesFilters.salesFilters.searchTerm}
                setSearchTerm={salesFilters.salesFilters.setSearchTerm}
                statusFilter={salesFilters.salesFilters.statusFilter}
                setStatusFilter={salesFilters.salesFilters.setStatusFilter}
                dateFilter=""
                setDateFilter={() => {}}
                onAdd={() => salesDialogs.openSaleDialog('add')}
                onEdit={(sale) => salesDialogs.openSaleDialog('edit', sale)}
                onDelete={(sale) => salesDialogs.openDeleteDialog('sale', sale)}
                onOpenScanner={() => setSnackbar({ open: true, message: 'QR Scanner à implémenter', severity: 'info' })}
              />
            )}

            {currentTab === 1 && (
              <InvoicesTab
                invoices={salesFilters.filteredInvoices}
                loading={salesData.invoiceLoading}
                clients={salesData.clients}
                searchTerm={salesFilters.invoiceFilters.invoiceSearchTerm}
                setSearchTerm={salesFilters.invoiceFilters.setInvoiceSearchTerm}
                statusFilter={salesFilters.invoiceFilters.invoiceStatusFilter}
                setStatusFilter={salesFilters.invoiceFilters.setInvoiceStatusFilter}
                dateFilter={salesFilters.invoiceFilters.invoiceDateFilter}
                setDateFilter={salesFilters.invoiceFilters.setInvoiceDateFilter}
                onAdd={() => salesDialogs.openInvoiceDialog('add')}
                onEdit={(invoice) => salesDialogs.openInvoiceDialog('edit', invoice)}
                onDelete={(invoice) => salesDialogs.openDeleteDialog('invoice', invoice)}
                onPrint={() => setSnackbar({ open: true, message: 'Impression à implémenter', severity: 'info' })}
              />
            )}

            {currentTab === 2 && (
              <QuotesTab
                quotes={salesFilters.filteredQuotes}
                loading={salesData.quoteLoading}
                clients={salesData.clients}
                searchTerm={salesFilters.quoteFilters.quoteSearchTerm}
                setSearchTerm={salesFilters.quoteFilters.setQuoteSearchTerm}
                statusFilter={salesFilters.quoteFilters.quoteStatusFilter}
                setStatusFilter={salesFilters.quoteFilters.setQuoteStatusFilter}
                dateFilter={salesFilters.quoteFilters.quoteDateFilter}
                setDateFilter={salesFilters.quoteFilters.setQuoteDateFilter}
                onAdd={() => salesDialogs.openQuoteDialog('add')}
                onEdit={(quote) => salesDialogs.openQuoteDialog('edit', quote)}
                onDelete={(quote) => salesDialogs.openDeleteDialog('quote', quote)}
                onPrint={() => setSnackbar({ open: true, message: 'Impression à implémenter', severity: 'info' })}
                onConvert={(quote) => salesDialogs.openQuoteConversionDialog(quote)}
              />
            )}
          </Box>
        </Paper>

        {/* Dialog Manager */}
        <SaleDialogManager
          dialogs={salesDialogs}
          data={salesData}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {/* Snackbar for notifications */}
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
    </PermissionGuard>
  );
};

export default Sales;
