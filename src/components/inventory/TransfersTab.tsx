/**
 * TransfersTab Component
 * Manages stock transfer operations between zones
 */

import React from 'react';
import { Box, Tooltip, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, IconButton } from '@mui/material';
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
import { StockTransfer } from '../../interfaces/inventory';
import { Zone } from '../../interfaces/business';
import { formatDate } from '../../utils/inventoryUtils';
import { getStatusTranslation } from '../../utils/translations';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TransfersTabProps {
  // Data
  transfers: StockTransfer[];
  loading: boolean;
  zones: Zone[];
  
  // Filters
  searchTerm: string;
  statusFilter: string;
  fromZoneFilter: number | '';
  toZoneFilter: number | '';
  
  // Filter Actions
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onFromZoneFilterChange: (value: number | '') => void;
  onToZoneFilterChange: (value: number | '') => void;
  
  // CRUD Actions
  onAdd: () => void;
  onEdit: (transfer: StockTransfer) => void;
  onDelete: (id: number) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TransfersTab: React.FC<TransfersTabProps> = ({
  transfers,
  loading,
  zones,
  searchTerm,
  statusFilter,
  fromZoneFilter,
  toZoneFilter,
  onSearchChange,
  onStatusFilterChange,
  onFromZoneFilterChange,
  onToZoneFilterChange,
  onAdd,
  onEdit,
  onDelete,
}) => {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [transferToDelete, setTransferToDelete] = React.useState<number | null>(null);
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
      field: 'from_zone_name',
      headerName: 'De',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'to_zone_name',
      headerName: 'Vers',
      flex: 1,
      minWidth: 150,
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
          disabled={params.row.status === 'completed'}
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
    setTransferToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Confirm deletion
   */
  const handleDeleteConfirm = async () => {
    if (transferToDelete) {
      setDeleting(true);
      try {
        await onDelete(transferToDelete);
        setDeleteDialogOpen(false);
        setTransferToDelete(null);
      } catch (error) {
        console.error('Error deleting transfer:', error);
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
    setTransferToDelete(null);
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
              <MenuItem value="pending">{getStatusTranslation('pending')}</MenuItem>
              <MenuItem value="completed">{getStatusTranslation('completed')}</MenuItem>
              <MenuItem value="cancelled">{getStatusTranslation('cancelled')}</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 220 }}>
            <InputLabel>De (Source)</InputLabel>
            <Select
              value={fromZoneFilter}
              onChange={(e) => onFromZoneFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
              label="De (Source)"
            >
              <MenuItem value="">Tous</MenuItem>
              {zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Vers (Destination)</InputLabel>
            <Select
              value={toZoneFilter}
              onChange={(e) => onToZoneFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
              label="Vers (Destination)"
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
            Nouveau Transfert
          </StandardButton>
        </Box>
      </Box>
      
      {/* Data Grid */}
      <Box sx={{ flex: 1 }}>
        <StandardDataGrid
          rows={transfers}
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
        title="Supprimer le transfert"
        message="Êtes-vous sûr de vouloir supprimer ce transfert ? Cette action est irréversible."
        loading={deleting}
      />
    </Box>
  );
};
