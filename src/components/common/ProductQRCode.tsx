import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { fetchProductQRCode } from '../../services/api';

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

  useEffect(() => {
    const getQRCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the QR code blob using the authenticated API
        const qrBlob = await fetchProductQRCode(productId);
        
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(qrBlob);
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

    // Clean up the object URL when the component unmounts
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [productId]);

  const handleDownload = () => {
    if (qrCodeUrl) {
      // Open QR code in a new tab instead of downloading
      window.open(qrCodeUrl, '_blank', 'noopener,noreferrer');
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