/**
 * Custom Hook for Dashboard Filter Management
 * Manages filter state and period calculations
 */

import { useState, useCallback, useMemo } from 'react';
import { subDays, format } from 'date-fns';
import type { ReportType } from '../utils/dashboardUtils';

interface UseDashboardFiltersReturn {
  // State
  selectedPeriod: string;
  customStartDate: string;
  customEndDate: string;
  selectedTab: number;
  reportType: ReportType;
  searchTerm: string;
  statusFilter: string;
  transactionTypeFilter: string;
  minAmount: string;
  maxAmount: string;
  sortOrder: string;
  
  // Computed
  startDate: string;
  endDate: string;
  isDateRangeValid: boolean;
  dateRangeError: string | null;
  
  // Actions
  setSelectedPeriod: (period: string) => void;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  setSelectedTab: (tab: number) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setTransactionTypeFilter: (type: string) => void;
  setMinAmount: (amount: string) => void;
  setMaxAmount: (amount: string) => void;
  setSortOrder: (order: string) => void;
  handleTabChange: (_event: React.SyntheticEvent, newValue: number) => void;
  resetFilters: () => void;
}

export const useDashboardFilters = (): UseDashboardFiltersReturn => {
  const today = new Date();
  const defaultStartDate = format(subDays(today, 30), 'yyyy-MM-dd');
  const defaultEndDate = format(today, 'yyyy-MM-dd');
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState(defaultEndDate);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');

  // Calculate date range based on selected period
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    let start = '';
    let end = format(today, 'yyyy-MM-dd');

    if (selectedPeriod === 'custom') {
      start = customStartDate;
      end = customEndDate;
    } else {
      const daysMap: { [key: string]: number } = {
        'today': 0,
        'week': 7,
        'month': 30,
        'quarter': 90,
        'semester': 180,
        'year': 365
      };
      
      const days = daysMap[selectedPeriod] || 30;
      start = format(days === 0 ? today : subDays(today, days), 'yyyy-MM-dd');
    }

    return { startDate: start, endDate: end };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Validate date range
  const { isDateRangeValid, dateRangeError } = useMemo(() => {
    if (selectedPeriod !== 'custom') {
      return { isDateRangeValid: true, dateRangeError: null };
    }

    if (!customStartDate || !customEndDate) {
      return { 
        isDateRangeValid: false, 
        dateRangeError: 'Veuillez sélectionner les dates de début et de fin' 
      };
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const today = new Date();

    if (start > end) {
      return { 
        isDateRangeValid: false, 
        dateRangeError: 'La date de début doit être antérieure à la date de fin' 
      };
    }

    if (start > today) {
      return { 
        isDateRangeValid: false, 
        dateRangeError: 'La date de début ne peut pas être dans le futur' 
      };
    }

    // Check if range is too large (more than 2 years)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 730) {
      return { 
        isDateRangeValid: false, 
        dateRangeError: 'La plage de dates ne peut pas dépasser 2 ans' 
      };
    }

    return { isDateRangeValid: true, dateRangeError: null };
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Get report type from tab index
  const reportType: ReportType = useMemo(() => {
    const types: ReportType[] = ['sales', 'products', 'inventory', 'accounts', 'suppliers'];
    return types[selectedTab] || 'sales';
  }, [selectedTab]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedPeriod('month');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchTerm('');
    setStatusFilter('all');
    setTransactionTypeFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setSortOrder('date_desc');
  }, []);

  return {
    selectedPeriod,
    customStartDate,
    customEndDate,
    selectedTab,
    reportType,
    searchTerm,
    statusFilter,
    transactionTypeFilter,
    minAmount,
    maxAmount,
    sortOrder,
    startDate,
    endDate,
    isDateRangeValid,
    dateRangeError,
    setSelectedPeriod,
    setCustomStartDate,
    setCustomEndDate,
    setSelectedTab,
    setSearchTerm,
    setStatusFilter,
    setTransactionTypeFilter,
    setMinAmount,
    setMaxAmount,
    setSortOrder,
    handleTabChange,
    resetFilters
  };
};
