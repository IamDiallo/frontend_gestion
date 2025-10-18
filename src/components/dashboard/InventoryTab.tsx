/**
 * Inventory Tab Component
 * Displays inventory metrics, trends, and stock levels
 */

import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import {
  AreaChart,
  Area,
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
import type { InventoryStats, LowStockProduct } from '../../services/api/index';

interface InventoryTabProps {
  inventoryStats: InventoryStats | null;
  inventoryValueTrend: Array<{ name: string; value: number }>;
  lowStockProducts: LowStockProduct[];
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  inventoryStats,
  inventoryValueTrend,
  lowStockProducts
}) => {
  // Low stock columns
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
      {/* Inventory Value Trend */}
      <Grid item xs={12} lg={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Évolution de la valeur d'inventaire
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={inventoryValueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS[2]}
                fill={CHART_COLORS[2]}
                fillOpacity={0.6}
                name="Valeur"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Stock by Zone */}
      <Grid item xs={12} lg={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Stock par zone
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={inventoryStats?.zone_data || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.zone}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(inventoryStats?.zone_data || []).map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
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

export default InventoryTab;
