/**
 * Dashboard Filters Component
 * Handles period selection, custom date range inputs, and advanced filters
 */

import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  type SelectChangeEvent
} from '@mui/material';
import {
  FilterList,
  ExpandLess,
  Clear,
  FileDownload
} from '@mui/icons-material';
import { 
  PERIOD_OPTIONS, 
  STATUS_OPTIONS, 
  TRANSACTION_TYPE_OPTIONS, 
  SORT_OPTIONS 
} from '../../utils/dashboardUtils';

interface DashboardFiltersProps {
  selectedPeriod: string;
  customStartDate: string;
  customEndDate: string;
  onPeriodChange: (period: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  
  // Advanced filters (optional)
  searchTerm?: string;
  statusFilter?: string;
  transactionTypeFilter?: string;
  minAmount?: string;
  maxAmount?: string;
  sortOrder?: string;
  onSearchChange?: (term: string) => void;
  onStatusChange?: (status: string) => void;
  onTransactionTypeChange?: (type: string) => void;
  onMinAmountChange?: (amount: string) => void;
  onMaxAmountChange?: (amount: string) => void;
  onSortOrderChange?: (order: string) => void;
  onResetFilters?: () => void;
  onExportData?: () => void;
  
  // Validation
  dateRangeError?: string | null;
  showAdvancedFilters?: boolean;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedPeriod,
  customStartDate,
  customEndDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  searchTerm = '',
  statusFilter = 'all',
  transactionTypeFilter = 'all',
  minAmount = '',
  maxAmount = '',
  sortOrder = 'date_desc',
  onSearchChange,
  onStatusChange,
  onTransactionTypeChange,
  onMinAmountChange,
  onMaxAmountChange,
  onSortOrderChange,
  onResetFilters,
  onExportData,
  dateRangeError,
  showAdvancedFilters = true
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePeriodChange = (event: SelectChangeEvent) => {
    onPeriodChange(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    onStatusChange?.(event.target.value);
  };

  const handleTransactionTypeChange = (event: SelectChangeEvent) => {
    onTransactionTypeChange?.(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    onSortOrderChange?.(event.target.value);
  };

  return (
    <Box>
      {/* Main Filters Row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Period Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Période</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            label="Période"
          >
            {PERIOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Date Range - Always visible, disabled when not custom */}
        <TextField
          label="Date début"
          type="date"
          value={customStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
          error={!!dateRangeError}
          disabled={selectedPeriod !== 'custom'}
        />
        <TextField
          label="Date fin"
          type="date"
          value={customEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
          error={!!dateRangeError}
          disabled={selectedPeriod !== 'custom'}
        />

        {/* Search Field */}
        {onSearchChange && (
          <TextField
            label="Rechercher"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nom, référence..."
            sx={{ minWidth: 200 }}
          />
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          {showAdvancedFilters && (
            <Tooltip title="Filtres avancés">
              <IconButton 
                onClick={() => setShowAdvanced(!showAdvanced)}
                color={showAdvanced ? 'primary' : 'default'}
              >
                {showAdvanced ? <ExpandLess /> : <FilterList />}
              </IconButton>
            </Tooltip>
          )}
          
          {onResetFilters && (
            <Tooltip title="Réinitialiser les filtres">
              <IconButton onClick={onResetFilters} color="default">
                <Clear />
              </IconButton>
            </Tooltip>
          )}
          
          {onExportData && (
            <Tooltip title="Exporter les données">
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={onExportData}
                size="small"
              >
                Exporter
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Date Range Error */}
      {dateRangeError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {dateRangeError}
        </Alert>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <Collapse in={showAdvanced}>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 2, 
              flexWrap: 'wrap',
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            {/* Status Filter */}
            {onStatusChange && (
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  label="Statut"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Transaction Type Filter */}
            {onTransactionTypeChange && (
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Type de transaction</InputLabel>
                <Select
                  value={transactionTypeFilter}
                  onChange={handleTransactionTypeChange}
                  label="Type de transaction"
                >
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Amount Range */}
            {onMinAmountChange && onMaxAmountChange && (
              <>
                <TextField
                  label="Montant min"
                  type="number"
                  value={minAmount}
                  onChange={(e) => onMinAmountChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                  placeholder="0"
                />
                <TextField
                  label="Montant max"
                  type="number"
                  value={maxAmount}
                  onChange={(e) => onMaxAmountChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                  placeholder="Illimité"
                />
              </>
            )}

            {/* Sort Order */}
            {onSortOrderChange && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Trier par</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={handleSortChange}
                  label="Trier par"
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default DashboardFilters;
