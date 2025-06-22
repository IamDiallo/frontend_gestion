// Common interfaces used across the application
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Common UI state types
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export interface PaginationModel {
  pageSize: number;
  page: number;
}