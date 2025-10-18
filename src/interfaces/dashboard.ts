// Dashboard-specific interfaces for API responses and component props

export interface SalesData {
  month: string;
  amount: number;
}

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
