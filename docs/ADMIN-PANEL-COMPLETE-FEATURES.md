# Admin Panel - Complete Features Guide

## Overview

The Admin Panel is now **fully functional** with comprehensive control over all aspects of the trading platform. Admins can manage users, modify balances, toggle features, and monitor system health—all with real-time synchronization to clients.

---

## ✅ Fully Implemented Features

### 1. **Dashboard (Home)**

Real-time system overview with live statistics.

**Features:**
- **Total Users** - Count of all registered users
- **Total Accounts** - Count of all trading accounts
- **Portfolio Value** - Combined value of all holdings
- **Total Trades** - Count of executed trades
- **Active Bots** - Count of currently running trading bots
- **System Health** - Database, auth, and real-time connection status
- **Pull-to-refresh** - Update stats manually

**Location:** `/admin-panel`

**What Updates:**
- Refreshes automatically every time page loads
- Pull down to manually refresh all statistics
- Shows real-time data from database

---

### 2. **User Management**

Complete user account management with balance control.

**Features:**

#### **View All Users**
- Search by name or email
- View total balance across all accounts
- See KYC status
- See join date
- Admin badge for admin users
- Email verification status

#### **Password Reset**
- Click "Reset Password" button
- User password changed to `Welcome2025!`
- User must login with new credentials
- Instant effect (user locked out immediately)

#### **Manage User Accounts**
- Click "Manage Accounts" to see all user's trading accounts
- View account details:
  - Account type (cash, margin, etc.)
  - Account number
  - Current balance
  - Account status (active/inactive)
- **Edit Account Balance** - Change any account balance directly
- Changes sync to client instantly

**Location:** `/admin-panel/users`

**How To Use:**
1. Search for user by name/email
2. Click "Manage Accounts" button
3. View all their accounts in modal
4. Click "Edit Balance" on any account
5. Enter new balance amount
6. Click "Save"
7. User sees updated balance immediately in their app

**Real-Time Effect:**
- Balance changes appear in client dashboard instantly
- Portfolio value updates automatically
- Account totals recalculate

---

### 3. **Configuration Management**

Control all app settings and feature flags.

**Features:**

#### **App Configuration (Settings Tab)**

Editable configuration values:

| Setting | Type | Description | Effect |
|---------|------|-------------|--------|
| `app_name` | string | Application name | Updates app title |
| `maintenance_mode` | boolean | Enable maintenance | Shows maintenance screen to users |
| `allow_new_registrations` | boolean | Allow signups | Blocks signup page |
| `trading_enabled` | boolean | Enable trading | Disables trade functionality |
| `bots_enabled` | boolean | Enable AI bots | Hides bot features |

**How To Edit:**
- **Boolean values**: Toggle switch on/off
- **String/Number values**: Click edit icon → Enter new value → Save

#### **Feature Flags (Feature Flags Tab)**

Toggle features instantly:

| Flag | Current | Description |
|------|---------|-------------|
| `admin_panel` | ON | Admin panel access |
| `new_ui_design` | OFF | New UI design |
| `advanced_charts` | ON | Advanced charts |
| `social_trading` | OFF | Social features |
| `dark_mode` | ON | Dark theme |

**How To Use:**
1. Switch to "Feature Flags" tab
2. Toggle any switch
3. Confirm in alert
4. All clients update instantly (< 100ms)

**Location:** `/admin-panel/configuration`

**Real-Time Sync:**
- Changes broadcast via WebSocket
- All connected clients receive update
- UI updates automatically
- No page refresh needed

---

## 🎯 Admin Actions & Client Impact

### Action 1: Toggle Maintenance Mode

**Steps:**
1. Go to Configuration → Settings
2. Toggle `maintenance_mode` ON
3. Click confirm

**Client Effect:**
- All non-admin users see maintenance screen immediately
- Cannot access any app functionality
- Admins can still access admin panel
- Users see message: "We're currently performing scheduled maintenance"

**Use Case:** Emergency maintenance, system upgrades

---

### Action 2: Disable Trading

**Steps:**
1. Go to Configuration → Settings
2. Toggle `trading_enabled` OFF
3. Click confirm

