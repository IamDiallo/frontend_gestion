/**
 * QuotesTab Component
 * Displays and manages the quotes list with filtering and actions
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
  Print as PrintIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { StandardDataGrid, StatusChip, PermissionButton } from '../common';
import { getStatusTranslation } from '../../utils/translations';
import { ApiQuote, Client } from '../../interfaces/sales';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

interface QuotesTabProps {
  quotes: ApiQuote[];
  loading: boolean;
  clients: Client[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  onAdd: () => void;
  onEdit: (quote: ApiQuote) => void;
  onDelete: (quote: ApiQuote) => void;
  onPrint: (quote: ApiQuote) => void;
  onConvert: (quote: ApiQuote) => void;
}

const QuotesTab: React.FC<QuotesTabProps> = ({
  quotes,
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
  onPrint,
  onConvert
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
      field: 'date',
      headerName: 'Date',
      flex: 1,
      minWidth: 100,
      valueGetter: (value, row) => {
        if (!row || !row.date) return '';
        return new Date(row.date).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'valid_until',
      headerName: 'Valable jusqu\'au',
      flex: 1,
      minWidth: 130,
      valueGetter: (value, row) => {
        if (!row || !row.valid_until) return '';
        return new Date(row.valid_until).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'total_amount',
      headerName: 'Montant Total',
      flex: 1,
      minWidth: 120,
      valueGetter: (value, row) => {
        if (!row) return '';
        return formatCurrency(row.total_amount);
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
      flex: 1.2,
      minWidth: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return <></>;
        const quote = params.row as ApiQuote;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(quote);
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
                onDelete(quote);
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
                onPrint(quote);
              }}
              title="Imprimer"
            >
              <PrintIcon fontSize="small" />
            </IconButton>
            {(quote.status === 'accepted' || quote.status === 'sent') && !quote.is_converted && (
              <IconButton
                size="small"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  onConvert(quote);
                }}
                title="Convertir en vente"
              >
                <SyncIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      }
    }
  ];

  // Calculate stats
  const totalQuotes = quotes.length;
  const draftQuotes = quotes.filter(q => q.status === 'draft').length;
  const sentQuotes = quotes.filter(q => q.status === 'sent').length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  
  // Calculate expired quotes
  const today = new Date();
  const expiredQuotes = quotes.filter(q => {
    if (q.status === 'accepted' || q.status === 'rejected' || q.status === 'expired') {
      return false;
    }
    const expiryDate = new Date(q.expiry_date);
    return expiryDate < today;
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
            Total Devis
          </Typography>
          <Typography variant="h6" color="primary.main">{totalQuotes}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Brouillon
          </Typography>
          <Typography variant="h6" color="grey.500">{draftQuotes}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Envoyé
          </Typography>
          <Typography variant="h6" color="info.main">{sentQuotes}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Accepté
          </Typography>
          <Typography variant="h6" color="success.main">{acceptedQuotes}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Expiré
          </Typography>
          <Typography variant="h6" color="error.main">{expiredQuotes}</Typography>
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
            <InputLabel id="quote-status-filter-label">Statut</InputLabel>
            <Select
              labelId="quote-status-filter-label"
              id="quote-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Statut"
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="draft">Brouillon</MenuItem>
              <MenuItem value="sent">Envoyé</MenuItem>
              <MenuItem value="accepted">Accepté</MenuItem>
              <MenuItem value="rejected">Rejeté</MenuItem>
              <MenuItem value="cancelled">Annulé</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="quote-date-filter-label">Période</InputLabel>
            <Select
              labelId="quote-date-filter-label"
              id="quote-date-filter"
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
            requiredPermission="sales.add_quote"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Nouveau devis
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
          rows={quotes}
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

export default QuotesTab;
