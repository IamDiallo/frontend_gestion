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
import { 
  SalesTab, 
  InvoicesTab, 
  QuotesTab, 
  SalesDialogs 
} from './sales/index';

// Services et utilitaires
import PermissionGuard from './PermissionGuard';
import { printFacture, printDevis } from '../utils/printUtils';
import type { Facture, Devis } from '../utils/printUtils';

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

  // Print handlers
  const handlePrintInvoice = (invoice: any) => {
    try {
      // Find client name
      const client = salesData.clients.find(c => c.id === invoice.client);
      
      // Map invoice data to print format
      const printData: Facture = {
        id: invoice.id,
        reference: invoice.reference,
        date: invoice.date,
        due_date: invoice.due_date,
        client_name: client?.name || 'N/A',
        client_phone: client?.phone,
        client_email: client?.email,
        sale_reference: invoice.sale_reference,
        amount: invoice.amount,
        paid_amount: invoice.paid_amount,
        balance: invoice.balance,
        status: invoice.status,
        notes: invoice.notes,
        items: invoice.items || []
      };
      
      printFacture(printData);
      handleSuccess('Impression de la facture en cours...');
    } catch (error) {
      console.error('Error printing invoice:', error);
      handleError('Erreur lors de l\'impression de la facture');
    }
  };

  const handlePrintQuote = (quote: any) => {
    try {
      // Find client name
      const client = salesData.clients.find(c => c.id === quote.client);
      
      // Map quote data to print format
      const printData: Devis = {
        id: quote.id,
        reference: quote.reference,
        date: quote.date,
        expiry_date: quote.expiry_date,
        client_name: client?.name || 'N/A',
        client_phone: client?.phone,
        client_email: client?.email,
        total_amount: quote.total_amount,
        status: quote.status,
        notes: quote.notes,
        items: quote.items || []
      };
      
      printDevis(printData);
      handleSuccess('Impression du devis en cours...');
    } catch (error) {
      console.error('Error printing quote:', error);
      handleError('Erreur lors de l\'impression du devis');
    }
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
                onPrint={handlePrintInvoice}
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
                onPrint={handlePrintQuote}
                onConvert={(quote) => salesDialogs.openQuoteConversionDialog(quote)}
              />
            )}
          </Box>
        </Paper>

        {/* Dialog Manager */}
        <SalesDialogs
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
