# Dialog Components Comparison - Missing Features

## Issues Found

After comparing the deprecated `SaleDialogManager.DEPRECATED.txt` with the new modular components, several important features are MISSING:

---

## 🔴 SALE DIALOG - Missing Features

### 1. **Payment Information Display (EDIT MODE)**
**MISSING:** Enhanced payment status display with visual cards

**OLD (DEPRECATED):**
```tsx
{/* Payment Information */}
{saleDialog.sale.paid_amount !== undefined && (
  <Paper elevation={2} sx={{ p: 3, mb: 3, border: '2px solid', borderColor: ... }}>
    <Typography variant="h6">Statut des Paiements</Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <Typography variant="caption">Montant Total</Typography>
        <Typography variant="h5">{formatCurrency(total_amount)}</Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Typography variant="caption">Montant Payé</Typography>
        <Typography variant="h5">{formatCurrency(paid_amount)}</Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Typography variant="caption">Solde Restant</Typography>
        <Typography variant="h5">{formatCurrency(remaining)}</Typography>
      </Grid>
    </Grid>
  </Paper>
)}
```

**NEW:** ❌ Not implemented - only shows basic fields

### 2. **Enhanced Summary Cards (EDIT MODE)**
**MISSING:** Visual summary cards for Client, Date, Total Amount

**OLD (DEPRECATED):**
```tsx
<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
  <Paper sx={{ flex: '1 0 200px', p: 2, borderRadius: 2, ... }}>
    <Typography variant="subtitle2">Client</Typography>
    <Typography variant="body1" fontWeight="bold">{client.name}</Typography>
  </Paper>
  <Paper sx={{ flex: '1 0 140px', p: 2, borderRadius: 2, ... }}>
    <Typography variant="subtitle2">Date</Typography>
    <Typography variant="body1" fontWeight="bold">{date}</Typography>
  </Paper>
  <Paper sx={{ flex: '1 0 140px', p: 2, borderRadius: 2, ... }}>
    <Typography variant="subtitle2">Montant total</Typography>
    <Typography variant="body1" fontWeight="bold">{total}</Typography>
  </Paper>
</Box>
```

**NEW:** ❌ Shows only basic TextFields

### 3. **Enhanced Items Table Styling (EDIT MODE)**
**MISSING:** Styled table with header background

**OLD (DEPRECATED):**
```tsx
<Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid' }}>
  <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
    <Typography variant="subtitle1">Articles de la vente</Typography>
  </Box>
  {/* Table here */}
</Paper>
```

**NEW:** ❌ Basic table without styled header

---

## 🔴 INVOICE DIALOG - Missing Features

### 1. **Enhanced Autocomplete Rendering**
**MISSING:** Better option rendering with sale details

**OLD (DEPRECATED):**
```tsx
<Autocomplete
  options={(sales || []).filter((sale) => 
    sale.status === 'payment_pending' || 
    sale.status === 'confirmed' || 
    sale.status === 'completed'
  )}
  getOptionLabel={(option) => 
    `${option.reference} - ${client?.name} (${formatCurrency(option.total_amount)})`
  }
  renderOption={(props, option) => (
    <li {...props} key={`sale-${option.id}`}>
      <Box>
        <Typography variant="body1">
          {option.reference} - {client?.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Montant: {formatCurrency(total)} • Date: {date}
        </Typography>
      </Box>
    </li>
  )}
  helperText="Sélectionnez une vente confirmée ou livrée sans facture existante"
  noOptionsText="Aucune vente éligible pour facturation"
/>
```

**NEW:** ❌ Simple rendering without detailed information

### 2. **Enhanced Sale Details Display**
**MISSING:** Better visual presentation of sale details

**OLD (DEPRECATED):**
```tsx
{selectedSale && (
  <Grid item xs={12}>
    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
      <Typography variant="subtitle1" gutterBottom>Détails de la vente</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Client:</Typography>
          <Typography variant="body1">{client.name}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Date de vente:</Typography>
          <Typography variant="body1">{date}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Montant total:</Typography>
          <Typography variant="h6" color="primary">{formatCurrency(total)}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">Statut:</Typography>
          <StatusChip status={sale.status} size="small" />
        </Grid>
      </Grid>
    </Paper>
  </Grid>
)}
```

**NEW:** ❌ Very simple 2-line summary

