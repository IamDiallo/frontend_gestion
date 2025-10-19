/**
 * InventoryFilters Component
 * Reusable filter UI for inventory tabs
 */

import React from 'react';
import { Box, Grid, TextField, InputAdornment, IconButton } from '@mui/material';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';
import { StandardSelect } from '../common';
import { Zone } from '../../interfaces/business';
import { Supplier } from '../../interfaces/business';

// ============================================================================
// INTERFACES
// ============================================================================

export interface InventoryFiltersProps {
  // Filter values
  searchTerm?: string;
  statusFilter?: string;
  zoneFilter?: number | '';
  supplierFilter?: number | '';
  fromZoneFilter?: number | '';
  toZoneFilter?: number | '';
  
  // Data for dropdowns
  zones?: Zone[];
  suppliers?: Supplier[];
  
  // Status options
  statusOptions?: Array<{ value: string; label: string }>;
  
  // Handlers
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onZoneChange?: (value: number | '') => void;
  onSupplierChange?: (value: number | '') => void;
  onFromZoneChange?: (value: number | '') => void;
  onToZoneChange?: (value: number | '') => void;
  
  // Visibility flags
  showSearch?: boolean;
  showStatus?: boolean;
  showZone?: boolean;
  showSupplier?: boolean;
  showFromToZones?: boolean;
  
  // Labels
  searchPlaceholder?: string;
  zoneLabel?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  // Filter values
  searchTerm = '',
  statusFilter = '',
  zoneFilter = '',
  supplierFilter = '',
  fromZoneFilter = '',
  toZoneFilter = '',
  
  // Data
  zones = [],
  suppliers = [],
  statusOptions = [],
  
  // Handlers
  onSearchChange,
  onStatusChange,
  onZoneChange,
  onSupplierChange,
  onFromZoneChange,
  onToZoneChange,
  
  // Visibility
  showSearch = true,
  showStatus = false,
  showZone = false,
  showSupplier = false,
  showFromToZones = false,
  
  // Labels
  searchPlaceholder = 'Rechercher...',
  zoneLabel = 'Emplacement',
}) => {
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        {/* Search Field */}
        {showSearch && onSearchChange && (
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Rechercher"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              variant="outlined"
              size="small"
              fullWidth
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
          </Grid>
        )}
        
        {/* Status Filter */}
        {showStatus && onStatusChange && statusOptions.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <StandardSelect
              label="Statut"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value as string)}
              fullWidth
            >
              <option value="">Tous</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </StandardSelect>
          </Grid>
        )}
        
        {/* Zone Filter */}
        {showZone && onZoneChange && zones.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <StandardSelect
              label={zoneLabel}
              value={zoneFilter}
              onChange={(e) => onZoneChange(e.target.value === '' ? '' : Number(e.target.value))}
              fullWidth
            >
              <option value="">Tous</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </StandardSelect>
          </Grid>
        )}
        
        {/* Supplier Filter */}
        {showSupplier && onSupplierChange && suppliers.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <StandardSelect
              label="Fournisseur"
              value={supplierFilter}
              onChange={(e) => onSupplierChange(e.target.value === '' ? '' : Number(e.target.value))}
              fullWidth
            >
              <option value="">Tous</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </StandardSelect>
          </Grid>
        )}
        
        {/* From Zone Filter */}
        {showFromToZones && onFromZoneChange && zones.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <StandardSelect
              label="De"
              value={fromZoneFilter}
              onChange={(e) => onFromZoneChange(e.target.value === '' ? '' : Number(e.target.value))}
              fullWidth
            >
              <option value="">Tous</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </StandardSelect>
          </Grid>
        )}
        
        {/* To Zone Filter */}
        {showFromToZones && onToZoneChange && zones.length > 0 && (
          <Grid item xs={12} sm={6} md={2}>
            <StandardSelect
              label="Vers"
              value={toZoneFilter}
              onChange={(e) => onToZoneChange(e.target.value === '' ? '' : Number(e.target.value))}
              fullWidth
            >
              <option value="">Tous</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </StandardSelect>
          </Grid>
        )}
        
        {/* Spacer */}
        <Grid item xs />
      </Grid>
    </Box>
  );
};

export default InventoryFilters;
