// src/utils/printUtils.ts
export type Facture = {
  id: number | string;
  reference?: string;
  date?: string;
  due_date?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  sale_reference?: string;
  amount?: number | string;
  paid_amount?: number | string;
  balance?: number | string;
  status?: string;
  statut?: string;
  notes?: string;
  items?: Array<{
    product_name?: string;
    quantity?: number;
    unit_price?: number | string;
    subtotal?: number | string;
  }>;
};

export type Devis = {
  id: number | string;
  reference?: string;
  date?: string;
  expiry_date?: string;
  client?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  total_amount?: number | string;
  status?: string;
  notes?: string;
  items?: Array<{
    product_name?: string;
    description?: string;
    quantity?: number;
    unit_price?: number | string;
    subtotal?: number | string;
  }>;
};

export type Paiement = {
  id: number | string;
  date?: string;
  amount?: number | string;
  method?: string;
  description?: string;
  reference?: string;
  client_name?: string;
  type?: string;
};

export type BonReception = {
  id: number | string;
  reference?: string;
  date?: string;
  supplier_name?: string;
  supplier_phone?: string;
  supplier_email?: string;
  zone_name?: string;
  status?: string;
  total_amount?: number | string;
  notes?: string;
  items?: Array<{
    product_name?: string;
    quantity?: number;
    unit_price?: number | string;
    total_price?: number | string;
  }>;
};

/* -------------------- Helpers -------------------- */

// Safely coerce different value types (strings with commas/currency symbols, numbers, null/undefined) to a number.
// Returns 0 for non-parsable values.
const toNumber = (value: number | string | null | undefined): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    // Normalize string: remove NBSP, spaces; convert comma to dot; remove non-numeric except . and -
    const normalized = value
      .replace(/\u00A0/g, '') // NBSP
      .replace(/\s/g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value as number);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: number | string | null | undefined, locale = 'fr-FR', currency = 'XOF') => {
  const n = toNumber(value);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
};

const formatDate = (d?: string | Date | null) => {
  if (!d) return '-';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleDateString('fr-FR');
};

