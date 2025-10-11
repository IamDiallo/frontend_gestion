/**
 * Composant réutilisable pour afficher les transactions
 * Élimine la duplication entre les onglets clients, fournisseurs et mouvements
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  Chip,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PrintIcon from '@mui/icons-material/Print';
import { 
  AccountStatement, 
  Account 
} from '../../interfaces/business';
import { 
  formatCurrency, 
  getTransactionTypeChipStyles,
  mapStatementsForGrid
} from '../../utils/treasuryUtils';
import { printPaiementReceipt } from '../../utils/printUtils';

interface TransactionsTableProps {
  statements: AccountStatement[];
  mode: 'client' | 'supplier' | 'account';
  showJournalCaisse?: boolean;
  allAccounts?: Account[];
  loading?: boolean;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  statements,
  mode,
  showJournalCaisse = true,
  allAccounts = [],
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getTransactionLibelle = useCallback((tx: AccountStatement): string => {
    switch (mode) {
      case 'client':
        return tx.transaction_type === 'sale' 
          ? 'Vente de marchandises' 
          : 'Paiement';
      case 'supplier':
        return tx.transaction_type === 'supply'
          ? 'Approvisionnement'
          : 'Paiement fournisseur';
      case 'account':
        return tx.transaction_type === 'sale'
          ? 'Vente de marchandises'
          : 'Paiement';
      default:
        return tx.description || 'Transaction';
    }
  }, [mode]);

  const getTransactionDebit = useCallback((tx: AccountStatement): number => {
    switch (mode) {
      case 'client':
        return tx.transaction_type === 'sale' ? parseFloat(tx.debit as string) : 0;
      case 'supplier':
        return tx.transaction_type === 'supplier_cash_payment' ? parseFloat(tx.debit as string) : 0;
      case 'account':
        return tx.transaction_type === 'sale' ? parseFloat(tx.debit as string) : 0;
      default:
        return parseFloat(tx.debit as string) || 0;
    }
  }, [mode]);

  const getTransactionCredit = useCallback((tx: AccountStatement): number => {
    switch (mode) {
      case 'client':
        return tx.transaction_type === 'cash_receipt' ? parseFloat(tx.credit as string) : 0;
      case 'supplier':
        return tx.transaction_type === 'supply' ? parseFloat(tx.credit as string) : 0;
      case 'account':
        return tx.transaction_type === 'cash_receipt' ? parseFloat(tx.credit as string) : 0;
      default:
        return parseFloat(tx.credit as string) || 0;
    }
  }, [mode]);

  // ============================================================================
  // DATA MAPPING
  // ============================================================================

  const journalData = useMemo(() => {
    return statements.map((tx, index) => ({
      id: index,
      date: tx.date,
      libelle: getTransactionLibelle(tx),
      debit: getTransactionDebit(tx),
      credit: getTransactionCredit(tx),
      solde: parseFloat(tx.balance as string)
    }));
  }, [statements, getTransactionLibelle, getTransactionDebit, getTransactionCredit]);

  const historyData = useMemo(() => {
    return mapStatementsForGrid(statements);
  }, [statements]);

  // ============================================================================
  // COLUMNS DEFINITION
  // ============================================================================

  const journalColumns: GridColDef[] = useMemo(() => [
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 120 
    },
    { 
      field: 'libelle', 
      headerName: 'Libellé', 
      flex: 1, 
      minWidth: 200 
    },
    { 
      field: 'debit', 
      headerName: 'Débit', 
      width: 150, 
      align: 'right', 
      headerAlign: 'right',
      renderCell: (params) => params.value > 0 ? formatCurrency(params.value) : ''
    },
    { 
      field: 'credit', 
      headerName: 'Crédit', 
      width: 150,
      align: 'right', 
      headerAlign: 'right',
      renderCell: (params) => params.value > 0 ? formatCurrency(params.value) : ''
    },
    { 
      field: 'solde', 
      headerName: 'Solde', 
      width: 160,
      align: 'right', 
      headerAlign: 'right',
      renderCell: (params) => formatCurrency(params.value)
    }
  ], []);

  const historyColumns: GridColDef[] = useMemo(() => {
    const baseColumns: GridColDef[] = [
      { 
        field: 'date', 
        headerName: 'Date', 
        width: 120 
      },
      { 
        field: 'reference', 
        headerName: 'Référence', 
        width: 140 
      },
      { 
        field: 'type', 
        headerName: 'Type', 
        width: 180, 
        renderCell: (params: GridRenderCellParams) => {
          const value = params.value || '';
          return (
            <Chip 
              label={value} 
              size="small" 
              sx={getTransactionTypeChipStyles(value)} 
            />
          );
        }
      },
      { 
        field: 'description', 
        headerName: 'Description', 
        flex: 1, 
        minWidth: 200 
      },
      { 
        field: 'debit', 
        headerName: 'Débit', 
        width: 130, 
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => params.value > 0 ? formatCurrency(params.value) : ''
      },
      { 
        field: 'credit', 
        headerName: 'Crédit', 
        width: 130, 
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => params.value > 0 ? formatCurrency(params.value) : ''
      },
      { 
        field: 'balance', 
        headerName: 'Solde', 
        width: 140, 
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => params.value > 0 ? formatCurrency(params.value) : ''
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          // Get transaction type from the row data (mapped in treasuryUtils)
          const transactionType = params.row.transaction_type;
          
          if (!transactionType) return null;

          // Only show print button for payment transactions
          const isPrintable = transactionType === 'cash_receipt' || 
                             transactionType === 'supplier_cash_payment' ||
                             transactionType === 'client_deposit';

          if (!isPrintable) return null;

          return (
            <Tooltip title="Imprimer le reçu">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  // Map transaction data to payment receipt format
                  const paiement = {
                    id: params.row.id,
                    date: params.row.rawDate || params.row.date,
                    amount: transactionType === 'cash_receipt' || transactionType === 'client_deposit'
                      ? params.row.credit 
                      : params.row.debit,
                    method: 'cash', // Default to cash as we don't have this field
                    description: params.row.description,
                    reference: params.row.reference,
                    type: transactionType
                  };
                  printPaiementReceipt(paiement);
                }}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }
      }
    ];

    // Add account column if in account mode
    if (mode === 'account' && allAccounts.length > 0) {
      baseColumns.splice(1, 0, {
        field: 'account_name',
        headerName: 'Compte',
        width: 150
      });
    }

    return baseColumns;
  }, [mode, allAccounts]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const getTabLabel = useCallback((tabIndex: number) => {
    if (tabIndex === 0 && showJournalCaisse) {
      const modeLabel = mode === 'client' 
        ? 'Client' 
        : mode === 'supplier' 
        ? 'Fournisseur' 
        : 'Client';
      return `Journal Caisse ${modeLabel} (${statements.length})`;
    }
    return `Historique des transactions (${statements.length})`;
  }, [mode, showJournalCaisse, statements.length]);

  if (loading) {
    return (
      <Paper sx={{ mb: 3, overflow: 'hidden' }} elevation={2}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 400 
        }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (statements.length === 0) {
    return (
      <Paper sx={{ mb: 3, overflow: 'hidden' }} elevation={2}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 400,
          gap: 2
        }}>
          <MoneyOffIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            Aucune transaction trouvée
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mb: 3, overflow: 'hidden' }} elevation={2}>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.light' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          textColor="inherit"
          indicatorColor="secondary"
        >
          {showJournalCaisse && (
            <Tab 
              label={getTabLabel(0)} 
              sx={{ color: 'primary.contrastText' }} 
            />
          )}
          <Tab 
            label={getTabLabel(showJournalCaisse ? 1 : 0)} 
            sx={{ color: 'primary.contrastText' }} 
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ 
        height: Math.min(Math.max(350, statements.length * 55 + 180), 400), 
        width: '100%' 
      }}>
        {activeTab === 0 && showJournalCaisse ? (
          // Journal Caisse
          <DataGrid
            rows={journalData}
            columns={journalColumns}
            getRowClassName={(params) => 
              params.indexRelativeToCurrentPage % 2 === 0 ? '' : 'even-row'
            } 
            initialState={{ 
              pagination: { 
                paginationModel: { pageSize: 10, page: 0 } 
              }, 
              sorting: { 
                sortModel: [{ field: 'date', sort: 'desc' }] 
              } 
            }} 
            density="compact" 
            disableRowSelectionOnClick 
            slots={{ toolbar: GridToolbar }} 
            slotProps={{ 
              toolbar: { 
                showQuickFilter: true, 
                quickFilterProps: { debounceMs: 300 } 
              } 
            }} 
            sx={{ 
              border: 'none', 
              '& .MuiDataGrid-cell:focus': { 
                outline: 'none' 
              }, 
              '& .even-row': { 
                bgcolor: 'rgba(0, 0, 0, 0.02)' 
              }, 
              '& .MuiDataGrid-columnHeaders': { 
                backgroundColor: 'rgba(0, 0, 0, 0.03)', 
                borderRadius: 0 
              } 
            }}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        ) : (
          // Historique des transactions
          <DataGrid
            rows={historyData}
            columns={historyColumns}
            getRowClassName={(params) => 
              params.indexRelativeToCurrentPage % 2 === 0 ? '' : 'even-row'
            } 
            initialState={{ 
              pagination: { 
                paginationModel: { pageSize: 10, page: 0 } 
              }, 
              sorting: { 
                sortModel: [{ field: 'rawDate', sort: 'desc' }] 
              } 
            }} 
            density="compact" 
            disableRowSelectionOnClick 
            slots={{ toolbar: GridToolbar }} 
            slotProps={{ 
              toolbar: { 
                showQuickFilter: true, 
                quickFilterProps: { debounceMs: 300 } 
              } 
            }} 
            sx={{ 
              border: 'none', 
              '& .MuiDataGrid-cell:focus': { 
                outline: 'none' 
              }, 
              '& .even-row': { 
                bgcolor: 'rgba(0, 0, 0, 0.02)' 
              }, 
              '& .MuiDataGrid-columnHeaders': { 
                backgroundColor: 'rgba(0, 0, 0, 0.03)', 
                borderRadius: 0 
              } 
            }}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        )}
      </Box>
    </Paper>
  );
};
