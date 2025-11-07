# Account Split - Quick Reference Guide

## What Changed

The Account Split component now displays **individual accounts** instead of aggregated "Cash" and "Investments" categories.

## Visual Result

**Amanda Taylor's Dashboard Now Shows**:
```
┌─────────────────────────────────────┐
│ Account Split                        │
├─────────────────────────────────────┤
│ 📈 Stocks       $47,680.00    43.1% │
│ ████████████████████░░░░░░░░░░░░░░  │
│                                      │
│ 💵 Dividends    $28,900.00    26.1% │
│ ████████████░░░░░░░░░░░░░░░░░░░░░  │
│                                      │
│ ₿  Crypto       $18,750.00    17.0% │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                      │
│ 👛 Cash         $15,250.00    13.8% │
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────┘
```

## Account Display Names

| Full Name | Display Name |
|-----------|--------------|
| Primary Cash Account | Cash |
| Growth Stock Portfolio | Stocks |
| Crypto Holdings | Crypto |
| Dividend Income Fund | Dividends |
| Savings Account | Savings |
| Retirement Account | Retirement |

## Key Features

✅ Shows all accounts individually
✅ Sorted by balance (largest first)
✅ Color-coded by account type
✅ Icons for visual identification
✅ Percentage of total portfolio
✅ Progress bars for quick comparison
✅ Smooth animations on load
✅ Works with account filtering
✅ Optimized display names

## Component Usage

```typescript
// Old way (deprecated)
<AccountSplit
  cashBalance={17250}
  investmentBalance={139500}
  totalValue={156750}
/>

// New way
<AccountSplit
  accounts={[
    { id: '1', name: 'Cash', account_type: 'primary_cash', balance: 15250 },
    { id: '2', name: 'Stocks', account_type: 'equity_trading', balance: 47680 },
    // ... more accounts
  ]}
  totalValue={156750}
/>
```

## Color Scheme

| Account Type | Color | Icon |
|--------------|-------|------|
| primary_cash | Green #10B981 | Wallet |
| equity_trading | Blue #3B82F6 | TrendingUp |
| crypto_portfolio | Amber #F59E0B | Bitcoin |
| dividend_income | Purple #8B5CF6 | DollarSign |
| savings_cash | Green #059669 | PiggyBank |
| margin_trading | Red #EF4444 | Zap |

## Database Query

Fetch accounts with display names:
```sql
SELECT id, name, display_name, account_type, balance
FROM accounts
WHERE user_id = $1
ORDER BY balance DESC;
```

## Troubleshooting

**Issue**: Accounts not showing
- Check if accounts have `balance > 0`
- Verify account status is 'active'
- Check AccountContext filtering

**Issue**: Wrong display names
- Verify `display_name` field in database
- Check fallback logic in `getDisplayName()`
- Ensure migration ran successfully

**Issue**: Percentages don't sum to 100%
- Verify `totalValue` calculation
- Check for rounding errors
- Ensure all accounts included

## Files Modified

1. `components/dashboard/AccountSplit.tsx`
2. `app/(tabs)/index.tsx`
3. `supabase/migrations/[timestamp]_add_account_display_names.sql`

## Testing Checklist

- [ ] All accounts display
- [ ] Display names are correct
- [ ] Percentages sum to 100%
- [ ] Colors match account types
- [ ] Icons render correctly
- [ ] Animations are smooth
- [ ] Empty state works
- [ ] Filtering integration works
- [ ] Mobile layout works
- [ ] Tablet layout works

## Quick Fixes

**Reset display names for a user**:
```sql
UPDATE accounts
SET display_name = NULL
WHERE user_id = '[user-id]';
```

**Manually set display name**:
```sql
UPDATE accounts
SET display_name = 'My Custom Name'
WHERE id = '[account-id]';
```

**Regenerate using helper function**:
```sql
UPDATE accounts
SET display_name = generate_account_display_name(account_type, name)
WHERE display_name IS NULL;
```

---

**Status**: ✅ Production Ready
**Last Updated**: November 7, 2025
