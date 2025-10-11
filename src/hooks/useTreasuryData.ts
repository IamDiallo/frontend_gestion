/**
 * Custom Hook: useTreasuryData
 * Manages all data fetching and CRUD operations for treasury management
 */

import { useState, useCallback } from 'react';
import api, {
  ClientsAPI,
  SuppliersAPI,
  TreasuryAPI,
  AccountsAPI,
  SettingsAPI,
  SalesAPI
} from '../services/api';
import {
  Client,
  Supplier,
  Account,
  ClientDeposit,
  AccountStatement,
  ActualClientBalanceResponse,
  ActualSupplierBalanceResponse
} from '../interfaces/business';

interface UseTreasuryDataReturn {
  // State
  clients: Client[];
  suppliers: Supplier[];
  accounts: Account[];
  allAccounts: Account[];
  paymentMethods: Array<{ id: number; name: string }>;
  selectedClient: Client | null;
  selectedSupplier: Supplier | null;
  clientBalanceData: ActualClientBalanceResponse | null;
  supplierBalanceData: ActualSupplierBalanceResponse | null;
  allClientTransactions: AccountStatement[];
  allSupplierTransactions: AccountStatement[];
  accountMovements: AccountStatement[];
  selectedAccount: Account | null;
  loading: boolean;
  loadingClientData: boolean;
  loadingSupplierData: boolean;
  loadingMovements: boolean;
  loadingResources: boolean;
  error: string | null;

  // Data fetching
  fetchClients: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchAllAccounts: () => Promise<void>;
  fetchResources: () => Promise<void>;
  fetchAccountMovements: (accountId?: number, startDate?: string, endDate?: string, transactionType?: string) => Promise<void>;
  refreshAllData: () => Promise<void>;

  // Client operations
  getClientBalance: (clientId: number) => Promise<ActualClientBalanceResponse>;
  getAllClientTransactions: () => Promise<void>;
  createClientDeposit: (data: ClientDeposit) => Promise<void>;
  createClientPayment: (saleId: number, amount: number, accountId: number, description: string) => Promise<void>;

  // Supplier operations
  getSupplierBalance: (supplierId: number) => Promise<ActualSupplierBalanceResponse>;
  getAllSupplierTransactions: () => Promise<void>;
  createSupplierPayment: (supplyId: number, amount: number, accountId: number, description: string) => Promise<void>;

