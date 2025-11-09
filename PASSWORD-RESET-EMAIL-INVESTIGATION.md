# Password Reset Email Investigation

> ⚠️ **UPDATE REQUIRED**: This investigation references the old Supabase project (`oanohrjkniduqkkahmel`). For current email configuration:
> - Staging: https://supabase.com/dashboard/project/tnjgqdpxvkciiqdrdkyz
> - Production: https://supabase.com/dashboard/project/urkokrimzciotxhykics
>
> See [docs/DEPLOYMENT-ENVIRONMENTS.md](docs/DEPLOYMENT-ENVIRONMENTS.md) for environment details.

---

## Issue Report
**Problem**: When users try to reset their password using the "Forgot Password" flow, they do not receive a password reset email.

## Investigation Results

### ✅ Frontend Implementation - WORKING CORRECTLY

The forgot password UI and logic are properly implemented:

**File**: `app/(auth)/forgot-password.tsx`
- ✅ Clean UI with email input validation
- ✅ Calls `resetPassword()` from AuthContext
- ✅ Shows success message after submission
- ✅ Proper error handling

**File**: `contexts/AuthContext.tsx` (lines 211-227)
```typescript
const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Platform.OS === 'web'
        ? `${window.location.origin}/(auth)/reset-password`
        : 'myapp://reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to send reset email' };
  }
};
```

### ❌ ROOT CAUSE: Supabase Email Configuration

The issue is **NOT** in the application code. The problem is that **Supabase email functionality is NOT configured** on your project.

#### Supabase Email Requirements

By default, Supabase projects DO NOT send emails. You need to configure an email provider in your Supabase dashboard.

#### What Happens Currently

1. ✅ User enters email on forgot password screen
2. ✅ App calls `supabase.auth.resetPasswordForEmail()`
3. ⚠️  Supabase receives the request but has NO email service configured
4. ❌ No email is sent (fails silently)
5. ✅ App shows "Check Your Email" success message (because the API call succeeded)
6. ❌ User never receives the email

## Solution: Configure Supabase Email

You have **three options** to fix this:

---

## Option 1: Use Supabase's Built-in Email (Development Only)

**Best for**: Testing during development

### Steps:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `oanohrjkniduqkkahmel`
3. Navigate to: **Authentication** → **Email Templates**
4. Supabase provides rate-limited email service for development
5. Check if emails are being sent from the dashboard logs

**Limitations**:
- ⚠️ Rate limited (4 emails per hour per user)
- ⚠️ May be flagged as spam
- ⚠️ NOT suitable for production use
- ⚠️ Disabled by default for security

**To Enable**:
```
Dashboard → Authentication → Email Templates →
Enable "Confirm signup" and "Reset password" emails
```

---

## Option 2: Configure Custom SMTP (Recommended for Production)

**Best for**: Production deployments

### Supported Email Services:
- **SendGrid** (recommended - 100 emails/day free)
- **Mailgun** (recommended - 5,000 emails/month free)
- **AWS SES** (very cheap, requires AWS account)
- **Postmark** (100 emails/month free)
- **Custom SMTP** (any email service)

### Setup Steps:

#### A. Get SMTP Credentials

**Using SendGrid** (Example):
1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Create a new API key with "Mail Send" permission
4. Save the API key securely

**Using Mailgun** (Example):
1. Sign up at https://mailgun.com
2. Add and verify your domain (or use their sandbox for testing)
3. Go to Settings → API Keys
4. Copy your SMTP credentials

#### B. Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to: **Project Settings** → **Auth**
3. Scroll to **SMTP Settings**
4. Fill in the details:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@yourdomain.com
Sender Name: Your App Name
```

**For Mailgun**:
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP username]
SMTP Password: [Your Mailgun SMTP password]
Sender Email: noreply@your-verified-domain.com
Sender Name: Trading App
```

5. Click **Save**
6. Send a test email from the dashboard

---

## Option 3: Use Resend (Modern Alternative)

**Best for**: Developers who want a modern, simple solution

### Why Resend?
- ✅ 3,000 emails/month free
- ✅ 100 emails/day free
- ✅ No domain verification needed (use resend.dev subdomain)
- ✅ Great deliverability
- ✅ Modern developer experience

### Setup Steps:

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Use Resend's SMTP credentials:

```
SMTP Host: smtp.resend.com
SMTP Port: 465 (SSL) or 587 (TLS)
SMTP User: resend
SMTP Password: [Your Resend API Key]
Sender Email: onboarding@resend.dev (or your verified domain)
Sender Name: Trading App
```

4. Configure in Supabase SMTP settings (see Option 2B)

---

## Testing the Email Flow

Once you've configured an email provider:

### Test Steps:

1. **Clear any cached states**:
   ```bash
   # Clear browser cache or restart app
   ```

2. **Navigate to Forgot Password**:
   - Go to the login screen
   - Click "Forgot Password?"

3. **Enter a valid email**:
   - Use an email you have access to
   - Submit the form

4. **Check for the email**:
   - Check inbox (may take 1-2 minutes)
   - Check spam/junk folder
   - Check Supabase Dashboard → Logs → Auth for errors

5. **Click the reset link**:
   - Link should redirect to: `/(auth)/reset-password`
   - Enter new password
   - Submit and verify you can login

### Troubleshooting

#### Email Not Received?

1. **Check Supabase Logs**:
   ```
   Dashboard → Logs → Auth
   Look for "reset password" events
   Check for any error messages
   ```

2. **Verify SMTP Configuration**:
   ```
   Dashboard → Project Settings → Auth → SMTP Settings
   Send a test email from the dashboard
   ```

