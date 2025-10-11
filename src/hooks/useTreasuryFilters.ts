/**
 * Custom Hook: useTreasuryFilters
 * Manages filter state and provides filtered data for all treasury tabs
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Client,
  Supplier,
  AccountStatement
} from '../interfaces/business';

interface ClientFilters {
  searchTerm: string;
  page: number;
  rowsPerPage: number;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

interface SupplierFilters {
  searchTerm: string;
  page: number;
  rowsPerPage: number;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

interface AccountFilters {
  accountFilter: number | '';
  transactionTypeFilter: string;
  startDate: string;
  endDate: string;
  onAccountFilterChange: (id: number | '') => void;
  onTransactionTypeFilterChange: (type: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

interface UseTreasuryFiltersProps {
  clients: Client[];
  suppliers: Supplier[];
  accountMovements: AccountStatement[];
}

interface UseTreasuryFiltersReturn {
  // Filtered data
  filteredClients: Client[];
  filteredSuppliers: Supplier[];
  filteredAccountMovements: AccountStatement[];
  paginatedClients: Client[];
  paginatedSuppliers: Supplier[];

  // Filter props for each tab
  clientFilters: ClientFilters;
  supplierFilters: SupplierFilters;
  accountFilters: AccountFilters;

  // Reset functions
  resetClientFilters: () => void;
  resetSupplierFilters: () => void;
  resetAccountFilters: () => void;
}

export const useTreasuryFilters = ({
  clients,
  suppliers,
  accountMovements
}: UseTreasuryFiltersProps): UseTreasuryFiltersReturn => {
  // ============================================================================
  // CLIENT FILTERS STATE
  // ============================================================================

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientPage, setClientPage] = useState(0);
  const [clientRowsPerPage, setClientRowsPerPage] = useState(6);

  // ============================================================================
  // SUPPLIER FILTERS STATE
  // ============================================================================

  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierRowsPerPage, setSupplierRowsPerPage] = useState(6);

  // ============================================================================
  // ACCOUNT FILTERS STATE
  // ============================================================================

  const [accountFilter, setAccountFilter] = useState<number | ''>('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ============================================================================
  // FILTERED DATA (MEMOIZED)
  // ============================================================================

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;

    const term = clientSearchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      (client.contact_person && client.contact_person.toLowerCase().includes(term))
    );
  }, [clients, clientSearchTerm]);

  const paginatedClients = useMemo(() => {
    return filteredClients.slice(
      clientPage * clientRowsPerPage,
      clientPage * clientRowsPerPage + clientRowsPerPage
    );
  }, [filteredClients, clientPage, clientRowsPerPage]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) return suppliers;

    const term = supplierSearchTerm.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(term) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(term))
    );
  }, [suppliers, supplierSearchTerm]);

  const paginatedSuppliers = useMemo(() => {
    return filteredSuppliers.slice(
      supplierPage * supplierRowsPerPage,
      supplierPage * supplierRowsPerPage + supplierRowsPerPage
    );
  }, [filteredSuppliers, supplierPage, supplierRowsPerPage]);

  const filteredAccountMovements = useMemo(() => {
    let filtered = [...accountMovements];

    // Filter by transaction type
    if (transactionTypeFilter) {
      filtered = filtered.filter(
        movement => movement.transaction_type === transactionTypeFilter
      );
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(movement => movement.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(movement => movement.date <= endDate);
    }

    return filtered;
  }, [accountMovements, transactionTypeFilter, startDate, endDate]);

  // ============================================================================
  // RESET FUNCTIONS
  // ============================================================================

  const resetClientFilters = useCallback(() => {
    setClientSearchTerm('');
    setClientPage(0);
  }, []);

  const resetSupplierFilters = useCallback(() => {
    setSupplierSearchTerm('');
    setSupplierPage(0);
  }, []);

  const resetAccountFilters = useCallback(() => {
    setAccountFilter('');
    setTransactionTypeFilter('');
    setStartDate('');
    setEndDate('');
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Filtered data
    filteredClients,
    filteredSuppliers,
    filteredAccountMovements,
    paginatedClients,
    paginatedSuppliers,

    // Client filters
    clientFilters: {
      searchTerm: clientSearchTerm,
      page: clientPage,
      rowsPerPage: clientRowsPerPage,
      onSearchChange: setClientSearchTerm,
      onPageChange: setClientPage,
      onRowsPerPageChange: setClientRowsPerPage
    },

    // Supplier filters
    supplierFilters: {
      searchTerm: supplierSearchTerm,
      page: supplierPage,
      rowsPerPage: supplierRowsPerPage,
      onSearchChange: setSupplierSearchTerm,
      onPageChange: setSupplierPage,
      onRowsPerPageChange: setSupplierRowsPerPage
    },

    // Account filters
    accountFilters: {
      accountFilter,
      transactionTypeFilter,
      startDate,
      endDate,
      onAccountFilterChange: setAccountFilter,
      onTransactionTypeFilterChange: setTransactionTypeFilter,
      onStartDateChange: setStartDate,
      onEndDateChange: setEndDate
    },

    // Reset functions
    resetClientFilters,
    resetSupplierFilters,
    resetAccountFilters
  };
};
