/**
 * Dialogue pour enregistrer un paiement fournisseur - Style amélioré
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Divider,
  Paper,
  Alert,
  AlertTitle,
  InputAdornment,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AttachMoney as AttachMoneyIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SupplierPaymentDialogState } from '../../hooks/useTreasuryDialogs';
import { Account } from '../../interfaces/business';
import { AccountsAPI } from '../../services/api/index';

interface SupplierPaymentDialogProps {
  data: SupplierPaymentDialogState;
  onClose: () => void;
  onChange: (data: Partial<SupplierPaymentDialogState>) => void;
  onSubmit: () => void;
  loading?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0
  }).format(value);
};

const formatNumberDisplay = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  return numValue.toString();
};

const validateAmountInput = (value: string, currentValue: number): number => {
  if (value === '' || value === null) return 0;
  const cleaned = value.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return currentValue;
  if (parts[1] && parts[1].length > 2) return currentValue;
  const numValue = parseFloat(cleaned);
  return isNaN(numValue) ? 0 : numValue;
};

const parseBalance = (balance: string | number): number => {
  if (typeof balance === 'number') return balance;
  return parseFloat(balance) || 0;
};

export const SupplierPaymentDialog: React.FC<SupplierPaymentDialogProps> = ({
  data,
  onClose,
  onChange,
  onSubmit,
  loading = false
}) => {
  const [companyAccounts, setCompanyAccounts] = useState<Account[]>([]);
  const selectedAccount = data.account;
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  const loadCompanyAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const accounts = await AccountsAPI.getAll();
      // Filter out client and supplier accounts
      const filtered = accounts.filter(
        acc => acc.account_type !== 'client' && acc.account_type !== 'supplier'
      );
      setCompanyAccounts(filtered);
      
      // Set first account as default if available and no account is selected
      if (filtered.length > 0 && !data.account) {
        onChange({ account: filtered[0] });
      }
    } catch (error) {
      console.error('Error loading company accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  }, [data.account, onChange]);

  // Load company accounts when dialog opens
  useEffect(() => {
    if (data.open) {
      loadCompanyAccounts();
      // Initialize amount from dialog data
      const initialAmount = typeof data.amount === 'string' 
        ? parseFloat(data.amount) 
        : data.amount || 0;
      setAmount(initialAmount);
    }
  }, [data.open, data.amount, loadCompanyAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🟠 SupplierPaymentDialog handleSubmit called');
    console.log('🟠 Calling onSubmit prop...');
    onSubmit();
  };

  const handleAmountChange = (value: string) => {
    const newAmount = validateAmountInput(value, amount);
    setAmount(newAmount);
    onChange({ amount: newAmount.toString() });
  };
  console.log('💰 Supplier Payment Dialog Render:', { data, amount });
  const supplyBalance = data.supply_balance || data.supply?.remaining_amount || 0;
  const supplyTotal = data.supply_total || data.supply?.total_amount || 0;
  const isPaid = data.supply && supplyBalance === 0;
  const isPartialPayment = amount > 0 && amount < supplyBalance;
  const isOverpayment = amount > 0 && amount > supplyBalance;
  const accountBalance = selectedAccount ? parseBalance(selectedAccount.current_balance) : 0;
  const insufficientFunds = selectedAccount && accountBalance < amount;

  // Debug logs
  console.log('💰 Supplier Payment Dialog Data:', {
    supply: data.supply,
    supply_balance: data.supply_balance,
    supply_total: data.supply_total,
    supplyBalance,
    supplyTotal,
    amount,
    isPaid,
    isOverpayment
  });

  return (
    <Dialog
      open={data.open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          pb: 2, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <PaymentIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6" component="div">
            Paiement fournisseur
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ py: 2 }}>
            {/* Alert if already paid */}
            {isPaid && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Approvisionnement déjà payé</AlertTitle>
                Cet approvisionnement a déjà été entièrement payé.
              </Alert>
            )}

            {/* Supply Information Card */}
            {data.supply && (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  borderRadius: 1, 
                  borderColor: 'divider', 
                  backgroundColor: 'background.paper' 
                }}
              >
                <Typography 
                  variant="h6" 
                  color="warning.main" 
                  gutterBottom 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 'medium', 
                    borderBottom: 1, 
                    pb: 1, 
                    borderColor: 'divider' 
                  }}
                >
                  Informations de l'approvisionnement
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Référence
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {data.supply_reference}
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
                      {formatCurrency(supplyTotal)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Montant payé
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium" color="success.main">
                      {formatCurrency(supplyTotal - supplyBalance)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Restant à payer
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold" 
                      color="error.main"
                    >
                      {formatCurrency(supplyBalance)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Payment Details */}
            <Grid container spacing={2}>
              {/* Company Account Selector */}
              <Grid item xs={12}>
                {loadingAccounts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Autocomplete
                    options={companyAccounts}
                    getOptionLabel={(option) => 
                      `${option.name} - Solde: ${formatCurrency(parseBalance(option.current_balance))}`
                    }
                    value={selectedAccount}
                    onChange={(_, newValue) => {
                      onChange({ account: newValue });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Compte de l'entreprise"
                        variant="outlined"
                        fullWidth
                        required
                        helperText={
                          insufficientFunds
                            ? `⚠️ Attention: Ce paiement créera un solde négatif (${formatCurrency(accountBalance - amount)})`
                            : "Sélectionnez le compte de l'entreprise pour effectuer le paiement"
                        }
                        InputLabelProps={{
                          sx: insufficientFunds 
                            ? { color: 'warning.main' } 
                            : undefined
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <Typography>{option.name}</Typography>
                          <Chip 
                            label={formatCurrency(parseBalance(option.current_balance))} 
                            size="small"
                            color={parseBalance(option.current_balance) >= amount ? 'success' : 'warning'}
                            icon={parseBalance(option.current_balance) < amount ? <WarningIcon fontSize="small" /> : undefined}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                      </li>
                    )}
                  />
                )}
              </Grid>

              {/* Payment Amount */}
              <Grid item xs={12}>
                <TextField
                  label="Montant du paiement"
                  type="text"
                  fullWidth
                  required
                  value={formatNumberDisplay(amount)}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  error={amount <= 0 || isOverpayment}
                  helperText={
                    amount <= 0 
                      ? 'Le montant doit être supérieur à zéro' 
                      : isOverpayment
                      ? 'Le montant ne peut pas dépasser le solde restant'
                      : insufficientFunds
                      ? `⚠️ Attention: Solde insuffisant (${formatCurrency(accountBalance)} disponible) - Le compte sera négatif`
                      : `Solde restant: ${formatCurrency(supplyBalance)}`
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Payment Type Summary */}
                {amount > 0 && !isOverpayment && (
                  <Box sx={{ mt: 2 }}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        borderRadius: 1,
                        borderColor: isPartialPayment ? 'info.main' : 'success.main',
                        borderWidth: 2,
                        backgroundColor: isPartialPayment 
                          ? 'rgba(3, 169, 244, 0.08)'
                          : 'rgba(46, 125, 50, 0.08)',
                        boxShadow: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ mr: 2, mt: 0.5 }}>
                          <PaymentIcon 
                            fontSize="large" 
                            color={isPartialPayment ? "info" : "success"} 
                          />
                        </Box>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom fontWeight="bold">
                            {isPartialPayment ? "Paiement partiel" : "Paiement total"}
                          </Typography>
                          
                          <Typography variant="body2">
                            {isPartialPayment ? (
                              <>
                                Vous effectuez un paiement partiel de {formatCurrency(amount)}. 
                                Un montant de {formatCurrency(supplyBalance - amount)} restera à payer.
                                Le statut de l'approvisionnement sera mis à jour en "Partiellement payé".
                              </>
                            ) : (
                              <>
                                Vous effectuez le paiement total de cet approvisionnement d'un montant de {formatCurrency(amount)}.
                                Le statut de l'approvisionnement sera mis à jour en "Payé".
                              </>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={data.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  placeholder="Description du paiement"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="warning"
            disabled={
              loading || 
              !selectedAccount ||
              amount <= 0 ||
              isOverpayment ||
              isPaid
            }
            startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
            sx={{ 
              fontWeight: 'medium',
              minWidth: '200px',
              px: 3
            }}
          >
            {loading ? 'Traitement...' : (
              isPaid ? 'Approvisionnement déjà payé' : (
                isPartialPayment ? 'Effectuer un paiement partiel' : 'Effectuer le paiement total'
              )
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
