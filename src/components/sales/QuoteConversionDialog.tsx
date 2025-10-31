/**
 * QuoteConversionDialog Component
 * Handles converting a quote to a sale
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import type { ApiQuote, Zone } from '../../interfaces/sales';
import * as SalesAPI from '../../services/api/sales.api';

interface QuoteConversionDialogProps {
  open: boolean;
  quote: ApiQuote | null;
  zones: Zone[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refreshData?: () => Promise<void>;
}

const QuoteConversionDialog: React.FC<QuoteConversionDialogProps> = ({
  open,
  quote,
  zones,
  onClose,
  onSuccess,
  onError,
  refreshData
}) => {
  const [selectedZone, setSelectedZone] = useState<number>(zones?.[0]?.id || 1);

  const handleConvert = async () => {
    try {
      if (!quote) {
        onError('Aucun devis sélectionné');
        return;
      }

      if (quote.is_converted) {
        onError('Ce devis a déjà été converti en vente');
        return;
      }

      if (!selectedZone) {
        onError('Veuillez sélectionner une zone');
        return;
      }

      // Call API to convert quote to sale
      const createdSale = await SalesAPI.convertQuoteToSale(quote.id!, selectedZone);

      // Refresh data if available
      if (refreshData) {
        await refreshData();
      }

      onSuccess(`Devis ${quote.reference} converti en vente avec succès! Référence: ${createdSale.reference}`);
      onClose();
      setSelectedZone(zones?.[0]?.id || 1);
    } catch (error: unknown) {
      console.error('Error converting quote to sale:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ?
        String((error as { response: { data: { error: string } } }).response.data.error) :
        'Erreur lors de la conversion du devis en vente';
      onError(errorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Convertir un devis en vente</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Convertir le devis {quote?.reference} en vente.
            </Typography>
            {quote?.is_converted && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Ce devis a déjà été converti en vente.
              </Alert>
            )}
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required disabled={quote?.is_converted}>
              <InputLabel>Zone</InputLabel>
              <Select
                value={selectedZone}
                onChange={(e) => setSelectedZone(Number(e.target.value))}
                label="Zone"
              >
                {(zones || []).map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>{zone.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={!quote || quote?.is_converted || !selectedZone}
        >
          Convertir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuoteConversionDialog;