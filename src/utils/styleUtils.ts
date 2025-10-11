import { Theme, SxProps } from '@mui/material/styles';

/**
 * Utilitaires de style partagés pour uniformiser l'interface
 */

// ============ STYLES POUR DATAGRID ============

/**
 * Style standard pour tous les DataGrid de l'application
 */
export const getStandardDataGridStyles = (): SxProps<Theme> => ({
  height: 500,
  width: '100%',
  boxShadow: 2,
  borderRadius: 2,
  overflow: 'hidden',
  bgcolor: 'background.paper',
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: (theme: Theme) => 
      theme.palette.mode === 'dark' ? 'background.paper' : 'primary.lighter',
    color: (theme: Theme) => theme.palette.text.primary,
    fontWeight: 'bold',
    fontSize: '0.875rem'
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid',
    borderColor: 'divider',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center'
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: (theme: Theme) => 
      theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
    cursor: 'pointer'
  },
  '& .MuiDataGrid-cell:focus': {
    outline: 'none'
  },
  '& .MuiDataGrid-cell:focus-within': {
    outline: 'none'
  },
  '& .MuiDataGrid-columnHeader:focus': {
    outline: 'none'
  }
});

/**
 * Configuration standard pour la pagination des DataGrid
 */
export const getStandardPaginationModel = (page: number, rowsPerPage: number) => ({
  pageSize: rowsPerPage,
  page: page
});

/**
 * Options standard pour la taille des pages
 */
export const STANDARD_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// ============ STYLES POUR BOUTONS ============

/**
 * Style standard pour les boutons primaires (actions principales)
 */
export const getStandardPrimaryButtonStyles = (): SxProps<Theme> => ({
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  px: 3,
  py: 1,
  boxShadow: 1,
  '&:hover': {
    boxShadow: 2,
    transform: 'translateY(-1px)'
  },
  transition: 'all 0.2s ease-in-out'
});

/**
 * Style standard pour les boutons secondaires (actions secondaires)
 */
export const getStandardSecondaryButtonStyles = (): SxProps<Theme> => ({
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 500,
  px: 2.5,
  py: 1,
  border: '1.5px solid',
  borderColor: 'primary.main',
  '&:hover': {
    borderColor: 'primary.dark',
    backgroundColor: 'primary.lightest'
  },
  transition: 'all 0.2s ease-in-out'
});

/**
 * Style standard pour les boutons d'action (edit, delete, etc.)
 */
export const getStandardActionButtonStyles = (): SxProps<Theme> => ({
  borderRadius: 1.5,
  minWidth: 'auto',
  p: 1,
  '&:hover': {
    transform: 'scale(1.05)'
  },
  transition: 'all 0.2s ease-in-out'
});

/**
 * Style standard pour les boutons d'icône
 */
export const getStandardIconButtonStyles = (): SxProps<Theme> => ({
  borderRadius: 2,
  p: 1,
  '&:hover': {
    backgroundColor: 'action.hover',
    transform: 'scale(1.1)'
  },
  transition: 'all 0.2s ease-in-out'
});

// ============ STYLES POUR CHAMPS DE SAISIE ============

/**
 * Style standard pour les TextField
 */
export const getStandardTextFieldStyles = (): SxProps<Theme> => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500
  }
});

/**
 * Style standard pour les Select/FormControl
 */
export const getStandardSelectStyles = (): SxProps<Theme> => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500
  }
});

/**
 * Style standard pour les Autocomplete
 */
export const getStandardAutocompleteStyles = (): SxProps<Theme> => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: 2
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500
  }
});

// ============ STYLES POUR CONTENEURS ============

/**
 * Style standard pour les boîtes de filtres/recherche
 */
export const getStandardFilterBoxStyles = (): SxProps<Theme> => ({
  mb: 2,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 2,
  p: 2,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 1
});

/**
 * Style standard pour les groupes de filtres
 */
export const getStandardFilterGroupStyles = (): SxProps<Theme> => ({
  display: 'flex',
  gap: 2,
  flexWrap: 'wrap',
  alignItems: 'center'
});

/**
 * Style standard pour les groupes d'actions
 */
export const getStandardActionGroupStyles = (): SxProps<Theme> => ({
  display: 'flex',
  gap: 1,
  alignItems: 'center'
});

// ============ STYLES POUR DIALOGS ============

/**
 * Style standard pour les Dialog
 */
export const getStandardDialogStyles = (): SxProps<Theme> => ({
  '& .MuiDialog-paper': {
    borderRadius: 3,
    minWidth: { xs: '90vw', sm: '500px' },
    maxWidth: { xs: '95vw', md: '800px' }
  }
});

