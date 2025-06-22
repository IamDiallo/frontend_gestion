// AccountPayment interface
export interface AccountPayment {
  id?: number;
  client: number;
  sale?: number;
  amount: number;
  date: string;
  reference: string;
  description?: string;
  created_by?: number;
  created_at?: string;
}

// Response from pay_from_account API endpoint
export interface AccountPaymentResponse {
  success: boolean;
  message: string;
  payment: {
    id: number;
    reference: string;
    amount: number;
    date: string;
  };
  sale: {
    id: number;
    reference: string;
    payment_status: string;
    workflow_state: string;
  };
  client_balance: number;
}
