/**
 * Dashboard Utilities
 * Helper functions and constants for dashboard operations
 */

// Chart colors
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

/**
 * Safely parse balance values that might be strings or numbers
 */
export const parseBalance = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number): string => {
  if (isNaN(value)) return '0 GNF';
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Generate placeholder inventory trend data for the last 7 months
 */
export const generateInventoryTrendData = (currentValue: number): Array<{name: string; value: number}> => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return Array.from({ length: 7 }, (_, i) => {
    const monthIndex = (currentMonth - 6 + i + 12) % 12;
    const variationFactor = 0.85 + (i * 0.05);
    return {
      name: months[monthIndex],
      value: Math.round(currentValue * variationFactor)
    };
  });
};

/**
 * Generate mock client data for demonstration
 */
export const generateMockClients = () => [
  {
    id: 1,
    name: 'Entreprise Alpha SARL',
    balance: 2500000,
    account: 1,
    account_balance: 2500000,
    last_transaction_date: undefined
  },
  {
    id: 2,
    name: 'Société Beta & Cie',
    balance: 1800000,
    account: 2,
    account_balance: 1800000,
    last_transaction_date: undefined
  },
  {
    id: 3,
    name: 'Commerce Gamma',
    balance: 950000,
    account: 3,
    account_balance: 950000,
    last_transaction_date: undefined
  },
  {
    id: 4,
    name: 'Distribution Delta',
    balance: 3200000,
    account: 4,
    account_balance: 3200000,
    last_transaction_date: undefined
  },
  {
    id: 5,
    name: 'Import Export Epsilon',
    balance: 1650000,
    account: 5,
    account_balance: 1650000,
    last_transaction_date: undefined
  }
];

/**
 * Generate mock account statements for demonstration
 */
export const generateMockStatements = (clientId: number) => [
  {
    id: 1,
    date: '2025-01-15',
    description: 'Vente produits divers',
    transaction_type: 'sale',
    transaction_type_display: 'Vente',
    reference: 'VTE-001',
    debit: 0,
    credit: 850000,
    amount: 850000,
    balance: 850000,
    client_id: clientId
  },
  {
    id: 2,
    date: '2025-01-20',
    description: 'Paiement partiel',
    transaction_type: 'payment',
    transaction_type_display: 'Paiement',
    reference: 'PAY-001',
    debit: 350000,
    credit: 0,
    amount: -350000,
    balance: 500000,
    client_id: clientId
  },
  {
    id: 3,
    date: '2025-01-25',
    description: 'Nouvelle commande',
    transaction_type: 'sale',
    transaction_type_display: 'Vente',
    reference: 'VTE-002',
    debit: 0,
    credit: 1200000,
    amount: 1200000,
    balance: 1700000,
    client_id: clientId
  },
  {
    id: 4,
    date: '2025-01-28',
    description: 'Paiement',
    transaction_type: 'payment',
    transaction_type_display: 'Paiement',
    reference: 'PAY-002',
    debit: 700000,
    credit: 0,
    amount: -700000,
    balance: 1000000,
    client_id: clientId
  },
  {
    id: 5,
    date: '2025-02-01',
    description: 'Achat en gros',
    transaction_type: 'sale',
    transaction_type_display: 'Vente',
    reference: 'VTE-003',
    debit: 0,
    credit: 1800000,
    amount: 1800000,
    balance: 2800000,
    client_id: clientId
  },
  {
    id: 6,
    date: '2025-02-05',
    description: 'Règlement facture',
    transaction_type: 'payment',
    transaction_type_display: 'Paiement',
    reference: 'PAY-003',
    debit: 1300000,
    credit: 0,
    amount: -1300000,
    balance: 1500000,
    client_id: clientId
  }
];

/**
 * Generate mock supplier data for demonstration
 */
export const generateMockSuppliers = (): Array<{
  id: number;
  name: string;
  balance: number;
  account: number;
  account_balance: number;
  last_transaction_date: string | undefined;
}> => [
  {
    id: 1,
    name: 'Fournisseur Alpha SARL',
    balance: -1500000,
    account: 101,
    account_balance: -1500000,
    last_transaction_date: '2025-09-28'
  },
  {
    id: 2,
    name: 'Import Export Beta',
    balance: -2800000,
    account: 102,
    account_balance: -2800000,
    last_transaction_date: '2025-09-25'
  },
  {
    id: 3,
    name: 'Distributeur Gamma',
    balance: -950000,
    account: 103,
    account_balance: -950000,
    last_transaction_date: '2025-09-20'
  },
  {
    id: 4,
    name: 'Commerce Delta & Cie',
    balance: -3200000,
    account: 104,
    account_balance: -3200000,
    last_transaction_date: '2025-09-15'
  },
  {
    id: 5,
    name: 'Société Epsilon',
    balance: -1250000,
    account: 105,
    account_balance: -1250000,
    last_transaction_date: '2025-09-10'
  }
];