  // Setters
  setSelectedClient: (client: Client | null) => void;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  setSelectedAccount: (account: Account | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useTreasuryData = (): UseTreasuryDataReturn => {
  // State management
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [clientBalanceData, setClientBalanceData] = useState<ActualClientBalanceResponse | null>(null);
  const [supplierBalanceData, setSupplierBalanceData] = useState<ActualSupplierBalanceResponse | null>(null);
  const [allClientTransactions, setAllClientTransactions] = useState<AccountStatement[]>([]);
  const [allSupplierTransactions, setAllSupplierTransactions] = useState<AccountStatement[]>([]);
  const [accountMovements, setAccountMovements] = useState<AccountStatement[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingClientData, setLoadingClientData] = useState<boolean>(false);
  const [loadingSupplierData, setLoadingSupplierData] = useState<boolean>(false);
  const [loadingMovements, setLoadingMovements] = useState<boolean>(false);
  const [loadingResources, setLoadingResources] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchClients = useCallback(async () => {
    try {
      const data = await ClientsAPI.getAll();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Erreur lors du chargement des clients');
      throw err;
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await SuppliersAPI.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Erreur lors du chargement des fournisseurs');
      throw err;
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await AccountsAPI.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Erreur lors du chargement des comptes');
      throw err;
    }
  }, []);

  const fetchAllAccounts = useCallback(async () => {
    try {
      const data = await AccountsAPI.getAll();
      setAllAccounts(data);
    } catch (err) {
      console.error('Error fetching all accounts:', err);
      setError('Erreur lors du chargement des comptes');
      throw err;
    }
  }, []);

  const fetchResources = useCallback(async () => {
    try {
      setLoadingResources(true);
      const [accountsData, paymentMethodsData] = await Promise.all([
        TreasuryAPI.getAccounts(),
        SettingsAPI.getSettings('payment-methods')
      ]);
      setAccounts(accountsData);
      setPaymentMethods(paymentMethodsData);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Erreur lors du chargement des ressources');
      throw err;
    } finally {
      setLoadingResources(false);
    }
  }, []);

  const fetchAccountMovements = useCallback(async (
    accountId?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _startDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _transactionType?: string
  ) => {
    try {
      setLoadingMovements(true);
      setError(null);

      let data: AccountStatement[] = [];
      if (accountId) {
        data = await TreasuryAPI.getAccountStatements(accountId) as AccountStatement[];
      } else {
        data = await TreasuryAPI.getAccountStatements() as AccountStatement[];
      }

      setAccountMovements(data);
    } catch (err) {
      console.error('Error fetching account movements:', err);
      setError('Erreur lors du chargement des mouvements de compte');
      setAccountMovements([]);
      throw err;
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchClients(),
        fetchSuppliers(),
        fetchAccounts(),
        fetchResources()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Erreur lors du rafraîchissement des données');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchClients, fetchSuppliers, fetchAccounts, fetchResources]);

  // ============================================================================
  // CLIENT OPERATIONS
  // ============================================================================

  const getClientBalance = useCallback(async (clientId: number): Promise<ActualClientBalanceResponse> => {
    try {
      setLoadingClientData(true);
      
      // First, get the client to retrieve their account ID
      const client = await ClientsAPI.getById(clientId);
      
      if (!client.account) {
        throw new Error('Ce client n\'a pas de compte associé');
      }
      
      // Then fetch the account info using the account ID
      const data = await TreasuryAPI.getAccountInfo(client.account, 'client');
      console.log('✅ Client balance data:', data);
      console.log('✅ Outstanding sales:', data.outstanding_sales);
      setClientBalanceData(data as ActualClientBalanceResponse);
      return data as ActualClientBalanceResponse;
    } catch (err) {
      console.error('Error fetching client balance:', err);
      setError('Erreur lors du chargement du solde client');
      throw err;
    } finally {
      setLoadingClientData(false);
    }
  }, []);

  const createClientDeposit = useCallback(async (depositData: ClientDeposit): Promise<void> => {
    try {
      // Transform ClientDeposit to CashReceipt format expected by backend
      const cashReceiptData = {
        reference: `DEP-${Date.now()}`, // Generate unique reference
        client: depositData.client,
        account: depositData.account,
        amount: depositData.amount,
        allocated_amount: depositData.amount, // Set allocated_amount to the full amount
        payment_method: depositData.payment_method?.id || null, // Extract ID from object
        date: depositData.date,
        description: depositData.description || 'Dépôt sur compte client'
      };

      await TreasuryAPI.createCashReceipt(cashReceiptData);
      
      // Refresh client balance if a client is selected
      if (selectedClient) {
        await getClientBalance(selectedClient.id);
      }
    } catch (err) {
      console.error('Error creating client deposit:', err);
      setError('Erreur lors de la création du dépôt');
      throw err;
    }
  }, [selectedClient, getClientBalance]);

  const createClientPayment = useCallback(async (
    saleId: number,
    amount: number,
    accountId: number,
    description: string
  ): Promise<void> => {
    try {
      await SalesAPI.payFromAccount(saleId, {
        amount,
        company_account: accountId,
        description
      });

      // Refresh client balance if a client is selected
      if (selectedClient) {
        await getClientBalance(selectedClient.id);
      }
    } catch (err) {
      console.error('Error creating client payment:', err);
      setError('Erreur lors du paiement');
      throw err;
    }
  }, [selectedClient, getClientBalance]);

  const getAllClientTransactions = useCallback(async (): Promise<void> => {
    try {
      setLoadingClientData(true);
      // Fetch all account statements without filtering by specific account
      const response = await api.get('/account-statements/');
      const allStatements = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      // Filter to only client-related transactions
      const clientStatements = allStatements.filter(
        (stmt: AccountStatement) => stmt.account && 
        (stmt.transaction_type === 'sale' || stmt.transaction_type === 'client_payment')
      );
      
      setAllClientTransactions(clientStatements);
    } catch (err) {
      console.error('Error fetching all client transactions:', err);
      setError('Erreur lors du chargement des transactions clients');
      throw err;
    } finally {
      setLoadingClientData(false);
    }
  }, []);

  // ============================================================================
  // SUPPLIER OPERATIONS
  // ============================================================================

  const getSupplierBalance = useCallback(async (supplierId: number): Promise<ActualSupplierBalanceResponse> => {
    try {
      setLoadingSupplierData(true);
      
      // First, get the supplier to retrieve their account ID
      const supplier = await SuppliersAPI.getById(supplierId);
      
      if (!supplier.account) {
        throw new Error('Ce fournisseur n\'a pas de compte associé');
      }
      
      // Then fetch the account info using the account ID
      const data = await TreasuryAPI.getAccountInfo(supplier.account, 'supplier');
      console.log('✅ Supplier balance data:', data);
      console.log('✅ Outstanding supplies:', data.outstanding_supplies);
      setSupplierBalanceData(data as unknown as ActualSupplierBalanceResponse);
      return data as unknown as ActualSupplierBalanceResponse;
    } catch (err) {
      console.error('Error fetching supplier balance:', err);
      setError('Erreur lors du chargement du solde fournisseur');
      throw err;
    } finally {
      setLoadingSupplierData(false);
    }
  }, []);

  const createSupplierPayment = useCallback(async (
    supplyId: number,
    amount: number,
    accountId: number,
    description: string
  ): Promise<void> => {
    try {
      await api.post(`/stock-supplies/${supplyId}/pay_from_account/`, {
        amount,
        company_account: accountId,
        description
      });

      // Refresh supplier balance if a supplier is selected
      if (selectedSupplier) {
        await getSupplierBalance(selectedSupplier.id);
      }
    } catch (err) {
      console.error('Error creating supplier payment:', err);
      setError('Erreur lors du paiement fournisseur');
      throw err;
    }
  }, [selectedSupplier, getSupplierBalance]);

  const getAllSupplierTransactions = useCallback(async (): Promise<void> => {
    try {
      setLoadingSupplierData(true);
      // Fetch all account statements without filtering by specific account
      const response = await api.get('/account-statements/');
      const allStatements = Array.isArray(response.data) ? response.data : 
        (response.data && response.data.results ? response.data.results : []);
      
      // Filter to only supplier-related transactions
      const supplierStatements = allStatements.filter(
        (stmt: AccountStatement) => stmt.account && 
        (stmt.transaction_type === 'supply' || stmt.transaction_type === 'supplier_payment')
      );
      
      setAllSupplierTransactions(supplierStatements);
    } catch (err) {
      console.error('Error fetching all supplier transactions:', err);
      setError('Erreur lors du chargement des transactions fournisseurs');
      throw err;
    } finally {
      setLoadingSupplierData(false);
    }
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    clients,
    suppliers,
    accounts,
    allAccounts,
    paymentMethods,
    selectedClient,
    selectedSupplier,
    clientBalanceData,
    supplierBalanceData,
    allClientTransactions,
    allSupplierTransactions,
    accountMovements,
    selectedAccount,
    loading,
    loadingClientData,
    loadingSupplierData,
    loadingMovements,
    loadingResources,
    error,

    // Data fetching
    fetchClients,
    fetchSuppliers,
    fetchAccounts,
    fetchAllAccounts,
    fetchResources,
    fetchAccountMovements,
    refreshAllData,

    // Client operations
    getClientBalance,
    getAllClientTransactions,
    createClientDeposit,
    createClientPayment,

    // Supplier operations
    getSupplierBalance,
    getAllSupplierTransactions,
    createSupplierPayment,

    // Setters
    setSelectedClient,
    setSelectedSupplier,
    setSelectedAccount,
    setError,
    setLoading
  };
};
