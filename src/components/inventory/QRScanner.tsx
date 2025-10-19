/**
 * QRScanner Component
 * QR code scanning dialog for product lookup
 */

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Alert,
  TextField,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../common';
import { UseQRScannerReturn } from '../../hooks/useQRScanner';

// ============================================================================
// INTERFACES
// ============================================================================

export interface QRScannerProps {
  // Scanner state and actions from useQRScanner hook
  scanner: UseQRScannerReturn;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const QRScanner: React.FC<QRScannerProps> = ({ scanner }) => {
  
  const { qrState, closeScanner, setScannedQuantity, addScannedProduct, clearError, startScanning, stopScanning } = scanner;
  const scannerElementId = 'qr-scanner-preview';
  const hasStartedScanning = useRef(false);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Start scanning when dialog opens
   */
  useEffect(() => {
    if (qrState.isOpen && !qrState.isScanning && !qrState.scannedProduct && !hasStartedScanning.current) {
      hasStartedScanning.current = true;
      // Longer delay to ensure DOM element is ready and rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(scannerElementId);
        if (element) {
          startScanning(scannerElementId);
        } else {
          console.error(`Element with id ${scannerElementId} not found`);
          hasStartedScanning.current = false;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [qrState.isOpen, qrState.isScanning, qrState.scannedProduct, startScanning, scannerElementId]);
  
  /**
   * Stop scanning when dialog closes
   */
  useEffect(() => {
    if (!qrState.isOpen) {
      hasStartedScanning.current = false;
      if (qrState.isScanning) {
        stopScanning();
      }
    }
  }, [qrState.isOpen, qrState.isScanning, stopScanning]);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (qrState.isScanning) {
      stopScanning();
    }
    closeScanner();
  };
  
  /**
   * Handle quantity change
   */
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setScannedQuantity(value);
    }
  };
  
  /**
   * Handle add product
   */
  const handleAddProduct = () => {
    addScannedProduct();
    // Reset and restart scanning
    hasStartedScanning.current = false;
  };
  
  /**
   * Handle retry scan
   */
  const handleRetryScan = () => {
    clearError();
    hasStartedScanning.current = false;
    startScanning(scannerElementId);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <Dialog
      open={qrState.isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Scanner Code-Barres
        <IconButton
          aria-label="fermer"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Camera Preview - Always render but control visibility */}
        {!qrState.scannedProduct && !qrState.error && (
          <Box sx={{ mb: 2 }}>
            <div id={scannerElementId} style={{ width: '100%', minHeight: '300px' }} />
            {qrState.isScanning && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Positionnez le code-barres dans le cadre
              </Typography>
            )}
          </Box>
        )}
        
        {/* Error Message */}
        {qrState.error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <StandardButton size="small" onClick={handleRetryScan}>
                Réessayer
              </StandardButton>
            }
          >
            {qrState.error}
          </Alert>
        )}
        
        {/* Scanned Product Display */}
        {qrState.scannedProduct && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Produit trouvé !
            </Alert>
            
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {qrState.scannedProduct.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Référence: {qrState.scannedProduct.reference}
              </Typography>
              {qrState.scannedProduct.description && (
                <Typography variant="body2" color="text.secondary">
                  {qrState.scannedProduct.description}
                </Typography>
              )}
            </Box>
            
            <TextField
              label="Quantité"
              type="number"
              value={qrState.scannedQuantity}
              onChange={handleQuantityChange}
              fullWidth
              inputProps={{ min: 1, step: 0.01 }}
            />
          </Box>
        )}
        
        {/* Loading State - Show above the video element */}
        {!qrState.isScanning && !qrState.scannedProduct && !qrState.error && (
          <Box sx={{ textAlign: 'center', py: 2, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
            <Typography color="text.secondary">
              Initialisation de la caméra...
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <StandardButton variant="outlined" onClick={handleClose}>
          Annuler
        </StandardButton>
        
        {qrState.scannedProduct && (
          <StandardButton variant="contained" onClick={handleAddProduct}>
            Ajouter
          </StandardButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;
