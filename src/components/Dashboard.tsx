/**
 * Dashboard Component - REFACTORED VERSION
 * Main analytics dashboard with sales, products, inventory, and accounts tabs
 */

import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import DashboardFilters from './dashboard/DashboardFilters';
import StatsCards from './dashboard/StatsCards';
import SalesTab from './dashboard/SalesTab';
import ProductsTab from './dashboard/ProductsTab';
import InventoryTab from './dashboard/InventoryTab';
import AccountsTab from './dashboard/AccountsTab';
import SuppliersTab from './dashboard/SuppliersTab';

const Dashboard: React.FC = () => {
  // Custom hooks for state management
  const {
    loading,
    error,
    dashboardStats,
    reportData,
    lowStockProducts,
    inventoryStats,
    inventoryValueTrend,
    clientBalances,
    supplierBalances,
    loadAllData,
    setError
  } = useDashboardData();

  const {
    selectedPeriod,
    customStartDate,
    customEndDate,
    selectedTab,
    reportType,
    searchTerm,
    statusFilter,
    transactionTypeFilter,
    minAmount,
    maxAmount,
    sortOrder,
    startDate,
    endDate,
    dateRangeError,
    setSelectedPeriod,
    setCustomStartDate,
    setCustomEndDate,
    setSearchTerm,
    setStatusFilter,
    setTransactionTypeFilter,
    setMinAmount,
    setMaxAmount,
    setSortOrder,
    handleTabChange,
    resetFilters
  } = useDashboardFilters();

  // Load initial data
  useEffect(() => {
    loadAllData(reportType, selectedPeriod, startDate, endDate);
  }, [selectedTab, selectedPeriod, customStartDate, customEndDate, loadAllData, reportType, startDate, endDate]);

  // Handle data export
  const handleExportData = () => {
    try {
      // Prepare data based on current tab
      let dataToExport: unknown[] = [];
      let filename = '';

      switch (selectedTab) {
        case 0: // Sales
          dataToExport = reportData.monthly_data || [];
          filename = `ventes_${startDate}_${endDate}.json`;
          break;
        case 1: // Products
          dataToExport = lowStockProducts;
          filename = `produits_stock_bas_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 2: // Inventory
          dataToExport = inventoryValueTrend;
          filename = `inventaire_${startDate}_${endDate}.json`;
          break;
        case 3: // Accounts
          dataToExport = clientBalances;
          filename = `comptes_clients_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 4: // Suppliers
          dataToExport = supplierBalances;
          filename = `comptes_fournisseurs_${new Date().toISOString().split('T')[0]}.json`;
          break;
      }

      // Create blob and download
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Erreur lors de l\'exportation des données');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 700, 
            color: theme => theme.palette.primary.main,
            borderBottom: theme => `2px solid ${theme.palette.primary.light}`,
            pb: 1,
            width: 'fit-content',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Assessment sx={{ fontSize: 32 }} />
          Tableau de Bord
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Analysez vos ventes, produits, inventaire et comptes en temps réel
        </Typography>
      </Box>

      {/* Filters */}
      <DashboardFilters
        selectedPeriod={selectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onPeriodChange={setSelectedPeriod}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        transactionTypeFilter={transactionTypeFilter}
        minAmount={minAmount}
        maxAmount={maxAmount}
        sortOrder={sortOrder}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onTransactionTypeChange={setTransactionTypeFilter}
        onMinAmountChange={setMinAmount}
        onMaxAmountChange={setMaxAmount}
        onSortOrderChange={setSortOrder}
        onResetFilters={resetFilters}
        onExportData={handleExportData}
        dateRangeError={dateRangeError}
        showAdvancedFilters={true}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <StatsCards stats={dashboardStats} reportType={reportType} />

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Main Content Tabs */}
      {!loading && (
        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Ventes" />
            <Tab label="Produits" />
            <Tab label="Inventaire" />
            <Tab label="Comptes Clients" />
            <Tab label="Comptes Fournisseurs" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Sales Tab */}
            {selectedTab === 0 && <SalesTab reportData={reportData} totalRevenue={dashboardStats?.total_revenue} />}

            {/* Products Tab */}
            {selectedTab === 1 && (
              <ProductsTab reportData={reportData} lowStockProducts={lowStockProducts} />
            )}

            {/* Inventory Tab */}
            {selectedTab === 2 && (
              <InventoryTab
                inventoryStats={inventoryStats}
                inventoryValueTrend={inventoryValueTrend}
                lowStockProducts={lowStockProducts}
              />
            )}

            {/* Accounts Tab */}
            {selectedTab === 3 && (
              <AccountsTab
                clientBalances={clientBalances}
                searchTerm={searchTerm}
                minAmount={minAmount}
                maxAmount={maxAmount}
              />
            )}

            {/* Suppliers Tab */}
            {selectedTab === 4 && (
              <SuppliersTab
                supplierBalances={supplierBalances}
                searchTerm={searchTerm}
                minAmount={minAmount}
                maxAmount={maxAmount}
              />
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;
