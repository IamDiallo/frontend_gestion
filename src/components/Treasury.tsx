/**
 * Treasury Component - Refactorisé
 * Gestion de la trésorerie : clients, fournisseurs, comptes bancaires
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
  useTheme
} from '@mui/material';
import { AccountBalance as TreasuryIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Hooks personnalisés
import { useTreasuryData } from '../hooks/useTreasuryData';
import { useTreasuryDialogs } from '../hooks/useTreasuryDialogs';

// Composants modulaires
import {
  ClientsTab,
  SuppliersTab,
  AccountsTab
} from './treasury/index';
import { TreasuryDialogsManager } from './treasury/TreasuryDialogsManager';

// Services et utilitaires
import PermissionGuard from './PermissionGuard';
import { OutstandingSale, OutstandingSupply } from '../interfaces/business';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`treasury-tabpanel-${index}`}
      aria-labelledby={`treasury-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const Treasury: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set([0])); // Track loaded tabs
  
  // State for balance change animation
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [balanceChangeHighlight, setBalanceChangeHighlight] = useState(false);

  // =============================================================================
  // HOOKS PERSONNALISÉS
  // =============================================================================
  
  // Gestion des données (API calls, CRUD operations)
  const {
    // Data states
    clients,
    suppliers,
    accounts,
    paymentMethods,
    clientBalanceData,
    supplierBalanceData,
    allClientTransactions,
    allSupplierTransactions,
    
    // Loading states
    loading,
    
    // Selected entities
    selectedClient,
    setSelectedClient,
    selectedSupplier,
    setSelectedSupplier,
    
    // CRUD operations
    getClientBalance,
    getAllClientTransactions,
    getSupplierBalance,
    getAllSupplierTransactions,
    createClientDeposit,
    createClientPayment,
    createSupplierPayment,
    fetchClients,
    fetchSuppliers,
    fetchAccounts,
    fetchResources
  } = useTreasuryData();

  // Gestion des dialogues (modals, forms)
  const {
    // Payment dialog
    paymentDialog,
    openPaymentDialog,
    closePaymentDialog,
    updatePaymentDialog,
    
    // Supplier payment dialog
    supplierPaymentDialog,
    openSupplierPaymentDialog,
    closeSupplierPaymentDialog,
    updateSupplierPaymentDialog,
    
    // Deposit dialog
    depositDialog,
    openDepositDialog, // TODO: Add deposit button to ClientsTab
    closeDepositDialog,
    updateDepositDialog,
    
    // Validation
    validatePayment,
    validateSupplierPayment,
    validateDeposit
  } = useTreasuryDialogs();

  // Extraire les données des balances
  const clientBalance = clientBalanceData ? {
    total_sales: clientBalanceData.total_sales,
    total_account_credits: clientBalanceData.total_account_credits,
    balance: clientBalanceData.balance
  } : null;
  const outstandingSales = clientBalanceData?.outstanding_sales || [];
  // Use specific client transactions if a client is selected, otherwise use all client transactions
  const clientTransactions = selectedClient 
    ? (clientBalanceData?.statements || []) 
    : allClientTransactions;

  const supplierBalance = supplierBalanceData ? {
    total_purchases: supplierBalanceData.total_purchases,
    total_account_credits: supplierBalanceData.total_account_credits,
    balance: supplierBalanceData.balance
  } : null;
  const outstandingSupplies = supplierBalanceData?.outstanding_supplies || [];
  // Use specific supplier transactions if a supplier is selected, otherwise use all supplier transactions
  const supplierTransactions = selectedSupplier 
    ? (supplierBalanceData?.statements || []) 
    : allSupplierTransactions;

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Chargement initial des données - essentielles uniquement
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load basic data needed for all tabs
        await Promise.all([
          fetchClients(),
          fetchSuppliers(),
          fetchAccounts(),
          fetchResources()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lazy load tab-specific data when tab changes
  useEffect(() => {
    if (loadedTabs.has(currentTab)) return; // Already loaded
    
    const loadTabData = async () => {
      try {
        switch (currentTab) {
          case 0: // Clients
            if (!selectedClient) {
              await getAllClientTransactions();
            }
            break;
          case 1: // Fournisseurs
            if (!selectedSupplier) {
              await getAllSupplierTransactions();
            }
            break;
          case 2: // Comptes
            // Account movements loaded on demand when account is selected
            break;
        }
        setLoadedTabs(prev => new Set(prev).add(currentTab));
      } catch (error) {
        console.error(`Error loading data for tab ${currentTab}:`, error);
      }
    };
    
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);

  // Debug: Logger les données chargées
  useEffect(() => {
    console.log('Treasury Data Loaded:', {
      clientsCount: clients.length,
      suppliersCount: suppliers.length,
      accountsCount: accounts.length,
      loading
    });
  }, [clients, suppliers, accounts, loading]);

  // Charger les données client quand un client est sélectionné
  useEffect(() => {
    if (selectedClient?.id) {
      getClientBalance(selectedClient.id);
    } else {
      // Load all client transactions when no specific client is selected
      getAllClientTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient?.id]);

  // Charger les données fournisseur quand un fournisseur est sélectionné
  useEffect(() => {
    if (selectedSupplier?.id) {
      getSupplierBalance(selectedSupplier.id);
    } else {
      // Load all supplier transactions when no specific supplier is selected
      getAllSupplierTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplier?.id]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleClientSelection = (clientId: number | null) => {
    if (!clientId) {
      setSelectedClient(null);
      return;
    }

    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
  };

  const handleSupplierSelection = (supplierId: number | null) => {
    if (!supplierId) {
      setSelectedSupplier(null);
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    setSelectedSupplier(supplier || null);
  };

  const handlePaymentClick = (sale: OutstandingSale) => {
    openPaymentDialog(sale);
  };

  const handleSupplierPaymentClick = (supply: OutstandingSupply) => {
    openSupplierPaymentDialog(supply);
  };

  // =============================================================================
  // DIALOG HANDLERS
  // =============================================================================

  const handlePaymentSubmit = async () => {
    console.log('🔵 Payment Submit Called');
    console.log('🔵 Payment Dialog:', paymentDialog);
    console.log('🔵 Validate Payment:', validatePayment());
    
    if (!validatePayment()) {
      enqueueSnackbar('Veuillez remplir tous les champs requis', { variant: 'error' });
      console.error('❌ Validation failed');
      return;
    }

    try {
      console.log('✅ Validation passed, processing payment...');
      
      if (!paymentDialog.sale) {
        enqueueSnackbar('Vente non sélectionnée', { variant: 'error' });
        return;
      }

      // Use first available company account if none selected
      const companyAccount = paymentDialog.account || accounts[0];
      if (!companyAccount || !companyAccount.id) {
        enqueueSnackbar('Aucun compte disponible', { variant: 'error' });
        return;
      }

      console.log('📤 Sending payment:', {
        saleId: paymentDialog.sale.id,
        amount: parseFloat(paymentDialog.amount),
        accountId: companyAccount.id,
        description: paymentDialog.description
      });

      // Store previous balance before payment
      const currentBalance = clientBalanceData?.balance || 0;
      setPreviousBalance(currentBalance);

      await createClientPayment(
        paymentDialog.sale.id,
        parseFloat(paymentDialog.amount),
        companyAccount.id,
        paymentDialog.description
      );

      enqueueSnackbar('Paiement enregistré avec succès', { variant: 'success' });
      closePaymentDialog();
      
      // Trigger balance change highlight animation
      setBalanceChangeHighlight(true);
      setTimeout(() => setBalanceChangeHighlight(false), 3000);
      
      // Refresh client balance
      if (selectedClient?.id) {
        await getClientBalance(selectedClient.id);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      enqueueSnackbar('Erreur lors du traitement du paiement', { variant: 'error' });
    }
  };

  const handleSupplierPaymentSubmit = async () => {
    console.log('🟡 Supplier Payment Submit Called');
    console.log('🟡 Supplier Payment Dialog:', supplierPaymentDialog);
    console.log('🟡 Validate Supplier Payment:', validateSupplierPayment());
    
    if (!validateSupplierPayment()) {
      enqueueSnackbar('Veuillez remplir tous les champs requis', { variant: 'error' });
      console.error('❌ Supplier validation failed');
      return;
    }

    try {
      console.log('✅ Supplier validation passed, processing payment...');
      
      if (!supplierPaymentDialog.supply) {
        enqueueSnackbar('Approvisionnement non sélectionné', { variant: 'error' });
        return;
      }

      // Use first available company account if none selected
      const companyAccount = supplierPaymentDialog.account || accounts[0];
      if (!companyAccount || !companyAccount.id) {
        enqueueSnackbar('Aucun compte disponible', { variant: 'error' });
        return;
      }

      console.log('📤 Sending supplier payment:', {
        supplyId: supplierPaymentDialog.supply.id,
        amount: parseFloat(supplierPaymentDialog.amount),
        accountId: companyAccount.id,
        description: supplierPaymentDialog.description
      });

      // Store previous balance before payment
      const currentBalance = supplierBalanceData?.balance || 0;
      setPreviousBalance(currentBalance);

      await createSupplierPayment(
        supplierPaymentDialog.supply.id,
        parseFloat(supplierPaymentDialog.amount),
        companyAccount.id,
        supplierPaymentDialog.description
      );

      enqueueSnackbar('Paiement fournisseur enregistré avec succès', { variant: 'success' });
      closeSupplierPaymentDialog();
      
      // Trigger balance change highlight animation
      setBalanceChangeHighlight(true);
      setTimeout(() => setBalanceChangeHighlight(false), 3000);
      
      // Refresh supplier balance
      if (selectedSupplier?.id) {
        await getSupplierBalance(selectedSupplier.id);
      }
    } catch (error) {
      console.error('Error processing supplier payment:', error);
      enqueueSnackbar('Erreur lors du traitement du paiement', { variant: 'error' });
    }
  };

  const handleDepositSubmit = async () => {
    if (!validateDeposit()) {
      enqueueSnackbar('Veuillez remplir tous les champs requis', { variant: 'error' });
      return;
    }

    try {
      if (!depositDialog.client || !depositDialog.account || !depositDialog.payment_method) return;

      // Store previous balance before deposit
      const currentBalance = clientBalanceData?.balance || 0;
      setPreviousBalance(currentBalance);

      await createClientDeposit({
        client: depositDialog.client.id,
        account: depositDialog.account.id!,
        amount: parseFloat(depositDialog.amount),
        payment_method: depositDialog.payment_method,
        date: depositDialog.date,
        description: depositDialog.description
      });

      enqueueSnackbar('Dépôt enregistré avec succès', { variant: 'success' });
      closeDepositDialog();
      
      // Trigger balance change highlight animation
      setBalanceChangeHighlight(true);
      setTimeout(() => setBalanceChangeHighlight(false), 3000);
      
      // Refresh client balance
      if (selectedClient?.id) {
        await getClientBalance(selectedClient.id);
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      enqueueSnackbar('Erreur lors du traitement du dépôt', { variant: 'error' });
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <PermissionGuard requiredPermission="view_cashreceipt" fallbackPath="/dashboard">
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
            <TreasuryIcon />
            Trésorerie
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les paiements clients, fournisseurs et comptes bancaires
          </Typography>
        </Box>

        <Paper sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="treasury tabs"
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
              <Tab label="Clients" />
              <Tab label="Fournisseurs" />
              <Tab label="Comptes bancaires" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ p: 3 }}>
            {/* Clients Tab */}
            <TabPanel value={currentTab} index={0}>
              <ClientsTab
                clients={clients}
                selectedClient={selectedClient}
                onClientChange={handleClientSelection}
                onPaymentClick={handlePaymentClick}
                onDepositClick={openDepositDialog}
                clientBalance={clientBalance}
                outstandingSales={outstandingSales}
                transactions={clientTransactions}
                loading={loading}
                clientBalanceData={clientBalanceData || undefined}
                previousBalance={previousBalance}
                balanceChangeHighlight={balanceChangeHighlight}
              />
            </TabPanel>

            {/* Suppliers Tab */}
            <TabPanel value={currentTab} index={1}>
              <SuppliersTab
                suppliers={suppliers}
                selectedSupplier={selectedSupplier}
                onSupplierChange={handleSupplierSelection}
                onPaymentClick={handleSupplierPaymentClick}
                supplierBalance={supplierBalance}
                outstandingSupplies={outstandingSupplies}
                transactions={supplierTransactions}
                loading={loading}
                supplierBalanceData={supplierBalanceData || undefined}
                previousBalance={previousBalance}
                balanceChangeHighlight={balanceChangeHighlight}
              />
            </TabPanel>

            {/* Accounts Tab */}
            <TabPanel value={currentTab} index={2}>
              <AccountsTab
                accounts={accounts}
                onAccountClick={(account) => {
                  enqueueSnackbar(`Compte sélectionné: ${account.name}`, { variant: 'info' });
                }}
                loading={loading}
              />
            </TabPanel>
          </Box>
        </Paper>

        {/* Dialogs Manager */}
        <TreasuryDialogsManager
          paymentDialog={paymentDialog}
          onPaymentDialogClose={closePaymentDialog}
          onPaymentDialogChange={updatePaymentDialog}
          onPaymentSubmit={handlePaymentSubmit}
          supplierPaymentDialog={supplierPaymentDialog}
          onSupplierPaymentDialogClose={closeSupplierPaymentDialog}
          onSupplierPaymentDialogChange={updateSupplierPaymentDialog}
          onSupplierPaymentSubmit={handleSupplierPaymentSubmit}
          depositDialog={depositDialog}
          onDepositDialogClose={closeDepositDialog}
          onDepositDialogChange={updateDepositDialog}
          onDepositSubmit={handleDepositSubmit}
          clients={clients}
          accounts={accounts}
          paymentMethods={paymentMethods}
          loading={loading}
        />
      </Box>
    </PermissionGuard>
  );
};

export default Treasury;
