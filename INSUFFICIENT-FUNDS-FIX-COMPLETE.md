# Insufficient Funds/Holdings Issue - Fix Complete

## Issue Summary

Users were experiencing "insufficient funds" errors when trying to sell the full available amount of their holdings (e.g., BTC). The error occurred even when the displayed available quantity matched what they were trying to sell.

## Root Cause

The system was **not accounting for pending sell orders** when calculating available quantities:

1. **Holdings display** showed total quantity from the database (e.g., 1.5 BTC)
2. **User tried to sell** the full amount shown
3. **Validation failed** because some quantity was already locked in pending sell orders (e.g., 0.5 BTC pending)
4. **Actual available** was less than shown (only 1.0 BTC truly available)

The core problem: `available_quantity = total_holdings - locked_in_pending_orders` was not being calculated anywhere in the system.

## Solution Implemented

### 1. Database Layer ✅

**Created new functions:**

- `get_available_quantity(account_id, symbol, asset_type)` - Calculates available quantity by subtracting locked quantities from pending orders
- `get_holdings_with_availability(account_id)` - Returns holdings with total, locked, and available quantities
- Updated `create_pending_sell_order` to check available quantity instead of total quantity

**Migration file:** `20251108040000_add_available_quantity_calculation.sql`

Key improvements:
- Validates against available quantity (not just total)
- Returns detailed error info (total, available, locked, requested)
- Considers only 'pending' and 'under_review' status orders as locked
- Ensures non-negative available quantities

### 2. Service Layer ✅

**Updated `portfolio-operations-service.ts`:**

- Modified `checkSufficientHoldings` to use the new `get_available_quantity` RPC function
- Now returns: `{ sufficient, available, total, locked }`
- Added new `getHoldingsWithAvailability` function for easy access to availability info

### 3. Frontend - Holdings Display ✅

**Updated `HoldingsView.tsx`:**

- Now fetches holdings using `getHoldingsWithAvailability` service function
- Displays available quantity when holdings are partially locked
- Shows visual indicator: "1.5 shares (1.0 available)" when locked quantity exists
- Passes correct available quantity (not total) to TradingModal
- Uses warning color for locked quantity badge

### 4. Frontend - Trading Modal ✅

**Updated `TradingModal.tsx`:**

- Added props: `totalQuantity`, `lockedQuantity`
- Shows locked quantity information in the "Available to Sell" card
- Improved validation with floating-point precision handling (epsilon comparison)
- Better error messages that explain locked quantities
- Visual indicators with AlertCircle icons for locked holdings

### 5. Hooks - Error Handling ✅

**Updated `usePortfolioOperations.ts`:**

- Enhanced error messages to include locked quantity information
- Clear messaging: "Insufficient available holdings. Required: X, Available: Y, Z locked in pending orders"

## Technical Details

### Floating Point Precision

Added epsilon comparison for quantity validation:
```typescript
const hasEnoughShares = !isBuy ? quantityValue <= availableQuantity + 0.00000001 : true;
```

This prevents false negatives when comparing decimal quantities.

### Database Function Logic

```sql
-- Calculates: total - locked = available
v_available_quantity := v_total_quantity - v_locked_quantity;

-- Locked includes only active pending orders
WHERE status IN ('pending', 'under_review')
```

### RLS and Security

All functions use `SECURITY DEFINER` with proper `search_path = public` and authentication checks via `auth.uid()`.

## User Experience Improvements

### Before Fix
- User sees: "1.5 BTC"
- User tries to sell: 1.5 BTC
- Error: "Insufficient funds" (confusing!)

### After Fix
- User sees: "1.5 BTC (1.0 available)" with warning badge
- User can only sell: 1.0 BTC (modal shows max available)
- If trying to sell more: Clear error explaining "0.5 locked in pending orders"
- Trading modal shows: "Available: 1.0 BTC" with info icon showing "0.5 locked in pending orders"

## Files Modified

1. `/supabase/migrations/20251108040000_add_available_quantity_calculation.sql` (NEW)
2. `/services/portfolio/portfolio-operations-service.ts`
3. `/components/portfolio/HoldingsView.tsx`
4. `/components/modals/TradingModal.tsx`
5. `/hooks/usePortfolioOperations.ts`

## Testing Scenarios

The fix handles these scenarios correctly:

1. ✅ **No pending orders** - Full quantity available, sells work normally
2. ✅ **Partial pending orders** - Shows and allows only available amount
3. ✅ **Multiple pending orders** - Correctly sums all locked quantities
4. ✅ **Exact available amount** - Can sell exactly what's available (epsilon handling)
5. ✅ **All quantity locked** - Shows 0 available, prevents selling
6. ✅ **Cross-account holdings** - Each account's availability calculated separately
7. ✅ **Order approval/rejection** - Quantities unlock when orders are processed

## Visual Changes

- Holdings cards show locked quantity badge in warning color
- Trading modal displays locked info with icon
- Error messages are clear and actionable
- No confusing "insufficient funds" for actually available amounts

## Database Migration Status

✅ Migration applied successfully to production database
✅ Functions created: `get_available_quantity`, `get_holdings_with_availability`
✅ Existing function updated: `create_pending_sell_order`

## Performance Considerations

- Functions use efficient queries with proper indexes
- No N+1 query issues (batch loading for multiple accounts)
- Locked quantity calculated on-demand (not stored, prevents stale data)
- COALESCE used to handle cases with no pending orders efficiently

## Backward Compatibility

✅ All existing functionality preserved
✅ No breaking changes to existing APIs
✅ Enhanced data returned (additional fields: locked, total)
✅ Old code continues to work (graceful degradation)

## Edge Cases Handled

1. **No holdings** - Returns 0 available
2. **Negative available** (shouldn't happen) - Clamped to 0
3. **Cancelled orders** - Not counted as locked
4. **Approved/rejected orders** - Not counted as locked
5. **Expired orders** - Not counted as locked
6. **Floating point comparison** - Uses epsilon for exact matches

## Summary

The insufficient funds issue has been completely resolved. Users can now:

- See exactly how much they can sell (available quantity)
- Understand why they can't sell more (locked in pending orders)
- Successfully sell their full available amount without errors
- Get clear, actionable error messages if they try to exceed available

The fix is production-ready and has been deployed to the database successfully.
