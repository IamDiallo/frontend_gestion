/**
 * Accounts Tab Component
 * Displays client account balances and transaction statements
 */

import React, { useMemo } from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { formatCurrency, parseBalance } from '../../utils/dashboardUtils';
import type { ClientWithAccount } from '../../services/api/index';

interface AccountsTabProps {
  clientBalances: ClientWithAccount[];
  // Filter props
  searchTerm?: string;
  minAmount?: string;
  maxAmount?: string;
}

const AccountsTab: React.FC<AccountsTabProps> = ({
  clientBalances,
  searchTerm = '',
  minAmount = '',
  maxAmount = ''
}) => {
  // Filter client balances
  const filteredClientBalances = useMemo(() => {
    let filtered = [...clientBalances];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(search)
      );
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filtered = filtered.filter(client => {
        const balance = Math.abs(parseBalance(client.balance));
        const min = minAmount ? parseFloat(minAmount) : 0;
        const max = maxAmount ? parseFloat(maxAmount) : Infinity;
        return balance >= min && balance <= max;
      });
    }

    // Sort by balance descending (highest debt first)
    filtered.sort((a, b) => parseBalance(b.balance) - parseBalance(a.balance));

    return filtered;
  }, [clientBalances, searchTerm, minAmount, maxAmount]);

  // Client balances columns
  const clientBalancesColumns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'Client', 
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
            color={balance > 0 ? 'error' : balance < 0 ? 'success' : 'default'}
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
      field: 'phone',
      headerName: 'Téléphone',
      flex: 1,
      minWidth: 120,
      valueGetter: (value) => value || '-'
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Soldes clients
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total: {filteredClientBalances.length} client(s)
        </Typography>
      </Box>
      <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400, width: '100%' }}>
        <DataGrid
          rows={filteredClientBalances}
          columns={clientBalancesColumns}
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

export default AccountsTab;
