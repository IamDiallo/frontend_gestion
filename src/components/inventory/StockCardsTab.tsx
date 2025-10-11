/**
 * StockCardsTab Component
 * Displays stock movement history (stock cards)
 */

import React from 'react';
import { Box, Typography, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  StandardDataGrid,
  StandardButton,
  StandardTextField,
  StatusChip
} from '../common';
import { StockMovement } from '../../interfaces/inventory';
import { Zone } from '../../interfaces/business';
import { formatDate, formatQuantity } from '../../utils/inventoryUtils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StockCardsTabProps {
  // Data
  stockCards: StockMovement[];
  loading: boolean;
  zones: Zone[];
  
  // Filters
  searchTerm: string;
  zoneFilter: number | '';
  typeFilter: string;
  
  // Filter Actions
  onSearchChange: (value: string) => void;
  onZoneFilterChange: (value: number | '') => void;
  onTypeFilterChange: (value: string) => void;
  onResetFilters: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StockCardsTab: React.FC<StockCardsTabProps> = ({
  stockCards,
  loading,
  zones,
  searchTerm,
  zoneFilter,
  typeFilter,
  onSearchChange,
  onZoneFilterChange,
  onTypeFilterChange,
  onResetFilters,
}) => {
  
  // ============================================================================
  // COLUMNS DEFINITION
  // ============================================================================
  
  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: 'product_name',
      headerName: 'Produit',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'zone_name',
      headerName: 'Emplacement',
      width: 150,
    },
    {
      field: 'transaction_type',
      headerName: 'Type',
      width: 180,
      renderCell: (params) => {
        const type = params.value;
        let label = '';
        let status: 'success' | 'error' | 'warning' | 'info' | 'default' = 'default';
        
        switch (type) {
          case 'supply':
            label = 'Approvisionnement';
            status = 'success';
            break;
          case 'sale':
            label = 'Vente';
            status = 'error';
            break;
          case 'transfer_in':
            label = 'Entrée par transfert';
            status = 'info';
            break;
          case 'transfer_out':
            label = 'Sortie par transfert';
            status = 'warning';
            break;
          case 'inventory':
            label = 'Ajustement d\'inventaire';
            status = 'warning';
            break;
          case 'production':
            label = 'Production';
            status = 'success';
            break;
          case 'return':
            label = 'Retour';
            status = 'info';
            break;
          default:
            label = type;
            status = 'default';
        }
        
        return <StatusChip label={label} status={status} />;
      },
    },
    {
      field: 'reference',
      headerName: 'Référence',
      width: 130,
      renderCell: (params) => params.value || '—',
    },
    {
      field: 'notes',
      headerName: 'Détails',
      flex: 1.2,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => {
        const notes = params.value || '';
        const transactionType = params.row.transaction_type;
        const reference = params.row.reference || '';
        
        // Truncate text for display
        const truncateText = (text: string, maxLength: number = 50) => {
          if (!text) return '—';
          return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
        };
        
        // For supply transactions, show just "Supply received: REF" with full details on hover
        if (transactionType === 'supply' && reference) {
          const displayText = `Supply received: ${reference}`;
          const fullDetails = notes || displayText;
          
          return (
            <Tooltip 
              title={
                <Box sx={{ maxWidth: 400, p: 1 }}>
                  <Typography variant="body2" color="inherit" sx={{ whiteSpace: 'pre-line' }}>
                    {fullDetails}
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
              enterDelay={300}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                cursor: 'help',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  transition: 'background-color 0.2s'
                }
              }}>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem', 
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {truncateText(displayText, 40)}
                </Typography>
              </Box>
            </Tooltip>
          );
        }
        
        // For inventory adjustments, show more details with tooltip
        if (transactionType === 'inventory' && notes) {
          return (
            <Tooltip 
              title={
                <Box sx={{ maxWidth: 400, p: 1 }}>
                  <Typography variant="subtitle2" gutterBottom color="inherit">
                    Détails de l'inventaire
                  </Typography>
                  <Typography variant="body2" color="inherit" sx={{ whiteSpace: 'pre-line' }}>
                    {notes}
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
              enterDelay={300}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                cursor: 'help',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  transition: 'background-color 0.2s'
                }
              }}>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem', 
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {truncateText(notes, 50)}
                </Typography>
              </Box>
            </Tooltip>
          );
        }
        
        // For other transaction types with notes, show simple tooltip
        if (notes && notes !== '—') {
          return (
            <Tooltip 
              title={notes}
              arrow
              placement="top"
              enterDelay={500}
            >
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                cursor: 'help',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  transition: 'background-color 0.2s'
                }
              }}>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem', 
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {truncateText(notes, 60)}
                </Typography>
              </Box>
            </Tooltip>
          );
        }
        
        return (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            width: '100%'
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
              {notes || '—'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'quantity_in',
      headerName: 'Entrée',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (params.value === null || params.value === undefined || params.value === 0) {
          return '';
        }
        // Use unit_symbol from the row data
        const unitSymbol = params.row.unit_symbol || '';
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            color: 'success.main',
            fontWeight: 'medium'
          }}>
            +{formatQuantity(params.value)} {unitSymbol}
          </Box>
        );
      },
    },
    {
      field: 'quantity_out',
      headerName: 'Sortie',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (params.value === null || params.value === undefined || params.value === 0) {
          return '';
        }
        // Use unit_symbol from the row data
        const unitSymbol = params.row.unit_symbol || '';
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            color: 'error.main',
            fontWeight: 'medium'
          }}>
            -{formatQuantity(params.value)} {unitSymbol}
          </Box>
        );
      },
    },
  ];
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Export stock cards data to JSON
   */
  const handleExport = () => {
    const dataToExport = stockCards.map(card => ({
      Date: formatDate(card.date),
      Produit: card.product_name,
      Emplacement: card.zone_name,
      Type: card.transaction_type,
      Référence: card.reference || '',
      Détails: card.notes || '',
      Entrée: card.quantity_in || 0,
      Sortie: card.quantity_out || 0,
    }));
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock_cards_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
          <StandardTextField
            label="Rechercher"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Produit, référence, notes..."
            size="small"
            sx={{ minWidth: 250 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
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
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              label="Type"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="supply">Approvisionnement</MenuItem>
              <MenuItem value="sale">Vente</MenuItem>
              <MenuItem value="transfer_in">Entrée par transfert</MenuItem>
              <MenuItem value="transfer_out">Sortie par transfert</MenuItem>
              <MenuItem value="inventory">Ajustement d'inventaire</MenuItem>
              <MenuItem value="production">Production</MenuItem>
              <MenuItem value="return">Retour</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ flex: 1 }} />
          
          <StandardButton
            variant="outlined"
            size="small"
            onClick={onResetFilters}
            disabled={!searchTerm && !zoneFilter && !typeFilter}
          >
            Réinitialiser
          </StandardButton>
          
          <StandardButton
            variant="contained"
            size="small"
            onClick={handleExport}
            disabled={stockCards.length === 0}
          >
            Exporter
          </StandardButton>
        </Box>
      </Box>
      
      {/* Data Grid */}
      <Box sx={{ flex: 1 }}>
        <StandardDataGrid
          rows={stockCards}
          columns={columns}
          loading={loading}
          showToolbar 
          initialState={{
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default StockCardsTab;
