/**
 * useQRScanner Hook
 * Manages QR code scanning functionality for inventory operations
 * Handles camera control, barcode scanning, and      });

    } catch (error) {
      console.error('Error starting scanner:', error);
      setQRState(prev => ({
        ...prev,
        error: 'Impossible de démarrer la caméra. Vérifiez les permissions.',
        isScanning: false,
      }));
    }
  }, [handleBarcodeScanned]);okup
 */

import { useState, useEffect, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product } from '../interfaces/products';

// ============================================================================
// INTERFACES
// ============================================================================

export interface QRScannerState {
  isOpen: boolean;
  isScanning: boolean;
  scannedProduct: Product | null;
  scannedQuantity: number;
  error: string | null;
}

export interface UseQRScannerReturn {
  // State
  qrState: QRScannerState;
  
  // Actions
  openScanner: () => void;
  closeScanner: () => void;
  setScannedQuantity: (quantity: number) => void;
  addScannedProduct: () => void;
  clearError: () => void;
  
  // Camera control
  startScanning: (elementId: string) => Promise<void>;
  stopScanning: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export const useQRScanner = (
  products: Product[],
  onProductScanned: (product: Product, quantity: number) => void
): UseQRScannerReturn => {
  
  // State
  const [qrState, setQRState] = useState<QRScannerState>({
    isOpen: false,
    isScanning: false,
    scannedProduct: null,
    scannedQuantity: 1,
    error: null,
  });

  // QR Scanner instance
  const [qrScanner, setQRScanner] = useState<Html5Qrcode | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, [qrScanner]);

  // ============================================================================
  // SCANNER CONTROL
  // ============================================================================

  /**
   * Open scanner dialog
   */
  const openScanner = useCallback(() => {
    setQRState(prev => ({
      ...prev,
      isOpen: true,
      scannedProduct: null,
      scannedQuantity: 1,
      error: null,
    }));
  }, []);

  /**
   * Close scanner dialog
   */
  const closeScanner = useCallback(async () => {
    // Stop scanning if active
    if (qrState.isScanning && qrScanner) {
      try {
        await qrScanner.stop();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }

    setQRState(prev => ({
      ...prev,
      isOpen: false,
      isScanning: false,
      scannedProduct: null,
      scannedQuantity: 1,
      error: null,
    }));
  }, [qrState.isScanning, qrScanner]);

  /**
   * Handle scanned barcode
   */
  const handleBarcodeScanned = useCallback(async (
    barcode: string,
    scanner: Html5Qrcode
  ) => {
    // Stop scanning
    try {
      await scanner.stop();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }

    // Look up product by reference (barcode)
    const product = products.find(p => p.reference === barcode);

    if (product) {
      setQRState(prev => ({
        ...prev,
        isScanning: false,
        scannedProduct: product,
        error: null,
      }));
    } else {
      setQRState(prev => ({
        ...prev,
        isScanning: false,
        scannedProduct: null,
        error: `Aucun produit trouvé avec le code-barres: ${barcode}`,
      }));
    }
  }, [products]);

  /**
   * Start QR code scanning
   */
  const startScanning = useCallback(async (elementId: string) => {
    try {
      // Create scanner instance
      const scanner = new Html5Qrcode(elementId);
      setQRScanner(scanner);

      // Start scanning
      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10, // Scan 10 times per second
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback - handle scanned barcode
          handleBarcodeScanned(decodedText, scanner);
        },
        (errorMessage) => {
          // Error callback - can be ignored for most cases
          // This fires frequently and doesn't mean actual errors
          console.debug('QR scan error:', errorMessage);
        }
      );

      setQRState(prev => ({
        ...prev,
        isScanning: true,
        error: null,
      }));

    } catch (error) {
      console.error('Error starting scanner:', error);
      setQRState(prev => ({
        ...prev,
        error: 'Impossible de démarrer la caméra. Vérifiez les permissions.',
        isScanning: false,
      }));
    }
  }, [handleBarcodeScanned]);

  /**
   * Stop QR code scanning
   */
  const stopScanning = useCallback(async () => {
    if (qrScanner) {
      try {
        await qrScanner.stop();
        setQRState(prev => ({
          ...prev,
          isScanning: false,
        }));
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  }, [qrScanner]);

  // ============================================================================
  // PRODUCT MANAGEMENT
  // ============================================================================

  /**
   * Set quantity for scanned product
   */
  const setScannedQuantity = useCallback((quantity: number) => {
    setQRState(prev => ({
      ...prev,
      scannedQuantity: quantity,
    }));
  }, []);

  /**
   * Add scanned product to form
   */
  const addScannedProduct = useCallback(() => {
    if (qrState.scannedProduct) {
      onProductScanned(qrState.scannedProduct, qrState.scannedQuantity);
      
      // Reset scanner state
      setQRState(prev => ({
        ...prev,
        scannedProduct: null,
        scannedQuantity: 1,
      }));
    }
  }, [qrState.scannedProduct, qrState.scannedQuantity, onProductScanned]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setQRState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    qrState,
    openScanner,
    closeScanner,
    setScannedQuantity,
    addScannedProduct,
    clearError,
    startScanning,
    stopScanning,
  };
};

export default useQRScanner;
