/**
 * SalesTab Component
 * Displays and manages the sales list with filtering and actions
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
  QrCodeScanner as QrCodeScannerIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { StandardDataGrid, StatusChip } from '../common';
import { ExtendedSale } from '../../hooks/useSalesData';
import { Client, Zone } from '../../interfaces/sales';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import PermissionButton from '../common/PermissionButton';

interface SalesTabProps {
  sales: ExtendedSale[];
  loading: boolean;
  clients: Client[];
  zones: Zone[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  onAdd: () => void;
  onEdit: (sale: ExtendedSale) => void;
  onDelete: (sale: ExtendedSale, confirmationInfo?: Record<string, unknown>) => void;
  onOpenScanner: () => void;
}

const SalesTab: React.FC<SalesTabProps> = ({
  sales,
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
  onOpenScanner
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
      field: 'total_amount', 
      headerName: 'Montant Total', 
      flex: 1,
      valueGetter: (value, row) => {
        if (!row) return '';
        return formatCurrency(row.total_amount);
      }
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      flex: 1,
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
        const canDelete = params.row.status === 'pending' || params.row.status === 'cancelled';
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(params.row);
              }}
              title="Modifier"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {canDelete && (
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(params.row);
                }}
                title="Supprimer"
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      }
    }
  ];

  // Calculate stats
  const totalSales = sales.length;
  const pendingSales = sales.filter(s => s.status === 'pending').length;
  const unpaidSales = sales.filter(s => s.payment_status === 'unpaid').length;
  const partiallyPaidSales = sales.filter(s => s.payment_status === 'partially_paid').length;
  const paidSales = sales.filter(s => s.payment_status === 'paid').length;

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
            Total Ventes
          </Typography>
          <Typography variant="h6" color="primary.main">{totalSales}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            En attente
          </Typography>
          <Typography variant="h6" color="warning.main">{pendingSales}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Non payé
          </Typography>
          <Typography variant="h6" color="error.main">{unpaidSales}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Partiellement payé
          </Typography>
          <Typography variant="h6" color="info.main">{partiallyPaidSales}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center', px: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Payé
          </Typography>
          <Typography variant="h6" color="success.main">{paidSales}</Typography>
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
            <InputLabel id="status-filter-label">Statut</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Statut"
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="confirmed">Confirmée</MenuItem>
              <MenuItem value="payment_pending">Paiement en attente</MenuItem>
              <MenuItem value="partially_paid">Partiellement payée</MenuItem>
              <MenuItem value="paid">Payée</MenuItem>
              <MenuItem value="shipped">Expédiée</MenuItem>
              <MenuItem value="delivered">Livrée</MenuItem>
              <MenuItem value="completed">Terminée</MenuItem>
              <MenuItem value="cancelled">Annulée</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="date-filter-label">Période</InputLabel>
            <Select
              labelId="date-filter-label"
              id="date-filter"
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
            requiredPermission="sales.add_sale"
            variant="outlined"
            startIcon={<QrCodeScannerIcon />}
            onClick={onOpenScanner}
          >
            Scanner QR
          </PermissionButton>
          <PermissionButton
            requiredPermission="sales.add_sale"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Nouvelle vente
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
          rows={sales}
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

export default SalesTab;
