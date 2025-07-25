import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Paper, Typography, Tabs, Tab, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, CircularProgress,
  Snackbar, Alert, AlertTitle, IconButton, TablePagination,
  Autocomplete, Card, CardContent,
  Divider, Chip, Stack, Tooltip, Avatar,
  Grow, Slide, InputAdornment
} from '@mui/material';
import { DataGrid, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import PrintIcon from '@mui/icons-material/Print';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import MoneyIcon from '@mui/icons-material/Money';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WarningIcon from '@mui/icons-material/Warning';

import { useSnackbar } from 'notistack';
import { ClientsAPI, SettingsAPI, TreasuryAPI, SalesAPI, AccountsAPI } from '../services/api';
import { Client, Account, ClientDeposit, TabPanelProps, ClientAccountBalance, OutstandingSale, AccountStatement } from '../interfaces/business';
import { AccountTransfer } from '../interfaces/financial';
import { 
  validateDecimalInput, 
  formatNumberDisplay, 
  getValidationError,
  validateAmountInput,
  getAmountValidationError 
} from '../utils/inputValidation';



// Styled components for better visuals
const StyledPaper = styled(Paper)(() => ({
  borderRadius: 12,
  boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
  overflow: 'hidden',
}));

const ClientInfoCard = styled(Card)(() => ({
  borderRadius: 12,
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
  },
}));

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
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `treasury-tab-${index}`,
    'aria-controls': `treasury-tabpanel-${index}`,
  };
}

