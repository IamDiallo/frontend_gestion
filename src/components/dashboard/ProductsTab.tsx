/**
 * Products Tab Component
 * Displays product performance and low stock alerts
 */

import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { CHART_COLORS, formatCurrency } from '../../utils/dashboardUtils';
import type { ReportData, LowStockProduct } from '../../services/api/index';

interface ProductsTabProps {
  reportData: ReportData;
  lowStockProducts: LowStockProduct[];
}

const ProductsTab: React.FC<ProductsTabProps> = ({ reportData, lowStockProducts }) => {
  // Low stock products columns
  const lowStockColumns: GridColDef[] = [
    { field: 'name', headerName: 'Produit', flex: 1 },
    { field: 'category', headerName: 'Catégorie', flex: 1 },
    { field: 'zone', headerName: 'Zone', flex: 1 },
    {
      field: 'current_stock',
      headerName: 'Stock actuel',
      flex: 0.5,
      renderCell: (params) => (
        <Box sx={{ color: params.value < params.row.min_stock_level ? 'error.main' : 'inherit' }}>
          {params.value}
        </Box>
      )
    },
    { field: 'min_stock_level', headerName: 'Seuil min', flex: 0.5 },
    { field: 'unit', headerName: 'Unité', flex: 0.5 }
  ];


  return (
    <Grid container spacing={3}>
      {/* Produits les plus vendus par quantité */}
      <Grid item xs={12} lg={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Produits les plus vendus par quantité
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.top_products.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill={CHART_COLORS[1]} name="Quantité vendue" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Produits les plus vendus par chiffre d'affaires */}
      <Grid item xs={12} lg={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Produits les plus vendus par chiffre d'affaires
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.top_products.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="revenue" fill={CHART_COLORS[0]} name="Chiffre d'affaires" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Low Stock Products Table */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Produits en stock bas
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={lowStockProducts}
              columns={lowStockColumns}
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

export default ProductsTab;
