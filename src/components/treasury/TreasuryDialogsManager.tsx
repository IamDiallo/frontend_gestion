/**
 * Gestionnaire centralisé des dialogues de trésorerie
 * Regroupe tous les dialogues de paiement et dépôt
 */

import React from 'react';
import { PaymentDialog } from './PaymentDialog';
import { SupplierPaymentDialog } from './SupplierPaymentDialog';
import { DepositDialog } from './DepositDialog';
import {
  PaymentDialogState,
  SupplierPaymentDialogState,
  DepositDialogState
} from '../../hooks/useTreasuryDialogs';
import { Client, Account } from '../../interfaces/business';

interface TreasuryDialogsManagerProps {
  // Payment Dialog
  paymentDialog: PaymentDialogState;
  onPaymentDialogClose: () => void;
  onPaymentDialogChange: (data: Partial<PaymentDialogState>) => void;
  onPaymentSubmit: () => void;

  // Supplier Payment Dialog
  supplierPaymentDialog: SupplierPaymentDialogState;
  onSupplierPaymentDialogClose: () => void;
  onSupplierPaymentDialogChange: (data: Partial<SupplierPaymentDialogState>) => void;
  onSupplierPaymentSubmit: () => void;

  // Deposit Dialog
  depositDialog: DepositDialogState;
  onDepositDialogClose: () => void;
  onDepositDialogChange: (data: Partial<DepositDialogState>) => void;
  onDepositSubmit: () => void;

  // Additional data for dialogs
  clients?: Client[];
  accounts?: Account[];
  paymentMethods?: Array<{ id: number; name: string }>;
  error?: string | null;

  // Loading states
  loading?: boolean;
}

export const TreasuryDialogsManager: React.FC<TreasuryDialogsManagerProps> = ({
  paymentDialog,
  onPaymentDialogClose,
  onPaymentDialogChange,
  onPaymentSubmit,
  supplierPaymentDialog,
  onSupplierPaymentDialogClose,
  onSupplierPaymentDialogChange,
  onSupplierPaymentSubmit,
  depositDialog,
  onDepositDialogClose,
  onDepositDialogChange,
  onDepositSubmit,
  clients = [],
  accounts = [],
  paymentMethods = [],
  error = null,
  loading = false
}) => {
  // Wrapper to convert field-by-field onChange to object onChange
  const handleDepositChange = (field: keyof DepositDialogState, value: Client | Account | { id: number; name: string } | string | null) => {
    onDepositDialogChange({ [field]: value });
  };

  // Convert DepositDialogState to DepositDialogData format
  const depositDialogData = {
    open: depositDialog.open,
    client: depositDialog.client,
    account: depositDialog.account,
    amount: depositDialog.amount,
    date: depositDialog.date,
    payment_method: depositDialog.payment_method,
    description: depositDialog.description
  };

  return (
    <>
      {/* Client Payment Dialog */}
      <PaymentDialog
        data={paymentDialog}
        onClose={onPaymentDialogClose}
        onChange={onPaymentDialogChange}
        onSubmit={onPaymentSubmit}
        loading={loading}
      />

      {/* Supplier Payment Dialog */}
      <SupplierPaymentDialog
        data={supplierPaymentDialog}
        onClose={onSupplierPaymentDialogClose}
        onChange={onSupplierPaymentDialogChange}
        onSubmit={onSupplierPaymentSubmit}
        loading={loading}
      />

      {/* Deposit Dialog */}
      <DepositDialog
        data={depositDialogData}
        clients={clients}
        accounts={accounts}
        paymentMethods={paymentMethods}
        onClose={onDepositDialogClose}
        onChange={handleDepositChange}
        onSubmit={onDepositSubmit}
        loading={loading}
        error={error}
        selectedClient={depositDialog.client}
      />
    </>
  );
};
