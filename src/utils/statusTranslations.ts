/**
 * Status translations for Sales, Invoices, and Quotes
 * Matches backend models.py choices
 */

// Sale Status Translations (Sale.STATUS_CHOICES)
export const SALE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  confirmed: 'Confirmé',
  payment_pending: 'Paiement en attente',
  partially_paid: 'Partiellement payé',
  paid: 'Payé',
  shipped: 'Expédié',
  delivered: 'Livré',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

// Payment Status Translations (Sale.PAYMENT_STATUS_CHOICES)
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Non payé',
  partially_paid: 'Partiellement payé',
  paid: 'Payé',
  overpaid: 'Surpayé',
};

// Invoice Status Translations (Invoice.status choices)
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  paid: 'Payé',
  overdue: 'En retard',
  cancelled: 'Annulé',
};

// Quote Status Translations (Quote.status choices)
export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Rejeté',
  expired: 'Expiré',
};

// Delivery Note Status Translations (DeliveryNote.status choices)
export const DELIVERY_NOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  delivered: 'Livré',
  cancelled: 'Annulé',
};

/**
 * Get translated label for a given status
 * @param status - The status key
 * @param type - The entity type (sale, payment, invoice, quote, delivery_note)
 * @returns Translated label or the original status if not found
 */
export const getStatusLabel = (
  status: string, 
  type: 'sale' | 'payment' | 'invoice' | 'quote' | 'delivery_note' = 'sale'
): string => {
  switch (type) {
    case 'sale':
      return SALE_STATUS_LABELS[status] || status;
    case 'payment':
      return PAYMENT_STATUS_LABELS[status] || status;
    case 'invoice':
      return INVOICE_STATUS_LABELS[status] || status;
    case 'quote':
      return QUOTE_STATUS_LABELS[status] || status;
    case 'delivery_note':
      return DELIVERY_NOTE_STATUS_LABELS[status] || status;
    default:
      return status;
  }
};
