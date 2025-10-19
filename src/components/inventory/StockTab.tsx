/**
 * StockTab Component
 * Displays current stock levels with filtering capabilities
 */

import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, InputAdornment, IconButton, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import {
  StandardDataGrid,
  StatusChip
} from '../common';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';
import { Stock } from '../../interfaces/inventory';
import { Zone } from '../../interfaces/business';
import { formatQuantity } from '../../utils/inventoryUtils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StockTabProps {
  // Data
  stocks: Stock[];
  loading: boolean;
  zones: Zone[];
  
  // Filters
  searchTerm: string;
  zoneFilter: number | '';
  statusFilter: string;
  
  // Filter Actions
  onSearchChange: (value: string) => void;
  onZoneFilterChange: (value: number | '') => void;
  onStatusFilterChange: (value: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StockTab: React.FC<StockTabProps> = ({
  stocks,
  loading,
  zones,
  searchTerm,
  zoneFilter,
  statusFilter,
  onSearchChange,
  onZoneFilterChange,
  onStatusFilterChange,
}) => {
  
  // ============================================================================
  // DATA VALIDATION
  // ============================================================================
  
  // Filter out invalid stock objects that don't have the required properties
  const validStocks = React.useMemo(() => {
    return stocks.filter(stock => 
      stock && 
      typeof stock.product === 'number' && 
      typeof stock.zone === 'number' &&
      stock.product_name !== undefined
    );
  }, [stocks]);
  
  // ============================================================================
  // COLUMNS DEFINITION
  // ============================================================================
  
  const columns: GridColDef[] = [
    {
      field: 'product_name',
      headerName: 'Produit',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'zone_name',
      headerName: 'Emplacement',
      width: 150,
    },
    {
      field: 'quantity',
      headerName: 'Quantité',
      width: 120,
      type: 'number',
      renderCell: (params) => {
        const unitSymbol = params.row.unit_symbol || '';
        return (
          <Box
            sx={{
              fontWeight: 100,
              color: params.value <= 0 ? 'error.main' : 'text.primary'
            }}
          >
            {formatQuantity(params.value)} {unitSymbol}
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'État',
      width: 130,
      renderCell: (params) => {
        const quantity = params.row.quantity;
        
        let status = 'normal';
        
        if (quantity <= 0) {
          status = 'rupture';
        } else if (quantity <= 10) {
          status = 'faible';
        }
        
        return (
          <StatusChip
            status={status}
          />
        );
      },
    },
  ];
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', minHeight: 56 }}>
          <TextField
            label="Rechercher"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Emplacement</InputLabel>
            <Select
              value={zoneFilter}
              onChange={(e) => onZoneFilterChange(e.target.value as number | '')}
              label="Emplacement"
            >
              <MenuItem value="">Tous</MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel>État</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              label="État"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="faible">Stock faible</MenuItem>
              <MenuItem value="rupture">Rupture</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Data Grid */}
      <Box sx={{ flex: 1 }}>
        <StandardDataGrid
          rows={validStocks}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id ? row.id : `${row.product}-${row.zone}`}
          showToolbar 
          initialState={{
            sorting: {
              sortModel: [{ field: 'product_name', sort: 'asc' }],
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default StockTab;
