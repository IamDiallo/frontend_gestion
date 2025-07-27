// Dashboard-specific interfaces for API responses and component props
import { SalesData } from '../services/api';

export interface ApiResponse<T> {
  results?: T[];
}

export interface CategoryDataItem {
  category: string;
  amount: number;
}

export interface SalesResponseData {
  category_data: CategoryDataItem[];
  monthly_data: SalesData[];
  [key: string]: unknown;
}

export interface ClientResponseItem {
  id: number;
  name: string;
  account: number | null;
  account_balance: number;
  [key: string]: unknown;
}
