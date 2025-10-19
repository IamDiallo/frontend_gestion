/**
 * SalesDialogs Component
 * Simplified wrapper that manages all sales-related dialogs
 * Replaces the monolithic SaleDialogManager
 */

import React from 'react';
import SaleDialog from './SaleDialog';
import InvoiceDialog from './InvoiceDialog';
import QuoteDialog from './QuoteDialog';
import { DeleteDialog } from '../common';
import * as SalesAPI from '../../services/api/sales.api';

interface SalesDialogsProps {
  dialogs: any;
  data: any;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SalesDialogs: React.FC<SalesDialogsProps> = ({
  dialogs,
  data,
  onSuccess,
  onError
}) => {
  const {
    saleDialog,
    invoiceDialog,
    quoteDialog,
    quoteConversionDialog,
    deleteDialog,
    closeSaleDialog,
    closeInvoiceDialog,
    closeQuoteDialog,
    closeQuoteConversionDialog,
    closeDeleteDialog,
    updateSaleDialog,
    updateInvoiceDialog,
    updateQuoteDialog,
    addProductToQuote,
    removeProductFromQuote
  } = dialogs;

  const { 
    clients, 
    zones, 
    sales, 
    products,
    productsWithStock, 
    availableStock,
    refreshAllData 
  } = data;

  // Handle delete
  const handleDelete = async () => {
    try {
      if (!deleteDialog?.item) {
        return;
      }

      const itemId = deleteDialog.item.id;
      const type = deleteDialog.type;

      if (type === 'sale') {
        await SalesAPI.deleteSale(itemId);
        onSuccess(`Vente ${deleteDialog.item.reference || itemId} supprimée avec succès`);
      } else if (type === 'invoice') {
        await SalesAPI.deleteInvoice(itemId);
        onSuccess(`Facture ${deleteDialog.item.reference || itemId} supprimée avec succès`);
      } else if (type === 'quote') {
        await SalesAPI.deleteQuote(itemId);
        onSuccess(`Devis ${deleteDialog.item.reference || itemId} supprimé avec succès`);
      } else {
        onError('Type d\'élément non reconnu');
        return;
      }

      if (refreshAllData) {
        await refreshAllData();
      }

      closeDeleteDialog();
    } catch (error: unknown) {
      console.error('Error deleting item:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error ?
        String((error.response as any)?.data?.error) : 'Erreur lors de la suppression';
      onError(errorMessage);
    }
  };

  return (
    <>
      {/* Sale Dialog */}
      <SaleDialog
        open={saleDialog?.open || false}
        mode={saleDialog?.mode || 'add'}
        sale={saleDialog?.sale}
        clients={clients}
        zones={zones}
        productsWithStock={productsWithStock}
        availableStock={availableStock}
        saleDialog={saleDialog}
        onClose={closeSaleDialog}
        updateSaleDialog={updateSaleDialog}
        onSuccess={onSuccess}
        onError={onError}
        refreshData={refreshAllData}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialog?.open || false}
        mode={invoiceDialog?.mode || 'add'}
        invoice={invoiceDialog?.invoice}
        invoiceDialog={invoiceDialog}
        sales={sales}
        clients={clients}
        onClose={closeInvoiceDialog}
        updateInvoiceDialog={updateInvoiceDialog}
        onSuccess={onSuccess}
        onError={onError}
        refreshData={refreshAllData}
      />

      {/* Quote Dialog */}
      <QuoteDialog
        open={quoteDialog?.open || false}
        mode={quoteDialog?.mode || 'add'}
        quote={quoteDialog?.quote}
        quoteDialog={quoteDialog}
        clients={clients}
        zones={zones}
        products={products}
        onClose={closeQuoteDialog}
        updateQuoteDialog={updateQuoteDialog}
        addProductToQuote={addProductToQuote}
        removeProductFromQuote={removeProductFromQuote}
        onSuccess={onSuccess}
        onError={onError}
        refreshData={refreshAllData}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialog?.open || false}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        type={deleteDialog?.type}
        item={deleteDialog?.item}
        confirmationInfo={deleteDialog?.confirmationInfo}
      />
    </>
  );
};

export default SalesDialogs;