### 3. **Icon in Dialog Title**
**MISSING:** ReceiptLong icon in dialog title

**OLD (DEPRECATED):**
```tsx
<DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
    {mode === 'edit' ? 'Modifier la facture' : 'Nouvelle facture'}
  </Box>
</DialogTitle>
```

**NEW:** ❌ Plain text title

---

## 🔴 QUOTE DIALOG - Missing Features

### 1. **Status Selection Dropdown**
**MISSING:** Quote status selection (draft, sent, accepted, rejected, expired)

**OLD (DEPRECATED):**
```tsx
<Grid item xs={12} sm={6}>
  <FormControl fullWidth>
    <InputLabel>Statut</InputLabel>
    <Select
      value={newQuoteData.status || 'draft'}
      onChange={(e) => setNewQuoteData({...newQuoteData, status: e.target.value})}
      label="Statut"
    >
      <MenuItem value="draft">Brouillon</MenuItem>
      <MenuItem value="sent">Envoyé</MenuItem>
      <MenuItem value="accepted">Accepté</MenuItem>
      <MenuItem value="rejected">Rejeté</MenuItem>
      <MenuItem value="expired">Expiré</MenuItem>
    </Select>
  </FormControl>
</Grid>
```

**NEW:** ❌ Not implemented - status always defaults to 'draft'

### 2. **Quote Validity Display**
**MISSING:** Calculated days remaining field

**OLD (DEPRECATED):**
```tsx
<Grid item xs={12} sm={6}>
  <TextField
    label="Validité du devis"
    value={
      newQuoteData.expiry_date 
        ? `${Math.max(0, Math.ceil((new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24)))} jours`
        : '30 jours'
    }
    fullWidth
    disabled
    helperText="Jours restants de validité"
  />
</Grid>
```

**NEW:** ❌ Not shown

### 3. **Enhanced Product Display in Table**
**MISSING:** Product reference in table, better formatting

**OLD (DEPRECATED):**
```tsx
<TableCell>
  <Box>
    <Typography variant="body2">{item.product.name}</Typography>
    <Typography variant="caption" color="text.secondary">
      Réf: {item.product.reference}
    </Typography>
  </Box>
</TableCell>
```

**NEW:** ❌ Only shows product name

### 4. **Enhanced Product Autocomplete**
**MISSING:** Shows price and stock in options

**OLD (DEPRECATED):**
```tsx
<Autocomplete
  options={productsWithStock || []}
  getOptionLabel={(option) => `${option.name} (Stock: ${stock})`}
  renderOption={(props, option) => (
    <li {...props} key={`product-${option.id}`}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="body1">{option.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          Prix: {formatCurrency(selling_price)} • Stock: {stock}
        </Typography>
      </Box>
    </li>
  )}
/>
```

**NEW:** ✅ Partially implemented (has price but not as detailed)

### 5. **Icon in Dialog Title**
**MISSING:** ReceiptLong icon

**OLD (DEPRECATED):**
```tsx
<DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <ReceiptLong sx={{ mr: 1, color: 'primary.main' }} />
    {mode === 'edit' ? 'Modifier le devis' : 'Nouveau devis'}
  </Box>
</DialogTitle>
```

**NEW:** ❌ Plain text title

### 6. **Expiry Date Helper Text**
**MISSING:** Helper text on expiry date field

**OLD (DEPRECATED):**
```tsx
<TextField
  label="Date d'expiration"
  type="date"
  helperText="Date limite de validité du devis"
  // ...
/>
```

**NEW:** ❌ No helper text

---

## Summary of Missing Features

### SaleDialog
- ❌ Payment information cards (total, paid, remaining)
- ❌ Enhanced summary cards for client/date/total
- ❌ Styled items table header

### InvoiceDialog
- ❌ Enhanced sale autocomplete with detailed rendering
- ❌ Enhanced sale details Paper with grid layout
- ❌ ReceiptLong icon in title
- ❌ Helper text and noOptionsText
- ❌ StatusChip in sale details

### QuoteDialog
- ❌ Status dropdown (draft/sent/accepted/rejected/expired)
- ❌ Validity calculator field
- ❌ Product reference in items table
- ❌ Enhanced product autocomplete with detailed rendering
- ❌ ReceiptLong icon in title
- ❌ Expiry date helper text

---

## Action Required

Need to update all three dialog components to restore these missing UI/UX enhancements from the original implementation.
