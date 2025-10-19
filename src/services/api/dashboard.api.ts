/**
 * Dashboard Domain API
 * Handles: Dashboard stats, reports, analytics
 * Base path: /api/dashboard/
 */

import { api } from './config';

type Params = { period?: string; startDate?: string; endDate?: string };

interface SupplierDTO {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  account?: number | null;
}

interface AccountDTO {
  id: number;
  current_balance?: number | string;
  balance?: number | string;
  last_transaction_date?: string;
}

const buildPeriodQuery = ({ period = 'year', startDate, endDate }: Params): string => {
  const params = new URLSearchParams();
  params.append('period', period);

  if (period === 'custom' && startDate && endDate) {
    params.append('start_date', startDate);
    params.append('end_date', endDate);
  }

  return params.toString();
};

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export const getStats = async (
  period = 'year',
  startDate?: string,
  endDate?: string
): Promise<unknown> => {
  const response = await api.get(`/dashboard/stats/?${buildPeriodQuery({ period, startDate, endDate })}`);
  return response.data;
};

export const fetchDashboardStats = getStats;

export const getInventoryStats = async (
  period = 'year',
  startDate?: string,
  endDate?: string
): Promise<unknown> => {
  const response = await api.get(`/dashboard/inventory/?${buildPeriodQuery({ period, startDate, endDate })}`);
  return response.data;
};

export const fetchInventoryStats = getInventoryStats;

export const getLowStockProducts = async (): Promise<unknown[]> => {
  const response = await api.get('/dashboard/low-stock/');
  return response.data;
};

export const fetchLowStockProducts = getLowStockProducts;

export const getRecentSales = async (): Promise<unknown[]> => {
  const response = await api.get('/dashboard/recent-sales/');
  return response.data;
};

export const fetchRecentSales = getRecentSales;

// ============================================================================
// REPORTS
// ============================================================================

export const getSalesReport = async (
  period = 'year',
  startDate?: string,
  endDate?: string
): Promise<unknown> => {
  const response = await api.get(`/sales/reports/?${buildPeriodQuery({ period, startDate, endDate })}`);
  return response.data;
};

export const fetchSalesReport = getSalesReport;

export const getClientAccountStatements = async (clientId?: number): Promise<{ statements: unknown[] }> => {
  if (clientId) {
    const response = await api.get(`/treasury/account-statements/?client=${clientId}`);
    return {
      statements: response.data?.results || response.data || []
    };
  }

  return { statements: [] };
};

export const fetchClientAccountStatements = getClientAccountStatements;

export const getSupplierAccountStatements = async (supplierId?: number): Promise<{
  supplier_balances: Array<{
    id: number;
    name: string;
    balance: number;
    account: number | null;
    account_balance: number;
    last_transaction_date?: string;
    contact?: string;
  }>;
  supplier_transactions: unknown[];
}> => {
  const [suppliersResponse, accountsResponse] = await Promise.all([
    api.get('/partners/suppliers/'),
    api.get('/treasury/accounts/?account_type=supplier')
  ]);

  const suppliersData = suppliersResponse.data?.results || suppliersResponse.data || [];
  const accountsData = accountsResponse.data?.results || accountsResponse.data || [];

  const supplierBalances = (suppliersData as SupplierDTO[]).map((supplier) => {
    const account = (accountsData as AccountDTO[]).find((acc) => acc.id === supplier.account);
    const balance = account ? Number(account.current_balance ?? account.balance ?? 0) : 0;
    return {
      id: supplier.id,
      name: supplier.name,
      balance,
      account: account?.id ?? null,
      account_balance: balance,
      last_transaction_date: account?.last_transaction_date,
      contact: supplier.phone || supplier.contact_person || '-'
    };
  });

  let supplierTransactions: unknown[] = [];
  if (supplierId) {
    const selectedSupplier = supplierBalances.find((supplier) => supplier.id === supplierId);
    if (selectedSupplier?.account) {
      const statementsResponse = await api.get(`/treasury/account-statements/?account=${selectedSupplier.account}`);
      supplierTransactions = statementsResponse.data?.results || statementsResponse.data || [];
    }
  }

  return {
    supplier_balances: supplierBalances,
    supplier_transactions: supplierTransactions
  };
};

export const fetchSupplierAccountStatements = getSupplierAccountStatements;
