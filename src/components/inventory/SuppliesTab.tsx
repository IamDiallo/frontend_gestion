/**
 * SuppliesTab Component
 * Manages supply operations (receipts from suppliers)
 */

import React from 'react';
import { Box, Tooltip, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, IconButton } from '@mui/material';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  StandardDataGrid,
  StandardButton,
  StatusChip,
  DeleteDialog
} from '../common';
import { StockSupply } from '../../interfaces/inventory';
import { Zone, Supplier } from '../../interfaces/business';
import { formatDate } from '../../utils/inventoryUtils';
import { printBonReception } from '../../utils/printUtils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SuppliesTabProps {
  // Data
  supplies: StockSupply[];
  loading: boolean;
  zones: Zone[];
  suppliers: Supplier[];
  
  // Filters
  searchTerm: string;
  statusFilter: string;
  zoneFilter: number | '';
  supplierFilter: number | '';
  
  // Filter Actions
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onZoneFilterChange: (value: number | '') => void;
  onSupplierFilterChange: (value: number | '') => void;
  
  // CRUD Actions
  onAdd: () => void;
  onEdit: (supply: StockSupply) => void;
  onDelete: (id: number) => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SuppliesTab: React.FC<SuppliesTabProps> = ({
  supplies,
  loading,
  zones,
  suppliers,
  searchTerm,
  statusFilter,
  zoneFilter,
  supplierFilter,
  onSearchChange,
  onStatusFilterChange,
  onZoneFilterChange,
  onSupplierFilterChange,
  onAdd,
  onEdit,
  onDelete,
}) => {
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [supplyToDelete, setSupplyToDelete] = React.useState<number | null>(null);
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
      field: 'supplier_name',
      headerName: 'Fournisseur',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'zone_name',
      headerName: 'Emplacement',
      width: 150,
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
      width: 140,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Imprimer le bon de réception">
              <PrintIcon />
            </Tooltip>
          }
          label="Imprimer"
          onClick={() => {
            const supply = params.row;
            printBonReception({
              id: supply.id,
              reference: supply.reference,
              date: supply.date,
              supplier_name: supply.supplier_name,
              zone_name: supply.zone_name,
              status: supply.status,
              total_amount: supply.total_amount,
              items: supply.items?.map((item: StockSupply['items'][0]) => ({
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
              }))
            });
          }}
          color="primary"
        />, 
        <GridActionsCellItem
          icon={
            <Tooltip title="Modifier">
              <EditIcon />
            </Tooltip>
          }
          label="Modifier"
          onClick={() => onEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Supprimer">
              <DeleteIcon />
            </Tooltip>
          }
          label="Supprimer"
          onClick={() => handleDeleteClick(params.row.id)}
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
    setSupplyToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  /**
   * Confirm deletion
   */
  const handleDeleteConfirm = async () => {
    if (supplyToDelete) {
      setDeleting(true);
      try {
        await onDelete(supplyToDelete);
        setDeleteDialogOpen(false);
        setSupplyToDelete(null);
      } catch (error) {
        console.error('Error deleting supply:', error);
      } finally {
        setDeleting(false);
      }
    }
  };
  
  /**
   * Handle delete cancel
   */
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSupplyToDelete(null);
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
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as string)}
              label="Statut"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="received">Reçu</MenuItem>
              <MenuItem value="partial">Partiel</MenuItem>
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
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Fournisseur</InputLabel>
            <Select
              value={supplierFilter}
              onChange={(e) => onSupplierFilterChange(e.target.value === '' ? '' : Number(e.target.value))}
              label="Fournisseur"
            >
              <MenuItem value="">Tous</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
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
            Nouvelle Réception
          </StandardButton>
        </Box>
      </Box>
      
      {/* Data Grid */}
      <Box sx={{ flex: 1 }}>
        <StandardDataGrid
          rows={supplies}
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
        title="Supprimer la réception"
        message="Êtes-vous sûr de vouloir supprimer cette réception ? Cette action est irréversible."
        loading={deleting}
      />
    </Box>
  );
};

export default SuppliesTab;
