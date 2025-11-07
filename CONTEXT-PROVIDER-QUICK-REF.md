# Context Provider Quick Reference

## ✅ Correct Provider Setup Pattern

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // ALWAYS return providers first
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <AccountProvider>
              {/* Conditional rendering INSIDE providers */}
              {!ready ? (
                <LoadingScreen />
              ) : (
                <Stack>
                  <Stack.Screen name="index" />
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

---

## ❌ Common Mistakes

### Mistake #1: Early Return Before Providers
```typescript
// ❌ DON'T DO THIS
if (!ready) return <Loading />;
return <Provider><App /></Provider>;

// ✅ DO THIS
return (
  <Provider>
    {!ready ? <Loading /> : <App />}
  </Provider>
);
```

### Mistake #2: Conditional Provider Mounting
```typescript
// ❌ DON'T DO THIS
{ready && <Provider><App /></Provider>}

// ✅ DO THIS
<Provider>
  {ready && <App />}
</Provider>
```

### Mistake #3: Using Context Without Guard
```typescript
// ❌ DON'T DO THIS
const { user } = useAuth();
// user might be undefined!

// ✅ DO THIS
const auth = useAuth();
if (!auth) return <Loading />;
const { user } = auth;
```

---

## 🔍 Available Contexts

### AuthContext
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { session, user, loading, signIn, signOut } = useAuth();
```

### AccountContext
```typescript
import { useAccountContext } from '@/contexts/AccountContext';

const {
  selectedAccounts,
  selectAccount,
  deselectAccount
} = useAccountContext();
```

### LoadingContext
```typescript
import { useLoading } from '@/contexts/LoadingContext';

const { isLoading, setLoading, withLoading } = useLoading();
```

### ToastContext
```typescript
import { useToast } from '@/contexts/ToastContext';

const { success, error, warning, info } = useToast();
```

---

## 🛡️ Error Messages

If you see:
```
Error: useAuth must be used within an AuthProvider
```

**Check:**
1. Is the component inside the provider tree in `app/_layout.tsx`?
2. Are providers mounted before routes are evaluated?
3. Is there an early return blocking provider mounting?

**Fix:**
- Ensure providers are ALWAYS mounted
- Move conditional logic INSIDE the provider tree
- Add defensive null checks in entry routes

---

## 📋 Checklist for New Screens

When creating a new screen that needs auth:

- [ ] Import context hook at top
- [ ] Add null check or loading guard
- [ ] Handle loading state
- [ ] Handle unauthenticated state
- [ ] Use try/catch for async operations
- [ ] Show appropriate error messages

**Example:**
```typescript
export default function MyScreen() {
  const auth = useAuth();

  // Guard
  if (!auth) return <SplashGlass />;

  const { session, loading } = auth;

  // Loading
  if (loading) return <LoadingSpinner />;

  // Not authenticated
  if (!session) return <Redirect href="/login" />;

  // Authenticated content
  return <View>...</View>;
}
```

---

## 🚀 Provider Order Matters

The current provider order (from outer to inner):
1. **ErrorBoundary** - Catches all errors
2. **LoadingProvider** - Global loading state
3. **ToastProvider** - Notifications
4. **AuthProvider** - Authentication (depends on nothing)
5. **AccountProvider** - Account management (depends on AuthProvider)

**Note:** AccountProvider uses AuthProvider internally, so Auth must wrap Account.

---

## 💡 Pro Tips

1. **Always test initialization flow**
   - Cold start
   - Hot reload
   - Navigation between screens
   - Logout → Login flow

2. **Use defensive programming**
   - Check if context exists
   - Handle loading states
   - Provide fallbacks

3. **Keep providers lightweight**
   - Don't do heavy computation in providers
   - Use hooks for complex logic
   - Keep initialization fast

4. **Error messages should be helpful**
   - Explain what's wrong
   - Suggest how to fix it
   - Point to relevant docs

---

## 📖 Related Files

- `app/_layout.tsx` - Root provider setup
- `contexts/AuthContext.tsx` - Authentication
- `contexts/AccountContext.tsx` - Account management
- `contexts/LoadingContext.tsx` - Loading states
- `contexts/ToastContext.tsx` - Toast notifications
- `AUTH-PROVIDER-FIX-GUIDE.md` - Detailed fix documentation

---

## 🔗 Quick Links

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Context API](https://react.dev/reference/react/useContext)
- [Auth Flow Guide](https://reactnavigation.org/docs/auth-flow/)
