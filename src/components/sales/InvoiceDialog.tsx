/**
 * InvoiceDialog Component
 * Handles invoice creation and editing
 */

import React, { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
  Box,
  Paper,
  Autocomplete
} from '@mui/material';
import { 
  Add as AddIcon,
  ReceiptLong
} from '@mui/icons-material';
import { StatusChip } from '../common';
import type { InvoiceDialogState } from '../../hooks/useSalesDialogs';
import type { ExtendedSale } from '../../hooks/useSalesData';
import type { Client } from '../../interfaces/sales';
import * as SalesAPI from '../../services/api/sales.api';

import type { ExtendedInvoice } from '../../interfaces/sales';

interface InvoiceDialogProps {
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  invoice: ExtendedInvoice | null;
  invoiceDialog: InvoiceDialogState;
  sales: ExtendedSale[];
  clients: Client[];
  onClose: () => void;
  updateInvoiceDialog: (data: Partial<InvoiceDialogState>) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refreshData?: () => Promise<void>;
}

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  open,
  mode,
  invoice,
  invoiceDialog,
  sales,
  clients,
  onClose,
  updateInvoiceDialog,
  onSuccess,
  onError,
  refreshData
}) => {
  const [newInvoiceData, setNewInvoiceData] = useState<Partial<ExtendedInvoice>>({});
  const selectedSale = invoiceDialog.selectedSale;

  // Initialize Invoice dialog data when opening in edit mode
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (open && invoice && mode === 'edit') {
        try {
          // Fetch full invoice details from API
          const invoiceDetails = await SalesAPI.fetchInvoice(invoice.id!);
          console.log('Invoice details fetched:', invoiceDetails);
          // Valid invoice statuses: draft, sent, paid, overdue, cancelled
          const validInvoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
          const invoiceStatus = validInvoiceStatuses.includes(invoiceDetails.status)
            ? invoiceDetails.status
            : 'draft';
          setNewInvoiceData({
            date: invoiceDetails.date || '',
            due_date: invoiceDetails.due_date || '',
            notes: invoiceDetails.notes || '',
            status: invoiceStatus
          });
          // Set related sale if available
          if (invoiceDetails.sale && sales) {
            const sale = sales.find((s) => s.id === invoiceDetails.sale);
            if (sale) updateInvoiceDialog({ selectedSale: sale });
          }
        } catch (error) {
          console.error('Error fetching invoice details:', error);
          onError('Erreur lors de la récupération des détails de la facture');
        }
      } else if (!open) {
        // Reset when closing
        setNewInvoiceData({});
      }
    };
    fetchInvoiceDetails();
  }, [open, invoice?.id, mode, invoice, onError, sales, updateInvoiceDialog]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle save invoice
  const handleSaveInvoice = async () => {
    try {
      if (!selectedSale && mode !== 'edit') {
        onError('Veuillez sélectionner une vente');
        return;
      }

      if (mode === 'edit' && invoice?.id) {
        const updatedInvoice = await SalesAPI.updateInvoice(invoice.id, {
          date: newInvoiceData.date || invoice.date,
          due_date: newInvoiceData.due_date || invoice.due_date,
          notes: newInvoiceData.notes || invoice.notes
        });
        onSuccess(`Facture ${updatedInvoice.reference} modifiée avec succès`);
      } else if (selectedSale) {
        // Generate reference (INV-YYYY-XXX format)
        const year = new Date().getFullYear();
        const reference = `INV-${year}-${Date.now().toString().slice(-6)}`;
        
        const newInvoice = await SalesAPI.createInvoice({
          reference,
          sale: selectedSale.id!,
          date: invoiceDialog.date,
          due_date: invoiceDialog.due_date,
          amount: selectedSale.total_amount,
          balance: selectedSale.total_amount - (selectedSale.paid_amount || 0),
          notes: invoiceDialog.notes
        });
        onSuccess(`Facture ${newInvoice.reference} créée avec succès`);
      }

      if (refreshData) {
        await refreshData();
      }

      onClose();
      setNewInvoiceData({});
    } catch (error: unknown) {
      console.error('Error saving invoice:', error);
      const errorMessage = error instanceof Error && 'response' in error ?
        String((error as AxiosError<{ error?: string }>)?.response?.data?.error) : 'Erreur lors de l\'enregistrement de la facture';
      onError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
          {mode === 'edit' ? 'Modifier la facture' : 'Nouvelle facture'}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {mode !== 'edit' && (
            <Grid item xs={12}>
              <Autocomplete
                options={(sales || []).filter((sale) =>
                  sale.status === 'payment_pending' || 
                  sale.status === 'confirmed' || 
                  sale.status === 'completed'
                )}
                getOptionLabel={(option) => {
                  const client = (clients || []).find(c => c.id === option.client);
                  return `${option.reference} - ${client?.name || 'N/A'} (${formatCurrency(option.total_amount)})`;
                }}
                value={selectedSale}
                onChange={(event, newValue) => {
                  updateInvoiceDialog({ selectedSale: newValue });
                }}
                renderInput={(params) => (
                  <TextField {...params}
                    label="Vente associée *"
                    variant="outlined"
                    fullWidth
                    helperText="Sélectionnez une vente confirmée ou livrée sans facture existante"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`sale-${option.id}`}>
                    <Box>
                      <Typography variant="body1">
                        {option.reference} - {(clients || []).find(c => c.id === option.client)?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Montant: {formatCurrency(option.total_amount)} • Date: {new Date(option.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </li>
                )}
                noOptionsText="Aucune vente éligible pour facturation"
              />
            </Grid>
          )}

          {selectedSale && (
            <>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" gutterBottom>Détails de la vente</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Client:</Typography>
                      <Typography variant="body1">
                        {(clients || []).find(c => c.id === selectedSale.client)?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Date de vente:</Typography>
                      <Typography variant="body1">
                        {new Date(selectedSale.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Montant total:</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedSale.total_amount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Statut:</Typography>
                      <StatusChip 
                        status={selectedSale.status}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date d'émission"
                  type="date"
                  fullWidth
                  value={mode === 'edit' ? (newInvoiceData.date || invoice?.date) : invoiceDialog.date}
                  onChange={(e) => {
                    if (mode === 'edit') {
                      setNewInvoiceData({ ...newInvoiceData, date: e.target.value });
                    } else {
                      updateInvoiceDialog({ date: e.target.value });
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date d'échéance"
                  type="date"
                  fullWidth
                  value={mode === 'edit' ? (newInvoiceData.due_date || invoice?.due_date) : invoiceDialog.due_date}
                  onChange={(e) => {
                    if (mode === 'edit') {
                      setNewInvoiceData({ ...newInvoiceData, due_date: e.target.value });
                    } else {
                      updateInvoiceDialog({ due_date: e.target.value });
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={mode === 'edit' ? (newInvoiceData.notes || invoice?.notes || '') : invoiceDialog.notes}
                  onChange={(e) => {
                    if (mode === 'edit') {
                      setNewInvoiceData({ ...newInvoiceData, notes: e.target.value });
                    } else {
                      updateInvoiceDialog({ notes: e.target.value });
                    }
                  }}
                  placeholder="Notes additionnelles pour la facture..."
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveInvoice}
          disabled={!selectedSale}
          startIcon={<AddIcon />}
        >
          {mode === 'edit' ? 'Enregistrer' : 'Créer la facture'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDialog;