/**
 * Generate mock supplier transactions for demonstration
 */
export const generateMockSupplierTransactions = (supplierId: number): Array<{
  id: number;
  date: string;
  description: string;
  transaction_type: string;
  transaction_type_display: string;
  reference: string;
  debit: number;
  credit: number;
  amount: number;
  balance: number;
  supplier_id: number;
}> => [
  {
    id: 1,
    date: '2025-01-15',
    description: 'Achat marchandises',
    transaction_type: 'purchase',
    transaction_type_display: 'Achat',
    reference: 'ACH-001',
    debit: 0,
    credit: 1500000,
    amount: 1500000,
    balance: -1500000,
    supplier_id: supplierId
  },
  {
    id: 2,
    date: '2025-01-20',
    description: 'Paiement fournisseur',
    transaction_type: 'payment',
    transaction_type_display: 'Paiement',
    reference: 'PAY-101',
    debit: 500000,
    credit: 0,
    amount: -500000,
    balance: -1000000,
    supplier_id: supplierId
  },
  {
    id: 3,
    date: '2025-01-25',
    description: 'Nouvelle commande',
    transaction_type: 'purchase',
    transaction_type_display: 'Achat',
    reference: 'ACH-002',
    debit: 0,
    credit: 2200000,
    amount: 2200000,
    balance: -3200000,
    supplier_id: supplierId
  },
  {
    id: 4,
    date: '2025-01-28',
    description: 'Paiement partiel',
    transaction_type: 'payment',
    transaction_type_display: 'Paiement',
    reference: 'PAY-102',
    debit: 1200000,
    credit: 0,
    amount: -1200000,
    balance: -2000000,
    supplier_id: supplierId
  },
  {
    id: 5,
    date: '2025-02-01',
    description: 'Approvisionnement stock',
    transaction_type: 'purchase',
    transaction_type_display: 'Achat',
    reference: 'ACH-003',
    debit: 0,
    credit: 1800000,
    amount: 1800000,
    balance: -3800000,
    supplier_id: supplierId
  },
  {
    id: 6,
    date: '2025-02-05',
    description: 'Règlement dette',
    transaction_type: 'payment',
    transaction_type_display: 'Paiement',
    reference: 'PAY-103',
    debit: 2550000,
    credit: 0,
    amount: -2550000,
    balance: -1250000,
    supplier_id: supplierId
  }
];

/**
 * Map report types to their indices
 */
export const REPORT_TYPES = ['sales', 'products', 'inventory', 'accounts', 'suppliers'] as const;
export type ReportType = typeof REPORT_TYPES[number];

/**
 * Get report type from tab index
 */
export const getReportTypeFromIndex = (index: number): ReportType => {
  return REPORT_TYPES[index] || 'sales';
};

/**
 * Period options for the dashboard
 */
export const PERIOD_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Mois en cours' },
  { value: 'quarter', label: 'Trimestre en cours' },
  { value: 'semester', label: 'Semestre en cours' },
  { value: 'year', label: 'Année en cours' },
  { value: 'custom', label: 'Personnalisée' }
] as const;

/**
 * Status filter options
 */
export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'paid', label: 'Payé' },
  { value: 'partial', label: 'Partiellement payé' },
  { value: 'unpaid', label: 'Non payé' },
  { value: 'overdue', label: 'En retard' }
] as const;

/**
 * Transaction type filter options
 */
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'sale', label: 'Vente' },
  { value: 'payment', label: 'Paiement' },
  { value: 'purchase', label: 'Achat' },
  { value: 'refund', label: 'Remboursement' }
] as const;

/**
 * Sort order options
 */
export const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Plus récent' },
  { value: 'date_asc', label: 'Plus ancien' },
  { value: 'amount_desc', label: 'Montant (décroissant)' },
  { value: 'amount_asc', label: 'Montant (croissant)' },
  { value: 'name_asc', label: 'Nom (A-Z)' },
  { value: 'name_desc', label: 'Nom (Z-A)' }
] as const;
