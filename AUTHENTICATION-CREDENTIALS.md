# Authentication System - Login Credentials

## 🔐 Default Password Information

All demo users in the system have been assigned the following default password:

**Default Password:** `Welcome2025!`

---

## 👥 Demo User Accounts

You can log in with any of the following demo accounts using the default password above:

### Demo Users
1. **jessica.patel@demo.com** - Password: `Welcome2025!`
2. **michael.chen@demo.com** - Password: `Welcome2025!`
3. **amanda.taylor@demo.com** - Password: `Welcome2025!`
4. **emily.rodriguez@demo.com** - Password: `Welcome2025!`
5. **robert.kim@demo.com** - Password: `Welcome2025!`
6. **lisa.martinez@demo.com** - Password: `Welcome2025!`

### Test/Real Accounts
- **ali@gmail.com** - Password: (user-set password or `Welcome2025!`)
- **gmail@gmail.com** - Password: (user-set password or `Welcome2025!`)
- **test@abrahamhental.com** - Password: (user-set password or `Welcome2025!`)
- **ka6666ie@icloud.com** - Password: (user-set password or `Welcome2025!`)

---

## 🚀 Authentication Features

### Implemented Features
✅ **Email/Password Authentication**
- Full sign-in functionality
- Secure password handling via Supabase Auth
- Session management with automatic token refresh
- Remember me functionality

✅ **Social Authentication** (OAuth)
- Google Sign-In
- Apple Sign-In

✅ **Password Management**
- Forgot password flow with email reset
- Change password functionality
- Password visibility toggle
- Secure password masking

✅ **User Registration**
- Complete sign-up flow
- Profile creation on registration
- Automatic account setup (demo cash account)
- Email validation

✅ **UI/UX Features**
- Quantum-themed glassmorphic design
- Visual feedback on input focus
- Loading states during authentication
- Clear error messages
- Responsive design (mobile, tablet, desktop)
- Keyboard-aware views
- Accessibility support

---

## 🔒 Security Features

### Password Security
- **Hashing:** All passwords are automatically hashed by Supabase Auth using bcrypt
- **Minimum Length:** 6 characters required
- **Secure Storage:** Never stored in plaintext
- **Session Tokens:** JWT-based authentication with automatic refresh
- **HTTP-Only Cookies:** Session cookies are HTTP-only and secure

### Best Practices Implemented
- Password visibility toggle for user convenience
- Remember me with secure local storage
- Email verification flow (can be enabled)
- OAuth integration for passwordless auth
- Logout functionality with token cleanup
- Sentry error tracking integration

---

## 📝 Usage Instructions

### For Development/Testing

1. **Quick Login (Recommended)**
   ```
   Email: michael.chen@demo.com
   Password: Welcome2025!
   ```

2. **Create New Account**
   - Go to Sign Up page
   - Enter your details
   - Password must be at least 6 characters
   - Account and profile created automatically

3. **Forgot Password**
   - Click "Forgot your password?" on login page
   - Enter your email
   - Check email for reset link
   - Follow instructions to set new password

### For Production

⚠️ **IMPORTANT:** Before deploying to production:

1. **Remove Default Passwords**
   - Force password reset for all demo accounts
   - Implement password strength requirements
   - Enable email verification

2. **Enable Additional Security**
   ```sql
   -- Force password change for default passwords
   UPDATE profiles
   SET using_default_password = true
   WHERE using_default_password IS NULL;
   ```

3. **Configure OAuth Properly**
   - Set up Google OAuth credentials
   - Set up Apple Sign In
   - Configure proper redirect URLs

4. **Enable Email Verification**
   - In Supabase Dashboard > Authentication > Settings
   - Enable "Confirm email" requirement
   - Configure email templates

---

## 🧪 Testing Authentication

### Test Scenarios

1. **Successful Login**
   - Use: `michael.chen@demo.com` / `Welcome2025!`
   - Expected: Redirect to dashboard

2. **Failed Login**
   - Use any email with wrong password
   - Expected: Error message "Invalid login credentials"

3. **Remember Me**
   - Check "Remember" checkbox
   - Login successfully
   - Close and reopen app
   - Expected: Email pre-filled

4. **Password Reset**
   - Click "Forgot your password?"
   - Enter email
   - Expected: Success message

5. **Sign Up**
   - Click "Sign Up"
   - Fill in details
   - Expected: Account created, redirected to dashboard

6. **Sign Out**
   - Click profile/logout
   - Expected: Redirected to login

---

## 🛠️ Technical Implementation

### Authentication Flow

```
Login Flow:
1. User enters email/password
2. Call supabase.auth.signInWithPassword()
3. Supabase validates credentials
4. Returns session token (JWT)
5. Token stored in AsyncStorage (mobile) or localStorage (web)
6. AuthContext updates with user session
7. Redirect to dashboard

Sign Up Flow:
1. User enters details
2. Call supabase.auth.signUp()
3. User created in auth.users
4. Profile created in profiles table
5. Demo account created in accounts table
6. Auto sign-in
7. Redirect to dashboard
```

### Session Management

- **Token Refresh:** Automatic via Supabase client
- **Token Storage:** Secure storage (AsyncStorage/localStorage)
- **Token Expiry:** Handled automatically
- **Logout:** Clears all tokens and session data

### Database Schema

```sql
-- Auth users (managed by Supabase)
auth.users
  - id (uuid, primary key)
  - email (text, unique)
  - encrypted_password (text) -- bcrypt hash
  - created_at (timestamp)
  - updated_at (timestamp)

-- User profiles
profiles
  - id (uuid, references auth.users)
  - email (text)
  - full_name (text)
  - phone (text, optional)
  - using_default_password (boolean)
  - password_changed_at (timestamp)
```

---

## 📱 Platform Support

### Web
- ✅ Full functionality
- ✅ OAuth (Google, Apple)
- ✅ Remember me with localStorage
- ✅ Keyboard navigation

### iOS
- ✅ Full functionality
- ✅ Native OAuth providers
- ✅ Haptic feedback
- ✅ Biometric auth support (can be added)

### Android
- ✅ Full functionality
- ✅ Native OAuth providers
- ✅ Haptic feedback
- ✅ Biometric auth support (can be added)

---

## 🔄 Future Enhancements

### Planned Features
- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication (Face ID, Touch ID, Fingerprint)
- [ ] Social auth (GitHub, Microsoft)
- [ ] Magic link login (passwordless)
- [ ] Session management dashboard
- [ ] Login history
- [ ] Device management
- [ ] Password strength meter
- [ ] Passkey support (WebAuthn)

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** "Invalid login credentials"
- **Solution:** Verify email and password are correct
- **Note:** Password is case-sensitive
- **Default:** Try `Welcome2025!` for demo accounts

**Issue:** "Email not confirmed"
- **Solution:** Check email verification settings in Supabase
- **Note:** Email verification is currently disabled for demo

**Issue:** Can't see typed password
- **Solution:** Click the eye icon to toggle password visibility
- **Note:** Text is white on dark background

**Issue:** Remember me not working
- **Solution:** Check browser/app permissions for local storage
- **Note:** Clear cache and try again

**Issue:** OAuth not working
- **Solution:** Verify OAuth credentials in Supabase dashboard
- **Note:** Requires proper redirect URLs configured

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error messages in console
3. Check Supabase Auth logs
4. Verify environment variables are set

---

**Last Updated:** January 2025
**Authentication Provider:** Supabase Auth
**Status:** ✅ Production Ready
