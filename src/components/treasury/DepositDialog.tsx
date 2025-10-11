/**
 * Dialogue pour enregistrer un dépôt de caisse
 */

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Divider,
  Autocomplete,
  Alert,
  CircularProgress
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Client, Account } from '../../interfaces/business';

export interface DepositDialogData {
  open: boolean;
  client: Client | null;
  account: Account | null;
  amount: string;
  date: string;
  payment_method: { id: number; name: string } | null;
  description: string;
}

interface DepositDialogProps {
  data: DepositDialogData;
  clients: Client[];
  accounts: Account[];
  paymentMethods: Array<{ id: number; name: string }>;
  onClose: () => void;
  onChange: (field: keyof DepositDialogData, value: Client | Account | { id: number; name: string } | string | null) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
  selectedClient?: Client | null;
}

export const DepositDialog: React.FC<DepositDialogProps> = ({
  data,
  clients,
  accounts,
  paymentMethods,
  onClose,
  onChange,
  onSubmit,
  loading = false,
  error = null,
  selectedClient = null
}) => {
  // Auto-select account when dialog opens with a pre-selected client
  useEffect(() => {
    if (data.open && data.client && !data.account && accounts.length > 0) {
      console.log('Auto-selecting account for client:', {
        clientId: data.client.id,
        clientName: data.client.name,
        clientAccountId: data.client.account,
        availableAccounts: accounts.length
      });
      
      // Find the client's account
      if (data.client.account) {
        const clientAccount = accounts.find(a => a.id === data.client!.account);
        if (clientAccount) {
          console.log('Found and selecting client account:', clientAccount);
          onChange('account', clientAccount);
        } else {
          console.log('Client account ID not found in accounts list');
        }
      } else {
        console.log('Client has no account field');
      }
    }
  }, [data.open, data.client, data.account, accounts, onChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Validation: All required fields must be filled
  const isFormValid = 
    data.client !== null && 
    data.account !== null && 
    data.payment_method !== null && 
    data.amount !== '' && 
    parseFloat(data.amount) > 0 &&
    data.date !== '';

  // Debug: Log validation state
  console.log('Deposit Form Validation:', {
    client: data.client !== null,
    account: data.account !== null,
    payment_method: data.payment_method !== null,
    amount_not_empty: data.amount !== '',
    amount_valid: parseFloat(data.amount) > 0,
    date: data.date !== '',
    isFormValid
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
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        pb: 2, 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Box component="span">
          Nouveau dépôt client
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => option.name}
                value={data.client}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(event, newValue) => {
                  onChange('client', newValue);
                  // Auto-select the client's account if they have one
                  if (newValue) {
                    const clientAccount = accounts.find(a => a.id === newValue.account);
                    onChange('account', clientAccount || null);
                  } else {
                    onChange('account', null);
                  }
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
                options={accounts}
                getOptionLabel={(option) => `${option.name} (${option.account_type})`}
                value={data.account}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(event, newValue) => {
                  onChange('account', newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Compte du client"
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
                options={paymentMethods}
                getOptionLabel={(option) => option.name}
                value={data.payment_method}
                onChange={(event, newValue) => {
                  onChange('payment_method', newValue);
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
                type="number"
                value={data.amount}
                onChange={(e) => onChange('amount', e.target.value)}
                fullWidth
                required
                error={parseFloat(data.amount) <= 0 && data.amount !== ''}
                helperText={parseFloat(data.amount) <= 0 && data.amount !== '' ? 'Le montant doit être supérieur à 0' : ''}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                value={data.date}
                onChange={(e) => onChange('date', e.target.value)}
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
                value={data.description}
                onChange={(e) => onChange('description', e.target.value)}
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
          onClick={onClose}
          variant="outlined"
        >
          Annuler
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading || !isFormValid}
          startIcon={<AttachMoneyIcon />}
        >
          Créer le dépôt
        </Button>
      </DialogActions>
    </Dialog>
  );
};
