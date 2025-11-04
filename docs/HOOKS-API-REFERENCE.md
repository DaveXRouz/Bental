# Hooks API Reference

Complete documentation for all custom hooks in the application.

## Table of Contents

- [Account Management](#account-management)
- [Portfolio & Holdings](#portfolio--holdings)
- [Trading](#trading)
- [Market Data](#market-data)
- [Authentication & Security](#authentication--security)
- [UI & Navigation](#ui--navigation)
- [Utility Hooks](#utility-hooks)

---

## Account Management

### `useAccounts()`

Manages user accounts with automatic refresh on session changes.

**Returns:**
- `accounts: Account[]` - Array of active accounts
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh
- `getTotalBalance: () => number` - Calculate total balance

**Example:**
```tsx
const { accounts, getTotalBalance } = useAccounts();
const total = getTotalBalance();
```

---

## Portfolio & Holdings

### `useHoldings(accountId?: string)`

Fetches and caches holdings with 30s TTL and 60s auto-refresh.

**Parameters:**
- `accountId?: string` - Account ID to fetch holdings for

**Returns:**
- `holdings: Holding[]` - Array of holdings
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh
- `getTotalValue: () => number` - Total market value
- `getTotalPnL: () => number` - Total unrealized P&L

**Example:**
```tsx
const { holdings, getTotalValue, getTotalPnL } = useHoldings(accountId);
const value = getTotalValue();
const pnl = getTotalPnL();
const returnPct = (pnl / value) * 100;
```

### `useWatchlist(userId: string | undefined)`

Manages user watchlist with CRUD operations.

**Parameters:**
- `userId: string | undefined` - User ID

**Returns:**
- `items: WatchlistItem[]` - Watchlist items
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `addToWatchlist: (symbol: string) => Promise<void>` - Add symbol
- `removeFromWatchlist: (id: string) => Promise<void>` - Remove item
- `refreshWatchlist: () => Promise<void>` - Manual refresh

**Example:**
```tsx
const { items, addToWatchlist, removeFromWatchlist } = useWatchlist(userId);

await addToWatchlist('AAPL');
await removeFromWatchlist(itemId);
```

### `useWatchlistGroups(userId: string | undefined)`

Manages watchlist groups for organizing symbols.

**Parameters:**
- `userId: string | undefined` - User ID

**Returns:**
- `groups: WatchlistGroup[]` - Array of groups
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `createGroup: (name: string) => Promise<void>` - Create group
- `updateGroup: (id: string, name: string) => Promise<void>` - Update group
- `deleteGroup: (id: string) => Promise<void>` - Delete group
- `refetch: () => Promise<void>` - Manual refresh

### `usePortfolioSnapshots(accountId?: string)`

Fetches historical portfolio snapshots for performance tracking.

**Parameters:**
- `accountId?: string` - Account ID

**Returns:**
- `snapshots: PortfolioSnapshot[]` - Historical snapshots
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

---

## Trading

### `useBot(botId: string)`

Manages individual trading bot instance.

**Parameters:**
- `botId: string` - Bot ID

**Returns:**
- `bot: Bot | null` - Bot details
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useBots()`

Fetches all available trading bots.

**Returns:**
- `bots: Bot[]` - Array of bots
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useBotAllocations(userId: string | undefined)`

Manages user's bot allocations.

**Parameters:**
- `userId: string | undefined` - User ID

**Returns:**
- `allocations: BotAllocation[]` - Active allocations
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `createAllocation: (botId: string, amount: number) => Promise<void>` - Create allocation
- `pauseAllocation: (id: string) => Promise<void>` - Pause allocation
- `closeAllocation: (id: string) => Promise<void>` - Close allocation
- `refetch: () => Promise<void>` - Manual refresh

### `useBotTrades(botId: string)`

Fetches trade history for a bot.

**Parameters:**
- `botId: string` - Bot ID

**Returns:**
- `trades: Trade[]` - Trade history
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useBotMarketplace()`

Manages bot marketplace with filtering and sorting.

**Returns:**
- `bots: Bot[]` - Marketplace bots
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `filter: FilterState` - Current filter
- `setFilter: (filter: Partial<FilterState>) => void` - Update filter
- `refetch: () => Promise<void>` - Manual refresh

### `useBotDashboard(userId: string | undefined)`

Aggregates bot performance metrics.

**Parameters:**
- `userId: string | undefined` - User ID

**Returns:**
- `dashboard: DashboardData` - Aggregated metrics
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useBotKPIs(botId: string)`

Fetches key performance indicators for a bot.

**Parameters:**
- `botId: string` - Bot ID

**Returns:**
- `kpis: BotKPIs` - Performance metrics
- `loading: boolean` - Loading state
- `error: string | null` - Error message

---

## Market Data

### `useRealtimePrices(symbols: string[], enabled?: boolean)`

Real-time price updates via WebSocket.

**Parameters:**
- `symbols: string[]` - Symbols to track
- `enabled?: boolean` - Enable/disable updates (default: true)

**Returns:**
- `prices: Map<string, PriceUpdate>` - Price map
- `getPrice: (symbol: string) => PriceUpdate | undefined` - Get specific price
- `lastUpdate: Date | null` - Last update timestamp
- `isConnected: boolean` - Connection status
- `refresh: () => void` - Manual refresh

**Example:**
```tsx
const { prices, getPrice, isConnected } = useRealtimePrices(['AAPL', 'GOOGL']);
const applePrice = getPrice('AAPL');
```

### `useEnhancedRealtimePrices(symbols: string[], enabled?: boolean)`

Enhanced real-time prices with circuit breaker and reconnection logic.

**Parameters:**
- `symbols: string[]` - Symbols to track
- `enabled?: boolean` - Enable/disable (default: true)

**Returns:**
- `prices: Record<string, PriceData>` - Price data
- `isConnected: boolean` - Connection status
- `lastUpdate: Date | null` - Last update
- `error: string | null` - Error message
- `reconnect: () => void` - Manual reconnect

### `useQuote(symbol: string)`

Fetches quote data for a symbol with caching.

**Parameters:**
- `symbol: string` - Stock symbol

**Returns:**
- `quote: Quote | null` - Quote data
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useCandles(symbol: string, range: string)`

Fetches candlestick data with caching.

**Parameters:**
- `symbol: string` - Stock symbol
- `range: string` - Time range ('1D' | '1W' | '1M' | '1Y')

**Returns:**
- `candles: Candle[]` - Candlestick data
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useNews(filters?: NewsFilter)`

Fetches financial news with filtering.

**Parameters:**
- `filters?: NewsFilter` - Optional filters

**Returns:**
- `articles: NewsArticle[]` - News articles
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `refetch: () => Promise<void>` - Manual refresh

### `useFX()`

Manages foreign exchange rates.

**Returns:**
- `rates: Record<string, number>` - Exchange rates
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `convert: (amount: number, from: string, to: string) => number` - Convert currency
- `refetch: () => Promise<void>` - Manual refresh

### `useCurrency()`

Manages user currency preferences.

**Returns:**
- `currencies: Currency[]` - Available currencies
- `preferredCurrency: string` - User's preferred currency
- `setPreference: (code: string) => Promise<void>` - Update preference
- `convert: (amount: number, from: string, to: string) => number` - Convert amount
- `loading: boolean` - Loading state

---

## Authentication & Security

### `useBiometricAuth()`

Manages biometric authentication.

**Returns:**
- `isAvailable: boolean` - Biometric available
- `isEnrolled: boolean` - User enrolled
- `authenticate: (reason?: string) => Promise<boolean>` - Authenticate
- `loading: boolean` - Loading state

**Example:**
```tsx
const { isAvailable, authenticate } = useBiometricAuth();

if (isAvailable) {
  const success = await authenticate('Confirm transaction');
  if (success) {
    // Proceed with transaction
  }
}
```

### `useMFA()`

Manages multi-factor authentication.

**Returns:**
- `isEnabled: boolean` - MFA status
- `enable: (secret: string) => Promise<void>` - Enable MFA
- `disable: () => Promise<void>` - Disable MFA
- `verify: (code: string) => Promise<boolean>` - Verify code
- `loading: boolean` - Loading state

### `useSessionManagement()`

Manages user sessions with device tracking.

**Returns:**
- `sessions: Session[]` - Active sessions
- `currentSession: Session | null` - Current session
- `revoke: (sessionId: string) => Promise<void>` - Revoke session
- `revokeAll: () => Promise<void>` - Revoke all sessions
- `loading: boolean` - Loading state

### `useLoginHistory(userId?: string)`

Fetches user login history.

**Parameters:**
- `userId?: string` - User ID

**Returns:**
- `history: LoginRecord[]` - Login history
- `loading: boolean` - Loading state
- `error: string | null` - Error message

### `useMagicLink()`

Handles magic link authentication.

**Returns:**
- `sendMagicLink: (email: string) => Promise<void>` - Send link
- `verifyMagicLink: (token: string) => Promise<boolean>` - Verify link
- `loading: boolean` - Loading state
- `error: string | null` - Error message

---

## Alerts & Notifications

### `useNotifications(userId?: string)`

Manages user notifications.

**Parameters:**
- `userId?: string` - User ID

**Returns:**
- `notifications: Notification[]` - Notifications
- `unreadCount: number` - Unread count
- `markAsRead: (id: string) => Promise<void>` - Mark read
- `markAllAsRead: () => Promise<void>` - Mark all read
- `deleteNotification: (id: string) => Promise<void>` - Delete
- `loading: boolean` - Loading state

### `usePriceAlerts(userId?: string)`

Manages price alerts.

**Parameters:**
- `userId?: string` - User ID

**Returns:**
- `alerts: PriceAlert[]` - Price alerts
- `createAlert: (params: CreateAlertParams) => Promise<void>` - Create alert
- `updateAlert: (id: string, params: UpdateAlertParams) => Promise<void>` - Update
- `deleteAlert: (id: string) => Promise<void>` - Delete
- `loading: boolean` - Loading state

### `useInsights(userId?: string)`

Fetches AI-generated insights.

**Parameters:**
- `userId?: string` - User ID

**Returns:**
- `insights: AIInsight[]` - AI insights
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `markAsRead: (id: string) => Promise<void>` - Mark read
- `refetch: () => Promise<void>` - Manual refresh

---

## UI & Navigation

### `useResponsive()`

Provides responsive design utilities.

**Returns:**
- `width: number` - Screen width
- `height: number` - Screen height
- `isMobile: boolean` - Mobile device
- `isTablet: boolean` - Tablet device
- `isDesktop: boolean` - Desktop device
- `breakpoint: string` - Current breakpoint
- `orientation: 'portrait' | 'landscape'` - Orientation

**Example:**
```tsx
const { isMobile, width } = useResponsive();

return (
  <View style={{ padding: isMobile ? 16 : 32 }}>
    <Text>Width: {width}px</Text>
  </View>
);
```

### `useReducedMotion()`

Detects reduced motion preference.

**Returns:**
- `boolean` - Reduced motion enabled

**Example:**
```tsx
const reduceMotion = useReducedMotion();
const duration = reduceMotion ? 0 : 300;
```

### `useKeyboardShortcuts(shortcuts: Shortcut[])`

Manages keyboard shortcuts.

**Parameters:**
- `shortcuts: Shortcut[]` - Array of shortcuts

**Example:**
```tsx
useKeyboardShortcuts([
  { key: 's', modifiers: ['meta'], action: () => save() },
  { key: 'n', modifiers: ['meta'], action: () => create() },
]);
```

### `useNavigationAnalytics()`

Tracks navigation analytics.

**Returns:**
- `trackScreen: (name: string) => void` - Track screen view
- `trackAction: (action: string, params?: any) => void` - Track action

### `useNavigationPreferences()`

Manages navigation preferences.

**Returns:**
- `preferences: NavPreferences` - User preferences
- `updatePreferences: (prefs: Partial<NavPreferences>) => Promise<void>` - Update
- `loading: boolean` - Loading state

---

## Utility Hooks

### `useCache<T>(options: CacheOptions)`

Generic caching hook with TTL and prefetching.

**Parameters:**
- `options.key: string` - Cache key
- `options.fetcher: () => Promise<T>` - Data fetcher
- `options.ttl?: number` - Time to live (ms)
- `options.enabled?: boolean` - Enable/disable
- `options.memory?: boolean` - Use memory cache
- `options.prefix?: string` - Key prefix

**Returns:**
- `data: T | undefined` - Cached data
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error object
- `refetch: () => Promise<void>` - Manual refetch
- `invalidate: () => Promise<void>` - Clear cache

**Example:**
```tsx
const { data, isLoading, refetch } = useCache({
  key: 'user-profile',
  fetcher: async () => {
    const res = await fetch('/api/profile');
    return res.json();
  },
  ttl: 60000, // 1 minute
});
```

### `useProfile(userId?: string)`

Fetches user profile with caching.

**Parameters:**
- `userId?: string` - User ID

**Returns:**
- `profile: Profile | null` - User profile
- `loading: boolean` - Loading state
- `error: string | null` - Error message
- `updateProfile: (data: Partial<Profile>) => Promise<void>` - Update
- `refetch: () => Promise<void>` - Manual refresh

### `useAppConfig()`

Fetches app configuration.

**Returns:**
- `config: AppConfig` - App configuration
- `loading: boolean` - Loading state
- `isMaintenanceMode: boolean` - Maintenance status
- `featureFlags: Record<string, boolean>` - Feature flags

### `useFeatureFlag(flagName: string)`

Checks feature flag status.

**Parameters:**
- `flagName: string` - Feature flag name

**Returns:**
- `boolean` - Flag enabled status

**Example:**
```tsx
const darkModeEnabled = useFeatureFlag('dark-mode');

if (darkModeEnabled) {
  return <DarkModeToggle />;
}
```

### `useGuardrails()`

Provides trading guardrails and limits.

**Returns:**
- `limits: TradingLimits` - Trading limits
- `checkLimit: (amount: number, type: string) => boolean` - Check limit
- `getRemainingLimit: (type: string) => number` - Get remaining

### `useLeaderboard(limit: number)`

Fetches leaderboard data.

**Parameters:**
- `limit: number` - Max entries

**Returns:**
- `entries: LeaderboardEntry[]` - Leaderboard entries
- `userRank: UserRank | null` - User's rank
- `loading: boolean` - Loading state
- `togglePublicProfile: (isPublic: boolean) => Promise<void>` - Toggle visibility
- `refresh: () => Promise<void>` - Manual refresh

### `usePerformanceMonitor()`

Monitors app performance metrics.

**Returns:**
- `metrics: PerformanceMetrics` - Performance data
- `recordMetric: (name: string, value: number) => void` - Record metric
- `clearMetrics: () => void` - Clear data

### `usePerformanceAnalytics()`

Tracks performance analytics.

**Returns:**
- `trackRender: (component: string) => void` - Track render
- `trackApiCall: (endpoint: string, duration: number) => void` - Track API
- `trackError: (error: Error) => void` - Track error

### `useRateLimit(limit: number, window: number)`

Implements rate limiting.

**Parameters:**
- `limit: number` - Max requests
- `window: number` - Time window (ms)

**Returns:**
- `isAllowed: () => boolean` - Check if allowed
- `remaining: number` - Remaining requests
- `reset: Date` - Reset time

### `useSentiment(symbol: string)`

Fetches market sentiment for symbol.

**Parameters:**
- `symbol: string` - Stock symbol

**Returns:**
- `sentiment: SentimentData | null` - Sentiment data
- `loading: boolean` - Loading state
- `error: string | null` - Error message

### `useSmartForm<T>(schema: ZodSchema)`

Smart form with validation.

**Parameters:**
- `schema: ZodSchema` - Zod validation schema

**Returns:**
- `values: T` - Form values
- `errors: Record<string, string>` - Validation errors
- `touched: Record<string, boolean>` - Touched fields
- `handleChange: (field: string, value: any) => void` - Handle change
- `handleSubmit: (onSubmit: (values: T) => void) => void` - Handle submit
- `reset: () => void` - Reset form

### `useValidatedForm<T>(initialValues: T, validate: Function)`

Form with custom validation.

**Parameters:**
- `initialValues: T` - Initial form values
- `validate: Function` - Validation function

**Returns:**
- `values: T` - Form values
- `errors: Record<string, string>` - Validation errors
- `handleChange: (field: string, value: any) => void` - Handle change
- `handleSubmit: (callback: Function) => void` - Handle submit
- `reset: () => void` - Reset form

---

## Best Practices

### 1. Hook Dependencies

Always include all dependencies in useEffect and useCallback:

```tsx
useEffect(() => {
  fetchData();
}, [dependency1, dependency2]); // ✅ Complete dependencies
```

### 2. Error Handling

Always handle errors gracefully:

```tsx
const { data, error, loading } = useCustomHook();

if (error) {
  return <ErrorState message={error} />;
}
```

### 3. Loading States

Show loading states for better UX:

```tsx
if (loading) {
  return <LoadingSpinner />;
}
```

### 4. Cleanup

Always cleanup subscriptions:

```tsx
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 5. Memoization

Use useMemo and useCallback for expensive operations:

```tsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## Performance Tips

1. **Use caching hooks** for frequently accessed data
2. **Enable/disable hooks** conditionally to save resources
3. **Use proper TTL values** - balance freshness vs performance
4. **Batch updates** when possible
5. **Use real-time updates** only for critical data
6. **Implement pagination** for large datasets
7. **Use memory caching** for static data

---

## Common Patterns

### Fetching Data on Mount

```tsx
const { data, loading, error } = useCache({
  key: 'my-data',
  fetcher: fetchData,
  ttl: 60000,
});
```

### Real-time Updates

```tsx
const { prices, isConnected } = useRealtimePrices(symbols, true);
```

### Form Management

```tsx
const { values, errors, handleSubmit } = useSmartForm(schema);
```

### Conditional Fetching

```tsx
const { data } = useCache({
  key: 'conditional-data',
  fetcher: fetchData,
  enabled: shouldFetch, // Only fetch when true
});
```

---

## Troubleshooting

### Hook Returns Stale Data

- Check TTL settings
- Call `refetch()` or `invalidate()`
- Verify cache key uniqueness

### Hook Causes Re-renders

- Use `useMemo` for computed values
- Use `useCallback` for event handlers
- Check dependency arrays

### Hook Not Updating

- Verify WebSocket connection
- Check `enabled` flag
- Ensure dependencies are correct

### Memory Leaks

- Always cleanup in useEffect
- Unsubscribe from real-time updates
- Clear timers and intervals

---

## Migration Guide

When updating hooks:

1. Check the changelog
2. Update TypeScript types
3. Update component usage
4. Test thoroughly
5. Update documentation

---

## Related Documentation

- [Authentication System](./AUTHENTICATION-SYSTEM.md)
- [Database Schema](./DATABASE-SCHEMA.md)
- [API Reference](./API-REFERENCE.md)
- [Component Library](./COMPONENTS.md)
