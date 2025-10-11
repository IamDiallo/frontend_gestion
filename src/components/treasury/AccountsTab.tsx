/**
 * Onglet de gestion des comptes bancaires
 * Affiche la liste des comptes avec leurs soldes
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Pagination
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { Account } from '../../interfaces/business';
import { formatCurrency } from '../../utils/treasuryUtils';

interface AccountsTabProps {
  accounts: Account[];
  onAccountClick: (account: Account) => void;
  onAddClick?: () => void;
  loading?: boolean;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  onAccountClick,
  onAddClick,
  loading = false
}) => {
  const [page, setPage] = useState(1);
  const accountsPerPage = 6;
  
  const totalBalance = accounts.reduce((sum, account) => sum + (parseFloat(String(account.current_balance)) || 0), 0);
  
  // Calculate pagination
  const totalPages = Math.ceil(accounts.length / accountsPerPage);
  const startIndex = (page - 1) * accountsPerPage;
  const endIndex = startIndex + accountsPerPage;
  const paginatedAccounts = accounts.slice(startIndex, endIndex);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Comptes bancaires
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Solde total : {formatCurrency(totalBalance)}
          </Typography>
        </Box>
        {onAddClick && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddClick}
          >
            Nouveau compte
          </Button>
        )}
      </Box>

      {/* Accounts Grid */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Chargement...</Typography>
        </Box>
      ) : accounts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun compte bancaire
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ajoutez votre premier compte pour commencer
          </Typography>
          {onAddClick && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddClick}
            >
              Ajouter un compte
            </Button>
          )}
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedAccounts.map((account) => {
              const balance = parseFloat(String(account.current_balance)) || 0;
              const isPositive = balance >= 0;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={account.id}>
                <Card
                  elevation={2}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => onAccountClick(account)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {account.name}
                      </Typography>
                    </Box>

                    {account.account_number && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {account.account_number}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Solde actuel
                      </Typography>
                      {isPositive ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                    </Box>

                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: isPositive ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(balance)}
                    </Typography>

                    {account.account_type && (
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={account.account_type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
