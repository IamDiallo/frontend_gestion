/**
 * Carte d'affichage des ventes en attente de paiement
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
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { OutstandingSale } from '../../interfaces/business';
import { formatCurrency, formatDate, getPaymentStatusColor, getPaymentStatusLabel } from '../../utils/treasuryUtils';

interface OutstandingSalesCardProps {
  sales: OutstandingSale[];
  onPaymentClick: (sale: OutstandingSale) => void;
  loading?: boolean;
}

export const OutstandingSalesCard: React.FC<OutstandingSalesCardProps> = ({
  sales,
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
            <ReceiptIcon fontSize="small" color="action" />
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
      field: 'balance',
      headerName: 'Reste à payer',
      width: 140,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (value, row) => (row as OutstandingSale).remaining_amount || (row as OutstandingSale).balance || 0,
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
        const sale = params.row as OutstandingSale;
        const isPaid = sale.payment_status === 'paid';
        
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<PaymentIcon />}
            onClick={() => onPaymentClick(sale)}
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

  // Backend returns remaining_amount, but interface has balance for backwards compatibility
  const totalRemaining = sales.reduce((sum, sale) => sum + (sale.remaining_amount || sale.balance || 0), 0);
  const unpaidCount = sales.filter(s => s.payment_status !== 'paid').length;

  return (
    <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ventes en attente de paiement
            </Typography>
          </Box>
          {unpaidCount > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${unpaidCount} vente${unpaidCount > 1 ? 's' : ''} non payée${unpaidCount > 1 ? 's' : ''}`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        {totalRemaining > 0 && (
          <Box 
            sx={{ 
              bgcolor: 'warning.light', 
              p: 2, 
              borderRadius: 1, 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <InfoIcon color="warning" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Montant total à recevoir
              </Typography>
              <Typography variant="h6" color="warning.dark" sx={{ fontWeight: 700 }}>
                {formatCurrency(totalRemaining)}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {sales.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary'
          }}>
            <ReceiptIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">
              Aucune vente en attente de paiement
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={sales}
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
