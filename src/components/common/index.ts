/**
 * Exports centralisés des composants standardisés
 */

// Boutons
export { default as StandardButton } from './StandardButton';
export type { StandardButtonVariant } from './StandardButton';

// DataGrid
export { default as StandardDataGrid } from './StandardDataGrid';

// Stats Card
export { default as StatsCard } from './StatsCard';

// Dialog de suppression
export { default as DeleteDialog } from './DeleteDialog';
// Champs de saisie
export { 
  StandardTextField, 
  StandardSelect, 
  StandardAutocomplete 
} from './StandardInputs';

// Status
export { default as StatusChip } from './StatusChip';

// Sales Workflow
export { default as SalesWorkflow } from './SalesWorkflow';
export type { SalesStatus, SalesWorkflowProps } from './SalesWorkflow';

// Dialogs
export { default as ContactDialog } from './ContactDialog';
export { default as InventoryDialog } from './InventoryDialog';
export type { 
  InventoryOperationType, 
  InventoryDialogStatus, 
  InventoryDialogItem, 
  InventoryDialogFormData 
} from './InventoryDialog';

// Styles utilitaires
export * from '../../utils/styleUtils';
export * from '../../styles/commonStyles';

// Traductions
export * from '../../utils/translations';