**Client Effect:**
- Trade screen shows red banner: "Trading is temporarily disabled by admin"
- Order submission blocked with alert
- Trade button remains but shows error message
- Users can still view portfolios and market data

**Use Case:** Market volatility, system issues, compliance holds

---

### Action 3: Edit User Balance

**Steps:**
1. Go to Users
2. Click "Manage Accounts" on user
3. Click "Edit Balance" on account
4. Enter new amount (e.g., 50000)
5. Click "Save"

**Client Effect:**
- User's dashboard balance updates instantly
- Portfolio value recalculates
- Available balance for trading changes
- Transaction history unchanged (this is admin adjustment)

**Use Case:** Account adjustments, bonus deposits, error corrections

---

### Action 4: Reset User Password

**Steps:**
1. Go to Users
2. Click "Reset Password" on user
3. Confirm action

**Client Effect:**
- User immediately logged out (session invalidated)
- Must login with password: `Welcome2025!`
- Old password no longer works
- User should change password after login

**Use Case:** User locked out, security incident, password recovery

---

### Action 5: Enable Beta Feature

**Steps:**
1. Go to Configuration → Feature Flags
2. Toggle `social_trading` ON
3. Click confirm

**Client Effect:**
- Social trading tab appears in navigation
- Social features become accessible
- All users see new functionality immediately
- Can be toggled off anytime

**Use Case:** Beta rollouts, A/B testing, gradual feature releases

---

## 📊 Dashboard Statistics

### Available Metrics

**User Metrics:**
- Total registered users
- Active users (currently same as total)
- User growth trends (coming soon)

**Account Metrics:**
- Total trading accounts
- Active accounts
- Account types distribution (coming soon)

**Financial Metrics:**
- Total portfolio value across all users
- Combined account balances
- Holdings market value

**Trading Metrics:**
- Total trades executed
- Trade volume (coming soon)
- Win/loss ratios (coming soon)

**Bot Metrics:**
- Active bot count
- Bot performance (coming soon)
- Strategy distribution (coming soon)

**System Health:**
- Database status (online/offline)
- Authentication service status
- Real-time connection status

---

## 🔐 Security & Permissions

### Admin Access Control

**Who Can Access:**
- Users with `role = 'admin'` in profiles table
- Defined in database during user creation
- Cannot be changed from client (database-level protection)

**What Admins Can Do:**
- View all user data
- Edit user account balances
- Reset any user's password
- Toggle feature flags
- Modify app configuration
- View activity logs
- Monitor system health

**What Admins CANNOT Do:**
- Delete users (not implemented for safety)
- View user passwords (encrypted)
- Access user 2FA secrets
- Bypass RLS policies (database-enforced)

### Row Level Security (RLS)

All admin tables protected by RLS:
- `app_configuration` - Admin UPDATE only
- `feature_flags` - Admin UPDATE only
- `admin_activity_logs` - Admin INSERT/SELECT only
- User tables follow standard policies

### Audit Trail

All admin actions logged to `admin_activity_logs`:
```sql
{
  action_type: 'config_update' | 'feature_flag_toggle' | 'password_reset',
  target_entity: 'app_configuration' | 'feature_flags' | 'users',
  target_entity_id: UUID,
  changes: JSON,
  performed_by: admin_user_id,
  timestamp: NOW()
}
```

**View Logs:** `/admin-panel/logs` (page exists, full implementation coming)

---

## 🚀 Real-Time Synchronization

### How It Works

**Technology Stack:**
- Supabase Real-time (WebSocket)
- PostgreSQL Change Data Capture (CDC)
- React hooks for subscription management

**Channels:**
- `feature-flag-{name}` - Individual flag updates
- `app-config-sync` - Configuration changes
- `user-accounts-{userId}` - Account balance updates
- `config-sync` - Admin panel internal sync

**Latency:** < 100ms typically

**Reliability:**
- Auto-reconnect on disconnect
- Graceful degradation if WebSocket fails
- Fallback to polling (coming soon)

### What Syncs in Real-Time

