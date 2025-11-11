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
  Fade,
  Zoom,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { StandardButton } from '../common';
import { UseQRScannerReturn } from '../../hooks/useQRScanner';

// ============================================================================
// INTERFACES
// ============================================================================

export interface QRScannerProps {
  // Scanner state and actions from useQRScanner hook
  scanner: UseQRScannerReturn;
  // Optional stock error to display
  stockError?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const QRScanner: React.FC<QRScannerProps> = ({ scanner, stockError }) => {
  
  const { qrState, closeScanner, setScannedQuantity, addScannedProduct, clearError, startScanning, stopScanning } = scanner;
  const scannerElementId = 'qr-scanner-preview';
  const hasStartedScanning = useRef(false);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Start scanning when dialog opens and permission is granted
   */
  useEffect(() => {
    // Only start if:
    // 1. Dialog is open
    // 2. Not currently scanning
    // 3. No product scanned yet
    // 4. Permission not denied
    // 5. Haven't already started scanning
    if (
      qrState.isOpen && 
      !qrState.isScanning && 
      !qrState.scannedProduct && 
      !qrState.permissionDenied &&
      !hasStartedScanning.current
    ) {
      hasStartedScanning.current = true;
      
      // Use requestAnimationFrame to wait for rendering to complete
      const tryStartScanning = () => {
        requestAnimationFrame(() => {
          const element = document.getElementById(scannerElementId);
          
          if (element) {
            startScanning(scannerElementId);
          } else {
            // Element not ready yet, wait a bit more
            setTimeout(() => {
              const retryElement = document.getElementById(scannerElementId);
              if (retryElement) {
                startScanning(scannerElementId);
              } else {
                console.error(`Element with id ${scannerElementId} not found`);
                hasStartedScanning.current = false;
              }
            }, 200);
          }
        });
      };
      
      tryStartScanning();
    }
  }, [qrState.isOpen, qrState.isScanning, qrState.scannedProduct, qrState.permissionDenied, startScanning, scannerElementId]);
  
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
    // Reset the flag so scanner can start on next open
    hasStartedScanning.current = false;
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
    // Close the dialog after adding product
    closeScanner();
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
        {/* Permission Denied Message */}
        {qrState.permissionDenied && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom fontWeight="bold">
              {qrState.error || 'Accès à la caméra refusé'}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Pour utiliser le scanner:
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 0.5, pl: 2 }}>
              1. Cliquez sur l'icône de caméra dans la barre d'adresse<br/>
              2. Sélectionnez "Autoriser"<br/>
              3. Rechargez la page et réessayez
            </Typography>
          </Alert>
        )}
        
        {/* Camera Preview - Always render but control visibility */}
        {!qrState.scannedProduct && !qrState.error && !qrState.permissionDenied && (
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
            <Zoom in={true}>
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
                icon={<CheckCircleIcon fontSize="inherit" />}
              >
                Produit trouvé !
              </Alert>
            </Zoom>
            
            <Fade in={true} timeout={300}>
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
            </Fade>
            
            {/* Stock Error Alert */}
            {stockError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {stockError}
              </Alert>
            )}
            
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
        
        {/* Loading State - Show while waiting for permission or camera initialization */}
        {!qrState.isScanning && !qrState.scannedProduct && !qrState.error && !qrState.permissionDenied && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" gutterBottom>
              Initialisation de la caméra...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Si demandé, veuillez autoriser l'accès à la caméra
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <StandardButton variant="outlined" onClick={handleClose}>
          Annuler
        </StandardButton>
        
        {qrState.permissionDenied && (
          <StandardButton 
            variant="contained" 
            onClick={() => {
              window.location.reload();
            }}
          >
            Recharger la page
          </StandardButton>
        )}
        
        {qrState.scannedProduct && (
          <StandardButton variant="contained" onClick={handleAddProduct}>
            Ajouter
          </StandardButton>
        )}
      </DialogActions>
    </Dialog>
  );
};
