# Email Setup Quick Start Guide

## The Problem
Password reset emails are not being sent because Supabase doesn't have an email provider configured.

## Quick Fix (5 Minutes with Resend)

### Step 1: Get Resend API Key
1. Go to https://resend.com
2. Click "Start Building for Free"
3. Sign up with your email
4. Go to API Keys section
5. Create new API key
6. Copy the API key (starts with `re_`)

### Step 2: Configure Supabase
1. Go to https://supabase.com/dashboard
2. Select your project: `oanohrjkniduqkkahmel`
3. Navigate to: **Project Settings** → **Auth**
4. Scroll down to **SMTP Settings**
5. Click "Enable Custom SMTP"
6. Fill in these details:

```
Sender Name: Trading App
Sender Email: onboarding@resend.dev
Host: smtp.resend.com
Port Number: 465
Username: resend
Password: [Paste your Resend API key]
```

7. Click **Save**

### Step 3: Test
1. Go back to your app
2. Click "Forgot Password?"
3. Enter your email
4. Check your inbox (should arrive in 1-2 minutes)
5. Click the link in the email
6. Set new password
7. Done! ✅

## Alternative: SendGrid (10 Minutes)

### Step 1: Get SendGrid API Key
1. Go to https://sendgrid.com
2. Sign up (100 emails/day free)
3. Verify your email
4. Go to Settings → API Keys
5. Create API key with "Mail Send" permission
6. Copy the API key (starts with `SG.`)

### Step 2: Configure Supabase
```
Sender Name: Trading App
Sender Email: noreply@yourdomain.com
Host: smtp.sendgrid.net
Port Number: 587
Username: apikey
Password: [Paste your SendGrid API key]
```

### Step 3: Test
Same as above!

## Troubleshooting

### Email not arriving?
1. Check spam/junk folder
2. Wait 2-3 minutes
3. Check Supabase Dashboard → Logs → Auth for errors
4. Verify SMTP settings are saved

### Test email failed?
1. Double-check API key is correct
2. Ensure "Sender Email" matches your provider's requirements
3. For Resend, use: `onboarding@resend.dev`
4. For SendGrid, use your verified domain

### Link not working?
1. Make sure you're on the web version
2. Check the redirect URL in AuthContext.tsx (should be correct)
3. Try copying the link and pasting in browser

## What's Next?

Once emails are working:
1. ✅ Customize email templates in Supabase
2. ✅ Add your own domain (optional)
3. ✅ Set up SPF/DKIM records (for better deliverability)
4. ✅ Monitor email delivery in provider dashboard

## Cost

**Resend**: 3,000 emails/month free
**SendGrid**: 100 emails/day free (3,000/month)
**Both are FREE for development and small apps!**

---

**Total Time**: 5-10 minutes
**Difficulty**: Easy
**Result**: Working password reset emails! 🎉