/**
 * Style standard pour le contenu des Dialog
 */
export const getStandardDialogContentStyles = (): SxProps<Theme> => ({
  pt: 2,
  '& > *': {
    mb: 2
  }
});

// ============ STYLES POUR STATUTS ============

/**
 * Couleurs et styles standardisés pour les différents statuts
 */
export const getStatusChipStyles = (status: string): SxProps<Theme> => {
  const statusColors: Record<string, { color: string; bgcolor: string }> = {
    // Statuts généraux
    'active': { color: 'success.main', bgcolor: 'success.lighter' },
    'inactive': { color: 'error.main', bgcolor: 'error.lighter' },
    'pending': { color: 'warning.main', bgcolor: 'warning.lighter' },
    'draft': { color: 'grey.600', bgcolor: 'grey.100' },
    'confirmed': { color: 'success.main', bgcolor: 'success.lighter' },
    'cancelled': { color: 'error.main', bgcolor: 'error.lighter' },
    'default': { color: 'text.secondary', bgcolor: 'grey.100' },
    // Couleurs de base pour StatusChip
    'success': { color: 'success.main', bgcolor: 'success.lighter' },
    'error': { color: 'error.main', bgcolor: 'error.lighter' },
    'warning': { color: 'warning.main', bgcolor: 'warning.lighter' },
    'info': { color: 'info.main', bgcolor: 'info.lighter' },
    'primary': { color: 'primary.main', bgcolor: 'primary.lighter' },
    // Statuts de vente
    'quote': { color: 'info.main', bgcolor: 'info.lighter' },
    'order': { color: 'primary.main', bgcolor: 'primary.lighter' },
    'invoice': { color: 'success.main', bgcolor: 'success.lighter' },
    // Statuts de paiement
    'paid': { color: 'success.main', bgcolor: 'success.lighter' },
    'unpaid': { color: 'error.main', bgcolor: 'error.lighter' },
    'partial': { color: 'warning.main', bgcolor: 'warning.lighter' },
    // Statuts de stock
    'in_stock': { color: 'success.main', bgcolor: 'success.lighter' },
    'low_stock': { color: 'warning.main', bgcolor: 'warning.lighter' },
    'out_of_stock': { color: 'error.main', bgcolor: 'error.lighter' },
    'normal': { color: 'success.main', bgcolor: 'success.lighter' },
    'faible': { color: 'warning.main', bgcolor: 'warning.lighter' },
    'rupture': { color: 'error.main', bgcolor: 'error.lighter' },
    // Statuts d'inventaire
    'received': { color: 'success.main', bgcolor: 'success.lighter' },
    'completed': { color: 'success.main', bgcolor: 'success.lighter' },
    'in_progress': { color: 'info.main', bgcolor: 'info.lighter' }
  };

  const colors = statusColors[status.toLowerCase()] || 
                 { color: 'text.secondary', bgcolor: 'grey.100' };

  return {
    fontWeight: 600,
    borderRadius: 2,
    color: colors.color,
    bgcolor: colors.bgcolor,
    border: `1px solid ${colors.color}`,
    '&:hover': {
      bgcolor: colors.color,
      color: 'white'
    },
    transition: 'all 0.2s ease-in-out'
  };
};

// ============ STYLES POUR TABLES CLIQUABLES ============

/**
 * Style pour les lignes de table cliquables
 */
export const getClickableRowStyles = (): SxProps<Theme> => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: (theme: Theme) => 
      theme.palette.mode === 'dark' ? 'action.hover' : 'primary.lightest',
    transform: 'translateY(-1px)',
    boxShadow: 1
  }
});

// ============ STYLES POUR CARTES ============

/**
 * Style standard pour les cartes/Paper
 */
export const getStandardCardStyles = (): SxProps<Theme> => ({
  p: 3,
  borderRadius: 3,
  boxShadow: 2,
  '&:hover': {
    boxShadow: 4
  },
  transition: 'box-shadow 0.3s ease-in-out'
});

// ============ UTILITAIRES DE COULEUR ============

/**
 * Obtient la couleur appropriée selon le thème
 */
export const getThemeColor = (lightColor: string, darkColor: string) => 
  (theme: Theme) => theme.palette.mode === 'dark' ? darkColor : lightColor;

// ============ STYLES POUR LOADING ============

/**
 * Style standard pour les indicateurs de chargement
 */
export const getStandardLoadingStyles = (): SxProps<Theme> => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  p: 4
});
