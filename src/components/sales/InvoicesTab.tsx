/**
 * InvoicesTab Component
 * Displays and manages the invoices list with filtering and actions
 */

import React from 'react';
import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Typography,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { StandardDataGrid, StatusChip, PermissionButton } from '../common';
import { getStatusTranslation } from '../../utils/translations';
import { ExtendedInvoice, Client } from '../../interfaces/sales';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

interface InvoicesTabProps {
  invoices: ExtendedInvoice[];
  loading: boolean;
  clients: Client[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  onAdd: () => void;
  onEdit: (invoice: ExtendedInvoice) => void;
  onDelete: (invoice: ExtendedInvoice) => void;
  onPrint: (invoice: ExtendedInvoice) => void;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  loading,
  clients,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  onAdd,
  onEdit,
  onDelete,
  onPrint
}) => {
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: 'reference',
      headerName: 'Référence',
      flex: 1,
      minWidth: 120
    },
    {
      field: 'sale',
      headerName: 'Vente',
      flex: 1,
      minWidth: 120,
      valueGetter: (value, row) => {
        if (!row || !row.sale_reference) return 'N/A';
        return row.sale_reference;
      }
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1.5,
      minWidth: 150,
      valueGetter: (value, row) => {
        if (!row) return '';
        const client = clients.find(c => c.id === row.client);
        return client?.name || 'N/A';
      }
    },
    {
      field: 'issue_date',
      headerName: 'Date Emission',
      flex: 1,
      minWidth: 110,
      valueGetter: (value, row) => {
        if (!row || !row.issue_date) return '';
        return new Date(row.issue_date).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'due_date',
      headerName: 'Date Échéance',
      flex: 1,
      minWidth: 120,
      valueGetter: (value, row) => {
        if (!row || !row.due_date) return '';
        return new Date(row.due_date).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'amount',
      headerName: 'Montant',
      flex: 1,
      minWidth: 120,
      valueGetter: (value, row) => {
        if (!row) return '';
        return formatCurrency(row.amount);
      }
    },
    {
      field: 'balance',
      headerName: 'Solde',
      flex: 1,
      minWidth: 120,
      valueGetter: (value, row) => {
        if (!row) return '';
        return formatCurrency(row.balance);
      }
    },
    {
      field: 'status',
      headerName: 'Statut',
      flex: 1,
      minWidth: 100,
      valueGetter: (value, row) => {
        if (!row || !row.status) return '';
        return getStatusTranslation(row.status);
      },
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row || !params.row.status) return <></>;
        return <StatusChip status={params.row.status} />;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(params.row as ExtendedInvoice);
              }}
              title="Modifier"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(params.row as ExtendedInvoice);
              }}
              title="Supprimer"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(params.row as ExtendedInvoice);
              }}
              title="Imprimer"
            >
              <PrintIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  // Calculate stats
  const totalInvoices = invoices.length;
  const draftInvoices = invoices.filter(i => i.status === 'draft').length;
  const sentInvoices = invoices.filter(i => i.status === 'sent').length;
  const paidInvoices = invoices.filter(i => i.status === 'paid').length;
  const overdueInvoices = invoices.filter(i => {
    if (i.status === 'paid') return false;
    const dueDate = new Date(i.due_date);
    const today = new Date();
    return dueDate < today;
  }).length;

  return (
    <Box>
      {/* Stats Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          backgroundColor: 'background.paper',
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ textAlign: 'center', px: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Total Factures
          </Typography>
          <Typography variant="h6" color="primary.main">{totalInvoices}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Brouillon
          </Typography>
          <Typography variant="h6" color="grey.500">{draftInvoices}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Envoyée
          </Typography>
          <Typography variant="h6" color="info.main">{sentInvoices}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Payée
          </Typography>
          <Typography variant="h6" color="success.main">{paidInvoices}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            En retard
          </Typography>
          <Typography variant="h6" color="error.main">{overdueInvoices}</Typography>
        </Box>
      </Box>

      {/* Filters and Actions */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'flex-end' },
        mb: 3,
        gap: 2
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          width: { xs: '100%', md: 'auto' },
          flexGrow: 1
        }}>
          <TextField
            label="Rechercher"
            placeholder="Référence ou client"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VisibilityIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="invoice-status-filter-label">Statut</InputLabel>
            <Select
              labelId="invoice-status-filter-label"
              id="invoice-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Statut"
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="draft">Brouillon</MenuItem>
              <MenuItem value="sent">Envoyée</MenuItem>
              <MenuItem value="paid">Payée</MenuItem>
              <MenuItem value="overdue">En retard</MenuItem>
              <MenuItem value="cancelled">Annulée</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="invoice-date-filter-label">Période</InputLabel>
            <Select
              labelId="invoice-date-filter-label"
              id="invoice-date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              label="Période"
            >
              <MenuItem value="">Toutes les périodes</MenuItem>
              <MenuItem value="today">Aujourd'hui</MenuItem>
              <MenuItem value="week">Cette semaine</MenuItem>
              <MenuItem value="month">Ce mois</MenuItem>
              <MenuItem value="quarter">Ce trimestre</MenuItem>
              <MenuItem value="year">Cette année</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Stack direction="row" spacing={2}>
          <PermissionButton
            requiredPermission="sales.add_invoice"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Nouvelle facture
          </PermissionButton>
        </Stack>
      </Box>

      {/* Data Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <StandardDataGrid
          rows={invoices}
          columns={columns}
          loading={loading}
          getRowId={(row) => row?.id ?? Math.random()}
          onRowClick={(params) => onEdit(params.row)}
          showToolbar
        />
      )}
    </Box>
  );
};

export default InvoicesTab;