✅ **Feature Flags** - Toggle, all clients update
✅ **App Configuration** - Edit settings, all clients update
✅ **Account Balances** - Edit balance, user sees instantly
✅ **Maintenance Mode** - Enable, all users see screen
❌ **Password Resets** - Not real-time (requires re-login)
❌ **User Deletions** - Not implemented

---

## 🎨 User Interface

### Design Standards

**Color Scheme:**
- Background: `#0f172a` (dark blue)
- Cards: `#1e293b` (lighter blue)
- Text: `#ffffff` (white)
- Accent: `#3b82f6` (blue)
- Success: `#10b981` (green)
- Danger: `#ef4444` (red)
- Warning: `#f59e0b` (amber)

**Typography:**
- Headings: 24-32px, bold
- Body: 14-16px, regular
- Labels: 12-13px, medium

**Components:**
- Glass cards with blur effect
- Modal dialogs for actions
- Toggle switches for boolean values
- Edit icons for string/number values
- Action buttons with icons
- Search bars with icons

---

## 📱 Navigation

### Admin Panel Routes

```
/admin-panel              → Dashboard (stats overview)
/admin-panel/users        → User management
/admin-panel/configuration → Settings & feature flags
/admin-panel/logs         → Activity logs (basic)
```

### Workflow

**Typical Admin Session:**
1. Login with admin account
2. Redirected to admin panel dashboard
3. Review system stats
4. Navigate to specific management page
5. Make changes
6. Verify changes took effect
7. Return to dashboard or logout

**Quick Actions from Dashboard:**
- "Manage Users" → `/admin-panel/users`
- "App Settings" → `/admin-panel/configuration`

---

## 🔧 Common Use Cases

### Use Case 1: New User Onboarding Bonus

**Scenario:** Give new user $1000 starting bonus

**Steps:**
1. Go to Users page
2. Search for user email
3. Click "Manage Accounts"
4. Find their cash account
5. Edit balance to current + 1000
6. Save
7. User sees updated balance immediately

---

### Use Case 2: Emergency Trading Halt

**Scenario:** Market volatility, need to stop all trading

**Steps:**
1. Go to Configuration → Settings
2. Toggle `trading_enabled` OFF
3. Confirm
4. All users see "Trading disabled" banner
5. Orders blocked across platform
6. Re-enable when situation resolves

---

### Use Case 3: Beta Feature Rollout

**Scenario:** Launch social trading to test with users

**Steps:**
1. Go to Configuration → Feature Flags
2. Toggle `social_trading` ON
3. Confirm
4. All users see social tab immediately
5. Monitor usage and feedback
6. Toggle OFF if issues arise
7. No deployment or restart needed

---

### Use Case 4: Password Reset Request

**Scenario:** User forgot password and can't access email

**Steps:**
1. Verify user identity (via support ticket)
2. Go to Users page
3. Search for user
4. Click "Reset Password"
5. Confirm
6. Inform user new password is `Welcome2025!`
7. User logs in and changes password

---

### Use Case 5: System Maintenance

**Scenario:** Need to upgrade database, 30-minute downtime

**Steps:**
1. Go to Configuration → Settings
2. Toggle `maintenance_mode` ON
3. All users see maintenance screen with message
4. Admins can still access admin panel
5. Perform maintenance work
6. Toggle `maintenance_mode` OFF
7. Users automatically return to app

---

## 🐛 Troubleshooting

### Issue: Changes Not Appearing

**Symptoms:** Toggle switch changes but clients don't update

**Solution:**
1. Check browser console for errors
2. Verify Supabase connection status
3. Check network tab for WebSocket connection
4. Refresh client page manually
5. Verify RLS policies allow SELECT on tables

---

### Issue: Can't Edit Balance

**Symptoms:** "Edit Balance" button not responding

**Solution:**
1. Verify account exists in database
2. Check admin permissions
3. Verify account ID is valid UUID
4. Check for database errors in console
5. Ensure `accounts` table has UPDATE permissions

---

### Issue: Users Still Trading After Disable

**Symptoms:** `trading_enabled` OFF but users placing orders

