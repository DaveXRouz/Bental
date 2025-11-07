# Account Selection System - Quick Start Guide

## 🚀 TL;DR - It's Already Working!

The multi-account selection system is **fully implemented and operational**. Here's how to use it:

---

## For End Users

### How to Filter Your Dashboard by Account

1. **Open the app and navigate to the Dashboard** (Home tab)

2. **Look for the account selector** in the header:
   ```
   🔍 All Accounts
      $125,458.32
      ▼
   ```

3. **Tap the selector** to open the account list modal

4. **Choose your view:**
   - **"All Accounts"** (top option) - See your complete portfolio
   - **Single account** - Filter to one specific account
   - **Multiple accounts** - Select 2+ accounts to compare

5. **Tap "Done"** when finished selecting

6. **Dashboard updates instantly** with filtered data:
   - Balance shown for selected accounts only
   - Charts and metrics filtered
   - Performance calculated for selection

7. **Your selection persists** - Next time you open the app, same accounts will be selected

---

## For Developers

### Quick Implementation Examples

#### 1. Use Account Selection in Any Component

```typescript
import { useAccountContext } from '@/contexts/AccountContext';

function MyComponent() {
  const { selectedAccounts, isAllAccountsSelected } = useAccountContext();

  return (
    <View>
      {isAllAccountsSelected ? (
        <Text>Viewing all {selectedAccounts.length} accounts</Text>
      ) : (
        <Text>Viewing {selectedAccounts.length} selected accounts</Text>
      )}
    </View>
  );
}
```

#### 2. Get Filtered Portfolio Metrics

```typescript
import { useFilteredPortfolioMetrics } from '@/hooks/useFilteredPortfolioMetrics';
import { useAccountContext } from '@/contexts/AccountContext';

function PortfolioCard() {
  const { selectedAccountIds } = useAccountContext();
  const { metrics, loading } = useFilteredPortfolioMetrics(selectedAccountIds);

  if (loading) return <Spinner />;

  return (
    <View>
      <Text>Total: ${metrics.totalValue.toLocaleString()}</Text>
      <Text>Today: {metrics.todayChangePercent}%</Text>
    </View>
  );
}
```

#### 3. Add Account Selector to Your Screen

```typescript
import { DashboardAccountSelector } from '@/components/ui/DashboardAccountSelector';

function AnalyticsScreen() {
  return (
    <View>
      <DashboardAccountSelector />
      {/* Your content */}
    </View>
  );
}
```

#### 4. Manipulate Selection Programmatically

```typescript
import { useAccountContext } from '@/contexts/AccountContext';

function AccountManager() {
  const { selectAccount, deselectAccount, selectAllAccounts } = useAccountContext();

  return (
    <View>
      <Button onPress={() => selectAccount('account-id-123')}>
        Select Account
      </Button>
      <Button onPress={() => selectAllAccounts()}>
        View All Accounts
      </Button>
    </View>
  );
}
```

---

## Files Reference

### Core Implementation Files

| File | Purpose |
|------|---------|
| `contexts/AccountContext.tsx` | Global state management |
| `hooks/useFilteredPortfolioMetrics.ts` | Filtered calculations |
| `components/ui/DashboardAccountSelector.tsx` | UI component |
| `services/portfolio/portfolio-aggregation-service.ts` | Database queries |
| `app/(tabs)/index.tsx` | Dashboard integration |
| `app/_layout.tsx` | Provider setup |

### Documentation Files

| File | Content |
|------|---------|
| `ACCOUNT-SELECTION-COMPLETE.md` | Complete implementation guide |
| `ACCOUNT-SELECTION-QUICK-START.md` | This file |

---

## API Reference

### AccountContext

```typescript
interface AccountContextValue {
  selectedAccountIds: string[];           // IDs of selected accounts
  selectedAccounts: Account[];            // Full account objects
  isAllAccountsSelected: boolean;         // True if viewing all
  selectAccount: (id: string) => void;    // Select one account
  deselectAccount: (id: string) => void;  // Deselect one account
  toggleAccount: (id: string) => void;    // Toggle account
  selectAllAccounts: () => void;          // View all accounts
  clearSelection: () => void;             // Clear all selections
  setSelectedAccountIds: (ids: string[]) => void;  // Set multiple
  loading: boolean;                       // Loading state
}
```

### useFilteredPortfolioMetrics

