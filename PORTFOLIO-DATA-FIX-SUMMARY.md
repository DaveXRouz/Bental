# Portfolio Data Fix Summary

## Problem Identified

The Account Split and Asset Allocation components were displaying incorrect and inconsistent data due to fundamental calculation errors in how portfolio values were being aggregated.

### Root Causes

**1. Incorrect Cash vs Investment Classification**

The original code classified ALL account balances as "cash":
- Primary cash accounts: Correctly counted as cash ✓
- Equity trading accounts with $45,680 balance: Incorrectly counted as "cash" ✗
- Crypto portfolio accounts with $18,750 balance: Incorrectly counted as "cash" ✗
- Dividend income accounts with $28,900 balance: Incorrectly counted as "cash" ✗

**Example for Amanda Taylor:**
- **What was shown**: Cash = $108,580 (ALL account balances)
- **What should be shown**: Cash = $15,250 (only primary_cash accounts)

**2. Missing Investment Account Cash**

The system only counted holdings market value as "investments", completely ignoring the cash balances sitting in investment accounts:
- Holdings market value: $46,110.57 ✓
- Cash in equity accounts: $74,580 **← MISSING**
- Cash in crypto accounts: $18,750 **← MISSING**

**3. Fake Asset Allocation Data**

The dashboard was creating completely artificial asset breakdowns using hardcoded percentages:

```typescript
// OLD (WRONG) CODE
{
  label: 'Equities',
  value: investmentBalance * 0.7,  // 70% of total
  ...
},
{
  label: 'Crypto',
  value: investmentBalance * 0.2,  // 20% of total
  ...
},
{
  label: 'Bonds',
  value: investmentBalance * 0.1,  // 10% of total
  ...
}
```

This meant:
- If user had ZERO crypto, it showed 20% crypto allocation
- If user had 100% crypto, it still showed only 20% crypto
- Bonds were shown even if user owned none
- Actual asset types from holdings were completely ignored

## Solution Implemented

### 1. Created New Portfolio Aggregation Service

**File**: `/services/portfolio/portfolio-aggregation-service.ts`

This service properly categorizes accounts and holdings:

```typescript
// Define account type categories
const cashAccountTypes = ['primary_cash', 'savings_cash', 'trading_cash'];
const equityAccountTypes = ['equity_trading', 'dividend_income', 'margin_trading'];
const cryptoAccountTypes = ['crypto_portfolio'];

// Calculate TRUE cash (only from cash accounts)
const cashAccountsTotal = accounts
  .filter(a => cashAccountTypes.includes(a.account_type))
  .reduce((sum, a) => sum + Number(a.balance), 0);

// Calculate holdings by ACTUAL asset type
const stockHoldingsTotal = holdings
  .filter(h => h.asset_type === 'stock')
  .reduce((sum, h) => sum + Number(h.market_value), 0);

const cryptoHoldingsTotal = holdings
  .filter(h => h.asset_type === 'crypto')
  .reduce((sum, h) => sum + Number(h.market_value), 0);

// Stocks = holdings + uninvested cash in equity accounts
stocks: stockHoldingsTotal + equityAccountsTotal,

// Crypto = holdings + uninvested cash in crypto accounts
crypto: cryptoHoldingsTotal + cryptoAccountsTotal,
```

### 2. Updated Portfolio Calculator

**File**: `/services/portfolio/portfolio-calculator.ts`

Fixed the core metric calculations:

```typescript
// Only count true cash accounts as "cash"
const cashAccountTypes = ['primary_cash', 'savings_cash', 'trading_cash'];
const cashBalance = accounts
  .filter(a => cashAccountTypes.includes(a.account_type))
  .reduce((sum, acc) => sum + Number(acc.balance), 0);

// Investment balance = holdings + uninvested cash in investment accounts
const investmentAccountTypes = ['equity_trading', 'dividend_income', 'margin_trading', 'crypto_portfolio', 'retirement_fund'];
const investmentCash = accounts
  .filter(a => investmentAccountTypes.includes(a.account_type))
  .reduce((sum, acc) => sum + Number(acc.balance), 0);

const holdingsValue = holdings.reduce((sum, h) => sum + Number(h.market_value), 0);
const investmentBalance = holdingsValue + investmentCash;
```

### 3. Fixed Dashboard to Use Real Data

**File**: `/app/(tabs)/index.tsx`

Removed fake percentage-based allocations and replaced with actual data:

```typescript
// OLD (FAKE) CODE - REMOVED
const assetAllocations = useMemo(() => [
  {
    label: 'Equities',
    value: investmentBalance * 0.7,  // FAKE
    ...
  },
  ...
], [cashBalance, investmentBalance, netWorth]);

// NEW (REAL) CODE - ADDED
const allocations = await portfolioAggregationService.getAssetAllocation(user.id);
setAssetAllocations(allocations);
```

## Example: Amanda Taylor's Corrected Portfolio

### Database Reality

**Accounts:**
- Primary Cash Account: $15,250
- Equity Trading Account: $45,680 (uninvested)
- Crypto Portfolio Account: $18,750 (uninvested)
- Dividend Income Account: $28,900 (uninvested)

