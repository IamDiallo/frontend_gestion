/**
 * Onglet de gestion des fournisseurs - trésorerie
 * Affiche la balance fournisseur, les achats en attente et les transactions
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
import { Supplier, OutstandingSupply, AccountStatement, ActualSupplierBalanceResponse } from '../../interfaces/business';
import { SupplierBalanceCard } from './SupplierBalanceCard';
import { OutstandingSuppliesCard } from './OutstandingSuppliesCard';
import { TransactionsTable } from './TransactionsTable';

interface SuppliersTabProps {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  onSupplierChange: (supplierId: number | null) => void;
  onPaymentClick: (supply: OutstandingSupply) => void;
  supplierBalance: {
    total_purchases: number;
    total_account_credits: number;
    balance: number;
  } | null;
  outstandingSupplies: OutstandingSupply[];
  transactions: AccountStatement[];
  loading?: boolean;
  supplierBalanceData?: ActualSupplierBalanceResponse;
  previousBalance?: number | null;
  balanceChangeHighlight?: boolean;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({
  suppliers,
  selectedSupplier,
  onSupplierChange,
  onPaymentClick,
  supplierBalance,
  outstandingSupplies,
  transactions,
  loading = false,
  supplierBalanceData,
  previousBalance,
  balanceChangeHighlight
}) => {
  const [supplierSearch, setSupplierSearch] = useState('');

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const handleSupplierSelectChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value;
    onSupplierChange(value === 0 ? null : Number(value));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rechercher un fournisseur"
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
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
            <InputLabel>Fournisseur</InputLabel>
            <Select
              value={selectedSupplier?.id || 0}
              onChange={handleSupplierSelectChange}
              label="Fournisseur"
            >
              <MenuItem value={0}>Tous les fournisseurs</MenuItem>
              {filteredSuppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Supplier Balance Card - shown when a supplier is selected */}
      {selectedSupplier && supplierBalance && supplierBalanceData && (
        <SupplierBalanceCard 
          supplier={selectedSupplier} 
          balanceData={supplierBalanceData}
          previousBalance={previousBalance}
          balanceChangeHighlight={balanceChangeHighlight}
        />
      )}

      {/* Outstanding Supplies - shown when a supplier is selected */}
      {selectedSupplier && (
        <OutstandingSuppliesCard
          supplies={outstandingSupplies}
          onPaymentClick={onPaymentClick}
          loading={loading}
        />
      )}

      {/* Transactions Table - always shown (filtered by supplier when one is selected) */}
      <TransactionsTable
        statements={transactions}
        mode="supplier"
        loading={loading}
      />
    </Box>
  );
};