```typescript
interface FilteredMetricsHook {
  metrics: {
    totalValue: number;              // Total portfolio value
    cashBalance: number;             // Available cash
    investmentBalance: number;       // Market value of holdings
    todayChange: number;             // $ change today
    todayChangePercent: number;      // % change today
    totalReturn: number;             // $ unrealized P/L
    totalReturnPercent: number;      // % unrealized P/L
    dayChangeByHolding: Map<string, number>;  // Per-symbol
  };
  loading: boolean;                  // Loading state
  error: string | null;              // Error message
  refetch: () => Promise<void>;      // Manual refresh
}
```

---

## Common Use Cases

### Use Case 1: Show Selected Account Name in Header

```typescript
function Header() {
  const { selectedAccounts, isAllAccountsSelected } = useAccountContext();

  const title = isAllAccountsSelected
    ? 'All Accounts'
    : selectedAccounts.length === 1
    ? selectedAccounts[0].name
    : `${selectedAccounts.length} Accounts`;

  return <Text>{title}</Text>;
}
```

### Use Case 2: Filter Holdings List

```typescript
function HoldingsList() {
  const { selectedAccountIds } = useAccountContext();

  // Holdings will be automatically filtered by the hook
  const { metrics } = useFilteredPortfolioMetrics(selectedAccountIds);

  // Display holdings from metrics
  return (
    <FlatList
      data={Array.from(metrics.dayChangeByHolding.entries())}
      renderItem={({ item: [symbol, change] }) => (
        <HoldingCard symbol={symbol} change={change} />
      )}
    />
  );
}
```

### Use Case 3: Conditional Rendering Based on Selection

```typescript
function PortfolioView() {
  const { isAllAccountsSelected, selectedAccounts } = useAccountContext();

  if (isAllAccountsSelected) {
    return <CompletePortfolioView />;
  }

  if (selectedAccounts.length === 1) {
    return <SingleAccountView account={selectedAccounts[0]} />;
  }

  return <MultiAccountComparisonView accounts={selectedAccounts} />;
}
```

---

## Troubleshooting

### Selection Not Persisting
**Problem:** Selection resets after closing app
**Solution:** Check AsyncStorage permissions. Selection is automatically saved to `@account_selection_{userId}` key.

### Metrics Not Updating
**Problem:** Balance doesn't change when switching accounts
**Solution:** Ensure you're using `useFilteredPortfolioMetrics` instead of `usePortfolioMetrics`. The filtered version responds to account selection changes.

### Modal Not Showing Accounts
**Problem:** Account list is empty
**Solution:** Only active accounts with `status: 'active'` and `is_active: true` are shown. Check account status in database.

### Selection Cleared on Logout
**Problem:** Selection lost after logout
**Solution:** This is expected behavior for security. Each user has their own selection that's cleared on logout.

---

## Performance Tips

1. **Use memoization** for expensive calculations based on selection:
   ```typescript
   const expensiveData = useMemo(() => {
     return calculateSomething(selectedAccountIds);
   }, [selectedAccountIds]);
   ```

2. **Debounce rapid selection changes** if programmatically selecting:
   ```typescript
   const debouncedSelect = debounce(selectAccount, 300);
   ```

3. **Use the refetch sparingly** - auto-refresh happens every 60s:
   ```typescript
   const { refetch } = useFilteredPortfolioMetrics(selectedAccountIds);
   // Only call refetch on user action, not in useEffect
   ```

---

## Security Notes

- ✅ Selection is user-specific (stored with user ID)
- ✅ Cleared on logout automatically
- ✅ RLS policies enforce account ownership at database level
- ✅ No sensitive data logged

---

## Testing Checklist

Before deploying changes that use account selection:

- [ ] Test with "All Accounts" selected
- [ ] Test with single account selected
- [ ] Test with multiple accounts selected
- [ ] Test with no accounts (edge case)
- [ ] Verify selection persists across app restarts
- [ ] Test on iOS, Android, and Web
- [ ] Verify accessibility with screen reader

---

## Support

For issues or questions:
1. Check `ACCOUNT-SELECTION-COMPLETE.md` for detailed documentation
2. Review the implementation code in referenced files
3. Check console for error messages (filtered, no sensitive data)

---

**Status:** ✅ PRODUCTION READY
**Version:** 1.0.0
**Last Updated:** November 7, 2024