const openPrintWindow = (htmlContent: string, title: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // pop-up blocked
    console.warn('Unable to open print window (popup blocked?)');
    return;
  }

  printWindow.document.write(`
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          /* Reset + base */
          * { box-sizing: border-box; }
          body { 
            font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            margin: 0; 
            background: #f5f7fa; 
            padding: 24px; 
            color: #1a202c; 
          }
          .paper { 
            max-width: 850px; 
            margin: 0 auto; 
            background: #fff; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12); 
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 32px; 
            padding-bottom: 24px;
            border-bottom: 3px solid #1976d2;
          }
          .brand { 
            display: flex; 
            gap: 16px; 
            align-items: center; 
          }
          .logo { 
            width: 64px; 
            height: 64px; 
            border-radius: 8px; 
            background: linear-gradient(135deg, #1976d2, #42a5f5); 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            color: #fff; 
            font-weight: 700; 
            font-size: 24px; 
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
          }
          .company { 
            font-size: 14px; 
            color: #4a5568; 
          }
          .company-name { 
            font-weight: 700; 
            font-size: 18px; 
            color: #1a202c; 
            margin-bottom: 6px; 
          }
          h1 { 
            margin: 0; 
            font-size: 28px; 
            color: #1976d2; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta { 
            text-align: right; 
            font-size: 13px; 
            color: #4a5568; 
          }
          .meta-item {
            margin-bottom: 6px;
          }
          .meta-label {
            font-weight: 600;
            color: #2d3748;
          }
          .client-info {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
            border-left: 4px solid #1976d2;
          }
          .client-info h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            color: #2d3748;
            font-weight: 600;
          }
          .client-info p {
            margin: 4px 0;
            font-size: 14px;
            color: #4a5568;
          }
          .section { 
            margin-top: 24px; 
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 12px; 
          }
          th { 
            text-align: left; 
            font-size: 13px; 
            font-weight: 600;
            color: #2d3748; 
            padding: 12px 14px; 
            background: #f7fafc; 
            border-bottom: 2px solid #e2e8f0; 
          }
          td { 
            padding: 12px 14px; 
            border-bottom: 1px solid #e2e8f0; 
            font-size: 14px; 
            color: #1a202c; 
            vertical-align: top; 
          }
          tr:last-child td {
            border-bottom: none;
          }
          .line-items th, 
          .line-items td { 
            text-align: left; 
          }
          .line-items th:last-child,
          .line-items td:last-child {
            text-align: right;
          }
          .line-items .quantity,
          .line-items .price {
            text-align: right;
          }
          .totals-section {
            margin-top: 24px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-table {
            width: 350px;
          }
          .totals td { 
            padding: 10px 14px; 
            font-size: 15px;
          }
          .totals .label-cell {
            font-weight: 600;
            color: #4a5568;
          }
          .totals .amount-cell {
            text-align: right;
            font-weight: 600;
          }
          .total-row td {
            padding: 14px;
            font-size: 18px;
            font-weight: 700;
            background: #f7fafc;
            border-top: 2px solid #1976d2;
          }
          .total-value { 
            font-weight: 700; 
            color: #1976d2; 
          }
          .balance-due {
            color: #dc2626 !important;
          }
          .paid-status {
            color: #059669 !important;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-paid {
            background: #d1fae5;
            color: #065f46;
          }
          .status-partial {
            background: #fef3c7;
            color: #92400e;
          }
          .status-unpaid {
            background: #fee2e2;
            color: #991b1b;
          }
          .status-draft {
            background: #e5e7eb;
            color: #374151;
          }
          .status-sent {
            background: #dbeafe;
            color: #1e40af;
          }
          .status-accepted {
            background: #d1fae5;
            color: #065f46;
          }
          .status-rejected {
            background: #fee2e2;
            color: #991b1b;
          }
          .notes-section {
            margin-top: 24px;
            padding: 16px;
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }
          .notes-section h4 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #92400e;
            font-weight: 600;
          }
          .notes-section p {
            margin: 0;
            font-size: 13px;
            color: #78350f;
            line-height: 1.5;
          }
          .muted { 
            color: #718096; 
            font-size: 13px; 
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 24px;
            text-align: center; 
            font-size: 12px; 
            color: #718096; 
            border-top: 1px solid #e2e8f0;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(25, 118, 210, 0.05);
            font-weight: 900;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
          }
          @media print {
            body { 
              background: #fff; 
              padding: 0; 
            }
            .paper { 
              box-shadow: none; 
              border-radius: 0; 
              padding: 20px; 
            }
            .watermark {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="paper">
          ${htmlContent}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  // Ensure focus and allow render to settle briefly, then open print dialog
  printWindow.focus();
  // small delay helps ensure fonts/styles are applied before printing in some browsers
  setTimeout(() => {
    try {
      printWindow.print();
    } catch (err) {
      console.error('Print failed', err);
    }
  }, 150);
};

/* -------------------- Specific print templates -------------------- */

export const printFacture = (facture: Facture) => {
  const amount = toNumber(facture.amount);
  const paid = toNumber(facture.paid_amount);
  const balance = toNumber(facture.balance);

  // Determine status class
  const status = facture.status || facture.statut || 'draft';
  let statusClass = 'status-draft';
  if (balance === 0 || status === 'paid') statusClass = 'status-paid';
  else if (paid > 0 && balance > 0) statusClass = 'status-partial';
  else if (balance > 0) statusClass = 'status-unpaid';

  const statusLabels: { [key: string]: string } = {
    'paid': 'Payée',
    'partial': 'Partiellement payée',
    'unpaid': 'Non payée',
    'draft': 'Brouillon',
    'overdue': 'En retard'
  };

  const html = `
    <div class="watermark">FACTURE</div>
    
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div class="company-name">Gestion</div>
          <div class="muted">123 Rue Exemple</div>
          <div class="muted">+33 1 23 45 67 89</div>
          <div class="muted">contact@gestion.com</div>
        </div>
      </div>
      <div class="meta">
        <h1>FACTURE</h1>
        <div class="meta-item"><span class="meta-label">N°:</span> <strong>${facture.reference ?? facture.id}</strong></div>
        <div class="meta-item"><span class="meta-label">Date:</span> ${formatDate(facture.date)}</div>
        ${facture.due_date ? `<div class="meta-item"><span class="meta-label">Échéance:</span> ${formatDate(facture.due_date)}</div>` : ''}
        ${facture.sale_reference ? `<div class="meta-item"><span class="meta-label">Vente:</span> ${facture.sale_reference}</div>` : ''}
      </div>
    </div>

    ${facture.client_name ? `
    <div class="client-info">
      <h3>Informations Client</h3>
      <p><strong>${facture.client_name}</strong></p>
      ${facture.client_phone ? `<p>📞 ${facture.client_phone}</p>` : ''}
      ${facture.client_email ? `<p>✉️ ${facture.client_email}</p>` : ''}
    </div>
    ` : ''}

    ${facture.items && facture.items.length > 0 ? `
    <div class="section">
      <h3 class="section-title">Détails de la facture</h3>
      <table class="line-items">
        <thead>
          <tr>
            <th>Article</th>
            <th class="quantity">Quantité</th>
            <th class="price">Prix unitaire</th>
            <th class="price">Sous-total</th>
          </tr>
        </thead>
        <tbody>
          ${facture.items.map(item => `
            <tr>
              <td>${item.product_name || 'Article'}</td>
              <td class="quantity">${item.quantity || 0}</td>
              <td class="price">${formatCurrency(item.unit_price)}</td>
              <td class="price">${formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="totals-section">
      <table class="totals-table totals">
        <tr>
          <td class="label-cell">Montant total</td>
          <td class="amount-cell">${formatCurrency(amount)}</td>
        </tr>
        <tr>
          <td class="label-cell">Montant payé</td>
          <td class="amount-cell paid-status">${formatCurrency(paid)}</td>
        </tr>
        <tr class="total-row">
          <td class="label-cell">Solde restant</td>
          <td class="amount-cell total-value ${balance > 0 ? 'balance-due' : 'paid-status'}">${formatCurrency(balance)}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right; padding-top: 16px;">
            <span class="status-badge ${statusClass}">${statusLabels[status] || status}</span>
          </td>
        </tr>
      </table>
    </div>

    ${facture.notes ? `
    <div class="notes-section">
      <h4>Notes</h4>
      <p>${facture.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Merci de votre confiance !</strong></p>
      <p class="muted">Document généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
      <p class="muted">En cas de question, contactez-nous : contact@gestion.com</p>
    </div>
  `;

  openPrintWindow(html, `Facture ${facture.reference ?? facture.id}`);
};

export const printDevis = (devis: Devis) => {
  const total = toNumber(devis.total_amount);

  const status = devis.status || 'draft';
  let statusClass = 'status-draft';
  if (status === 'accepted') statusClass = 'status-accepted';
  else if (status === 'sent') statusClass = 'status-sent';
  else if (status === 'rejected') statusClass = 'status-rejected';

  const statusLabels: { [key: string]: string } = {
    'draft': 'Brouillon',
    'sent': 'Envoyé',
    'accepted': 'Accepté',
    'rejected': 'Rejeté',
    'expired': 'Expiré'
  };

  const html = `
    <div class="watermark">DEVIS</div>
    
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div class="company-name">Gestion</div>
          <div class="muted">123 Rue Exemple</div>
          <div class="muted">+33 1 23 45 67 89</div>
          <div class="muted">contact@gestion.com</div>
        </div>
      </div>
      <div class="meta">
        <h1>DEVIS</h1>
        <div class="meta-item"><span class="meta-label">N°:</span> <strong>${devis.reference ?? devis.id}</strong></div>
        <div class="meta-item"><span class="meta-label">Date:</span> ${formatDate(devis.date)}</div>
        ${devis.expiry_date ? `<div class="meta-item"><span class="meta-label">Valable jusqu'au:</span> ${formatDate(devis.expiry_date)}</div>` : ''}
      </div>
    </div>

    ${devis.client_name || devis.client ? `
    <div class="client-info">
      <h3>Informations Client</h3>
      <p><strong>${devis.client_name || devis.client}</strong></p>
      ${devis.client_phone ? `<p>📞 ${devis.client_phone}</p>` : ''}
      ${devis.client_email ? `<p>✉️ ${devis.client_email}</p>` : ''}
    </div>
    ` : ''}

    ${devis.items && devis.items.length > 0 ? `
    <div class="section">
      <h3 class="section-title">Détails du devis</h3>
      <table class="line-items">
        <thead>
          <tr>
            <th>Désignation</th>
            <th class="quantity">Quantité</th>
            <th class="price">Prix unitaire</th>
            <th class="price">Montant</th>
          </tr>
        </thead>
        <tbody>
          ${devis.items.map(item => `
            <tr>
              <td>
                <strong>${item.product_name || 'Article'}</strong>
                ${item.description ? `<br/><span class="muted">${item.description}</span>` : ''}
              </td>
              <td class="quantity">${item.quantity || 0}</td>
              <td class="price">${formatCurrency(item.unit_price)}</td>
              <td class="price">${formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="totals-section">
      <table class="totals-table totals">
        <tr class="total-row">
          <td class="label-cell">Montant total estimé</td>
          <td class="amount-cell total-value">${formatCurrency(total)}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right; padding-top: 16px;">
            <span class="status-badge ${statusClass}">${statusLabels[status] || status}</span>
          </td>
        </tr>
      </table>
    </div>

    ${devis.notes ? `
    <div class="notes-section">
      <h4>Notes et conditions</h4>
      <p>${devis.notes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Ce devis est valable ${devis.expiry_date ? 'jusqu\'au ' + formatDate(devis.expiry_date) : 'pendant 30 jours'}</strong></p>
      <p class="muted">Document généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
      <p class="muted">Pour toute question, contactez-nous : contact@gestion.com</p>
    </div>
  `;

  openPrintWindow(html, `Devis ${devis.reference ?? devis.id}`);
};

export const printPaiementReceipt = (paiement: Paiement) => {
  const amount = toNumber(paiement.amount);

  // Payment method translations
  const methodLabels: { [key: string]: string } = {
    'cash': 'Espèces',
    'card': 'Carte bancaire',
    'check': 'Chèque',
    'transfer': 'Virement',
    'mobile': 'Paiement mobile'
  };

  const paymentType = paiement.type || 'cash_receipt';
  const typeLabels: { [key: string]: string } = {
    'cash_receipt': 'Paiement reçu',
    'client_deposit': 'Dépôt client',
    'supplier_payment': 'Paiement fournisseur',
    'payment': 'Paiement'
  };

  const html = `
    <div class="watermark">REÇU</div>
    
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div class="company-name">Gestion</div>
          <div class="muted">123 Rue Exemple</div>
          <div class="muted">+33 1 23 45 67 89</div>
          <div class="muted">contact@gestion.com</div>
        </div>
      </div>
      <div class="meta">
        <h1>REÇU</h1>
        <div class="meta-item"><span class="meta-label">N°:</span> <strong>${paiement.reference || paiement.id}</strong></div>
        <div class="meta-item"><span class="meta-label">Date:</span> ${formatDate(paiement.date)}</div>
      </div>
    </div>

    ${paiement.client_name ? `
    <div class="client-info">
      <h3>${paymentType.includes('supplier') ? 'Fournisseur' : 'Client'}</h3>
      <p><strong>${paiement.client_name}</strong></p>
    </div>
    ` : ''}

    <div class="section">
      <h3 class="section-title">Détails du paiement</h3>
      <table>
        <tr>
          <th style="width: 40%;">Type de transaction</th>
          <td>
            <span class="status-badge status-paid">${typeLabels[paymentType] || 'Paiement'}</span>
          </td>
        </tr>
        <tr>
          <th>Montant</th>
          <td style="font-size: 20px; font-weight: 700; color: #059669;">
            ${formatCurrency(amount)}
          </td>
        </tr>
        <tr>
          <th>Méthode de paiement</th>
          <td>${methodLabels[paiement.method || ''] || paiement.method || 'Non spécifié'}</td>
        </tr>
        ${paiement.description ? `
        <tr>
          <th>Description</th>
          <td>${paiement.description}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="margin-top: 48px; padding: 24px; background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 8px; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #15803d;">
        ✓ Paiement confirmé
      </p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">
        Montant reçu : ${formatCurrency(amount)}
      </p>
    </div>

    <div class="footer">
      <p><strong>Merci pour votre paiement !</strong></p>
      <p class="muted">Reçu généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
      <p class="muted">Conservez ce reçu pour vos archives</p>
      <p class="muted" style="margin-top: 16px;">Contact : contact@gestion.com | +33 1 23 45 67 89</p>
    </div>
  `;

  openPrintWindow(html, `Reçu de paiement ${paiement.reference || paiement.id}`);
};

export const printBonReception = (bonReception: BonReception) => {
  const totalAmount = toNumber(bonReception.total_amount);

  const status = bonReception.status || 'pending';
  let statusClass = 'status-draft';
  if (status === 'received') statusClass = 'status-accepted';
  else if (status === 'partial') statusClass = 'status-partial';
  else if (status === 'cancelled') statusClass = 'status-rejected';
  else if (status === 'pending') statusClass = 'status-sent';

  const statusLabels: { [key: string]: string } = {
    'pending': 'En attente',
    'received': 'Reçu',
    'partial': 'Partiel',
    'cancelled': 'Annulé'
  };

  // Calculate total from items if not provided
  let calculatedTotal = totalAmount;
  if (bonReception.items && bonReception.items.length > 0 && !bonReception.total_amount) {
    calculatedTotal = bonReception.items.reduce((sum, item) => {
      return sum + toNumber(item.total_price);
    }, 0);
  }

  const html = `
    <div class="watermark">BON DE RÉCEPTION</div>
    
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div class="company-name">Gestion</div>
          <div class="muted">123 Rue Exemple</div>
          <div class="muted">+33 1 23 45 67 89</div>
          <div class="muted">contact@gestion.com</div>
        </div>
      </div>
      <div class="meta">
        <h1>BON DE RÉCEPTION</h1>
        <div class="meta-item"><span class="meta-label">N°:</span> <strong>${bonReception.reference ?? bonReception.id}</strong></div>
        <div class="meta-item"><span class="meta-label">Date:</span> ${formatDate(bonReception.date)}</div>
        ${bonReception.zone_name ? `<div class="meta-item"><span class="meta-label">Emplacement:</span> ${bonReception.zone_name}</div>` : ''}
      </div>
    </div>

    ${bonReception.supplier_name ? `
    <div class="client-info">
      <h3>Informations Fournisseur</h3>
      <p><strong>${bonReception.supplier_name}</strong></p>
      ${bonReception.supplier_phone ? `<p>📞 ${bonReception.supplier_phone}</p>` : ''}
      ${bonReception.supplier_email ? `<p>✉️ ${bonReception.supplier_email}</p>` : ''}
    </div>
    ` : ''}

    ${bonReception.items && bonReception.items.length > 0 ? `
    <div class="section">
      <h3 class="section-title">Détails de la réception</h3>
      <table class="line-items">
        <thead>
          <tr>
            <th>Article</th>
            <th class="quantity">Quantité</th>
            <th class="price">Prix unitaire</th>
            <th class="price">Montant</th>
          </tr>
        </thead>
        <tbody>
          ${bonReception.items.map(item => `
            <tr>
              <td>${item.product_name || 'Article'}</td>
              <td class="quantity">${item.quantity || 0}</td>
              <td class="price">${formatCurrency(item.unit_price)}</td>
              <td class="price">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="totals-section">
      <table class="totals-table totals">
        <tr class="total-row">
          <td class="label-cell">Montant total</td>
          <td class="amount-cell total-value">${formatCurrency(calculatedTotal)}</td>
        </tr>
        <tr>
          <td colspan="2" style="text-align: right; padding-top: 16px;">
            <span class="status-badge ${statusClass}">${statusLabels[status] || status}</span>
          </td>
        </tr>
      </table>
    </div>

    ${bonReception.notes ? `
    <div class="notes-section">
      <h4>Notes</h4>
      <p>${bonReception.notes}</p>
    </div>
    ` : ''}

    <div style="margin-top: 48px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #718096; font-weight: 600;">Signature du fournisseur</p>
          <div style="border-top: 2px solid #1a202c; width: 200px; margin-top: 50px;"></div>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #718096;">Date et signature</p>
        </div>
        <div style="flex: 1; text-align: right;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #718096; font-weight: 600;">Signature du réceptionnaire</p>
          <div style="border-top: 2px solid #1a202c; width: 200px; margin-top: 50px; margin-left: auto;"></div>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #718096;">Date et signature</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Document de réception officiel</strong></p>
      <p class="muted">Document généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
      <p class="muted">Conservez ce document pour votre comptabilité</p>
      <p class="muted" style="margin-top: 16px;">Contact : contact@gestion.com | +33 1 23 45 67 89</p>
    </div>
  `;

  openPrintWindow(html, `Bon de réception ${bonReception.reference ?? bonReception.id}`);
};
