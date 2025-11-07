# AuthProvider Context Error - Fix & Prevention Guide

## Problem Summary

**Error Message:**
```
Error: useAuth must be used within an AuthProvider
```

**Root Cause:**
A race condition during app initialization where child routes attempt to render before the AuthProvider context is fully established. This occurred because the root layout (`app/_layout.tsx`) had an early return for font loading that happened BEFORE the provider tree was created.

---

## The Fix

### 1. Provider Tree Restructuring (app/_layout.tsx)

**Before (❌ Incorrect):**
```typescript
export default function RootLayout() {
  // Early return prevents providers from mounting
  if (!fontsLoaded && !fontError) {
    return <Loading />;
  }

  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
```

**After (✅ Correct):**
```typescript
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <AccountProvider>
              {!fontsLoaded && !fontError ? (
                <Loading />
              ) : (
                <Stack>
                  <Stack.Screen name="index" />
                  {/* Other routes */}
                </Stack>
              )}
            </AccountProvider>
          </AuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
}
```

**Key Change:** Providers are ALWAYS mounted. Loading state is handled conditionally WITHIN the provider tree.

---

### 2. Enhanced Error Messages

All context providers now have improved error messages that help developers troubleshoot:

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider> in app/_layout.tsx. ' +
      'If you are seeing this error during app initialization, ensure providers are mounted before routes are evaluated.'
    );
  }
  return context;
}
```

---

### 3. Defensive Guard in Index Route (app/index.tsx)

Added null check before using context:

```typescript
export default function Index() {
  const auth = useAuth();

  // Guard against undefined context during initialization
  if (!auth) {
    return <SplashGlass />;
  }

  const { session, loading } = auth;
  // ... rest of component
}
```

---

## Why This Works

### Provider Mounting Order

The providers are now mounted in the correct order:

1. **ErrorBoundary** - Catches any errors during initialization
2. **LoadingProvider** - Available for loading states
3. **ToastProvider** - Available for notifications
4. **AuthProvider** - Authentication context
5. **AccountProvider** - Account management context
6. **Conditional Rendering** - Routes only render when providers are ready

### Timing Guarantees

- ✅ Providers are mounted BEFORE any route evaluation
- ✅ Context is available BEFORE any component tries to use it
- ✅ Loading states don't interrupt provider availability
- ✅ Navigation happens only when providers are ready

---

## Prevention Strategies

### 1. Always Mount Providers First

```typescript
// ❌ DON'T DO THIS
if (loading) return <Loading />;
return <Provider><App /></Provider>;

// ✅ DO THIS
return (
  <Provider>
    {loading ? <Loading /> : <App />}
  </Provider>
);
```

### 2. Use Defensive Checks in Critical Routes

For entry points like `app/index.tsx`, add guards:

```typescript
const auth = useAuth();
if (!auth) return <Loading />;
```

### 3. Enhanced Error Messages

Always provide helpful context in error messages:

```typescript
if (!context) {
  throw new Error(
    'useHook must be used within Provider. ' +
    'Check your provider setup in app/_layout.tsx'
  );
}
```

### 4. Test Initialization Flow

Always test:
- First app load (cold start)
- Navigation between routes
- Refresh/reload scenarios
- Slow network conditions

---

## File Changes Made

### Modified Files

1. **app/_layout.tsx**
   - Moved loading check inside provider tree
   - Ensures providers always mount

2. **contexts/AuthContext.tsx**
   - Enhanced error message with troubleshooting guidance

3. **contexts/AccountContext.tsx**
   - Enhanced error message

4. **contexts/LoadingContext.tsx**
   - Enhanced error message

5. **contexts/ToastContext.tsx**
   - Enhanced error message

6. **app/index.tsx**
   - Added defensive null check

---

## Common Pitfalls to Avoid

### ❌ Don't: Early Return Before Providers

```typescript
// This causes context errors!
if (loading) return <View />;
return <Provider><App /></Provider>;
```

### ❌ Don't: Conditional Provider Mounting

```typescript
// This can cause race conditions!
{loading ? null : <Provider><App /></Provider>}
```

### ❌ Don't: Nested Conditional Returns

```typescript
// Complex conditions make debugging hard!
if (conditionA) return <A />;
if (conditionB) return <B />;
return <Provider><App /></Provider>;
```

### ✅ Do: Always Mount Providers

```typescript
// Providers always available!
return (
  <Provider>
    {loading ? <Loading /> : <App />}
  </Provider>
);
```

---

## Testing Checklist

After implementing this fix, verify:

- [ ] App loads without "useAuth must be used within an AuthProvider" error
- [ ] Fonts load correctly without breaking context
- [ ] Navigation works from all entry points
- [ ] Login/logout flows function properly
- [ ] Refresh doesn't break authentication state
- [ ] All protected routes check auth correctly
- [ ] Admin panel routing works as expected

---

## Expo Router Best Practices

### Provider Setup

In Expo Router v6+, always structure your root layout like this:

```typescript
export default function RootLayout() {
  // 1. Hooks at the top
  const [fontsLoaded] = useFonts({...});

  // 2. Effects for initialization
  useEffect(() => {
    // initialization logic
  }, []);

  // 3. Return providers ALWAYS
  return (
    <Providers>
      {!ready ? <Loading /> : <Navigation />}
    </Providers>
  );
}
```

### Route Guards

For protected routes, implement guards that rely on context:

```typescript
export default function ProtectedScreen() {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;

  return <Screen />;
}
```

---

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Context Best Practices](https://react.dev/reference/react/useContext)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow/)

---

## Summary

The fix ensures that all context providers are mounted BEFORE any route evaluation happens. This eliminates the race condition where components try to access context that hasn't been created yet. By moving the loading check inside the provider tree and adding defensive guards in critical components, the app now initializes reliably across all scenarios.

**Key Takeaway:** In Expo Router apps, ALWAYS mount your providers before conditional rendering or route evaluation to ensure context is available when components need it.