const Treasury = () => {

  const [tabValue, setTabValue] = useState(0);
  // Client account management state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientBalanceData, setClientBalanceData] = useState<ClientAccountBalance | null>(null);
  const [loadingClientData, setLoadingClientData] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  // Add client pagination state
  const [clientPage, setClientPage] = useState(0);
  const [clientRowsPerPage, setClientRowsPerPage] = useState(6);

  // Payment related state variables
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<OutstandingSale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);


  // New client deposit state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [newDeposit, setNewDeposit] = useState<ClientDeposit>({
    client: null,
    account: null,
    amount: 0,
    payment_method: null,
    date: new Date().toISOString().split('T')[0],
    description: 'Dépôt sur compte'
  });

  // Resources needed for forms
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{id: number, name: string}>>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  // Add state for balance change feedback
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [balanceChangeHighlight, setBalanceChangeHighlight] = useState(false);

  // Account movements state
  const [accountMovements, setAccountMovements] = useState<AccountStatement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');  const [endDate, setEndDate] = useState<string>('');
  const [accountTransfer, setAccountTransfer] = useState<Partial<AccountTransfer>>({
    from_account: undefined,
    to_account: undefined,
    amount: 0,
    transfer_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [processingTransfer, setProcessingTransfer] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Use notistack hook for notifications
  const { enqueueSnackbar } = useSnackbar();
  
  // Account movements functions
  const fetchAllAccounts = useCallback(async () => {
    try {
      const data = await AccountsAPI.getAll();
      setAllAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Erreur lors du chargement des comptes.');
    }
  }, []);

  const fetchAccountMovements = useCallback(async () => {
    try {
      setLoadingMovements(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedAccount) {
        params.append('account', selectedAccount.id.toString());
      }
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      if (transactionTypeFilter) {
        params.append('transaction_type', transactionTypeFilter);
      }

      // Call the API
      let data: AccountStatement[] = [];
      if (selectedAccount) {
        data = await TreasuryAPI.getAccountStatements(selectedAccount.id) as AccountStatement[];
      } else {
        data = await TreasuryAPI.getAccountStatements() as AccountStatement[];
      }
      
      setAccountMovements(data);
    } catch (err) {
      console.error('Error fetching account movements:', err);
      setError('Erreur lors du chargement des mouvements de compte.');
      setAccountMovements([]);    } finally {
      setLoadingMovements(false);
    }
  }, [selectedAccount, startDate, endDate, transactionTypeFilter]);

  // Load data on component mount
  useEffect(() => {
    fetchClients();
  }, []);
  
  // Load resources when the deposit modal is opened
  useEffect(() => {
    if (showDepositModal) {
      fetchResources();
    }
  }, [showDepositModal]);
  
  // Load accounts when account movements tab is active
  useEffect(() => {
    if (tabValue === 1) {
      fetchAllAccounts();
      fetchAccountMovements();
    }
  }, [tabValue, fetchAllAccounts, fetchAccountMovements]);

  // Reload movements when filters change
  useEffect(() => {
    if (tabValue === 1) {
      fetchAccountMovements();
    }
  }, [tabValue, fetchAccountMovements]);

  // Filter clients for client tab
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.contact_person && client.contact_person.toLowerCase().includes(clientSearch.toLowerCase()))
  );
  
  // Get paginated client list
  const paginatedClients = filteredClients
    .slice(clientPage * clientRowsPerPage, clientPage * clientRowsPerPage + clientRowsPerPage);

  const handleCreateTransfer = async () => {
    try {
      setProcessingTransfer(true);
      setError(null);

      // Validate required fields
      if (!accountTransfer.from_account) {
        setError('Veuillez sélectionner le compte source');
        return;
      }
      if (!accountTransfer.to_account) {
        setError('Veuillez sélectionner le compte destination');
        return;
      }
      if (accountTransfer.from_account === accountTransfer.to_account) {
        setError('Le compte source et destination doivent être différents');
        return;
      }
      if (!accountTransfer.amount || accountTransfer.amount <= 0) {
        setError('Le montant doit être supérieur à 0');
        return;
      }

      // Generate reference if not provided
      const transfer = {
        ...accountTransfer,
        reference_number: accountTransfer.reference_number || `TR-${Date.now()}`
      };

      await TreasuryAPI.createAccountTransfer(transfer as AccountTransfer);
      
      enqueueSnackbar('Transfert créé avec succès', { variant: 'success' });
      setShowTransferModal(false);
      
      // Reset form
      setAccountTransfer({
        from_account: undefined,
        to_account: undefined,
        amount: 0,
        transfer_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: ''
      });
      
      // Refresh movements
      fetchAccountMovements();
    } catch (err) {
      console.error('Error creating transfer:', err);
      setError('Erreur lors de la création du transfert. Veuillez réessayer.');
    } finally {
      setProcessingTransfer(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'client_payment':
      case 'cash_receipt':
      case 'transfer_in':
      case 'sale':
      case 'deposit':
        return 'success';
      case 'supplier_payment':
      case 'cash_payment':
      case 'transfer_out':
      case 'expense':
      case 'purchase':
        return 'error';
      default:
        return 'default';
    }
  };


  // Fetch clients from API
  const fetchClients = async () => {
    try {
      const data = await ClientsAPI.getAll();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Erreur lors du chargement des clients. Veuillez réessayer plus tard.');
    }
  };

  // Fetch resources (accounts and payment methods)
  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const [accountsData, paymentMethodsData] = await Promise.all([
        TreasuryAPI.getAccounts(),
        SettingsAPI.getSettings('payment-methods')
      ]);
      setAccounts(accountsData);
      setPaymentMethods(paymentMethodsData);
      setLoadingResources(false);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Erreur lors du chargement des comptes et méthodes de paiement.');
      setLoadingResources(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Clear any errors when switching tabs
    setError(null);
  };

  // Handle payment from client account
  const handlePayFromAccount = async (): Promise<void> => {
    if (!selectedSaleForPayment || !selectedClient) return;
    
    try {
      setProcessingPayment(true);
      setError(null);
        
      // Check if this will be a credit payment
      const isCreditPayment = clientBalanceData && clientBalanceData.client.current_balance < paymentAmount;
      
      // If it's a credit payment, confirm with the user
      if (isCreditPayment) {
        const creditAmount = clientBalanceData 
          ? Math.abs(clientBalanceData.client.current_balance - paymentAmount)
          : paymentAmount;
          
        if (!window.confirm(`ATTENTION: Ce paiement dépassera le solde disponible du client et créera un crédit de ${formatCurrency(creditAmount)}. Voulez-vous continuer?`)) {
          setProcessingPayment(false);
          return;
        }
      }
        // Pay directly from account
      // Define the type for our enhanced API response
      interface EnhancedPaymentResponse {
        success: boolean;
        message: string;
        payment: {
          id: number;
          reference: string;
          amount: number;
          date: string;
        };
        sale: {
          id: number;
          reference: string;
          payment_status: string;
          workflow_state: string;
          status: string;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
        };
        client_balance: number;
        is_credit_payment: boolean;
      }
      
      const response = await SalesAPI.payFromAccount(
        selectedSaleForPayment.id,
        { 
          amount: paymentAmount,
          description: paymentDescription || `Paiement pour la vente ${selectedSaleForPayment.reference} depuis le compte client`
        }
      ) as EnhancedPaymentResponse;
      
        // Show success message with credit warning if applicable
      let successMsg = `Paiement de ${formatCurrency(response.payment.amount)} traité avec succès. Nouveau solde client: ${formatCurrency(response.client_balance)}`;
      
      // Add credit warning if this was a credit payment
      if (response.is_credit_payment) {
        successMsg = `⚠️ PAIEMENT À CRÉDIT: ${successMsg}`;
        // Also show a toast notification about the credit
        enqueueSnackbar(`Attention: Un crédit de ${formatCurrency(Math.abs(response.client_balance))} a été accordé à ce client`, { 
          variant: 'warning',
          autoHideDuration: 10000,
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
          }
        });
      }
      
      // Add information about partial payment
      if (response.sale.payment_status === 'partially_paid') {
        // Extract payment details from the response
        const paidAmount = response.sale.paid_amount;
        const totalAmount = response.sale.total_amount;
        const remainingAmount = response.sale.remaining_amount;
        
        // Add partial payment info to success message
        successMsg += `\nPaiement partiel: ${formatCurrency(paidAmount)} payé, ${formatCurrency(remainingAmount)} restant.`;
        
        // Show notification about partial payment
        enqueueSnackbar(
          <Box>
            <Typography variant="subtitle2">Paiement partiel enregistré</Typography>
            <Typography variant="body2">
              {formatCurrency(paidAmount)} payé sur {formatCurrency(totalAmount)}
              <br />
              {formatCurrency(remainingAmount)} restant à payer
            </Typography>
          </Box>, 
          { 
            variant: 'info',
            autoHideDuration: 8000,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'center',
            }
          }
        );
      }
      
      setSuccessMessage(successMsg);
      setShowSuccessSnackbar(true);
      setTimeout(() => {
        setShowSuccessSnackbar(false);
        setSuccessMessage(null);
      }, 6000);
      
      // Update the client balance data
      if (selectedClient) {        // Save previous balance for animation
        if (clientBalanceData) {
          setPreviousBalance(clientBalanceData.client.current_balance);
        }
        // Reload client data to get updated balance
        loadClientAccountData(selectedClient.id);
      }
      // Close modal and reset form
      setShowPaymentModal(false);
      resetPaymentForm();
      setProcessingPayment(false);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Erreur lors du traitement du paiement. Veuillez réessayer.');
      setProcessingPayment(false);
    }
  };
    // Reset payment form
  const resetPaymentForm = () => {
    setSelectedSaleForPayment(null);
    setPaymentAmount(0);
    setPaymentDescription('');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(amount);
  };
  // Handle client pagination
  const handleChangeClientPage = (event: unknown, newPage: number) => {
    setClientPage(newPage);
  };

  const handleChangeClientRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClientRowsPerPage(parseInt(event.target.value, 10));
    setClientPage(0);
  };  // Load client account data
  const loadClientAccountData = async (clientId: number) => {
    try {
      setLoadingClientData(true);
      setError(null);      // Store previous balance before loading new data
      const prevBalance = clientBalanceData ? clientBalanceData.client.current_balance : null;
        const data = await TreasuryAPI.getClientBalance(clientId) as ClientAccountBalance;
      setClientBalanceData(data);
      setLoadingClientData(false);
        // If previous balance exists and is different from new balance, show feedback
      if (prevBalance !== null && data.client.current_balance !== prevBalance) {
        showBalanceUpdateFeedback(prevBalance, data.client.current_balance);
      }
    } catch (err) {
      console.error('Error loading client account data:', err);
      setError('Erreur lors du chargement des données du compte client.');
      setLoadingClientData(false);
      setClientBalanceData(null);
    }
  };
  // Handle client selection change
  const handleClientChange = (client: Client | null) => {
    setSelectedClient(client);
    setClientBalanceData(null);
    if (client) {
      loadClientAccountData(client.id);
      
      // Pre-fill deposit form with client data
      setNewDeposit(prev => ({
        ...prev,
        client: client.id,
        account: client.account || null
      }));
    }
  };

  // Handle creating a client deposit
  const handleCreateDeposit = async () => {
    try {
      setError(null);

      // Validate required fields
      if (!newDeposit.client) {
        setError('Veuillez sélectionner un client');
        return;
      }

      if (!newDeposit.account) {
        setError('Veuillez sélectionner un compte pour le dépôt');
        return;
      }

      if (!newDeposit.payment_method) {
        setError('Veuillez sélectionner une méthode de paiement');
        return;
      }

      if (newDeposit.amount <= 0) {
        setError('Le montant doit être supérieur à 0');
        return;
      }      // Store current balance for comparison
      const currentBalance = clientBalanceData?.client.current_balance || 0;      // Prepare data for API
      const depositData = {
        reference: `DEP-${Date.now()}`, // Generate unique reference
        client: newDeposit.client,
        account: newDeposit.account,
        amount: newDeposit.amount,
        payment_method: newDeposit.payment_method?.id || null,
        date: newDeposit.date,
        description: newDeposit.description || 'Dépôt sur compte client'
      };

      // Call API to create cash receipt
      await TreasuryAPI.createCashReceipt(depositData);

      // Show enhanced success message with amount details
      const successMsg = `Dépôt de ${formatCurrency(newDeposit.amount)} créé avec succès`;
      setSuccessMessage(successMsg);
      setShowSuccessSnackbar(true);
      setTimeout(() => {
        setShowSuccessSnackbar(false);
        setSuccessMessage(null);
      }, 6000);

      // Close modal and refresh client data
      setShowDepositModal(false);
      
      // Reset form
      setNewDeposit({
        client: selectedClient?.id || null,
        account: null,
        amount: 0,
        payment_method: null,
        date: new Date().toISOString().split('T')[0],
        description: 'Dépôt sur compte'
      });      
      // Refresh data
      if (selectedClient) {
        // Save previous balance before refresh
        setPreviousBalance(currentBalance);
        // Reload client data to get updated balance
        loadClientAccountData(selectedClient.id);
      }
    } catch (err) {
      console.error('Error creating deposit:', err);
      setError('Erreur lors de la création du dépôt. Veuillez réessayer.');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get payment status chip color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'error';
      case 'partially_paid':
        return 'warning';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get payment status label
  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'unpaid':
        return 'Non payé';
      case 'partially_paid':
        return 'Partiellement payé';
      case 'paid':
        return 'Payé';
      case 'overpaid':
        return 'Surpayé';
      default:
        return status;
    }
  };

  // Show visual feedback when balance is updated
  const showBalanceUpdateFeedback = (previousAmount: number, newAmount: number) => {
    // Store previous balance
    setPreviousBalance(previousAmount);
    
    // Highlight the balance change
    setBalanceChangeHighlight(true);
    
    // Display notification
    const isIncrease = newAmount > previousAmount;
    const difference = Math.abs(newAmount - previousAmount);
    
    enqueueSnackbar(
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar 
          sx={{ 
            bgcolor: isIncrease ? 'success.main' : 'error.main', 
            width: 32, 
            height: 32,
            mr: 1.5
          }}
        >
          {isIncrease ? '+' : '-'}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {isIncrease ? 'Dépôt effectué' : 'Retrait effectué'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {isIncrease ? 'Crédit' : 'Débit'} de {formatCurrency(difference)}
          </Typography>
        </Box>
      </Box>,
      { 
        variant: isIncrease ? 'success' : 'warning',
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
        TransitionComponent: Grow,
        autoHideDuration: 5000
      }
    );
    
    // Reset highlight after animation completes
    setTimeout(() => {
      setBalanceChangeHighlight(false);
    }, 3000);
  };

  return (
    <Box>
      <Box 
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Trésorerie
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestion des paiements et comptes clients
          </Typography>
        </Box>        <Box>
          {tabValue === 0 && selectedClient && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ArrowBackIcon />}
                onClick={() => {
                  setSelectedClient(null);
                  setClientBalanceData(null);
                }}
                sx={{ borderRadius: 2 }}
              >
                Retour
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleIcon />}
                onClick={() => setShowDepositModal(true)}
                sx={{ borderRadius: 2 }}
              >
                Nouveau dépôt
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      <StyledPaper>        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            variant="fullWidth"
            aria-label="treasury tabs"
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWalletIcon fontSize="small" />
                  <span>Comptes Clients</span>
                </Box>
              } 
              {...a11yProps(0)} 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceIcon fontSize="small" />
                  <span>Mouvements</span>
                </Box>
              } 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>        {/* Client Accounts Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {!selectedClient ? (
              <>
                <Grid item xs={12}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Sélectionner un client
                    </Typography>
                    <TextField
                      fullWidth
                      label="Rechercher un client"
                      variant="outlined"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      sx={{ mb: 3 }}
                    />
                  </Box>
                  
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}
                  
                  <Grid container spacing={2}>
                    {paginatedClients.map(client => (
                        <Grid item xs={12} sm={6} md={4} key={client.id}>
                          <ClientInfoCard
                            onClick={() => handleClientChange(client)}
                            sx={{ 
                              cursor: 'pointer',
                              height: '100%',
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                                    {client.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {client.name}
                                  </Typography>
                                </Box>
                                {client.is_active ? 
                                  <Chip size="small" label="Actif" color="success" /> : 
                                  <Chip size="small" label="Inactif" color="default" />
                                }
                              </Box>
                              
                              {client.contact_person && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Contact: {client.contact_person}
                                </Typography>
                              )}
                              
                              {client.phone && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Tél: {client.phone}
                                </Typography>
                              )}
                              
                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                <Button 
                                  variant="outlined" 
                                  color="primary"
                                  size="small"
                                  startIcon={<AccountBalanceWalletIcon />}
                                >
                                  Consulter compte
                                </Button>
                              </Box>
                            </CardContent>
                          </ClientInfoCard>
                        </Grid>
                      ))}
                    
                    {filteredClients.length === 0 && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                          <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Aucun client trouvé
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Essayez d'autres termes de recherche
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                  <TablePagination
                    rowsPerPageOptions={[6, 12, 18]}
                    component="div"
                    count={filteredClients.length}
                    rowsPerPage={clientRowsPerPage}
                    page={clientPage}
                    onPageChange={handleChangeClientPage}
                    onRowsPerPageChange={handleChangeClientRowsPerPage}
                    labelRowsPerPage="Clients par page:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {selectedClient.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedClient.name}
                        </Typography>
                        {selectedClient.contact_person && (
                          <Typography variant="body2" color="text.secondary">
                            {selectedClient.contact_person}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Contact
                      </Typography>
                      
                      {selectedClient.phone && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          📞 {selectedClient.phone}
                        </Typography>
                      )}
                      
                      {selectedClient.email && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          ✉️ {selectedClient.email}
                        </Typography>
                      )}
                      
                      {selectedClient.address && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          🏠 {selectedClient.address}
                        </Typography>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />

                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<AttachMoneyIcon />}
                      onClick={() => setShowDepositModal(true)}
                      sx={{ mb: 2 }}
                    >
                      Nouveau dépôt
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      sx={{ mb: 2 }}
                    >
                      Imprimer relevé
                    </Button>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  {loadingClientData ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  ) : clientBalanceData ? (
                    <Box>
                      <Card sx={{ mb: 3 }} elevation={2}>
                        <CardContent>
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={12} md={6}>                              <Typography variant="subtitle1" fontWeight="medium">
                                Compte: {clientBalanceData.client.account_name}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Solde actuel
                                </Typography>
                                <Grow
                                  in={true}
                                  style={{ transformOrigin: '0 0 0' }}
                                  {...(balanceChangeHighlight ? { timeout: 1000 } : {})}
                                >
                                  <Typography                                    variant="h4" 
                                    sx={{ 
                                      fontWeight: 'bold',
                                      color: clientBalanceData.client.current_balance >= 0 ? 'success.main' : 'error.main',
                                      transition: 'color 0.5s ease',
                                      animation: balanceChangeHighlight ? 'pulse 2s infinite' : 'none',
                                      '@keyframes pulse': {
                                        '0%': {
                                          opacity: 1,
                                        },
                                        '50%': {
                                          opacity: 0.6,
                                        },
                                        '100%': {
                                          opacity: 1,
                                        },
                                      },
                                    }}
                                  >
                                    {formatCurrency(clientBalanceData.client.current_balance)}
                                  </Typography>
                                </Grow>                                {previousBalance !== null && previousBalance !== clientBalanceData.client.current_balance && (
                                  <Slide direction="up" in={balanceChangeHighlight} mountOnEnter unmountOnExit>
                                    <Typography variant="caption" 
                                      sx={{ 
                                        color: clientBalanceData.client.current_balance > previousBalance ? 'success.main' : 'error.main',
                                        fontWeight: 'medium'
                                      }}
                                    >                                      {clientBalanceData.client.current_balance > previousBalance ? '↑' : '↓'} 
                                      {formatCurrency(Math.abs(clientBalanceData.client.current_balance - previousBalance))}
                                    </Typography>
                                  </Slide>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      {clientBalanceData.outstanding_sales && clientBalanceData.outstanding_sales.length > 0 && (
                        <Paper sx={{ mb: 3, overflow: 'hidden', height: 420 }} elevation={2}>
                          <Box sx={{ bgcolor: 'warning.light', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="warning.contrastText">
                              <WarningIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                              Ventes non soldées
                            </Typography>
                            <Box>
                              <Tooltip title="Exporter les données">
                                <IconButton size="small" sx={{ color: 'warning.contrastText' }}>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Filtrer les ventes">
                                <IconButton size="small" sx={{ color: 'warning.contrastText' }}>
                                  <FilterListIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          
                          <Box sx={{ height: 360, width: '100%' }}>
                            <DataGrid
                              rows={clientBalanceData.outstanding_sales.map(sale => ({
                                id: sale.id,
                                reference: sale.reference,
                                date: formatDate(sale.date),
                                rawDate: sale.date,
                                total_amount: sale.total_amount,
                                paid_amount: sale.paid_amount,
                                balance: sale.payment_status === 'unpaid' && sale.balance === 0 ? sale.total_amount : sale.balance,
                                payment_status: sale.payment_status,
                                actions: sale
                              }))}
                              columns={[
                                { 
                                  field: 'date', 
                                  headerName: 'Date', 
                                  width: 120,
                                  sortComparator: (v1, v2, param1, param2) => {
                                    const d1 = new Date(param1.api.getCellValue(param1.id, 'rawDate'));
                                    const d2 = new Date(param2.api.getCellValue(param2.id, 'rawDate'));
                                    return d1.getTime() - d2.getTime();
                                  }
                                },
                                { field: 'reference', headerName: 'Référence', width: 140 },
                                { 
                                  field: 'total_amount', 
                                  headerName: 'Montant', 
                                  width: 130,
                                  align: 'right',
                                  headerAlign: 'right',
                                  renderCell: (params) => (
                                    <Typography variant="body2" fontWeight="500">
                                      {formatCurrency(params.value)}
                                    </Typography>
                                  )
                                },
                                { 
                                  field: 'paid_amount', 
                                  headerName: 'Payé', 
                                  width: 130,
                                  align: 'right',
                                  headerAlign: 'right',
                                  renderCell: (params) => (
                                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                      {formatCurrency(params.value)}
                                    </Typography>
                                  )
                                },
                                { 
                                  field: 'balance', 
                                  headerName: 'Solde', 
                                  width: 130,
                                  align: 'right',
                                  headerAlign: 'right',
                                  renderCell: (params) => (
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="bold"
                                      sx={{ 
                                        color: 'error.main',
                                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                        py: 0.5,
                                        px: 1,
                                        borderRadius: 1,
                                        fontSize: '0.8125rem'
                                      }}
                                    >
                                      {formatCurrency(params.value)}
                                    </Typography>
                                  )
                                },
                                { 
                                  field: 'payment_status', 
                                  headerName: 'Statut', 
                                  width: 140,
                                  renderCell: (params) => (
                                    <Chip
                                      label={getPaymentStatusLabel(params.value)}
                                      color={getPaymentStatusColor(params.value)}
                                      size="small"
                                      sx={{ fontWeight: 500 }}
                                    />
                                  )
                                },
                                { 
                                  field: 'actions', 
                                  headerName: 'Actions', 
                                  width: 100,
                                  align: 'center',
                                  headerAlign: 'center',
                                  sortable: false,
                                  renderCell: (params) => (
                                    <Tooltip title="Effectuer un paiement">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => {
                                          const sale = params.value;
                                          const actualBalance = sale.payment_status === 'unpaid' && sale.balance === 0 
                                            ? sale.total_amount 
                                            : sale.balance;
                                          
                                          const saleWithCorrectBalance = {
                                            ...sale,
                                            balance: actualBalance
                                          };
                                          
                                          setSelectedSaleForPayment(saleWithCorrectBalance);
                                          
                                          if (clientBalanceData) {
                                            const availableBalance = clientBalanceData.client.current_balance;
                                            if (availableBalance > 0 && availableBalance < actualBalance) {
                                              setPaymentAmount(availableBalance);
                                            } else {
                                              setPaymentAmount(actualBalance);
                                            }
                                          } else {
                                            setPaymentAmount(actualBalance);
                                          }
                                          
                                          setPaymentDescription(`Paiement pour la vente ${sale.reference}`);
                                          setShowPaymentModal(true);
                                        }}
                                      >
                                        <PaymentIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )
                                }
                              ]}
                              getRowClassName={(params) => 
                                params.indexRelativeToCurrentPage % 2 === 0 ? '' : 'even-row'
                              }
                              initialState={{
                                pagination: {
                                  paginationModel: { pageSize: 5, page: 0 },
                                },
                                sorting: {
                                  sortModel: [{ field: 'rawDate', sort: 'desc' }],
                                },
                              }}
                              density="compact"
                              disableRowSelectionOnClick
                              slots={{
                                toolbar: GridToolbar,
                              }}
                              slotProps={{
                                toolbar: {
                                  showQuickFilter: true,
                                  quickFilterProps: { debounceMs: 300 },
                                },
                              }}
                              sx={{
                                border: 'none',
                                '& .MuiDataGrid-cell:focus': {
                                  outline: 'none',
                                },
                                '& .even-row': {
                                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  borderRadius: 0,
                                }
                              }}
                              pageSizeOptions={[5, 10, 25]}
                            />
                          </Box>
                        </Paper>
                      )}                      <Paper sx={{ mb: 3, overflow: 'hidden', height: 520 }} elevation={2}>
                        <Box sx={{ bgcolor: 'primary.light', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary.contrastText">
                            <ReceiptIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                            Historique des transactions
                          </Typography>
                          <Box>
                            <Tooltip title="Exporter les données">
                              <IconButton size="small" sx={{ color: 'primary.contrastText' }}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Filtrer les transactions">
                              <IconButton size="small" sx={{ color: 'primary.contrastText' }}>
                                <FilterListIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        
                        <Box sx={{ height: 460, width: '100%' }}>
                          {clientBalanceData.statements && clientBalanceData.statements.length > 0 ? (
                            <DataGrid
                              rows={clientBalanceData.statements.map(statement => ({
                                id: statement.id,
                                date: formatDate(statement.date),
                                rawDate: statement.date, // For sorting
                                reference: statement.reference,
                                type: statement.transaction_type_display,
                                description: statement.description,
                                debit: statement.debit,
                                credit: statement.credit,
                                balance: statement.balance
                              }))}
                              columns={[
                                { 
                                  field: 'date', 
                                  headerName: 'Date', 
                                  width: 120,
                                  sortComparator: (v1, v2, param1, param2) => {
                                    // Custom sort by raw date
                                    const d1 = new Date(param1.api.getCellValue(param1.id, 'rawDate'));
                                    const d2 = new Date(param2.api.getCellValue(param2.id, 'rawDate'));
                                    return d1.getTime() - d2.getTime();
                                  }
                                },
                                { field: 'reference', headerName: 'Référence', width: 140 },
                                { 
                                  field: 'type', 
                                  headerName: 'Type', 
                                  width: 180,
                                  renderCell: (params: GridRenderCellParams) => (
                                    <Chip 
                                      label={params.value}
                                      size="small"
                                      sx={{ 
                                        bgcolor: 
                                          params.value.toLowerCase().includes('dépôt') ? 'rgba(46, 125, 50, 0.1)' :
                                          params.value.toLowerCase().includes('paiement') ? 'rgba(25, 118, 210, 0.1)' :
                                          'rgba(156, 39, 176, 0.1)',
                                        color: 
                                          params.value.toLowerCase().includes('dépôt') ? 'success.main' :
                                          params.value.toLowerCase().includes('paiement') ? 'primary.main' :
                                          'secondary.main',
                                        borderRadius: '4px',
                                        fontWeight: 500
                                      }}
                                    />
                                  )
                                },
                                { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
                                { 
                                  field: 'debit', 
                                  headerName: 'Débit', 
                                  width: 130, 
                                  align: 'right',
                                  headerAlign: 'right',                                  renderCell: (params) => (
                                    params.value > 0 ? (
                                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                                        {formatCurrency(params.value)}
                                      </Typography>
                                    ) : null
                                  )
                                },
                                { 
                                  field: 'credit', 
                                  headerName: 'Crédit', 
                                  width: 130,
                                  align: 'right',
                                  headerAlign: 'right',
                                  renderCell: (params) => (
                                    params.value > 0 ? (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                                        {formatCurrency(params.value)}
                                      </Typography>
                                    ) : null
                                  )
                                },
                                { 
                                  field: 'balance', 
                                  headerName: 'Solde', 
                                  width: 140,
                                  align: 'right',
                                  headerAlign: 'right',
                                  renderCell: (params) => (
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="bold"
                                      sx={{ 
                                        color: params.value >= 0 ? 'success.main' : 'error.main',
                                        backgroundColor: params.value >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                                        py: 0.5,
                                        px: 1,
                                        borderRadius: 1,
                                        fontSize: '0.8125rem'
                                      }}
                                    >
                                      {formatCurrency(params.value)}
                                    </Typography>
                                  )                                }
                              ]}
                              getRowClassName={(params) => 
                                params.indexRelativeToCurrentPage % 2 === 0 ? '' : 'even-row'
                              }
                              initialState={{
                                pagination: {
                                  paginationModel: { pageSize: 10, page: 0 },
                                },
                                sorting: {
                                  sortModel: [{ field: 'rawDate', sort: 'desc' }],
                                },
                              }}
                              density="compact"
                              disableRowSelectionOnClick
                              slots={{
                                toolbar: GridToolbar,
                              }}
                              slotProps={{
                                toolbar: {
                                  showQuickFilter: true,
                                  quickFilterProps: { debounceMs: 300 },
                                },
                              }}
                              sx={{
                                border: 'none',
                                '& .MuiDataGrid-cell:focus': {
                                  outline: 'none',
                                },
                                '& .even-row': {
                                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                                },
                                '& .MuiDataGrid-columnHeaders': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                  borderRadius: 0,
                                }
                              }}
                              pageSizeOptions={[5, 10, 25, 50]}
                            />
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <MoneyOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                Aucune transaction trouvée
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Ce client n'a pas encore de transactions dans le système.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>        {/* Account Movements Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Filters Section */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
                <Typography variant="h6" gutterBottom>
                  Filtres et contrôles
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      options={allAccounts}
                      getOptionLabel={(option) => `${option.name} (${option.account_type})`}
                      value={selectedAccount}
                      onChange={(event, newValue) => setSelectedAccount(newValue)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Compte" 
                          size="small"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Date début"
                      type="date"
                      size="small"
                      fullWidth
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Date fin"
                      type="date"
                      size="small"
                      fullWidth
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Autocomplete
                      options={[
                        { value: '', label: 'Tous les types' },
                        { value: 'client_payment', label: 'Règlement client' },
                        { value: 'supplier_payment', label: 'Règlement fournisseur' },
                        { value: 'transfer_in', label: 'Virement entrant' },
                        { value: 'transfer_out', label: 'Virement sortant' },
                        { value: 'cash_receipt', label: 'Encaissement' },
                        { value: 'cash_payment', label: 'Décaissement' },
                        { value: 'expense', label: 'Dépense' },
                        { value: 'sale', label: 'Vente' },
                        { value: 'purchase', label: 'Achat' },
                        { value: 'deposit', label: 'Dépôt' }
                      ]}
                      getOptionLabel={(option) => option.label}
                      value={[
                        { value: '', label: 'Tous les types' },
                        { value: 'client_payment', label: 'Règlement client' },
                        { value: 'supplier_payment', label: 'Règlement fournisseur' },
                        { value: 'transfer_in', label: 'Virement entrant' },
                        { value: 'transfer_out', label: 'Virement sortant' },
                        { value: 'cash_receipt', label: 'Encaissement' },
                        { value: 'cash_payment', label: 'Décaissement' },
                        { value: 'expense', label: 'Dépense' },
                        { value: 'sale', label: 'Vente' },
                        { value: 'purchase', label: 'Achat' },
                        { value: 'deposit', label: 'Dépôt' }
                      ].find(option => option.value === transactionTypeFilter) || { value: '', label: 'Tous les types' }}
                      onChange={(event, newValue) => setTransactionTypeFilter(newValue?.value || '')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Type" 
                          size="small"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>                  <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        size="small"
                        onClick={() => setShowTransferModal(true)}
                      >
                        Nouveau transfert
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        size="small"
                      >
                        Exporter
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Account Summary Cards */}
            {selectedAccount && (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Compte sélectionné
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {selectedAccount.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedAccount.account_type}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Solde actuel
                        </Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight="bold"
                          color={selectedAccount.current_balance >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(selectedAccount.current_balance)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total débits
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(accountMovements.reduce((sum, mov) => sum + mov.debit, 0))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total crédits
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(accountMovements.reduce((sum, mov) => sum + mov.credit, 0))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            )}

            {/* Movements Table */}
            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              <Paper sx={{ height: 600, width: '100%' }} elevation={2}>
                <Box sx={{ bgcolor: 'primary.light', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.contrastText">
                    <ReceiptIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'text-bottom' }} />
                    Mouvements de compte
                  </Typography>
                  <Typography variant="body2" color="primary.contrastText">
                    {accountMovements.length} mouvement(s)
                  </Typography>
                </Box>
                
                {loadingMovements ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 60px)' }}>
                    <CircularProgress />
                  </Box>
                ) : accountMovements.length > 0 ? (
                  <DataGrid
                    rows={accountMovements.map(movement => ({
                      id: movement.id,
                      account_name: movement.account_name || '',
                      date: formatDate(movement.date),
                      rawDate: movement.date,
                      reference: movement.reference,
                      transaction_type_display: movement.transaction_type_display,
                      transaction_type: movement.transaction_type,
                      description: movement.description,
                      debit: movement.debit,
                      credit: movement.credit,
                      balance: movement.balance
                    }))}
                    columns={[
                      { 
                        field: 'date', 
                        headerName: 'Date', 
                        width: 120,
                        sortComparator: (v1, v2, param1, param2) => {
                          const d1 = new Date(param1.api.getCellValue(param1.id, 'rawDate'));
                          const d2 = new Date(param2.api.getCellValue(param2.id, 'rawDate'));
                          return d1.getTime() - d2.getTime();
                        }
                      },
                      { 
                        field: 'account_name', 
                        headerName: 'Compte', 
                        width: 150,
                        renderCell: (params) => (
                          <Chip 
                            label={params.value}
                            size="small"
                            variant="outlined"
                            sx={{ maxWidth: '100%' }}
                          />
                        )
                      },
                      { field: 'reference', headerName: 'Référence', width: 140 },
                      { 
                        field: 'transaction_type_display', 
                        headerName: 'Type', 
                        width: 180,
                        renderCell: (params) => (
                          <Chip 
                            label={params.value}
                            size="small"
                            color={getTransactionTypeColor(params.row.transaction_type)}
                            sx={{ fontWeight: 500 }}
                          />
                        )
                      },
                      { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
                      { 
                        field: 'debit', 
                        headerName: 'Débit', 
                        width: 130, 
                        align: 'right',
                        headerAlign: 'right',
                        renderCell: (params) => (
                          params.value > 0 ? (
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                              {formatCurrency(params.value)}
                            </Typography>
                          ) : null
                        )
                      },
                      { 
                        field: 'credit', 
                        headerName: 'Crédit', 
                        width: 130,
                        align: 'right',
                        headerAlign: 'right',
                        renderCell: (params) => (
                          params.value > 0 ? (
                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                              {formatCurrency(params.value)}
                            </Typography>
                          ) : null
                        )
                      },
                      { 
                        field: 'balance', 
                        headerName: 'Solde', 
                        width: 140,
                        align: 'right',
                        headerAlign: 'right',
                        renderCell: (params) => (
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ 
                              color: params.value >= 0 ? 'success.main' : 'error.main',
                              backgroundColor: params.value >= 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              fontSize: '0.8125rem'
                            }}
                          >
                            {formatCurrency(params.value)}
                          </Typography>
                        )
                      }
                    ]}
                    getRowClassName={(params) => 
                      params.indexRelativeToCurrentPage % 2 === 0 ? '' : 'even-row'
                    }
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 15, page: 0 },
                      },
                      sorting: {
                        sortModel: [{ field: 'rawDate', sort: 'desc' }],
                      },
                    }}
                    density="compact"
                    disableRowSelectionOnClick
                    slots={{
                      toolbar: GridToolbar,
                    }}
                    slotProps={{
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 300 },
                      },
                    }}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                      '& .even-row': {
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        borderRadius: 0,
                      }
                    }}
                    pageSizeOptions={[10, 15, 25, 50]}
                  />
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 60px)' }}>
                    <MoneyOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Aucun mouvement trouvé
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {selectedAccount ? 
                        `Aucun mouvement trouvé pour le compte ${selectedAccount.name} avec les filtres appliqués.` :
                        'Sélectionnez un compte pour voir ses mouvements ou ajustez les filtres.'
                      }
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </StyledPaper>

      {/* Account Transfer Dialog */}
      <Dialog 
        open={showTransferModal} 
        onClose={() => setShowTransferModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
            Nouveau transfert entre comptes
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={allAccounts}
                getOptionLabel={(option) => `${option.name} (${option.account_type}) - ${formatCurrency(option.current_balance)}`}
                value={allAccounts.find(a => a.id === accountTransfer.from_account) || null}
                onChange={(event, newValue) => {
                  setAccountTransfer({...accountTransfer, from_account: newValue?.id});
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Compte source"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={allAccounts.filter(a => a.id !== accountTransfer.from_account)}
                getOptionLabel={(option) => `${option.name} (${option.account_type}) - ${formatCurrency(option.current_balance)}`}
                value={allAccounts.find(a => a.id === accountTransfer.to_account) || null}
                onChange={(event, newValue) => {
                  setAccountTransfer({...accountTransfer, to_account: newValue?.id});
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Compte destination"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Montant"
                type="text"
                value={formatNumberDisplay(accountTransfer.amount)}
                onChange={(e) => {
                  const newValue = validateDecimalInput(e.target.value, accountTransfer.amount);
                  setAccountTransfer({...accountTransfer, amount: newValue});
                }}
                fullWidth
                required
                error={accountTransfer.amount <= 0}
                helperText={getValidationError(accountTransfer.amount, 'amount')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date du transfert"
                type="date"
                value={accountTransfer.transfer_date}
                onChange={(e) => setAccountTransfer({...accountTransfer, transfer_date: e.target.value})}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Numéro de référence"
                value={accountTransfer.reference_number}
                onChange={(e) => setAccountTransfer({...accountTransfer, reference_number: e.target.value})}
                fullWidth
                placeholder="Optionnel - sera généré automatiquement"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={accountTransfer.notes}
                onChange={(e) => setAccountTransfer({...accountTransfer, notes: e.target.value})}
                fullWidth
                multiline
                rows={2}
                placeholder="Raison du transfert"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setShowTransferModal(false)}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTransfer}
            disabled={processingTransfer || !accountTransfer.from_account || !accountTransfer.to_account || !accountTransfer.amount}
            startIcon={processingTransfer ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
          >
            {processingTransfer ? 'Traitement...' : 'Créer le transfert'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Client Deposit Dialog */}
      <Dialog 
        open={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
            Nouveau dépôt client
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {loadingResources ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(option) => option.name}
                  value={clients.find(c => c.id === newDeposit.client) || null}
                  onChange={(event, newValue) => {
                    setNewDeposit({
                      ...newDeposit, 
                      client: newValue ? newValue.id : null,
                      account: newValue ? newValue.account || null : null
                    });
                  }}
                  renderInput={(params) => (
                    <TextField {...params}
                      label="Client"
                      variant="outlined"
                      fullWidth
                      required
                    />
                  )}
                  disabled={!!selectedClient}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={accounts.filter(a => a.account_type === 'cash')}
                  getOptionLabel={(option) => `${option.name} (${option.account_type})`}
                  value={accounts.find(a => a.id === newDeposit.account) || null}
                  onChange={(event, newValue) => {
                    setNewDeposit({...newDeposit, account: newValue ? newValue.id : null});
                  }}
                  renderInput={(params) => (
                    <TextField {...params}
                      label="Compte du client"
                      variant="outlined"
                      fullWidth
                      required
                      helperText="Sélectionnez le compte qui recevra le dépôt"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>                <Autocomplete
                  options={paymentMethods}
                  getOptionLabel={(option) => option.name}
                  value={newDeposit.payment_method}
                  onChange={(event, newValue) => {
                    setNewDeposit({...newDeposit, payment_method: newValue});
                  }}
                  renderInput={(params) => (
                    <TextField {...params}
                      label="Méthode de paiement"
                      variant="outlined"
                      fullWidth
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Montant"
                  type="text"
                  value={formatNumberDisplay(newDeposit.amount)}
                  onChange={(e) => {
                    const newValue = validateDecimalInput(e.target.value, newDeposit.amount);
                    setNewDeposit({...newDeposit, amount: newValue});
                  }}
                  fullWidth
                  required
                  error={newDeposit.amount <= 0}
                  helperText={getValidationError(newDeposit.amount, 'amount')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={newDeposit.date}
                  onChange={(e) => setNewDeposit({...newDeposit, date: e.target.value})}
                  fullWidth
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={newDeposit.description}
                  onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setShowDepositModal(false)}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateDeposit}
            disabled={loadingResources}
            startIcon={<AttachMoneyIcon />}
          >
            Créer le dépôt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog 
        open={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2, display: 'flex', alignItems: 'center' }}>
          <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            Paiement de vente
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSaleForPayment && (
            <Box sx={{ py: 2 }}>
              {selectedSaleForPayment.payment_status === 'paid' ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <AlertTitle>Vente déjà payée</AlertTitle>
                  Cette vente a déjà été entièrement payée. Aucun paiement supplémentaire n'est nécessaire.
                </Alert>
              ) : null}
              
              {/* Sale information card */}
              <Paper 
                variant="outlined" 
                sx={{ p: 2, mb: 3, borderRadius: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}
              >
                <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 2, fontWeight: 'medium', borderBottom: 1, pb: 1, borderColor: 'divider' }}>
                  Informations de la vente
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Référence
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {selectedSaleForPayment.reference}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Client
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {selectedClient?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Montant total
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {formatCurrency(selectedSaleForPayment.total_amount)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Déjà payé
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium" color="success.main">
                      {formatCurrency(selectedSaleForPayment.paid_amount)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Montant restant
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium" color={selectedSaleForPayment.balance > 0 ? "error.main" : "success.main"}>
                      {formatCurrency(selectedSaleForPayment.payment_status === 'unpaid' && selectedSaleForPayment.balance === 0 
                        ? selectedSaleForPayment.total_amount 
                        : Math.max(0, selectedSaleForPayment.balance))}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Client account balance card */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  borderRadius: 1, 
                  borderColor: clientBalanceData && clientBalanceData.client.current_balance < 0 ? 'error.main' : 'divider',
                  backgroundColor: 'background.paper',
                  borderWidth: clientBalanceData && clientBalanceData.client.current_balance < 0 ? 2 : 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalanceWalletIcon sx={{ mr: 1, color: clientBalanceData && clientBalanceData.client.current_balance >= 0 ? 'success.main' : 'error.main' }} />
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'medium' }}>
                    Compte client
                  </Typography>
                </Box>
                
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Solde disponible
                    </Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="medium"
                      color={clientBalanceData && clientBalanceData.client.current_balance >= 0 ? 'success.main' : 'error.main'}
                    >
                      {clientBalanceData ? formatCurrency(clientBalanceData.client.current_balance) : 'Chargement...'}
                    </Typography>
                  </Grid>
                  
                  {(!clientBalanceData || clientBalanceData.client.current_balance <= 0) && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Solde insuffisant. Un paiement à crédit sera créé.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
              
              {/* Payment information */}
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'medium' }}>
                Détails du paiement
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Montant du paiement"
                    type="text"
                    fullWidth
                    required
                    value={formatNumberDisplay(paymentAmount)}
                    onChange={(e) => {
                      const maxValue = selectedSaleForPayment ? selectedSaleForPayment.balance : undefined;
                      const newValue = validateAmountInput(e.target.value, paymentAmount, maxValue);
                      setPaymentAmount(newValue);
                    }}
                    error={paymentAmount <= 0 || (selectedSaleForPayment && paymentAmount > selectedSaleForPayment.balance)}
                    helperText={getAmountValidationError(paymentAmount, selectedSaleForPayment?.balance)}
                    InputProps={{ 
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color={
                            clientBalanceData && clientBalanceData.client.current_balance < paymentAmount 
                              ? "warning" 
                              : "primary"
                          } />
                        </InputAdornment>
                      )
                    }}
                    color={clientBalanceData && clientBalanceData.client.current_balance < paymentAmount ? "warning" : (
                      selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance ? "info" : "primary"
                    )}
                  />
                  
                  {/* Payment summary card with dynamic coloring based on payment type */}
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        borderRadius: 1,
                        borderColor: clientBalanceData && clientBalanceData.client.current_balance < paymentAmount 
                          ? 'warning.main' 
                          : (selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance 
                            ? 'info.main' 
                            : 'success.main'),
                        borderWidth: 2,
                        backgroundColor: clientBalanceData && clientBalanceData.client.current_balance < paymentAmount
                          ? 'rgba(237, 108, 2, 0.08)'  // warning light background
                          : (selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance
                            ? 'rgba(3, 169, 244, 0.08)'  // info light background
                            : 'rgba(46, 125, 50, 0.08)'),  // success light background
                        boxShadow: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ mr: 2, mt: 0.5 }}>
                          {clientBalanceData && clientBalanceData.client.current_balance < paymentAmount ? (
                            <WarningIcon fontSize="large" color="warning" />
                          ) : (
                            selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance ? (
                              <PaymentIcon fontSize="large" color="info" />
                            ) : (
                              <PaymentIcon fontSize="large" color="success" />
                            )
                          )}
                        </Box>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom fontWeight="bold">
                            {clientBalanceData && clientBalanceData.client.current_balance < paymentAmount
                              ? "Paiement à crédit"
                              : (selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance
                                ? "Paiement partiel"
                                : "Paiement total")}
                          </Typography>
                          
                          {clientBalanceData && clientBalanceData.client.current_balance < paymentAmount ? (
                            <Typography variant="body2">
                              Ce paiement dépassera le solde disponible du client de {formatCurrency(paymentAmount - clientBalanceData.client.current_balance)} et créera un crédit.
                            </Typography>
                          ) : (
                            selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance ? (
                              <Typography variant="body2">
                                Vous effectuez un paiement partiel de {formatCurrency(paymentAmount)}. Un montant de {formatCurrency(selectedSaleForPayment.balance - paymentAmount)} restera à payer.
                                Le statut de la vente sera mis à jour en "Partiellement payé".
                              </Typography>
                            ) : (
                              <Typography variant="body2">
                                Vous effectuez le paiement total de cette vente d'un montant de {formatCurrency(paymentAmount)}.
                                Le statut de la vente sera mis à jour en "Payé".
                              </Typography>
                            )
                          )}
                          
                          {/* Show payment amount breakdown */}
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={6} sm={4}>
                              <Typography variant="caption" color="text.secondary">Montant du paiement</Typography>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {formatCurrency(paymentAmount)}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6} sm={4}>
                              <Typography variant="caption" color="text.secondary">Solde client utilisé</Typography>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {clientBalanceData 
                                  ? formatCurrency(Math.min(clientBalanceData.client.current_balance, paymentAmount))
                                  : "Chargement..."}
                              </Typography>
                            </Grid>
                            
                            {clientBalanceData && clientBalanceData.client.current_balance < paymentAmount && (
                              <Grid item xs={6} sm={4}>
                                <Typography variant="caption" color="error.main">Montant à crédit</Typography>
                                <Typography variant="subtitle1" fontWeight="medium" color="error.main">
                                  {formatCurrency(paymentAmount - clientBalanceData.client.current_balance)}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="Description du paiement"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ReceiptIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Ajoutez une description facultative pour ce paiement"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setShowPaymentModal(false)}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            color={clientBalanceData && clientBalanceData.client.current_balance < paymentAmount 
              ? "warning" 
              : (selectedSaleForPayment && paymentAmount < selectedSaleForPayment.balance 
                ? "info" 
                : "primary")}
            onClick={handlePayFromAccount}
            disabled={
              processingPayment || 
              !selectedSaleForPayment || 
              paymentAmount <= 0 ||
              (selectedSaleForPayment && paymentAmount > selectedSaleForPayment.balance) ||
              (selectedSaleForPayment && selectedSaleForPayment.payment_status === 'paid') // Disable if already paid
            }
            startIcon={processingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
            sx={{ 
              fontWeight: 'medium',
              minWidth: '200px',
              px: 3
            }}
          >
            {processingPayment ? 'Traitement...' : (
              !selectedSaleForPayment ? 'Effectuer le paiement' : (
                selectedSaleForPayment.payment_status === 'paid' ? 
                'Vente déjà payée' : (
                  // First check if it's a partial payment - the amount is less than the balance
                  paymentAmount > 0 && paymentAmount < selectedSaleForPayment.balance ?
                  'Effectuer un paiement partiel' : (
                    // Then check if it's a credit payment - client balance is less than payment amount
                    clientBalanceData && clientBalanceData.client.current_balance < paymentAmount ? 
                    'Effectuer le paiement à crédit' : 'Effectuer le paiement total'
                  )
                )
              )
            )}
          </Button>
        </DialogActions>      
        </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Treasury;