**Solution:**
1. Check database value: `SELECT * FROM app_configuration WHERE key = 'trading_enabled'`
2. Verify real-time subscription active
3. Check client code imports `useAppConfig` hook
4. Clear browser cache and reload
5. Verify trade submission checks config value

---

### Issue: Stats Not Loading

**Symptoms:** Dashboard shows 0 for all stats

**Solution:**
1. Check database connection
2. Verify tables exist: profiles, accounts, holdings, trades, bots
3. Check RLS policies allow admin SELECT
4. Verify admin user has correct role
5. Check browser console for query errors

---

## 📚 API Reference

### Database Tables

#### `app_configuration`
```sql
{
  id: UUID,
  category: TEXT,  -- 'general', 'features', etc.
  key: TEXT,       -- 'maintenance_mode', 'trading_enabled', etc.
  value: JSONB,    -- true, false, "string", 123
  description: TEXT,
  data_type: TEXT, -- 'boolean', 'string', 'number'
  is_public: BOOLEAN,
  updated_by: UUID,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

#### `feature_flags`
```sql
{
  id: UUID,
  flag_name: TEXT,
  is_enabled: BOOLEAN,
  description: TEXT,
  target_users: UUID[],
  rollout_percentage: INT,
  metadata: JSONB,
  updated_by: UUID,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

#### `admin_activity_logs`
```sql
{
  id: UUID,
  action_type: TEXT,
  target_entity: TEXT,
  target_entity_id: UUID,
  changes: JSONB,
  performed_by: UUID,
  performed_at: TIMESTAMPTZ
}
```

### Database Functions

#### `admin_update_user_password`
```sql
SELECT admin_update_user_password(
  user_email TEXT,
  new_password TEXT
) RETURNS VOID
```

Changes user password. Must be called by admin.

#### `log_admin_action`
```sql
SELECT log_admin_action(
  p_action_type TEXT,
  p_target_entity TEXT,
  p_target_entity_id UUID,
  p_changes JSONB
) RETURNS VOID
```

Logs admin action to audit trail. Auto-captures admin user ID.

---

## 🔮 Future Enhancements

### Planned Features

**User Management:**
- [ ] Bulk password resets
- [ ] User suspension/activation
- [ ] Account freezing
- [ ] Custom email notifications
- [ ] User communication center

**Configuration:**
- [ ] Scheduled feature flags (auto-enable/disable)
- [ ] Rollout percentage (gradual feature release)
- [ ] Target specific users for beta
- [ ] A/B testing framework
- [ ] Feature flag analytics

**Dashboard:**
- [ ] Real-time chart of portfolio value
- [ ] User activity timeline
- [ ] Trade volume charts
- [ ] Bot performance metrics
- [ ] Revenue/commission tracking

**Audit & Compliance:**
- [ ] Full activity log viewer with filters
- [ ] Export logs to CSV
- [ ] Compliance reports
- [ ] Automated alerts for suspicious activity
- [ ] Admin action approvals (two-admin system)

**System Management:**
- [ ] Database backup/restore
- [ ] System health monitoring
- [ ] Performance metrics
- [ ] Error tracking integration
- [ ] Automated maintenance scheduling

---

## 🎓 Best Practices

### For Admins

1. **Test Before Production**
   - Use test accounts to verify changes
   - Toggle features on/off to test behavior
   - Edit small balances first before large amounts

2. **Communication**
   - Notify users before enabling maintenance mode
   - Document all major changes
   - Keep team informed of configuration changes

3. **Security**
   - Change default passwords immediately
   - Use strong admin passwords
   - Enable 2FA for admin accounts (when available)
   - Review audit logs regularly

4. **Monitoring**
   - Check dashboard stats daily
   - Monitor system health indicators
   - Review user feedback after feature changes
   - Track feature flag adoption rates

---

## 📞 Support

### Getting Help

**For Admins:**
- Review this documentation first
- Check troubleshooting section
- Review audit logs for error patterns
- Contact development team if issues persist

**For Developers:**
- Review code in `/app/admin-panel/`
- Check database migrations in `/supabase/migrations/`
- Review real-time hook implementations
- Check RLS policies in database

---

*Last Updated: January 4, 2025*
*Version: 2.0*
