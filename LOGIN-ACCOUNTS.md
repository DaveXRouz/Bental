# 🔐 LOGIN ACCOUNTS - QUICK REFERENCE

## 📱 TWO TEST ACCOUNTS READY

---

## 👨‍💼 ADMIN ACCOUNT

**Purpose:** Admin-only access - Command Center ONLY

```
Email:    michael.chen@demo.com
Password: Welcome2025!
Role:     Administrator
Name:     Michael Chen
```

### What You'll See:
✅ **Admin Panel ONLY** - Complete command center interface
✅ **User Management** - Reset passwords, manage users
✅ **System Stats** - Total users, accounts, holdings value
✅ **Configuration** - Feature flags, app settings
✅ **Activity Logs** - System audit trail
❌ **NO Trading App** - No portfolio, markets, or trading features

### Admin Experience:
- **Automatic redirect** to `/admin-panel` after login
- **No access** to trading features (portfolio, markets, trading)
- **Admin-only interface** - separate from client app
- **Web-based only** - Admin panel requires desktop browser

---

## 👤 CLIENT ACCOUNT

**Purpose:** Regular user with standard app access

```
Email:    amanda.taylor@demo.com
Password: Welcome2025!
Role:     User (Client)
Name:     Amanda Taylor
```

### What You'll See:
✅ **Dashboard** - Portfolio overview, balance
✅ **Portfolio** - Your holdings and watchlist
✅ **Markets** - Stock/crypto market data
✅ **Trade** - Buy/sell interface
✅ **History** - Transaction history
✅ **Profile** - Account settings

### Restrictions:
❌ **No Admin Panel** - Admin tab will not be visible
❌ **No System Settings** - Cannot modify app configuration
❌ **No User Management** - Cannot see other users

---

## 🎯 TESTING SCENARIOS

### Test 1: Login as Admin
1. Open app in browser: Press `w` in terminal
2. Login with: `michael.chen@demo.com` / `Welcome2025!`
3. **Automatically redirected** to Admin Panel (no tabs)
4. See admin control center interface ONLY
5. View system stats, users, configuration

### Test 2: Login as Client (New Browser/Incognito)
1. Open app in incognito/private window
2. Login with: `amanda.taylor@demo.com` / `Welcome2025!`
3. You should see regular app tabs (no Admin tab)
4. Browse portfolio, markets, trading features
5. Limited to personal account features

### Test 3: Compare Views Side-by-Side
1. Open two browser windows
2. Window 1: Login as admin (michael.chen@demo.com)
3. Window 2: Login as client (amanda.taylor@demo.com)
4. Compare the completely different interfaces
5. Admin sees ONLY admin panel, Client sees ONLY trading app

---

## 🔍 KEY DIFFERENCES

| Feature | Admin | Client |
|---------|-------|--------|
| Dashboard | ❌ | ✅ |
| Portfolio | ❌ | ✅ |
| Markets | ❌ | ✅ |
| Trading | ❌ | ✅ |
| History | ❌ | ✅ |
| **Admin Panel** | ✅ | ❌ |
| **User Management** | ✅ | ❌ |
| **System Config** | ✅ | ❌ |
| **Reset Passwords** | ✅ | ❌ |
| **View All Users** | ✅ | ❌ |

---

## 💡 DEMO DATA

Both accounts have:
- ✅ Active trading accounts
- ✅ Demo portfolio holdings
- ✅ Transaction history
- ✅ Sample market data

Amanda (client) has:
- Main Trading Account: ~$42,150 USD
- Holdings in AAPL, GOOGL, MSFT, etc.
- Recent trades and transactions

Michael (admin) has:
- Main Trading Account: ~$52,438 USD
- Holdings portfolio
- PLUS full system access

---

## 🚀 QUICK START

### Open the App
```bash
# In your terminal where dev server is running
# Press: w
```

### First Login (Admin)
1. Email: `michael.chen@demo.com`
2. Password: `Welcome2025!`
3. Click "Sign In"
4. Look for "Admin" tab in bottom navigation

### Second Login (Client) - Use Incognito
1. Open incognito/private browser window
2. Navigate to same URL
3. Email: `amanda.taylor@demo.com`
4. Password: `Welcome2025!`
5. Click "Sign In"
6. Notice: No "Admin" tab visible

---

## 🎨 VISUAL INDICATORS

### Admin Account (Michael)
```
NO TABS - Admin Panel Full Screen Interface
┌────────────────────────────────────────┐
│  ADMIN PANEL - Command Center          │
│  • User Management                     │
│  • System Configuration                │
│  • Activity Logs                       │
│  • Feature Flags                       │
└────────────────────────────────────────┘
```

### Client Account (Amanda)
```
Bottom Navigation Tabs:
[ Home ] [ Portfolio ] [ Markets ] [ Trade ] [ More ]
     Full Trading App Experience
```

---

## 🔒 SECURITY NOTES

- Both passwords are set to `Welcome2025!`
- Passwords are securely hashed in database
- Sessions are independent (can login both simultaneously)
- Admin privileges are checked on every protected action
- Row Level Security (RLS) enforces data access rules

---

## ✅ VERIFICATION CHECKLIST

### After logging in as Admin:
- [ ] Can see Admin tab in navigation
- [ ] Can access `/admin-panel`
- [ ] Can view system statistics
- [ ] Can see list of all users
- [ ] Can reset user passwords
- [ ] Can toggle feature flags

### After logging in as Client:
- [ ] Cannot see Admin tab
- [ ] Dashboard shows personal portfolio
- [ ] Can trade and view markets
- [ ] Can only see own transactions
- [ ] Cannot access admin features

---

## 🆘 TROUBLESHOOTING

**Issue:** Both accounts show admin panel
**Fix:** Check that you're logged in as the correct user in each window

**Issue:** Can't see admin tab for michael.chen@demo.com
**Fix:** Verify role in database: `SELECT email, role FROM profiles WHERE email='michael.chen@demo.com';`

**Issue:** Can't login with either account
**Fix:** Password is case-sensitive: `Welcome2025!` (capital W, ends with !)

---

## 📞 SUPPORT

If you have issues:
1. Check browser console (F12) for errors
2. Verify you're on the correct URL
3. Clear browser cache and try again
4. Ensure dev server is running (press `w` in terminal)

---

**Last Updated:** January 2025
**Status:** ✅ Both Accounts Verified & Ready
**Default Password:** `Welcome2025!` (all accounts)
