/**
 * Suppliers Tab Component
 * Displays supplier account balances and transaction statements
 */

import React, { useMemo } from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { formatCurrency, parseBalance } from '../../utils/dashboardUtils';

interface SupplierWithAccount {
  id: number;
  name: string;
  balance: number;
  account: number;
  account_balance: number;
  last_transaction_date?: string;
  contact?: string;
}

interface SuppliersTabProps {
  supplierBalances: SupplierWithAccount[];
  // Filter props
  searchTerm?: string;
  minAmount?: string;
  maxAmount?: string;
}

const SuppliersTab: React.FC<SuppliersTabProps> = ({
  supplierBalances,
  searchTerm = '',
  minAmount = '',
  maxAmount = ''
}) => {
  // Filter supplier balances
  const filteredSupplierBalances = useMemo(() => {
    let filtered = [...supplierBalances];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(search)
      );
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filtered = filtered.filter(supplier => {
        const balance = Math.abs(parseBalance(supplier.balance));
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Infinity;
        return balance >= min && balance <= max;
      });
    }

    // Sort by balance descending (highest credit first - we owe them more)
    filtered.sort((a, b) => parseBalance(b.balance) - parseBalance(a.balance));

    return filtered;
  }, [supplierBalances, searchTerm, minAmount, maxAmount]);

  // Supplier balances columns
  const supplierBalancesColumns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Fournisseur', 
      flex: 1.5,
      minWidth: 200
    },
    {
      field: 'balance',
      headerName: 'Solde',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        const balance = parseBalance(params.value);
        return (
          <Chip
            label={formatCurrency(balance)}
            color={balance > 0 ? 'success' : balance < 0 ? 'error' : 'default'}
            size="small"
          />
        );
      }
    },
    {
      field: 'last_transaction_date',
      headerName: 'Dernière transaction',
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'contact',
      headerName: 'Contact',
      flex: 1,
      minWidth: 120,
      valueGetter: (value) => value || '-'
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Soldes fournisseurs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {filteredSupplierBalances.length} fournisseur(s)
        </Typography>
      </Box>
      <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400, width: '100%' }}>
        <DataGrid
          rows={filteredSupplierBalances}
          columns={supplierBalancesColumns}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } }
          }}
          disableRowSelectionOnClick
          autoHeight={false}
          sx={{
            '& .MuiDataGrid-virtualScroller': {
              minHeight: 400
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default SuppliersTab;
