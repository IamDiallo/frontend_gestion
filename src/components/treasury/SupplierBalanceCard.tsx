/**
 * Carte d'affichage du solde fournisseur avec statistiques
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  Avatar,
  Grow,
  Slide
} from '@mui/material';
import {
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { Supplier, ActualSupplierBalanceResponse } from '../../interfaces/business';
import { formatCurrency } from '../../utils/treasuryUtils';

interface SupplierBalanceCardProps {
  supplier: Supplier;
  balanceData: ActualSupplierBalanceResponse;
  previousBalance?: number | null;
  balanceChangeHighlight?: boolean;
}

export const SupplierBalanceCard: React.FC<SupplierBalanceCardProps> = ({
  supplier,
  balanceData,
  previousBalance,
  balanceChangeHighlight
}) => {
  const balance = balanceData.balance || 0;
  const totalPurchases = balanceData.total_purchases || 0;
  const totalPayments = balanceData.total_account_credits || 0;

  return (
    <Grow in={true}>
      <Card 
        elevation={0}
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'secondary.light', 
                color: 'secondary.dark',
                width: 48, 
                height: 48,
                mr: 2
              }}
            >
              <StoreIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {supplier.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {supplier.contact_person || 'Aucun contact'}
              </Typography>
            </Box>
            <Chip
              size="small"
              label="Fournisseur"
              sx={{ 
                bgcolor: 'secondary.50',
                color: 'secondary.main',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 1.5,
                  bgcolor: balance <= 0 ? 'success.50' : 'error.50',
                  border: '1px solid',
                  borderColor: balance <= 0 ? 'success.200' : 'error.200'
                }}
              >
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500 }}
                >
                  Solde Compte
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: balance <= 0 ? 'success.dark' : 'error.dark'
                  }}
                >
                  {formatCurrency(balance)}
                </Typography>
                {previousBalance !== null && previousBalance !== undefined && balance !== previousBalance && balanceChangeHighlight && (
                  <Slide direction="up" in={balanceChangeHighlight}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 0.5,
                        fontWeight: 600,
                        color: balance < previousBalance ? 'success.main' : 'error.main'
                      }}
                    >
                      {balance < previousBalance ? '↓' : '↑'} {formatCurrency(Math.abs(balance - previousBalance))}
                    </Typography>
                  </Slide>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500 }}
                >
                  Total Achats
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(totalPurchases)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500 }}
                >
                  Total Paiements
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingDownIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(totalPayments)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grow>
  );
};
