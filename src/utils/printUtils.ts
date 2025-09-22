// src/utils/printUtils.ts
export type Facture = {
  id: number | string;
  reference?: string;
  date?: string;
  amount?: number | string;
  paid_amount?: number | string;
  balance?: number | string;
  statut?: string;
};

export type Devis = {
  id: number | string;
  reference?: string;
  date?: string;
  client?: string;
  total_amount?: number | string;
  status?: string;
};

export type Paiement = {
  id: number | string;
  date?: string;
  amount?: number | string;
  method?: string;
  description?: string;
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

const formatCurrency = (value: number | string | null | undefined, locale = 'fr-FR', currency = 'EUR') => {
  const n = toNumber(value);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
};

const formatDate = (d?: string | Date | null) => {
  if (!d) return '-';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleDateString('fr-FR');
};

/* -------------------- Print window opener -------------------- */

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
          body { font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; background: #f4f6f8; padding: 32px; color: #222; }
          .paper { max-width: 800px; margin: 0 auto; background: #fff; padding: 28px; border-radius: 8px; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08); }
          .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 18px; }
          .brand { display:flex; gap:12px; align-items:center; }
          .logo { width:56px; height:56px; border-radius:6px; background: linear-gradient(135deg,#1976d2, #42a5f5); display:inline-flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:18px; }
          .company { font-size:14px; color:#333; }
          h1 { margin:0; font-size:18px; color:#0b2560; }
          .meta { text-align:right; font-size:12px; color:#666; }
          .section { margin-top: 14px; }
          table { width:100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align:left; font-size:13px; color:#444; padding:10px 12px; background:#fafafa; border-bottom: 1px solid #eee; }
          td { padding:10px 12px; border-bottom: 1px solid #f1f1f1; font-size:13px; color:#222; vertical-align: top; }
          .line-items th, .line-items td { text-align:left; }
          .totals td { padding: 12px; }
          .total-value { font-weight:700; color: #d32f2f; }
          .muted { color:#777; font-size:12px; }
          .footer { margin-top:24px; text-align:center; font-size:12px; color:#777; }
          @media print {
            body { background: #fff; padding: 0; }
            .paper { box-shadow: none; border-radius: 0; padding: 0; }
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

  const html = `
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div style="font-weight:700">Gestion</div>
          <div class="muted">Adresse • Téléphone • email@exemple.com</div>
        </div>
      </div>
      <div class="meta">
        <div>Facture: <strong>#${facture.reference ?? facture.id}</strong></div>
        <div>Date: ${formatDate(facture.date)}</div>
      </div>
    </div>

    <h1>Facture ${facture.reference ?? facture.id}</h1>

    <div class="section">
      <table>
        <tr><th>Montant total</th><td>${formatCurrency(amount)}</td></tr>
        <tr><th>Payé</th><td>${formatCurrency(paid)}</td></tr>
        <tr><th>Solde</th><td class="total-value">${formatCurrency(balance)}</td></tr>
        <tr><th>Statut</th><td>${facture.statut ?? '-'}</td></tr>
      </table>
    </div>

    <div class="footer">
      Document généré automatiquement — ${new Date().toLocaleString('fr-FR')}
    </div>
  `;

  openPrintWindow(html, `Facture ${facture.reference ?? facture.id}`);
};

export const printDevis = (devis: Devis) => {
  const total = toNumber(devis.total_amount);

  const html = `
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div style="font-weight:700">Gestion</div>
          <div class="muted">Adresse • Téléphone • email@exemple.com</div>
        </div>
      </div>
      <div class="meta">
        <div>Devis: <strong>#${devis.reference ?? devis.id}</strong></div>
        <div>Date: ${formatDate(devis.date)}</div>
      </div>
    </div>

    <h1>Devis ${devis.reference ?? devis.id}</h1>

    <div class="section">
      <table>
        <tr><th>Client</th><td>${devis.client ?? '-'}</td></tr>
        <tr><th>Montant estimé</th><td class="total-value">${formatCurrency(total)}</td></tr>
        <tr><th>Statut</th><td>${devis.status ?? '-'}</td></tr>
      </table>
    </div>

    <div class="footer">
      Document généré automatiquement — ${new Date().toLocaleString('fr-FR')}
    </div>
  `;

  openPrintWindow(html, `Devis ${devis.reference ?? devis.id}`);
};

export const printPaiementReceipt = (paiement: Paiement) => {
  const amount = toNumber(paiement.amount);

  const html = `
    <div class="header">
      <div class="brand">
        <div class="logo">G</div>
        <div class="company">
          <div style="font-weight:700">Gestion</div>
          <div class="muted">Adresse • Téléphone • email@exemple.com</div>
        </div>
      </div>
      <div class="meta">
        <div>Reçu: <strong>#${paiement.id}</strong></div>
        <div>Date: ${formatDate(paiement.date)}</div>
      </div>
    </div>

    <h1>Reçu de paiement</h1>

    <div class="section">
      <table>
        <tr><th>Montant</th><td class="total-value">${formatCurrency(amount)}</td></tr>
        <tr><th>Méthode</th><td>${paiement.method ?? '-'}</td></tr>
        ${paiement.description ? `<tr><th>Description</th><td>${paiement.description}</td></tr>` : ''}
      </table>
    </div>

    <div class="footer">
      Document généré automatiquement — ${new Date().toLocaleString('fr-FR')}
    </div>
  `;

  openPrintWindow(html, `Paiement ${paiement.id}`);
};
