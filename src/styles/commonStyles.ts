import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/material/styles';

/**
 * Styles constants partagés pour toute l'application
 */

// ============ CONSTANTES DE STYLE ============

export const BORDER_RADIUS = {
  small: 1,
  medium: 2,
  large: 3
};

export const SPACING = {
  xs: 0.5,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4
};

export const SHADOWS = {
  light: 1,
  medium: 2,
  strong: 4
};

// ============ OBJETS DE STYLE COMPLETS ============

/**
 * Container principal pour les pages
 */
export const PAGE_CONTAINER_STYLES: SxProps<Theme> = {
  p: 3,
  minHeight: '100vh',
  bgcolor: 'background.default'
};

/**
 * Container pour les sections
 */
export const SECTION_CONTAINER_STYLES: SxProps<Theme> = {
  mb: 3,
  p: 2,
  bgcolor: 'background.paper',
  borderRadius: BORDER_RADIUS.medium,
  boxShadow: SHADOWS.light
};

/**
 * Header de page standard
 */
export const PAGE_HEADER_STYLES: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: 3,
  pb: 2,
  borderBottom: '1px solid',
  borderColor: 'divider'
};

/**
 * Zone de filtres standard
 */
export const FILTER_SECTION_STYLES: SxProps<Theme> = {
  mb: 2,
  p: 2,
  bgcolor: 'background.paper',
  borderRadius: BORDER_RADIUS.medium,
  boxShadow: SHADOWS.light,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
  alignItems: 'center'
};

/**
 * Zone d'actions (boutons) standard
 */
export const ACTION_SECTION_STYLES: SxProps<Theme> = {
  display: 'flex',
  gap: 1,
  alignItems: 'center',
  flexWrap: 'wrap'
};

/**
 * Container pour les onglets
 */
export const TABS_CONTAINER_STYLES: SxProps<Theme> = {
  borderBottom: 1,
  borderColor: 'divider',
  mb: 2
};

/**
 * Panel de contenu d'onglet
 */
export const TAB_PANEL_STYLES: SxProps<Theme> = {
  pt: 2
};

/**
 * Container pour les métriques/KPI
 */
export const METRICS_CONTAINER_STYLES: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)'
  },
  gap: 2,
  mb: 3
};

/**
 * Carte de métrique individuelle
 */
export const METRIC_CARD_STYLES: SxProps<Theme> = {
  p: 2,
  textAlign: 'center',
  borderRadius: BORDER_RADIUS.medium,
  boxShadow: SHADOWS.light,
  bgcolor: 'background.paper',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: SHADOWS.medium,
    transform: 'translateY(-2px)'
  }
};

// ============ STYLES POUR FORMULAIRES ============

/**
 * Container de formulaire
 */
export const FORM_CONTAINER_STYLES: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  maxWidth: 600,
  mx: 'auto'
};

/**
 * Groupe de champs dans un formulaire
 */
export const FORM_GROUP_STYLES: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  gap: 2,
  alignItems: 'flex-start'
};

/**
 * Actions de formulaire (boutons submit, cancel)
 */
export const FORM_ACTIONS_STYLES: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 2,
  pt: 2,
  borderTop: '1px solid',
  borderColor: 'divider'
};

// ============ STYLES POUR TABLEAUX ============

/**
 * Container de tableau standard
 */
export const TABLE_CONTAINER_STYLES: SxProps<Theme> = {
  borderRadius: BORDER_RADIUS.medium,
  overflow: 'hidden',
  boxShadow: SHADOWS.medium
};

/**
 * Cellule de header de tableau
 */
export const TABLE_HEADER_CELL_STYLES: SxProps<Theme> = {
  fontWeight: 'bold',
  bgcolor: 'primary.lighter',
  color: 'primary.contrastText'
};

/**
 * Ligne de tableau cliquable
 */
export const TABLE_ROW_CLICKABLE_STYLES: SxProps<Theme> = {
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    bgcolor: 'action.hover',
    transform: 'translateY(-1px)'
  }
};

// ============ STYLES POUR MODALES/DIALOGS ============

/**
 * Backdrop de modal
 */
export const MODAL_BACKDROP_STYLES: SxProps<Theme> = {
  backdropFilter: 'blur(4px)',
  backgroundColor: 'rgba(0, 0, 0, 0.5)'
};

/**
 * Paper de modal
 */
export const MODAL_PAPER_STYLES: SxProps<Theme> = {
  borderRadius: BORDER_RADIUS.large,
  p: 0,
  overflow: 'hidden',
  maxHeight: '90vh',
  maxWidth: '90vw'
};

/**
 * Header de modal
 */
export const MODAL_HEADER_STYLES: SxProps<Theme> = {
  p: 2,
  borderBottom: '1px solid',
  borderColor: 'divider',
  bgcolor: 'primary.main',
  color: 'primary.contrastText'
};

/**
 * Contenu de modal
 */
export const MODAL_CONTENT_STYLES: SxProps<Theme> = {
  p: 3,
  maxHeight: '60vh',
  overflow: 'auto'
};

/**
 * Actions de modal
 */
export const MODAL_ACTIONS_STYLES: SxProps<Theme> = {
  p: 2,
  borderTop: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.default',
  justifyContent: 'flex-end',
  gap: 1
};

// ============ STYLES RESPONSIFS ============

/**
 * Grid responsive standard
 */
export const RESPONSIVE_GRID_STYLES: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)'
  },
  gap: 2
};

/**
 * Container responsive avec padding adaptatif
 */
export const RESPONSIVE_CONTAINER_STYLES: SxProps<Theme> = {
  px: { xs: 1, sm: 2, md: 3 },
  py: { xs: 1, sm: 2 }
};

// ============ ANIMATIONS ============

/**
 * Transition standard pour les interactions
 */
export const STANDARD_TRANSITION = 'all 0.2s ease-in-out';

/**
 * Transition lente pour les transformations importantes
 */
export const SLOW_TRANSITION = 'all 0.3s ease-in-out';

/**
 * Transition rapide pour les micro-interactions
 */
export const FAST_TRANSITION = 'all 0.1s ease-in-out';
