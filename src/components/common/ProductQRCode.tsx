import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { InventoryAPI } from '../../services/api/index';

interface ProductQRCodeProps {
  productId: number;
  productName?: string;
  downloadable?: boolean;
  width?: string | number;
  height?: string | number;
}

const ProductQRCode: React.FC<ProductQRCodeProps> = ({ 
  productId, 
  productName, 
  downloadable = true,
  width = '150px',
  height = '150px'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Store URL in ref for proper cleanup
  const qrCodeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const getQRCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the QR code blob using the authenticated API
        const qrBlob = await InventoryAPI.fetchProductQRCode(productId);
        
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(qrBlob);
        qrCodeUrlRef.current = objectUrl;
        setQrCodeUrl(objectUrl);
      } catch (err) {
        console.error(`Error fetching QR code for product ${productId}:`, err);
        setError('Impossible de charger le code QR');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      getQRCode();
    }

    // Clean up the object URL when the component unmounts or productId changes
    return () => {
      if (qrCodeUrlRef.current) {
        URL.revokeObjectURL(qrCodeUrlRef.current);
        qrCodeUrlRef.current = null;
      }
    };
  }, [productId]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `QR_${productName || `Product_${productId}`}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        padding: 2,
        bgcolor: 'rgba(0, 0, 0, 0.02)'
      }}
    >
      {loading ? (
        <CircularProgress size={40} />
      ) : error ? (
        <Typography color="error" variant="body2">{error}</Typography>
      ) : qrCodeUrl ? (
        <>
          <img 
            src={qrCodeUrl} 
            alt={`QR Code pour ${productName || `produit ${productId}`}`}
            style={{ 
              width: width, 
              height: height,
              marginBottom: downloadable ? '8px' : '0'
            }}
          />
          {downloadable && (
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleDownload}
              sx={{ mt: 1 }}
            >
              Télécharger
            </Button>
          )}
        </>
      ) : (
        <Typography color="textSecondary">QR Code non disponible</Typography>
      )}
    </Box>
  );
};

export default ProductQRCode;