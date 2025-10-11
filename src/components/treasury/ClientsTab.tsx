/**
 * Onglet de gestion des clients - trésorerie
 * Affiche la balance client, les ventes en attente et les transactions
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Client, OutstandingSale, AccountStatement, ActualClientBalanceResponse } from '../../interfaces/business';
import { ClientBalanceCard } from './ClientBalanceCard';
import { OutstandingSalesCard } from './OutstandingSalesCard';
import { TransactionsTable } from './TransactionsTable';

interface ClientsTabProps {
  clients: Client[];
  selectedClient: Client | null;
  onClientChange: (clientId: number | null) => void;
  onPaymentClick: (sale: OutstandingSale) => void;
  onDepositClick?: (client: Client) => void;
  clientBalance: {
    total_sales: number;
    total_account_credits: number;
    balance: number;
  } | null;
  outstandingSales: OutstandingSale[];
  transactions: AccountStatement[];
  loading?: boolean;
  clientBalanceData?: ActualClientBalanceResponse;
  previousBalance?: number | null;
  balanceChangeHighlight?: boolean;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  selectedClient,
  onClientChange,
  onPaymentClick,
  onDepositClick,
  clientBalance,
  outstandingSales,
  transactions,
  loading = false,
  clientBalanceData,
  previousBalance = null,
  balanceChangeHighlight = false
}) => {
  const [clientSearch, setClientSearch] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleClientSelectChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value;
    onClientChange(value === 0 ? null : Number(value));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rechercher un client"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Client</InputLabel>
            <Select
              value={selectedClient?.id || 0}
              onChange={handleClientSelectChange}
              label="Client"
            >
              <MenuItem value={0}>Tous les clients</MenuItem>
              {filteredClients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Client Balance Card - shown when a client is selected */}
      {selectedClient && clientBalance && clientBalanceData && (
        <ClientBalanceCard 
          client={selectedClient} 
          balanceData={clientBalanceData}
          onDepositClick={() => onDepositClick?.(selectedClient)}
          previousBalance={previousBalance}
          balanceChangeHighlight={balanceChangeHighlight}
        />
      )}

      {/* Outstanding Sales - shown when a client is selected */}
      {selectedClient && (
        <OutstandingSalesCard
          sales={outstandingSales}
          onPaymentClick={onPaymentClick}
          loading={loading}
        />
      )}

      {/* Transactions Table - always shown (filtered by client when one is selected) */}
      <TransactionsTable
        statements={transactions}
        mode="client"
        loading={loading}
      />
    </Box>
  );
};
