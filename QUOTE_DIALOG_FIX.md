# Quote Dialog - Products List Fix

**Date:** October 19, 2025  
**Issue:** Quote dialog was missing products list - couldn't select products when creating a quote

## Problem

After the refactoring of `SaleDialogManager` into modular components, the `QuoteDialog` was created but was missing:
1. **Products list** - The `productsWithStock` prop was not passed from `SalesDialogs` to `QuoteDialog`
2. **Product selection** - The Autocomplete had an empty array `[]` instead of actual products

## Root Cause

When creating the modular `QuoteDialog.tsx` component, the `productsWithStock` prop was:
- Not included in the `QuoteDialogProps` interface
- Not passed from `SalesDialogs.tsx` to `QuoteDialog`
- Not used in the product Autocomplete (had hardcoded empty array)

## Solution

### 1. Updated QuoteDialogProps Interface

**File:** `frontend/src/components/sales/QuoteDialog.tsx`

```tsx
interface QuoteDialogProps {
  // ... existing props
  productsWithStock: Product[];  // ✅ ADDED
  // ... rest of props
}
```

### 2. Updated SalesDialogs to Pass Products

**File:** `frontend/src/components/sales/SalesDialogs.tsx`

```tsx
<QuoteDialog
  // ... existing props
  productsWithStock={productsWithStock}  // ✅ ADDED
  // ... rest of props
/>
```

### 3. Fixed Product Autocomplete

**File:** `frontend/src/components/sales/QuoteDialog.tsx`

**BEFORE:**
```tsx
<Autocomplete
  options={[]} // ❌ Empty array - no products!
  getOptionLabel={(option: Product) => option.name}
  // ...
/>
```

**AFTER:**
```tsx
<Autocomplete
  options={productsWithStock || []}  // ✅ Actual products
  getOptionLabel={(option: Product) => `${option.name} (Prix: ${formatCurrency(option.selling_price)})`}
  renderOption={(props, option) => (
    <li {...props} key={`product-${option.id}`}>
      {option.name} - Prix: {formatCurrency(option.selling_price)}
    </li>
  )}
  // ...
/>
```

### 4. Fixed Quote Items Structure

The quote items were missing required fields `discount_percentage` and `total_price`:

**BEFORE:**
```tsx
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
  total: (item.product.selling_price || 0) * item.quantity  // ❌ Wrong field name
}))
```

**AFTER:**
```tsx
items: selectedProducts.map(item => ({
  product: item.product.id!,
  quantity: item.quantity,
  unit_price: item.product.selling_price || 0,
  discount_percentage: 0,  // ✅ Added
  total_price: (item.product.selling_price || 0) * item.quantity  // ✅ Correct field name
}))
```

## Important Note: Zone Field

**Quotes DO NOT require a `zone` field** - this is correct behavior!

- ✅ **Sales** (ventes) require a zone → has `zone` FK in backend model
- ❌ **Quotes** (devis) do NOT require a zone → no `zone` field in backend model

The Quote model only requires:
- `client` (required)
- `date` (required)
- `expiry_date` (required)
- `status` (default: 'draft')
- `items` (products with quantities and prices)
- `notes` (optional)

The zone is only needed when converting a quote to a sale, not when creating the quote itself.

## Testing

To verify the fix works:

1. Go to Sales page
2. Click "Nouveau devis" (New Quote)
3. Select a client
4. **Verify:** Products list should now display in the Autocomplete
5. Select a product and quantity
6. Click "Ajouter" to add to cart
7. Add multiple products if desired
8. Click "Créer le devis"
9. **Expected:** Quote should be created successfully

## Related Files

- `frontend/src/components/sales/QuoteDialog.tsx` - Fixed component
- `frontend/src/components/sales/SalesDialogs.tsx` - Updated to pass products
- `backend/apps/sales/models.py` - Quote model (for reference)

## Impact

- **Before:** Users couldn't select any products when creating quotes
- **After:** Users can search and select from available products with pricing info

---

**Status:** ✅ FIXED  
**Tested:** Pending user verification
