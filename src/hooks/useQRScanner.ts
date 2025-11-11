/**
 * useQRScanner Hook
 * Manages QR code scanning functionality for inventory operations
 * Handles camera control, barcode scanning, and product lookup
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
  permissionDenied: boolean;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
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
    permissionDenied: false,
    permissionStatus: 'unknown',
  });

  // QR Scanner instance
  const [qrScanner, setQRScanner] = useState<Html5Qrcode | null>(null);

  // ============================================================================
  // HELPER: Safe scanner stop
  // ============================================================================
  
  /**
   * Safely stop scanner - catches all errors
   */
  const safeStopScanner = useCallback(async (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    
    try {
      await scanner.stop();
    } catch (error) {
      // Completely ignore all stop errors - they're expected when scanner isn't running
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      safeStopScanner(qrScanner);
    };
  }, [qrScanner, safeStopScanner]);

  // ============================================================================
  // SCANNER CONTROL
  // ============================================================================

  /**
   * Open scanner dialog
   */
  const openScanner = useCallback(() => {
    // Just open the dialog - scanner cleanup will be handled by startScanning
    setQRState(prev => ({
      ...prev,
      isOpen: true,
      scannedProduct: null,
      scannedQuantity: 1,
      error: null,
      permissionDenied: false,
      permissionStatus: 'unknown',
    }));
  }, []);

  /**
   * Close scanner dialog
   */
  const closeScanner = useCallback(async () => {
    // Stop scanning if active
    await safeStopScanner(qrScanner);

    setQRState(prev => ({
      ...prev,
      isOpen: false,
      isScanning: false,
      scannedProduct: null,
      scannedQuantity: 1,
      error: null,
      permissionDenied: false,
    }));
  }, [qrScanner, safeStopScanner]);

  /**
   * Handle scanned barcode
   */
  const handleBarcodeScanned = useCallback(async (
    barcode: string,
    scanner: Html5Qrcode
  ) => {
    // Stop scanning
    await safeStopScanner(scanner);

    // Look up product by reference (barcode)
    const product = products.find(p => p.reference === barcode);

    if (product) {
      // Play success sound (optional - user agents may block autoplay)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (error) {
        // Silently fail if audio cannot be played
        console.debug('Could not play success sound:', error);
      }
      
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
  }, [products, safeStopScanner]);

  /**
   * Start QR code scanning
   */
  const startScanning = useCallback(async (elementId: string) => {
    try {
      // Stop any existing scanner first (silently)
      await safeStopScanner(qrScanner);

      // Create scanner instance
      const scanner = new Html5Qrcode(elementId);
      setQRScanner(scanner);

      // Try to get available cameras
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras && cameras.length > 0) {
        // Start scanning with camera - Html5Qrcode will request camera permission
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
          permissionStatus: 'granted',
          permissionDenied: false,
        }));
      } else {
        throw new Error('No cameras found');
      }

    } catch (error) {
      console.error('Error starting scanner:', error);
      
      const err = error as Error;
      let errorMessage = 'Impossible de démarrer la caméra.';
      
      // Provide specific error messages
      if (err.message?.includes('NotAllowedError') || err.message?.includes('Permission')) {
        errorMessage = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans votre navigateur.';
        setQRState(prev => ({
          ...prev,
          permissionDenied: true,
          permissionStatus: 'denied',
        }));
      } else if (err.message?.includes('NotFoundError') || err.message?.includes('No cameras')) {
        errorMessage = 'Aucune caméra détectée. Vous pouvez scanner un fichier QR code à la place.';
      } else if (err.message?.includes('NotReadableError')) {
        errorMessage = 'La caméra est déjà utilisée par une autre application.';
      } else if (err.message?.includes('not supported') || err.message?.includes('HTTPS')) {
        errorMessage = 'Le streaming caméra nécessite HTTPS. Utilisez localhost ou un serveur HTTPS.';
      }
      
      setQRState(prev => ({
        ...prev,
        error: errorMessage,
        isScanning: false,
      }));
    }
  }, [handleBarcodeScanned, qrScanner, safeStopScanner]);

  /**
   * Stop QR code scanning
   */
  const stopScanning = useCallback(async () => {
    await safeStopScanner(qrScanner);
    setQRState(prev => ({
      ...prev,
      isScanning: false,
    }));
  }, [qrScanner, safeStopScanner]);

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