**Holdings:**
- TSLA Stock: $8,495.20
- META Stock: $12,165.25
- BTC Crypto: $16,808.57
- ETH Crypto: $8,641.55

### OLD (WRONG) Display

**Account Split:**
- Cash: $108,580 (70.2%)
- Investments: $46,110.57 (29.8%)

**Asset Allocation:**
- Cash: $108,580 (70.2%)
- Equities: $32,277.40 (20.9%) ← 70% of investments (FAKE)
- Crypto: $9,222.11 (6.0%) ← 20% of investments (FAKE)
- Bonds: $4,611.06 (3.0%) ← 10% of investments (FAKE)

**Total**: $154,690.57

### NEW (CORRECT) Display

**Account Split:**
- Cash: $15,250 (10.0%)
- Investments: $139,441.02 (90.0%)

**Asset Allocation:**
- Cash: $15,250 (10.0%)
- Stocks: $95,240.45 (61.6%) ← holdings $20,660.45 + account cash $74,580
- Crypto: $44,200.12 (28.6%) ← holdings $25,450.12 + account cash $18,750
- Bonds: $0 (0%) ← user has no bonds

**Total**: $154,690.57 ✓

## Key Improvements

✅ **Accurate Cash Balance**: Only counts true liquid cash accounts, not all account balances

✅ **Proper Investment Tracking**: Includes both holdings AND uninvested cash in investment accounts

✅ **Real Asset Types**: Uses actual `asset_type` field from holdings table (stock, crypto, bond)

✅ **Account Type Classification**: Properly categorizes accounts using `account_type` field

✅ **No Fake Data**: Removed all hardcoded percentage-based calculations

✅ **Proper Aggregation**: Single source of truth for portfolio metrics

✅ **Extensible**: Easy to add new account types or asset types in the future

## Technical Details

### Account Type Categories

**Cash Accounts** (liquid cash):
- `primary_cash` - Main checking/spending account
- `savings_cash` - High-yield savings
- `trading_cash` - Cash reserved for trading

**Investment Accounts** (counted as investments):
- `equity_trading` - Stock trading account
- `dividend_income` - Dividend-focused portfolio
- `margin_trading` - Leveraged trading account
- `crypto_portfolio` - Cryptocurrency account
- `retirement_fund` - Retirement accounts (IRA, 401k)

**Legacy Account Types** (fallback for older data):
- `demo_cash` - Demo account cash
- `live_cash` - Live trading cash
- `demo_crypto` - Demo crypto account
- `demo_equity` - Demo equity account
- `live_equity` - Live equity account

### Asset Type Classification

Holdings are categorized by their `asset_type` field:
- `stock` - Equities, ETFs, stock securities
- `crypto` - Cryptocurrencies, tokens
- `bond` - Fixed income securities
- Other types can be added as needed

### Database Schema

The fix relies on proper database schema:

**accounts table**:
- `account_type` TEXT - Categorizes the account purpose
- `balance` DECIMAL - Cash balance in the account
- `status` TEXT - Active/frozen/closed status

**holdings table**:
- `asset_type` TEXT - Type of asset (stock, crypto, bond)
- `market_value` DECIMAL - Current market value
- `unrealized_pnl` DECIMAL - Profit/loss
- `account_id` UUID - Links to parent account

## Files Changed

1. **NEW**: `/services/portfolio/portfolio-aggregation-service.ts`
   - Complete portfolio aggregation logic
   - Asset allocation calculation
   - Proper account categorization

2. **MODIFIED**: `/services/portfolio/portfolio-calculator.ts`
   - Fixed cashBalance calculation (only cash accounts)
   - Fixed investmentBalance calculation (holdings + investment account cash)
   - Uses account_type for proper filtering

3. **MODIFIED**: `/app/(tabs)/index.tsx`
   - Removed fake percentage-based allocations
   - Integrated portfolioAggregationService
   - Now fetches real asset allocation data

## Testing Verification

To verify the fix works correctly:

1. **Check Account Split**:
   - Should show only true cash accounts in "Cash"
   - Should show holdings + investment account cash in "Investments"

2. **Check Asset Allocation Donut**:
   - Should show actual breakdown by asset type
   - Should NOT show bonds if user owns no bonds
   - Should reflect real crypto percentage
   - Percentages should add up to 100%

3. **Verify Numbers**:
   - Total = Cash + Stocks + Crypto + Bonds + Other
   - Stocks = Stock holdings + Equity account balances
   - Crypto = Crypto holdings + Crypto account balances
   - No artificial percentage-based calculations

## Future Enhancements

- Add real-time price updates for holdings
- Implement performance tracking by asset type
- Add historical allocation charts
- Create rebalancing recommendations
- Support for more asset types (commodities, real estate, etc.)
- Tax lot tracking for capital gains calculations

## Migration Notes

This fix is **backward compatible** and requires **no database migration**. It simply uses existing database fields (`account_type`, `asset_type`) that were already populated but not being used correctly.

All existing accounts and holdings will immediately display correctly with this fix.
