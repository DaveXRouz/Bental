# 🚀 Admin Panel - Quick Reference Card

## 🔐 **LOGIN**
```
Email: michael.chen@demo.com
Password: Welcome2025!
Access: Web browser ONLY
```

---

## 📍 **ADMIN PANEL PAGES**

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin-panel` | Stats & overview |
| Users | `/admin-panel/users` | Manage users |
| Config | `/admin-panel/configuration` | App settings |
| Logs | `/admin-panel/logs` | Audit trail |

---

## ⚡ **QUICK SQL COMMANDS**

### Toggle Feature
```sql
UPDATE feature_flags
SET is_enabled = NOT is_enabled
WHERE flag_name = 'dark_mode';
```

### Make User Admin
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'user@example.com';
```

### Reset Password
```sql
SELECT admin_update_user_password('user@example.com', 'NewPass123!');
```

### View All Configs
```sql
SELECT category, key, value
FROM app_configuration
ORDER BY category;
```

---

## 🎯 **COMMON TASKS**

### In Admin Panel:
1. **View Stats**: Open dashboard
2. **Reset Password**: Users → Find user → Click "Reset Password"
3. **Toggle Feature**: Configuration → Feature Flags → Toggle switch
4. **View Logs**: Logs → See all actions

### Via Database:
```sql
-- System status
SELECT COUNT(*) FROM profiles;                    -- Total users
SELECT COUNT(*) FROM profiles WHERE role='admin'; -- Total admins
SELECT SUM(market_value) FROM holdings;          -- Total value

-- User management
UPDATE profiles SET account_locked=true WHERE email='user@example.com';  -- Lock
UPDATE profiles SET account_locked=false WHERE email='user@example.com'; -- Unlock

-- Feature control
UPDATE feature_flags SET is_enabled=true WHERE flag_name='trading_enabled';
```

---

## 🔄 **REAL-TIME SYNC**

Changes apply **instantly** (<1 second):
- Feature flags toggle
- Configuration updates
- User account status
- All settings

**No app restart needed!**

---

## 🆘 **EMERGENCY**

### Locked Out?
```sql
UPDATE profiles SET role='admin' WHERE email='your@email.com';
```

### Reset All Passwords?
```sql
UPDATE auth.users SET encrypted_password=crypt('Welcome2025!',gen_salt('bf'));
```

### Force Feature Off?
```sql
UPDATE feature_flags SET is_enabled=false WHERE flag_name='feature_name';
```

---

## ✅ **VERIFICATION**

### Check If Admin:
```sql
SELECT email, role FROM profiles WHERE email='your@email.com';
```

### Test Real-Time Sync:
1. Toggle `dark_mode` feature flag OFF
2. Watch app theme change instantly
3. Toggle back ON
4. Theme changes again!

---

## 📊 **AVAILABLE SETTINGS**

### General
- app_name
- maintenance_mode
- allow_new_registrations

### Features
- trading_enabled
- bots_enabled
- crypto_trading
- stock_trading

### Limits
- max_trade_amount (100,000)
- daily_withdrawal_limit (50,000)
- min_account_balance (100)

### Security
- require_2fa_for_withdrawal
- session_timeout_minutes (60)

---

## 🎨 **FEATURE FLAGS**

✅ **Enabled:**
- admin_panel
- advanced_charts
- dark_mode

❌ **Disabled:**
- new_ui_design
- social_trading

**Toggle instantly in admin panel!**

---

## 💡 **PRO TIPS**

1. **Test in staging first** before production changes
2. **Review logs regularly** for suspicious activity
3. **Use SQL** for bulk operations
4. **Admin panel** for quick tasks
5. **Changes sync instantly** - no restart needed!

---

## 📞 **NEED HELP?**

1. Check browser console (F12)
2. Review `DATABASE-ADMIN-GUIDE.md`
3. Check activity logs in admin panel
4. Verify database connection

---

**STATUS: ✅ FULLY OPERATIONAL**

Login now: michael.chen@demo.com / Welcome2025!
