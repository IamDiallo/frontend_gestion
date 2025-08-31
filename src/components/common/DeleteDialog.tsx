import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  message?: React.ReactNode;
  irreversible?: boolean;
  extraInfo?: React.ReactNode;
  type?: 'sale' | 'invoice' | 'quote';
  item?: { reference?: string };
  confirmationInfo?: {
    willRestoreStock: boolean;
    willRefundAmount: number;
    hasPayments: boolean;
  };
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Confirmation de suppression',
  type = 'sale',
  item,
  confirmationInfo
}) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    PaperProps={{
      sx: {
        borderRadius: 2,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        backgroundColor: 'background.paper'
      }
    }}
  >
    <DialogTitle sx={{ 
      backgroundColor: 'error.main', 
      color: '#fff',
      fontWeight: 'bold'
    }}>
      {title}
    </DialogTitle>
    <DialogContent>
        <Typography>
          Êtes-vous sûr de vouloir supprimer {
            type === 'invoice' ? 'cette facture'
            : type === 'quote' ? 'ce devis'
            : 'cette vente'
          } ?
        </Typography>
        {item?.reference && (
          <Typography sx={{ mt: 2 }}>
            <strong>Référence :</strong> {item.reference}
          </Typography>
        )}
        {/* Optionally show confirmationInfo details here */}
        {confirmationInfo && (
          <Typography sx={{ mt: 2, color: 'warning.main' }}>
            {confirmationInfo.willRestoreStock && 'Le stock sera restauré.'}
            {confirmationInfo.willRefundAmount > 0 && (
              <><br />Montant remboursé : {confirmationInfo.willRefundAmount}</>
            )}
          </Typography>
        )}
      </DialogContent>
    <DialogActions sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}>
      <Button 
        onClick={onClose} 
        disabled={loading}
        variant="outlined"
        sx={{ borderRadius: '20px' }}
      >
        Annuler
      </Button>
      <Button 
        variant="contained" 
        color="error" 
        onClick={onConfirm}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        sx={{ 
          borderRadius: '20px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }
        }}
      >
        {loading ? 'Suppression...' : 'Supprimer'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteDialog;
