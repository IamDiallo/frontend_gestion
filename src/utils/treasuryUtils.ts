import { OutstandingSale, AccountStatement, AccountTransfer, ClientDeposit } from '../interfaces/business';

/**
 * Format currency amount to GNF
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date for display in French format
 */
export const formatDate = (dateString: string): string => {
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

/**
 * Get color for payment status chips
 */
export const getPaymentStatusColor = (status: string): 'error' | 'warning' | 'success' | 'default' => {
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

/**
 * Get label for payment status
 */
export const getPaymentStatusLabel = (status: string): string => {
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

/**
 * Get color for transaction types
 */
export const getTransactionTypeColor = (type: string): 'success' | 'error' | 'default' => {
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

/**
 * Filter outstanding sales for a specific client
 * Using any type because backend returns additional fields not in interfaces
 */
export const filterOutstandingSales = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  salesData: any[], 
  clientId: number
): OutstandingSale[] => {
  return salesData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((sale: any) => 
      sale.client === clientId && 
      (sale.payment_status === 'unpaid' || sale.payment_status === 'partially_paid')
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((sale: any) => ({
      id: sale.id || 0,
      reference: sale.reference || '',
      date: sale.date,
      total_amount: sale.total_amount,
      paid_amount: sale.paid_amount || 0,
      balance: sale.remaining_amount || sale.total_amount,
      payment_status: sale.payment_status || 'unpaid'
    }));
};

/**
 * Map account statements for DataGrid display
 */
export const mapStatementsForGrid = (statements: AccountStatement[]) => {
  return statements.map(statement => ({
    id: statement.id,
    date: formatDate(statement.date),
    rawDate: statement.date,
    reference: statement.reference,
    type: statement.transaction_type_display || statement.transaction_type || 'Type non défini',
    description: statement.description,
    debit: statement.debit,
    credit: statement.credit,
    balance: statement.balance
  }));
};

/**
 * Generate transaction type chip styles
 */
export const getTransactionTypeChipStyles = (value: string) => {
  const lowerValue = (value || '').toLowerCase();
  return {
    bgcolor: 
      lowerValue.includes('dépôt') ? 'rgba(46, 125, 50, 0.1)' :
      lowerValue.includes('paiement') ? 'rgba(25, 118, 210, 0.1)' :
      'rgba(156, 39, 176, 0.1)',
    color: 
      lowerValue.includes('dépôt') ? 'success.main' :
      lowerValue.includes('paiement') ? 'primary.main' :
      'secondary.main',
    borderRadius: '4px',
    fontWeight: 500
  };
};

/**
 * Validate transfer form data
 */
export const validateTransferForm = (transfer: Partial<AccountTransfer>): string | null => {
  if (!transfer.from_account) {
    return 'Veuillez sélectionner le compte source';
  }
  if (!transfer.to_account) {
    return 'Veuillez sélectionner le compte destination';
  }
  if (transfer.from_account === transfer.to_account) {
    return 'Le compte source et destination doivent être différents';
  }
  if (!transfer.amount || transfer.amount <= 0) {
    return 'Le montant doit être supérieur à 0';
  }
  return null;
};

/**
 * Validate deposit form data
 */
export const validateDepositForm = (deposit: ClientDeposit): string | null => {
  console.log("Deposit validation:", deposit);
  if (!deposit.client) {
    return 'Veuillez sélectionner un client';
  }
  if (!deposit.account) {
    return 'Veuillez sélectionner un compte pour le dépôt';
  }
  if (!deposit.payment_method) {
    return 'Veuillez sélectionner une méthode de paiement';
  }
  if (deposit.amount <= 0) {
    return 'Le montant doit être supérieur à 0';
  }
  return null;
};

/**
 * Generate unique reference for deposits
 */
export const generateDepositReference = (): string => {
  return `DEP-${Date.now()}`;
};

/**
 * Generate unique reference for transfers
 */
export const generateTransferReference = (): string => {
  return `TR-${Date.now()}`;
};
