/**
 * Custom Hook for Dashboard Data Management
 * Handles all data fetching logic for the dashboard
 */

import { useState, useCallback } from 'react';
import * as DashboardAPI from '../services/api/dashboard.api';
import * as PartnersAPI from '../services/api/partners.api';
import * as TreasuryAPI from '../services/api/treasury.api';
import type {
  DashboardStats,
  LowStockProduct,
  InventoryStats,
  ClientWithAccount,
  ReportData
} from '../services/api/index';
import type { AccountStatement } from '../interfaces/treasury';
import { 
  parseBalance, 
  generateInventoryTrendData,
  type ReportType 
} from '../utils/dashboardUtils';
import type { ApiResponse, ClientResponseItem } from '../interfaces';

interface UseDashboardDataReturn {
  // State
  loading: boolean;
  error: string | null;
  dashboardStats: DashboardStats | null;
  reportData: ReportData;
  lowStockProducts: LowStockProduct[];
  inventoryStats: InventoryStats | null;
  inventoryValueTrend: Array<{name: string; value: number}>;
  accountStatements: AccountStatement[];
  clientBalances: ClientWithAccount[];
  supplierBalances: Array<{
    id: number;
    name: string;
    balance: number;
    account: number;
    account_balance: number;
    last_transaction_date?: string;
  }>;
  supplierTransactions: Array<{
    id: number;
    date: string;
    description: string;
    transaction_type: string;
    transaction_type_display: string;
    reference: string;
    debit: number | string;
    credit: number | string;
    amount: number;
    balance: number | string;
    supplier_id: number;
  }>;
  
