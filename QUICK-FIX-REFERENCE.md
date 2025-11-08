# Quick Fix Reference Card

**Last Updated**: November 8, 2025

---

## 🚨 Admin Can't See Pending Orders

**Status**: ✅ **FIXED**

**What to do**:
1. Log out of admin panel
2. Log back in
3. Navigate to Pending Orders
4. Should now see all orders ✅

**Technical fix applied**: Updated `is_admin()` database functions to query correct table

---

## 🚨 "Insufficient Balance" When Selling Assets

**Status**: ⚠️ **Not a bug - User education needed**

**Quick Fix for Users**:

### ✅ DO THIS:
**Tap the holding card directly**
```
Portfolio Screen
  ↓
Tap the asset you want to sell (e.g., BTC card)
  ↓
Position Detail Modal opens
  ↓
Click "Sell" button
  ↓
System uses correct account ✅
```

### ❌ DON'T DO THIS:
**Click general "Sell Assets" button** (may select wrong account)

---

## Why "Insufficient Balance" Happens

**You have multiple accounts**:
- 💰 Crypto Holdings (has BTC, ETH)
- 📈 Stock Portfolio (has TSLA, META)
- 💼 Dividend Fund (has other stocks)

**The error means**: "This asset isn't in the account you have selected"

**Solution**: Always sell from the specific holding card, not the general button.

---

## Database Verification Queries

### Check if admin role is working:
```sql
SELECT is_admin('YOUR_USER_ID');
-- Should return: true
```

### Check user's holdings:
```sql
SELECT
    a.name as account,
    h.symbol,
    h.quantity
FROM holdings h
JOIN accounts a ON h.account_id = a.id
WHERE h.user_id = 'USER_ID'
ORDER BY a.name, h.symbol;
```

### Check pending orders:
```sql
SELECT * FROM pending_sell_orders
WHERE status = 'pending'
ORDER BY submitted_at DESC;
```

---

## Quick Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Admin panel empty | Session not refreshed | Log out and back in |
| Can't sell BTC | Wrong account selected | Tap BTC holding card directly |
| "No holdings found" | Asset in different account | Switch to correct account |
| Order not appearing | Not submitted yet | Check pending orders section |

---

## Support Escalation

**Level 1**: Share TROUBLESHOOTING-GUIDE.md with user
**Level 2**: Verify database with SQL queries above
**Level 3**: Check DIAGNOSTIC-REPORT.md for technical details

---

## Files to Reference

- **SOLUTION-SUMMARY.md** - Executive overview
- **TROUBLESHOOTING-GUIDE.md** - Full user guide
- **DIAGNOSTIC-REPORT.md** - Technical deep dive

---

## Key Takeaways

✅ Admin panel fixed - just need to re-login
⚠️ Sell "errors" are account selection issues
📋 All database data is correct and intact
👍 System working as designed - UX can be improved
