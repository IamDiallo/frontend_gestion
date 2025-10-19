/**
 * Sales Tab Component
 * Displays sales analytics with charts and metrics
 */

import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { CHART_COLORS, formatCurrency } from '../../utils/dashboardUtils';
import type { ReportData } from '../../services/api/index';

interface SalesTabProps {
  reportData: ReportData;
  totalRevenue?: number;
}

const SalesTab: React.FC<SalesTabProps> = ({ reportData, totalRevenue }) => {
  // Columns for top products table
  const topProductsColumns: GridColDef[] = [
    { field: 'name', headerName: 'Produit', flex: 1 },
    { field: 'category', headerName: 'Catégorie', flex: 1 },
    {
      field: 'revenue',
      headerName: 'Chiffre d\'affaires',
      flex: 1,
      valueFormatter: (value) => formatCurrency(value)
    },
    { field: 'quantity', headerName: 'Quantité vendue', flex: 1 }
  ];

  return (
    <Grid container spacing={3}>
      {/* Monthly Revenue Chart */}
      <Grid item xs={12} lg={8}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Évolution du chiffre d'affaires
            </Typography>
            {totalRevenue !== undefined && (
              <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(totalRevenue)}
              </Typography>
            )}
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.monthly_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={CHART_COLORS[0]}
                name="Chiffre d'affaires"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Category Breakdown Chart */}
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ventes par catégorie
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.category_data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.category}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {reportData.category_data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Top Products Table */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top produits
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={reportData.top_products}
              columns={topProductsColumns}
              getRowId={(row) => row.name || Math.random().toString()}
              pageSizeOptions={[5, 10, 25]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              disableRowSelectionOnClick
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SalesTab;