  // Actions
  fetchDashboardStats: (period: string, startDate: string, endDate: string) => Promise<void>;
  fetchSalesReport: (period: string, startDate: string, endDate: string) => Promise<void>;
  fetchInventoryStats: (period: string, startDate: string, endDate: string) => Promise<void>;
  fetchLowStockProducts: () => Promise<void>;
  fetchClientAccountStatements: () => Promise<void>;
  fetchSupplierAccountStatements: () => Promise<void>;
  loadAllData: (reportType: ReportType, period: string, startDate: string, endDate: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    monthly_data: [],
    category_data: [],
    top_products: []
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [inventoryValueTrend, setInventoryValueTrend] = useState<Array<{name: string; value: number}>>([]);
  const [accountStatements, setAccountStatements] = useState<AccountStatement[]>([]);
  const [clientBalances, setClientBalances] = useState<ClientWithAccount[]>([]);
  const [supplierBalances, setSupplierBalances] = useState<Array<{
    id: number;
    name: string;
    balance: number;
    account: number;
    account_balance: number;
    last_transaction_date?: string;
  }>>([]);
  const [supplierTransactions, setSupplierTransactions] = useState<Array<{
    id: number;
    date: string;
    description: string;
    transaction_type: string;
    transaction_type_display: string;
    reference: string;
    debit: number | string;
    credit: number | string;
    amount: number;
    balance: number | string;
    supplier_id: number;
  }>>([]);

  const fetchDashboardStats = useCallback(async (period: string, startDate: string, endDate: string) => {
    try {
      // Don't fetch if period is custom but dates are missing
      if (period === 'custom' && (!startDate || !endDate)) {
        console.warn('Skipping dashboard stats fetch: custom period requires start and end dates');
        return;
      }
      
      const data = await DashboardAPI.getStats(period, startDate, endDate);
      setDashboardStats(data as DashboardStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      throw err;
    }
  }, []);

  const fetchSalesReport = useCallback(async (period: string, startDate: string, endDate: string) => {
    try {
      // Don't fetch if period is custom but dates are missing
      if (period === 'custom' && (!startDate || !endDate)) {
        console.warn('Skipping sales report fetch: custom period requires start and end dates');
        return;
      }
      
      const response = await DashboardAPI.getSalesReport(period, startDate, endDate);
      setReportData(response as ReportData);
    } catch (err) {
      console.error('Error fetching sales report:', err);
      throw err;
    }
  }, []);

  const fetchInventoryStats = useCallback(async (period: string, startDate: string, endDate: string) => {
    try {
      // Don't fetch if period is custom but dates are missing
      if (period === 'custom' && (!startDate || !endDate)) {
        console.warn('Skipping inventory stats fetch: custom period requires start and end dates');
        return;
      }
      
      const data = await DashboardAPI.getInventoryStats(period, startDate, endDate) as InventoryStats;
      setInventoryStats(data);
      
      // Set inventory value trend
      if (data && data.historical_value) {
        setInventoryValueTrend(data.historical_value);
      } else {
        const currentValue = data?.inventory_value || 0;
        const placeholderData = generateInventoryTrendData(currentValue);
        setInventoryValueTrend(placeholderData);
      }
    } catch (err) {
      console.error('Error fetching inventory stats:', err);
      throw err;
    }
  }, []);

  const fetchLowStockProducts = useCallback(async () => {
    try {
      const data = await DashboardAPI.getLowStockProducts();
      setLowStockProducts(data as LowStockProduct[]);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      throw err;
    }
  }, []);

  const fetchClientAccountStatements = useCallback(async () => {
    try {
      console.log('Starting to fetch client account statements...');
      const clientsData = await PartnersAPI.fetchClients();
      
      const responseData = Array.isArray(clientsData) 
        ? clientsData 
        : ((clientsData as ApiResponse<ClientResponseItem>).results 
          ? (clientsData as ApiResponse<ClientResponseItem>).results 
          : []);
      
      const accounts = await TreasuryAPI.getAccountsByType("client");
      const clientsWithAccounts = (responseData as ClientResponseItem[])
        .map((client: ClientResponseItem) => {
          const account = accounts.find(acc => acc.id === client.account);
          const balance = account ? parseBalance(account.current_balance) : 0;

          return {
            id: client.id,
            name: client.name,
            balance: balance, 
            account: account?.id || client.account, 
            account_balance: balance,
            last_transaction_date: undefined,
            phone: client.phone || '-',
          };
        })
        .filter(client => client.balance > 0);
      
      setClientBalances(clientsWithAccounts);
      
      // Fetch statements for first client if available
      if (clientsWithAccounts.length > 0) {
        const clientId = clientsWithAccounts[0].id;
        
        try {
          const statementsData = await DashboardAPI.getClientAccountStatements(clientId);
          const statements = statementsData.statements 
            ? statementsData.statements 
            : (Array.isArray(statementsData) ? statementsData : []);
          setAccountStatements(statements as AccountStatement[]);
        } catch (statementError) {
          console.error('Error fetching client statements:', statementError);
          setAccountStatements([]);
        }
      } else {
        setAccountStatements([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching account statements:', err);
      // Set empty arrays on error
      setClientBalances([]);
      setAccountStatements([]);
    }
  }, []);

  const fetchSupplierAccountStatements = useCallback(async (supplierId?: number) => {
    try {
      console.log('Fetching supplier account statements from API...');
      
      // Fetch real supplier data from the backend
      const data = await DashboardAPI.getSupplierAccountStatements(supplierId);
      
      if (data.supplier_balances) {
        setSupplierBalances(data.supplier_balances as Array<{
          id: number;
          name: string;
          balance: number;
          account: number;
          account_balance: number;
          last_transaction_date?: string;
        }>);
      }
      
      if (data.supplier_transactions) {
        setSupplierTransactions(data.supplier_transactions as Array<{
          id: number;
          date: string;
          description: string;
          transaction_type: string;
          transaction_type_display: string;
          reference: string;
          debit: number | string;
          credit: number | string;
          amount: number;
          balance: number | string;
          supplier_id: number;
        }>);
      } else {
        setSupplierTransactions([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching supplier account statements:', err);
      // Set empty arrays on error
      setSupplierBalances([]);
      setSupplierTransactions([]);
    }
  }, []);

  const loadAllData = useCallback(async (
    reportType: ReportType, 
    period: string, 
    startDate: string, 
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Always fetch dashboard stats
      await fetchDashboardStats(period, startDate, endDate);
      
      // Fetch data based on report type
      switch(reportType) {
        case 'sales':
          await fetchSalesReport(period, startDate, endDate);
          break;
        case 'products':
          await fetchLowStockProducts();
          break;
        case 'inventory':
          await fetchInventoryStats(period, startDate, endDate);
          break;
        case 'accounts':
          await fetchClientAccountStatements();
          break;
        case 'suppliers':
          await fetchSupplierAccountStatements();
          break;
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Une erreur est survenue lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardStats, fetchSalesReport, fetchInventoryStats, fetchLowStockProducts, fetchClientAccountStatements, fetchSupplierAccountStatements]);

  return {
    loading,
    error,
    dashboardStats,
    reportData,
    lowStockProducts,
    inventoryStats,
    inventoryValueTrend,
    accountStatements,
    clientBalances,
    supplierBalances,
    supplierTransactions,
    fetchDashboardStats,
    fetchSalesReport,
    fetchInventoryStats,
    fetchLowStockProducts,
    fetchClientAccountStatements,
    fetchSupplierAccountStatements,
    loadAllData,
    setError
  };
};
