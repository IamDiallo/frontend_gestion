/**
 * Carte d'affichage des achats en attente de paiement
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  LocalShipping as LocalShippingIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { OutstandingSupply } from '../../interfaces/business';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '../../utils/treasuryUtils';

interface OutstandingSuppliesCardProps {
  supplies: OutstandingSupply[];
  onPaymentClick: (supply: OutstandingSupply) => void;
  loading?: boolean;
}

export const OutstandingSuppliesCard: React.FC<OutstandingSuppliesCardProps> = ({
  supplies,
  onPaymentClick,
  loading = false
}) => {
  const columns: GridColDef[] = [
    {
      field: 'reference',
      headerName: 'Référence',
      flex: 1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value} placement="top">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
            <LocalShippingIcon fontSize="small" color="action" />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {params.value}
            </Typography>
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => formatDate(value)
    },
    {
      field: 'total_amount',
      headerName: 'Montant Total',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'paid_amount',
      headerName: 'Payé',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'remaining_amount',
      headerName: 'Reste à payer',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'bold',
            color: params.value > 0 ? 'error.main' : 'text.secondary'
          }}
        >
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'payment_status',
      headerName: 'Statut',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getPaymentStatusLabel(params.value)}
          color={getPaymentStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const supply = params.row as OutstandingSupply;
        const isPaid = supply.payment_status === 'paid';
        
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PaymentIcon />}
            onClick={() => onPaymentClick(supply)}
            disabled={isPaid}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              minWidth: 100
            }}
          >
            Payer
          </Button>
        );
      }
    }
  ];

  const totalRemaining = supplies.reduce((sum, supply) => sum + supply.remaining_amount, 0);
  const unpaidCount = supplies.filter(s => s.payment_status !== 'paid').length;

  return (
    <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Achats en attente de paiement
            </Typography>
          </Box>
          {unpaidCount > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${unpaidCount} achat${unpaidCount > 1 ? 's' : ''} non payé${unpaidCount > 1 ? 's' : ''}`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        {totalRemaining > 0 && (
          <Box 
            sx={{ 
              bgcolor: 'error.light', 
              p: 2, 
              borderRadius: 1, 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <InfoIcon color="error" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Montant total à payer
              </Typography>
              <Typography variant="h6" color="error.dark" sx={{ fontWeight: 700 }}>
                {formatCurrency(totalRemaining)}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {supplies.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <LocalShippingIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">
              Aucun achat en attente de paiement
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={supplies}
              columns={columns}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5, page: 0 }
                },
                sorting: {
                  sortModel: [{ field: 'date', sort: 'desc' }]
                }
              }}
              pageSizeOptions={[5, 10, 25]}
              density="comfortable"
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  fontSize: '0.875rem',
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center'
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none'
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: 'grey.50',
                  fontWeight: 600
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
