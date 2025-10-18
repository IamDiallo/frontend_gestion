/**
 * Dialogue pour enregistrer un paiement client - Style amélioré
 */

import React, { useState, useEffect } from 'react';
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
  Autocomplete
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Money as MoneyIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { PaymentDialogState } from '../../hooks/useTreasuryDialogs';
import { Account } from '../../interfaces/business';
import { AccountsAPI } from '../../services/api/index';

interface PaymentDialogProps {
  data: PaymentDialogState;
  onClose: () => void;
  onChange: (data: Partial<PaymentDialogState>) => void;
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

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  data,
  onClose,
  onChange,
  onSubmit,
  loading = false
}) => {
  const [companyAccounts, setCompanyAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  // Use data.account as the selected account (controlled by parent)
  const selectedAccount = data.account;

  // Load company accounts when dialog opens
  useEffect(() => {
    const loadCompanyAccounts = async () => {
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
    };

    if (data.open) {
      loadCompanyAccounts();
      // Initialize amount from dialog data
      const initialAmount = typeof data.amount === 'string' 
        ? parseFloat(data.amount) 
        : data.amount || 0;
      setAmount(initialAmount);
    }
  }, [data.open, data.amount, data.account, onChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔴 PaymentDialog handleSubmit called');
    console.log('🔴 Calling onSubmit prop...');
    onSubmit();
  };

  const handleAmountChange = (value: string) => {
    const newAmount = validateAmountInput(value, amount);
    setAmount(newAmount);
    onChange({ amount: newAmount.toString() });
  };

  // Backend returns remaining_amount for outstanding_sales
  const saleBalance = data.sale_balance || data.sale?.remaining_amount || data.sale?.balance || 0;
  const saleTotal = data.sale_total || data.sale?.total_amount || 0;
  const isPaid = data.sale && saleBalance === 0;
  const isPartialPayment = amount > 0 && amount < saleBalance;
  const isOverpayment = amount > 0 && amount > saleBalance;

  // Debug logs
  console.log('💰 Payment Dialog Data:', {
    sale: data.sale,
    sale_balance: data.sale_balance,
    sale_total: data.sale_total,
    saleBalance,
    saleTotal,
    amount,
    isPaid,
    isPartialPayment,
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
          <PaymentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            Paiement de vente
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ py: 2 }}>
            {/* Alert if already paid */}
            {isPaid && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Vente déjà payée</AlertTitle>
                Cette vente a déjà été entièrement payée.
              </Alert>
            )}

            {/* Sale Information Card */}
            {data.sale && (
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
                  color="primary" 
                  gutterBottom 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 'medium', 
                    borderBottom: 1, 
                    pb: 1, 
                    borderColor: 'divider' 
                  }}
                >
                  Informations de la vente
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Référence
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {data.sale_reference}
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
                      {formatCurrency(saleTotal)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Déjà payé
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium" color="success.main">
                      {formatCurrency(saleTotal - saleBalance)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Montant restant
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="medium" 
                      color={saleBalance > 0 ? "error.main" : "success.main"}
                    >
                      {formatCurrency(saleBalance)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Payment Details */}
            <Typography 
              variant="h6" 
              color="primary" 
              gutterBottom 
              sx={{ mt: 3, mb: 2, fontWeight: 'medium' }}
            >
              Détails du paiement
            </Typography>
            
            <Grid container spacing={3}>
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
                      `${option.name} (${option.account_type})`
                    }
                    value={selectedAccount}
                    onChange={(_, newValue) => {
                      onChange({ account: newValue });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Compte de l'entreprise à créditer"
                        variant="outlined"
                        fullWidth
                        required
                      />
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
                      ? "Le montant doit être supérieur à 0" 
                      : isOverpayment 
                      ? "Le montant dépasse le solde restant"
                      : ""
                  }
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color={amount > 0 ? "primary" : "action"} />
                      </InputAdornment>
                    )
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
                                Un montant de {formatCurrency(saleBalance - amount)} restera à payer.
                                Le statut de la vente sera mis à jour en "Partiellement payé".
                              </>
                            ) : (
                              <>
                                Vous effectuez le paiement total de cette vente d'un montant de {formatCurrency(amount)}.
                                Le statut de la vente sera mis à jour en "Payé".
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
        </DialogContent>

        <Divider />
        
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
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
            color={isPartialPayment ? "info" : "primary"}
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
              isPaid ? 'Vente déjà payée' : (
                isPartialPayment ? 'Effectuer un paiement partiel' : 'Effectuer le paiement total'
              )
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
