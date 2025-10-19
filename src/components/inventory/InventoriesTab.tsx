/**
 * InventoriesTab Component
 * Manages physical inventory count operations
 */

import React from 'react';
import { Box, Tooltip, Typography, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, IconButton } from '@mui/material';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  StandardDataGrid,
  StandardButton,
  StatusChip,
  DeleteDialog
} from '../common';
import { Inventory } from '../../interfaces/inventory';
import { Zone } from '../../interfaces/business';
import { formatDate, calculateVariance } from '../../utils/inventoryUtils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface InventoriesTabProps {
  // Data
  inventories: Inventory[];
  loading: boolean;
  zones: Zone[];
  
  // Filters
  searchTerm: string;
  statusFilter: string;
  zoneFilter: number | '';
  
  // Filter Actions
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onZoneFilterChange: (value: number | '') => void;
  
  // CRUD Actions
  onAdd: () => void;
  onEdit: (inventory: Inventory) => void;
  onDelete: (id: number) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InventoriesTab: React.FC<InventoriesTabProps> = ({
  inventories,
  loading,
  zones,
  searchTerm,
  statusFilter,
  zoneFilter,
  onSearchChange,
  onStatusFilterChange,
  onZoneFilterChange,
  onAdd,
  onEdit,
  onDelete,
}) => {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [inventoryToDelete, setInventoryToDelete] = React.useState<number | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  
  // ============================================================================
  // COLUMNS DEFINITION
  // ============================================================================
  
  const columns: GridColDef[] = [
    {
      field: 'reference',
      headerName: 'Référence',
      width: 150,
      renderCell: (params) => params.value || '—',
    },
    {
      field: 'zone_name',
      headerName: 'Emplacement',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: 'status',
      headerName: 'Statut',
      width: 140,
      renderCell: (params) => (
        <StatusChip
          status={params.value}
        />
      ),
    },
    {
      field: 'items_count',
      headerName: 'Articles',
      width: 100,
      type: 'number',
      renderCell: (params) => params.row.items?.length || 0,
    },
    {
      field: 'variance',
      headerName: 'Écart',
      width: 120,
      renderCell: (params) => {
        const items = params.row.items || [];
        const totalVariance = items.reduce((sum: number, item: { expected_quantity: number; actual_quantity: number }) => {
          const variance = calculateVariance(item.expected_quantity, item.actual_quantity);
          return sum + variance;
        }, 0);
        
        return (
          <Typography
            sx={{
              fontWeight: 500,
              color: totalVariance === 0 ? 'success.main' : 
                     totalVariance < 0 ? 'error.main' : 'warning.main'
            }}
          >
            {totalVariance > 0 ? '+' : ''}{totalVariance}
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Modifier">
              <EditIcon />
            </Tooltip>
          }
          label="Modifier"
          onClick={() => onEdit(params.row)}
          disabled={params.row.status === 'completed' || params.row.status === 'cancelled'}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Supprimer">
              <DeleteIcon />
            </Tooltip>
          }
          label="Supprimer"
          onClick={() => handleDeleteClick(params.row.id)}
          disabled={params.row.status === 'completed'}
        />,
      ],
    },
  ];
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Handle delete button click
   */
  const handleDeleteClick = (id: number) => {
    setInventoryToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Confirm deletion
   */
  const handleDeleteConfirm = async () => {
    if (inventoryToDelete) {
      setDeleting(true);
      try {
        await onDelete(inventoryToDelete);
        setDeleteDialogOpen(false);
        setInventoryToDelete(null);
      } catch (error) {
        console.error('Error deleting inventory:', error);
      } finally {
        setDeleting(false);
      }
    }
  };
  
  /**
   * Cancel deletion
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInventoryToDelete(null);
  };
  
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
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as string)}
              label="Statut"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="draft">Brouillon</MenuItem>
              <MenuItem value="in_progress">En cours</MenuItem>
              <MenuItem value="completed">Terminé</MenuItem>
              <MenuItem value="cancelled">Annulé</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Emplacement</InputLabel>
            <Select
              value={zoneFilter}
              onChange={(e) => onZoneFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
              label="Emplacement"
            >
              <MenuItem value="">Tous</MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ flex: 1, minWidth: 20 }} />
          
          <StandardButton
            variant="contained"
            size="small"
            onClick={onAdd}
            startIcon={<AddIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Nouvel Inventaire
          </StandardButton>
        </Box>
      </Box>
      
      {/* Data Grid */}
      <Box sx={{ flex: 1 }}>
        <StandardDataGrid
          rows={inventories}
          columns={columns}
          loading={loading}
          showToolbar 
          onRowDoubleClick={(params) => onEdit(params.row)}
          initialState={{
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }],
            },
          }}
        />
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'inventaire"
        message="Êtes-vous sûr de vouloir supprimer cet inventaire ? Cette action est irréversible."
        loading={deleting}
      />
    </Box>
  );
};

export default InventoriesTab;