3. **Check Email Provider Logs**:
   - SendGrid: Dashboard → Activity
   - Mailgun: Logs
   - Resend: Activity

4. **Verify Sender Email**:
   - Some providers require domain verification
   - Use a verified "From" address

#### Email Goes to Spam?

- Add SPF and DKIM records to your domain
- Use a professional email address (not gmail/yahoo)
- Add an unsubscribe link in templates
- Warm up your domain (start with small volumes)

---

## Email Templates

Supabase uses default email templates. You can customize them:

### Location:
```
Dashboard → Authentication → Email Templates
```

### Available Templates:
1. **Confirm Signup** - Verify email after signup
2. **Invite User** - Admin invites
3. **Magic Link** - Passwordless login
4. **Reset Password** - Password reset (the one you need)
5. **Change Email Address** - Email change confirmation

### Customize Reset Password Template:

Go to "Reset Password" template and customize:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password for Trading App.</p>
<p>Click the button below to choose a new password:</p>
<a href="{{ .ConfirmationURL }}"
   style="background-color: #10B981; color: white; padding: 12px 24px;
          text-decoration: none; border-radius: 8px; display: inline-block;">
   Reset Password
</a>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Thanks,<br>The Trading App Team</p>
```

---

## Quick Start Recommendations

### For Development/Testing:
1. ✅ Use **Resend** (easiest, 3k emails/month free)
2. ✅ Use resend.dev subdomain (no verification needed)
3. ✅ Configure in 5 minutes

### For Production:
1. ✅ Use **SendGrid** or **Mailgun** (reliable, scalable)
2. ✅ Verify your custom domain
3. ✅ Set up SPF/DKIM records
4. ✅ Customize email templates to match your brand

---

## Current Configuration Check

### Your Supabase Project:
```
URL: https://oanohrjkniduqkkahmel.supabase.co
Project ID: oanohrjkniduqkkahmel
```

### To Check Current Email Setup:
1. Login to https://supabase.com/dashboard
2. Select project `oanohrjkniduqkkahmel`
3. Go to: **Project Settings** → **Auth**
4. Scroll to **SMTP Settings**
5. Check if SMTP is configured

### Expected Status:
- ❌ SMTP not configured (most likely)
- ❌ No email provider set up
- ❌ Emails not being sent

---

## Implementation Checklist

- [ ] Choose an email provider (Resend, SendGrid, or Mailgun)
- [ ] Sign up and get SMTP credentials
- [ ] Configure SMTP in Supabase Dashboard
- [ ] Customize email templates (optional)
- [ ] Send test email from Supabase Dashboard
- [ ] Test forgot password flow in your app
- [ ] Verify email delivery
- [ ] Check spam folder
- [ ] Test reset link works
- [ ] Verify new password works for login

---

## Cost Analysis

### Free Tier Comparison:

| Provider | Free Emails | Cost After Free | Setup Difficulty |
|----------|-------------|-----------------|------------------|
| **Resend** | 3,000/month | $20/50k | ⭐ Easy |
| **SendGrid** | 100/day | $20/40k | ⭐⭐ Medium |
| **Mailgun** | 5,000/month | $35/50k | ⭐⭐ Medium |
| **AWS SES** | 3,000/month* | $0.10/1k | ⭐⭐⭐ Hard |
| **Postmark** | 100/month | $10/10k | ⭐⭐ Medium |

*AWS SES: First 3,000 if sent from EC2

### Recommendation:
- **For MVP/Testing**: Resend (easiest + generous free tier)
- **For Production**: SendGrid or Mailgun (proven reliability)
- **For High Volume**: AWS SES (cheapest at scale)

---

## Alternative: Passwordless Authentication

If you don't want to deal with email configuration immediately, consider these alternatives:

### Option A: Magic Links
- User enters email
- Receives login link
- No password needed
- Still requires email setup

### Option B: Phone/SMS
- Use Twilio or similar
- Send reset code via SMS
- Requires phone number collection

### Option C: Social Auth Only
- Google Sign-In
- Apple Sign-In
- No password reset needed

**Note**: These still require proper authentication setup but avoid the "forgot password" issue.

---

## Monitoring & Maintenance

Once emails are working:

### Monitor Deliverability:
1. Check bounce rates (should be < 5%)
2. Monitor spam complaints (should be < 0.1%)
3. Track email open rates
4. Review provider dashboards weekly

### Best Practices:
- ✅ Use a consistent sender email
- ✅ Include unsubscribe links
- ✅ Don't send too many emails at once
- ✅ Keep email templates professional
- ✅ Test on multiple email clients
- ✅ Monitor Supabase Auth logs

---

## Summary

**The Problem**:
- Your code is correct ✅
- Supabase connection works ✅
- Email provider is NOT configured ❌

**The Solution**:
1. Choose an email provider (Resend recommended)
2. Get SMTP credentials
3. Configure in Supabase Dashboard
4. Test the flow
5. Emails should work!

**Time to Fix**: 10-15 minutes with Resend

**Next Steps**:
1. Pick Resend, SendGrid, or Mailgun
2. Follow setup steps above
3. Configure SMTP in Supabase
4. Test forgot password flow
5. You're done! 🎉

---

## Support Resources

- **Supabase Email Docs**: https://supabase.com/docs/guides/auth/auth-smtp
- **Resend**: https://resend.com/docs
- **SendGrid**: https://docs.sendgrid.com
- **Mailgun**: https://documentation.mailgun.com

---

**Status**: Investigation Complete
**Root Cause**: Missing email provider configuration in Supabase
**Fix Difficulty**: Easy (10-15 minutes)
**Blocker**: Requires external service account (Resend/SendGrid/Mailgun)
