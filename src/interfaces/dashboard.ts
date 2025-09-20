// Dashboard-specific interfaces for API responses and component props
import { SalesData } from '../services/api';
import { Account } from './business';

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
  account: number
  [key: string]: unknown;
}
