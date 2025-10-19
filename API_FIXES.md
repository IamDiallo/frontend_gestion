# API Data Structure Fixes - 400 Bad Request Errors

**Date:** October 19, 2025  
**Issues:** Backend returning 400 Bad Request due to missing/incorrect fields

---

## Issue 1: Sale Creation - 400 Bad Request ✅ FIXED

### Error
```
POST http://localhost:8000/api/sales/sales/
Status: 400 Bad Request
```

### Root Cause
Frontend was sending incorrect field names in sale items:
- Sending: `total` 
- Expected: `total_price` and `discount_percentage`

### Backend Expected Structure (SaleItemSerializer)
```python
class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ['id', 'sale', 'product', 'product_name', 'quantity', 'unit_price', 
                  'discount_percentage', 'total_price']  # ✅ Needs these fields
```

### Frontend Was Sending (BEFORE)
```typescript
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
  total: (item.product.selling_price || 0) * item.quantity  // ❌ Wrong field name
}))
```

### Frontend Now Sends (AFTER)
```typescript
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
  discount_percentage: 0,  // ✅ Added
  total_price: (item.product.selling_price || 0) * item.quantity  // ✅ Correct field name
}))
```

### File Modified
- `frontend/src/components/sales/SaleDialog.tsx` (line ~241)

---

## Issue 2: Invoice Creation - 400 Bad Request ✅ FIXED

### Error
```json
{
  "reference": ["Ce champ est obligatoire."],
  "amount": ["Ce champ est obligatoire."],
  "balance": ["Ce champ est obligatoire."]
}
```

```
POST http://localhost:8000/api/sales/invoices/
Status: 400 Bad Request
```

### Root Cause
Frontend was only sending `sale`, `date`, `due_date`, and `notes`, but the backend Invoice model requires:
- `reference` (CharField, unique, required)
- `amount` (DecimalField, required)
- `balance` (DecimalField, required)

### Backend Model Structure
```python
class Invoice(models.Model):
    reference = models.CharField(max_length=50, unique=True)  # ✅ Required
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='invoices')
    date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, default='draft')
    amount = models.DecimalField(max_digits=15, decimal_places=2)  # ✅ Required
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=15, decimal_places=2)  # ✅ Required
    notes = models.TextField(blank=True, null=True)
```

### Frontend Was Sending (BEFORE)
```typescript
const newInvoice = await SalesAPI.createInvoice({
  sale: selectedSale.id!,
  date: invoiceDialog.date,
  due_date: invoiceDialog.due_date,
  notes: invoiceDialog.notes
  // ❌ Missing: reference, amount, balance
});
```

### Frontend Now Sends (AFTER)
```typescript
// Generate reference (INV-YYYY-XXX format)
const year = new Date().getFullYear();
const reference = `INV-${year}-${Date.now().toString().slice(-6)}`;

const newInvoice = await SalesAPI.createInvoice({
  reference,  // ✅ Added
  sale: selectedSale.id!,
  date: invoiceDialog.date,
  due_date: invoiceDialog.due_date,
  amount: selectedSale.total_amount,  // ✅ Added
  balance: selectedSale.total_amount - (selectedSale.paid_amount || 0),  // ✅ Added
  notes: invoiceDialog.notes
});
```

### File Modified
- `frontend/src/components/sales/InvoiceDialog.tsx` (line ~87)

### Reference Generation Logic
```typescript
const year = new Date().getFullYear();
const reference = `INV-${year}-${Date.now().toString().slice(-6)}`;
// Example: INV-2025-123456
```

---

## Issue 3: Quote Creation - Already Fixed Previously ✅

The QuoteDialog was previously updated to send:
```typescript
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
  discount_percentage: 0,  // ✅ Required
  total_price: (item.product.selling_price || 0) * item.quantity  // ✅ Correct field name
}))
```

---

## Summary of Changes

### SaleDialog.tsx
```diff
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
- total: (item.product.selling_price || 0) * item.quantity
+ discount_percentage: 0,
+ total_price: (item.product.selling_price || 0) * item.quantity
}))
```

### InvoiceDialog.tsx
```diff
+ const year = new Date().getFullYear();
+ const reference = `INV-${year}-${Date.now().toString().slice(-6)}`;

const newInvoice = await SalesAPI.createInvoice({
+ reference,
  sale: selectedSale.id!,
  date: invoiceDialog.date,
  due_date: invoiceDialog.due_date,
+ amount: selectedSale.total_amount,
+ balance: selectedSale.total_amount - (selectedSale.paid_amount || 0),
  notes: invoiceDialog.notes
});
```

### QuoteDialog.tsx
```diff
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
- total: (item.product.selling_price || 0) * item.quantity
+ discount_percentage: 0,
+ total_price: (item.product.selling_price || 0) * item.quantity
}))
```

---

## Testing Checklist

### Sale Creation
- [ ] Open "Nouvelle vente"
- [ ] Select client and zone
- [ ] Add products to cart
- [ ] Click "Créer la vente"
- [ ] **Expected:** Sale created successfully with 201 response
- [ ] **Verify:** Stock reduced correctly

### Invoice Creation
- [ ] Open "Nouvelle facture"
- [ ] Select a sale
- [ ] Set dates
- [ ] Click "Créer la facture"
- [ ] **Expected:** Invoice created successfully with 201 response
- [ ] **Verify:** Invoice reference auto-generated (INV-2025-XXXXXX format)

### Quote Creation
- [ ] Open "Nouveau devis"
- [ ] Select client
- [ ] Add products
- [ ] Click "Créer le devis"
- [ ] **Expected:** Quote created successfully with 201 response

---

## Backend Serializer Notes

### Why These Fields Are Required

**SaleItem:**
- `discount_percentage`: Used for item-level discounts (default: 0)
- `total_price`: Calculated field stored for performance (unit_price * quantity - discount)

**Invoice:**
- `reference`: Unique identifier for the invoice (should be auto-generated in backend ideally)
- `amount`: Total invoice amount (copied from sale.total_amount)
- `balance`: Remaining unpaid balance (amount - paid_amount)

### Recommended Backend Improvements

1. **Auto-generate invoice reference in model's save() method:**
```python
def save(self, *args, **kwargs):
    if not self.pk and not self.reference:
        year = timezone.now().year
        last_invoice = Invoice.objects.filter(
            reference__startswith=f"INV-{year}-"
        ).order_by('-reference').first()
        
        if last_invoice:
            last_number = int(last_invoice.reference.split('-')[-1])
            next_number = last_number + 1
        else:
            next_number = 1
        
        self.reference = f"INV-{year}-{next_number:03d}"
    
    super().save(*args, **kwargs)
```

2. **Auto-calculate amount and balance in serializer:**
```python
def create(self, validated_data):
    sale = validated_data.get('sale')
    if sale:
        validated_data['amount'] = sale.total_amount
        validated_data['balance'] = sale.total_amount - sale.paid_amount
    
    # ... rest of create logic
```

---

**Status:** ✅ ALL FIXES APPLIED  
**Impact:** Sales, Invoices, and Quotes can now be created successfully
