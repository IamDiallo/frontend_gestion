/**
 * Dashboard Stats Cards Component
 * Displays key metrics in card format
 */

import React from 'react';
import { Grid } from '@mui/material';
import StatsCard from '../common/StatsCard';
import { Assessment, People, Inventory2, LocalShipping } from '@mui/icons-material';
import type { DashboardStats } from '../../services/api';

interface StatsCardsProps {
  stats: DashboardStats | null;
  reportType: 'sales' | 'products' | 'inventory' | 'accounts' | 'suppliers';
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  if (!stats) {
    return null;
  }

  // Render different stats based on report type
  const renderStats = () => (
    <>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total ventes"
          value={stats.total_sales.toString()}
          icon={<Assessment />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total clients"
          value={stats.total_clients.toString()}
          icon={<People />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total produits"
          value={stats.total_products.toString()}
          icon={<Inventory2 />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Total fournisseurs"
          value={stats.total_suppliers.toString()}
          icon={<LocalShipping />}
          color="warning"
        />
      </Grid>
    </>
  );

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {renderStats()}
    </Grid>
  );
};

export default StatsCards;
