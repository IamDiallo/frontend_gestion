/**
 * Sales Components Index
 * Barrel export for all sales-related sub-components
 */

// Main tabs
export { default as SalesTab } from './SalesTab';
export { default as InvoicesTab } from './InvoicesTab';
export { default as QuotesTab } from './QuotesTab';

// New modular dialogs (recommended)
export { default as SalesDialogs } from './SalesDialogs';
export { default as SaleDialog } from './SaleDialog';
export { default as InvoiceDialog } from './InvoiceDialog';
export { default as QuoteDialog } from './QuoteDialog';

// Legacy (deprecated - will be removed November 19, 2025)
// If you're still using this, migrate to SalesDialogs immediately
// export { default as SaleDialogManager } from './SaleDialogManager.DEPRECATED';
