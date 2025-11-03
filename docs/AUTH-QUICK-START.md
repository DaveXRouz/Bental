# Authentication Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide shows you how to implement authentication in your React Native Expo app.

---

## 📦 What's Included

✅ **5 Core Features**
1. Sign Up (User Registration)
2. Sign In (User Login)
3. Sign Out (User Logout)
4. Change Password
5. Reset Password

✅ **2 Bonus Features**
6. Google OAuth
7. Apple OAuth

---

## 🎯 Quick Implementation

### 1. Use the Auth Hook

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    user,          // Current user object
    session,       // Current session
    loading,       // Auth loading state
    signIn,        // Login function
    signUp,        // Registration function
    signOut,       // Logout function
    changePassword,// Change password function
    resetPassword, // Send reset email function
    updatePassword,// Update password function
  } = useAuth();

  return <View>...</View>;
}
```

### 2. Check Authentication Status

```typescript
function ProtectedScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Redirect to login
    router.replace('/(auth)/login');
    return null;
  }

  return <YourContent />;
}
```

### 3. Implement Sign Up

```typescript
async function handleSignUp() {
  const { error } = await signUp(
    'user@example.com',
    'SecurePass123!',
    'John Doe',
    '+1234567890' // optional
  );

  if (error) {
    Alert.alert('Error', error.message);
  } else {
    // Success! User is auto-logged in
    router.replace('/(tabs)');
  }
}
```

### 4. Implement Sign In

```typescript
// Email login
async function handleSignIn() {
  const { error } = await signIn(
    'user@example.com',
    'password123',
    'email'
  );

  if (error) {
    Alert.alert('Error', error.message);
  }
}

// OR Trading Passport login
const { error } = await signIn(
  'TP123456',
  'password123',
  'passport'
);
```

### 5. Implement Sign Out

```typescript
async function handleSignOut() {
  await signOut();
  router.replace('/(auth)/login');
}
```

### 6. Change Password

```typescript
async function handleChangePassword() {
  const { success, error } = await changePassword(
    'currentPassword',
    'newPassword123!'
  );

  if (success) {
    Alert.alert('Success', 'Password updated!');
  } else {
    Alert.alert('Error', error);
  }
}
```

### 7. Reset Password Flow

**Step 1: Send Reset Email**
```typescript
async function handleForgotPassword() {
  const { success, error } = await resetPassword('user@example.com');

  if (success) {
    Alert.alert('Check Email', 'Reset link sent!');
  } else {
    Alert.alert('Error', error);
  }
}
```

**Step 2: Update Password (after clicking email link)**
```typescript
async function handleResetPassword() {
  const { success, error } = await updatePassword('newPassword123!');

  if (success) {
    Alert.alert('Success', 'Password reset!');
    router.replace('/(auth)/login');
  } else {
    Alert.alert('Error', error);
  }
}
```

---

## 🎨 Pre-Built UI Screens

Use these ready-made screens:

### Login Screen
```typescript
// Navigate to login
router.push('/(auth)/login');

// Features:
// - Email/password login
// - Trading passport login
// - Remember me toggle
// - Forgot password link
// - OAuth buttons (Google, Apple)
```

### Signup Screen
```typescript
// Navigate to signup
router.push('/(auth)/signup');

// Features:
// - Email/password registration
// - Full name input
// - Phone number (optional)
// - OAuth options
```

### Forgot Password Screen
```typescript
// Navigate to forgot password
router.push('/(auth)/forgot-password');

// Features:
// - Email input
// - Send reset link
// - Success confirmation
```

### Reset Password Screen
```typescript
// Automatically loaded from email link
// Route: /(auth)/reset-password

// Features:
// - New password input
// - Confirm password input
// - Password strength indicator
```

### Password Change Modal
```typescript
import PasswordChangeModal from '@/components/modals/PasswordChangeModal';

<PasswordChangeModal
  visible={showModal}
  onClose={() => setShowModal(false)}
