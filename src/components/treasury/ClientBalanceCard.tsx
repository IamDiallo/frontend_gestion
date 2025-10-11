/**
 * Carte d'affichage du solde client avec statistiques
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
  Button,
  Stack,
  Slide
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { Client, ActualClientBalanceResponse } from '../../interfaces/business';
import { formatCurrency } from '../../utils/treasuryUtils';

interface ClientBalanceCardProps {
  client: Client;
  balanceData: ActualClientBalanceResponse;
  onDepositClick?: () => void;
  previousBalance?: number | null;
  balanceChangeHighlight?: boolean;
}

export const ClientBalanceCard: React.FC<ClientBalanceCardProps> = ({
  client,
  balanceData,
  onDepositClick,
  previousBalance = null,
  balanceChangeHighlight = false
}) => {
  const balance = balanceData.balance || 0;
  const totalSales = balanceData.total_sales || 0;
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
                bgcolor: 'primary.light', 
                color: 'primary.dark',
                width: 48, 
                height: 48,
                mr: 2
              }}
            >
              <PersonIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {client.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client.contact_person || 'Aucun contact'}
              </Typography>
            </Box>
            <Chip
              size="small"
              label="Client"
              sx={{ 
                bgcolor: 'primary.50',
                color: 'primary.main',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 1.5,
                      bgcolor: balance >= 0 ? 'success.50' : 'error.50',
                      border: '1px solid',
                      borderColor: balance >= 0 ? 'success.200' : 'error.200',
                      height: '100%'
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
                        color: balance >= 0 ? 'success.dark' : 'error.dark'
                      }}
                    >
                      {formatCurrency(balance)}
                    </Typography>
                    
                    {/* Balance change animation */}
                    {previousBalance !== null && balance !== previousBalance && balanceChangeHighlight && (
                      <Slide direction="up" in={balanceChangeHighlight} mountOnEnter unmountOnExit>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 1,
                            fontWeight: 600,
                            color: balance > previousBalance ? 'success.main' : 'error.main',
                          }}
                        >
                          {balance > previousBalance ? '↑' : '↓'} 
                          {formatCurrency(Math.abs(balance - previousBalance))}
                        </Typography>
                      </Slide>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 500 }}
                    >
                      Total Ventes
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUpIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(totalSales)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
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
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack 
                spacing={1} 
                justifyContent="center" 
                sx={{ height: '100%' }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AttachMoneyIcon />}
                  onClick={onDepositClick}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.24)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.32)'
                    }
                  }}
                >
                  Nouveau dépôt
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grow>
  );
};
