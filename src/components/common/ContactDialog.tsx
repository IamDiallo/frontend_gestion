import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  MenuItem,
  Grid,
  Button,
  Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { StandardButton, StandardTextField, StandardSelect } from './index';
import { t } from '../../utils/translations';


interface ContactFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  account?: number;
  is_active: boolean;
  price_group?: number; // Only for clients
}

interface ContactDialogProps {
  open: boolean;
  editMode: boolean;
  contactType: 'client' | 'supplier';
  formData: ContactFormData;
  availableAccounts: Array<{ id: number; name: string }>;
  loadingAccounts: boolean;
  priceGroups?: Array<{ id: number; name: string }>; // Only for clients
  loadingPriceGroups?: boolean; // Loading state for price groups
  onClose: () => void;
  onSubmit: () => void;
  onFormDataChange: (data: ContactFormData) => void;
  onAccountChange: (value: number | '') => void;
  onPriceGroupChange?: (value: number) => void; // Only for clients
  onCreateAccount?: () => void; // Handler to create new account
}

/**
 * Reusable dialog for creating and editing clients and suppliers
 */
const ContactDialog: React.FC<ContactDialogProps> = ({
  open,
  editMode,
  contactType,
  formData,
  availableAccounts,
  loadingAccounts,
  priceGroups,
  loadingPriceGroups,
  onClose,
  onSubmit,
  onFormDataChange,
  onAccountChange,
  onPriceGroupChange,
  onCreateAccount
}) => {
  const theme = useTheme();
  const isClient = contactType === 'client';

  // Get dialog title
  const getTitle = () => {
    if (editMode) {
      return isClient ? 'Modifier le client' : 'Modifier le fournisseur';
    }
    return isClient ? 'Ajouter un client' : 'Ajouter un fournisseur';
  };

  // Get account type label
  const getAccountLabel = () => {
    return isClient ? 'Compte client' : 'Compte fournisseur';
  };

  // Get account selection placeholder
  const getAccountPlaceholder = () => {
    return isClient ? 'Aucun compte client disponible' : 'Aucun compte fournisseur disponible';
  };

  // Get account creation message
  const getAccountCreationMessage = () => {
    return isClient 
      ? 'Aucun compte client disponible. Veuillez d\'abord créer un compte de type client dans la section Paramètres.'
      : 'Aucun compte fournisseur disponible. Veuillez d\'abord créer un compte de type fournisseur dans la section Paramètres.';
  };

  // Handle field changes
  const handleFieldChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFormDataChange({
      ...formData,
      [field]: e.target.value
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          minHeight: '400px'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        fontWeight: 'bold',
        py: 2,
        px: 3
      }}>
        {getTitle()}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, mt: 1 }}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <StandardTextField
              label="Entreprise"
              value={formData.name}
              onChange={handleFieldChange('name')}
              required
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <StandardTextField
              label="Nom Prenom"
              value={formData.contact_person}
              onChange={handleFieldChange('contact_person')}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <StandardTextField
              label="Email"
              value={formData.email}
              onChange={handleFieldChange('email')}
              type="email"
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <StandardTextField
              label="Téléphone"
              value={formData.phone}
              onChange={handleFieldChange('phone')}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12}>
            <StandardTextField
              label="Adresse"
              value={formData.address}
              onChange={handleFieldChange('address')}
              multiline
              rows={2}
              fullWidth
            />
          </Grid>

          {/* Price group for clients only */}
          {isClient && priceGroups && onPriceGroupChange && (
            <Grid item xs={12} sm={6}>
              <StandardSelect
                label="Groupe de prix"
                value={formData.price_group || ''}
                onChange={(e) => onPriceGroupChange(Number(e.target.value))}
                fullWidth
              >
                {loadingPriceGroups ? (
                  <MenuItem disabled>Chargement des groupes de prix...</MenuItem>
                ) : priceGroups && Array.isArray(priceGroups) && priceGroups.length === 0 ? (
                  <MenuItem disabled>Aucun groupe de prix disponible</MenuItem>
                ) : (
                  priceGroups && Array.isArray(priceGroups) && priceGroups.map((priceGroup) => (
                    <MenuItem key={priceGroup.id} value={priceGroup.id}>
                      {priceGroup.name}
                    </MenuItem>
                  ))
                )}
              </StandardSelect>
            </Grid>
          )}

          {/* Account selection */}
          <Grid item xs={12} sm={isClient && priceGroups ? 6 : 12}>
            <StandardSelect
              label={getAccountLabel()}
              value={formData.account ?? ''}
              onChange={(e) => onAccountChange(e.target.value === '' ? '' : Number(e.target.value))}
              fullWidth
            >
              <MenuItem value="">Sélectionner un compte</MenuItem>
              {loadingAccounts ? (
                <MenuItem disabled>Chargement des comptes...</MenuItem>
              ) : availableAccounts && Array.isArray(availableAccounts) && availableAccounts.length === 0 ? (
                <MenuItem disabled>{getAccountPlaceholder()}</MenuItem>
              ) : (
                availableAccounts && Array.isArray(availableAccounts) && availableAccounts.map(account => (
                  <MenuItem key={account.id} value={account.id}>{account.name}</MenuItem>
                ))
              )}
            </StandardSelect>
          </Grid>
          
          {/* Account creation message with link */}
          {availableAccounts && Array.isArray(availableAccounts) && availableAccounts.length === 0 && !loadingAccounts && onCreateAccount && (
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 2, 
                  backgroundColor: theme.palette.warning.light + '20',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.warning.main}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                >
                  {getAccountCreationMessage()}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => {
                    onClose();
                    onCreateAccount();
                  }}
                  sx={{ 
                    alignSelf: 'flex-start',
                    textTransform: 'none',
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                    '&:hover': {
                      borderColor: theme.palette.warning.dark,
                      backgroundColor: theme.palette.warning.light + '10'
                    }
                  }}
                >
                  Créer un compte dans Paramètres
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <StandardButton onClick={onClose}>
          {t('cancel')}
        </StandardButton>
        
        <StandardButton 
          onClick={onSubmit} 
          variant="contained"
          disabled={!formData.name}
        >
          {editMode ? t('update') : t('add')}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default ContactDialog;