/>
```

---

## 🔐 Security Features (Built-in)

✅ **Password Security**
- Bcrypt hashing (Supabase)
- Strength validation
- Min 8 characters required

✅ **Email Validation**
- Format checking
- Real-time feedback

✅ **Session Management**
- JWT tokens
- Auto-refresh
- Secure storage

✅ **Input Sanitization**
- XSS prevention
- SQL injection prevention (Supabase)

---

## 📱 Navigation Flow

```
App Start
    ↓
Check Session
    ↓
┌───────────────────┐
│ Authenticated?    │
└───────────────────┘
    ↓           ↓
   YES          NO
    ↓           ↓
Dashboard    Login Screen
    ↓           ↓
          Sign Up / Sign In
                  ↓
              Dashboard
```

---

## 🛠 Common Patterns

### Pattern 1: Protected Route

```typescript
function ProtectedScreen() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    }
  }, [user]);

  if (!user) return null;

  return <YourContent />;
}
```

### Pattern 2: Show User Info

```typescript
function UserProfile() {
  const { user } = useAuth();

  return (
    <View>
      <Text>Email: {user?.email}</Text>
      <Text>ID: {user?.id}</Text>
    </View>
  );
}
```

### Pattern 3: Conditional Rendering

```typescript
function Header() {
  const { user } = useAuth();

  return (
    <View>
      {user ? (
        <Button title="Sign Out" onPress={signOut} />
      ) : (
        <Button title="Sign In" onPress={() => router.push('/(auth)/login')} />
      )}
    </View>
  );
}
```

---

## 🎯 Form Validation Example

```typescript
import { validateEmail, validatePassword } from '@/utils/validation';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!validatePassword(password)) {
      newErrors.password = 'Password must be 8+ characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const { error } = await signUp(email, password, 'John Doe');
    // Handle result...
  };

  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      <Button title="Sign Up" onPress={handleSubmit} />
    </View>
  );
}
```

---

## 📊 Database Access

After authentication, access user data:

```typescript
import { supabase } from '@/lib/supabase';

// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Update profile
await supabase
  .from('profiles')
  .update({ full_name: 'New Name' })
  .eq('id', user.id);

// Get user accounts
const { data: accounts } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', user.id);
```

---

## 🐛 Error Handling

```typescript
async function handleSignIn() {
  try {
    const { error } = await signIn(email, password);

    if (error) {
      // Handle specific errors
      if (error.message.includes('Invalid')) {
        Alert.alert('Error', 'Invalid credentials');
      } else if (error.message.includes('Network')) {
        Alert.alert('Error', 'Network error. Try again.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  } catch (err) {
    Alert.alert('Error', 'An unexpected error occurred');
    console.error(err);
  }
}
```

---

## ✅ Testing Checklist

Before deploying, test:

- [ ] Sign up creates user and profile
- [ ] Sign in works with email
- [ ] Sign in works with trading passport
- [ ] Sign out clears session
- [ ] Change password updates successfully
- [ ] Forgot password sends email
- [ ] Reset password link works
- [ ] Protected routes redirect to login
- [ ] Session persists after app restart
- [ ] Tokens refresh automatically

---

## 🚨 Common Mistakes

❌ **DON'T**: Store passwords in state or logs
✅ **DO**: Use auth context and secure storage

❌ **DON'T**: Validate only on frontend
✅ **DO**: Supabase handles backend validation

❌ **DON'T**: Forget to handle loading states
✅ **DO**: Show loaders during auth operations

❌ **DON'T**: Expose sensitive data in URLs
✅ **DO**: Use POST requests for credentials

---

## 📚 More Resources

- [Full Documentation](./AUTHENTICATION-SYSTEM.md)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security)

---

## 💡 Quick Tips

1. **Always** check if user is null before accessing user properties
2. **Use** loading states to prevent double submissions
3. **Handle** errors gracefully with user-friendly messages
4. **Test** on both iOS and Android devices
5. **Implement** proper navigation guards for protected routes

---

## 🎉 You're Ready!

You now have a complete, production-ready authentication system. Start building your app! 🚀
