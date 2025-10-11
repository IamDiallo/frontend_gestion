/**
 * Custom Hook: useTreasuryDialogs
 * Manages dialog state and form operations for treasury operations
 */

import { useState, useCallback } from 'react';
import {
  OutstandingSale,
  OutstandingSupply,
  Client,
  Account
} from '../interfaces/business';
import {
  validateDepositForm,
  validateClientPaymentForm,
  validateSupplierPaymentForm
} from '../utils/treasuryUtils';

export interface PaymentDialogState {
  open: boolean;
  sale: OutstandingSale | null;
  amount: string;
  account: Account | null;
  description: string;
  processing: boolean;
  sale_reference?: string;
  sale_total?: number;
  sale_balance?: number;
  date?: Date;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface SupplierPaymentDialogState {
  open: boolean;
  supply: OutstandingSupply | null;
  amount: string;
  account: Account | null;
  description: string;
  processing: boolean;
  supply_reference?: string;
  supply_total?: number;
  supply_balance?: number;
  date?: Date;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

export interface DepositDialogState {
  open: boolean;
  client: Client | null;
  amount: string;
  account: Account | null;
  payment_method: { id: number; name: string } | null;
  date: string;
  description: string;
  processing: boolean;
}

export interface UseTreasuryDialogsReturn {
  // Payment dialog state
  paymentDialog: PaymentDialogState;
  openPaymentDialog: (sale: OutstandingSale) => void;
  closePaymentDialog: () => void;
  updatePaymentDialog: (data: Partial<PaymentDialogState>) => void;
  setPaymentProcessing: (processing: boolean) => void;

  // Supplier payment dialog state
  supplierPaymentDialog: SupplierPaymentDialogState;
  openSupplierPaymentDialog: (supply: OutstandingSupply) => void;
  closeSupplierPaymentDialog: () => void;
  updateSupplierPaymentDialog: (data: Partial<SupplierPaymentDialogState>) => void;
  setSupplierPaymentProcessing: (processing: boolean) => void;

  // Deposit dialog state
  depositDialog: DepositDialogState;
  openDepositDialog: (client: Client) => void;
  closeDepositDialog: () => void;
  updateDepositDialog: (data: Partial<DepositDialogState>) => void;
  setDepositProcessing: (processing: boolean) => void;

  // Validation functions
  validatePayment: () => boolean;
  validateSupplierPayment: () => boolean;
  validateDeposit: () => boolean;
}

export const useTreasuryDialogs = (): UseTreasuryDialogsReturn => {
  
  // ============================================================================
  // PAYMENT DIALOG STATE
  // ============================================================================

  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState>({
    open: false,
    sale: null,
    amount: '0',
    account: null,
    description: '',
    processing: false
  });

  const openPaymentDialog = useCallback((sale: OutstandingSale) => {
    const balance = sale.remaining_amount || sale.balance || 0;
    setPaymentDialog({
      open: true,
      sale,
      amount: String(balance),
      account: null,
      description: `Paiement vente ${sale.reference}`,
      processing: false,
      sale_reference: sale.reference,
      sale_total: sale.total_amount,
      sale_balance: balance,
      date: new Date(),
      payment_method: '',
      reference: '',
      notes: ''
    });
  }, []);

  const closePaymentDialog = useCallback(() => {
    setPaymentDialog(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const updatePaymentDialog = useCallback((data: Partial<PaymentDialogState>) => {
    setPaymentDialog(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const setPaymentProcessing = useCallback((processing: boolean) => {
    setPaymentDialog(prev => ({
      ...prev,
      processing
    }));
  }, []);

  // ============================================================================
  // SUPPLIER PAYMENT DIALOG STATE
  // ============================================================================

  const [supplierPaymentDialog, setSupplierPaymentDialog] = useState<SupplierPaymentDialogState>({
    open: false,
    supply: null,
    amount: '0',
    account: null,
    description: '',
    processing: false
  });

  const openSupplierPaymentDialog = useCallback((supply: OutstandingSupply) => {
    setSupplierPaymentDialog({
      open: true,
      supply,
      amount: String(supply.remaining_amount),
      account: null,
      description: `Paiement approvisionnement ${supply.reference}`,
      processing: false,
      supply_reference: supply.reference,
      supply_total: supply.total_amount,
      supply_balance: supply.remaining_amount,
      date: new Date(),
      payment_method: '',
      reference: '',
      notes: ''
    });
  }, []);

  const closeSupplierPaymentDialog = useCallback(() => {
    setSupplierPaymentDialog(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const updateSupplierPaymentDialog = useCallback((data: Partial<SupplierPaymentDialogState>) => {
    setSupplierPaymentDialog(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const setSupplierPaymentProcessing = useCallback((processing: boolean) => {
    setSupplierPaymentDialog(prev => ({
      ...prev,
      processing
    }));
  }, []);

  // ============================================================================
  // DEPOSIT DIALOG STATE
  // ============================================================================

  const [depositDialog, setDepositDialog] = useState<DepositDialogState>({
    open: false,
    client: null,
    amount: '0',
    account: null,
    payment_method: null,
    date: new Date().toISOString().split('T')[0],
    description: 'Dépôt sur compte',
    processing: false
  });

  const openDepositDialog = useCallback((client: Client) => {
    setDepositDialog({
      open: true,
      client,
      amount: '0',
      account: null, // Will be set by the dialog component when accounts are loaded
      payment_method: null,
      date: new Date().toISOString().split('T')[0],
      description: 'Dépôt sur compte',
      processing: false
    });
  }, []);

  const closeDepositDialog = useCallback(() => {
    setDepositDialog(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const updateDepositDialog = useCallback((data: Partial<DepositDialogState>) => {
    setDepositDialog(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const setDepositProcessing = useCallback((processing: boolean) => {
    setDepositDialog(prev => ({
      ...prev,
      processing
    }));
  }, []);

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  const validatePayment = useCallback(() => {
    if (!paymentDialog.sale || !paymentDialog.account) {
      return false;
    }

    const validation = validateClientPaymentForm({
      sale_id: paymentDialog.sale.id,
      amount: paymentDialog.amount,
      account: paymentDialog.account.id
    });

    return validation.valid;
  }, [paymentDialog]);

  const validateSupplierPayment = useCallback(() => {
    if (!supplierPaymentDialog.supply || !supplierPaymentDialog.account) {
      return false;
    }

    const validation = validateSupplierPaymentForm({
      supply_id: supplierPaymentDialog.supply.id,
      amount: supplierPaymentDialog.amount,
      account: supplierPaymentDialog.account.id
    });

    return validation.valid;
  }, [supplierPaymentDialog]);

  const validateDeposit = useCallback(() => {
    if (!depositDialog.client || !depositDialog.account || !depositDialog.payment_method) {
      return false;
    }

    const validation = validateDepositForm({
      client: depositDialog.client.id,
      account: depositDialog.account.id,
      amount: parseFloat(depositDialog.amount),
      payment_method: depositDialog.payment_method,
      date: depositDialog.date,
      description: depositDialog.description
    });

    return validation !== null ? false : true;
  }, [depositDialog]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Payment dialog
    paymentDialog,
    openPaymentDialog,
    closePaymentDialog,
    updatePaymentDialog,
    setPaymentProcessing,

    // Supplier payment dialog
    supplierPaymentDialog,
    openSupplierPaymentDialog,
    closeSupplierPaymentDialog,
    updateSupplierPaymentDialog,
    setSupplierPaymentProcessing,

    // Deposit dialog
    depositDialog,
    openDepositDialog,
    closeDepositDialog,
    updateDepositDialog,
    setDepositProcessing,

    // Validation
    validatePayment,
    validateSupplierPayment,
    validateDeposit
  };
};
