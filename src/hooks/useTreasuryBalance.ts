/**
 * Custom Hook: useTreasuryBalance
 * Manages balance state and change highlighting for treasury operations
 */

import { useState, useCallback, useEffect } from 'react';

interface UseTreasuryBalanceReturn {
  previousBalance: number | null;
  balanceChangeHighlight: boolean;
  updateBalance: (newBalance: number) => void;
  resetBalance: () => void;
}

export const useTreasuryBalance = (): UseTreasuryBalanceReturn => {
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [balanceChangeHighlight, setBalanceChangeHighlight] = useState(false);

  // Update balance and trigger highlight animation if changed
  const updateBalance = useCallback((newBalance: number) => {
    if (previousBalance !== null && previousBalance !== newBalance) {
      setBalanceChangeHighlight(true);
      
      // Auto-hide highlight after 2 seconds
      setTimeout(() => {
        setBalanceChangeHighlight(false);
      }, 2000);
    }
    
    setPreviousBalance(newBalance);
  }, [previousBalance]);

  // Reset balance state
  const resetBalance = useCallback(() => {
    setPreviousBalance(null);
    setBalanceChangeHighlight(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      setBalanceChangeHighlight(false);
    };
  }, []);

  return {
    previousBalance,
    balanceChangeHighlight,
    updateBalance,
    resetBalance
  };
};
