# Monitoring Setup Guide 📊

Quick guide to set up error tracking and monitoring for production.

---

## Option 1: Sentry (Recommended) 🎯

### Why Sentry?
- Real-time error tracking
- Source map support
- Performance monitoring
- User feedback
- Free tier: 5K errors/month

### Setup (10 minutes)

**1. Create Sentry Account**
```bash
# Visit https://sentry.io/signup/
# Create account and new project (React)
```

**2. Install Sentry SDK**
```bash
npm install @sentry/react @sentry/tracing
```

**3. Add Environment Variable**

In `.env.production`:
```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

**4. Initialize Sentry**

Create `lib/sentry.ts`:
```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: 'production',

      // Performance monitoring
      tracesSampleRate: 1.0,

      // Session replay (optional)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Ignore common errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],

      // Add user context
      beforeSend(event, hint) {
        // Add custom data
        return event;
      },
    });
  }
}
```

**5. Add to App Layout**

In `app/_layout.tsx`:
```typescript
import { initSentry } from '@/lib/sentry';

// Initialize Sentry before app renders
initSentry();

export default function RootLayout() {
  // ... rest of layout
}
```

**6. Test Error Tracking**
```typescript
// Trigger test error
throw new Error('Sentry test error');
```

**7. Rebuild and Deploy**
```bash
npm run build:web
vercel --prod
```

---

## Option 2: LogRocket 🎥

### Why LogRocket?
- Session replay
- Network monitoring
- Console logs
- Redux state tracking

### Setup (15 minutes)

```bash
npm install logrocket
```

```typescript
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');

// Identify users
LogRocket.identify(userId, {
  name: userName,
  email: userEmail,
});
```

---

## Option 3: Built-in Monitoring 🔧

Use existing performance monitoring utilities:

### 1. Performance Monitoring

Already integrated! Just export data:

```typescript
import { performanceMonitor } from '@/utils/performance-monitor';

// Get summary
const summary = performanceMonitor.getSummary();

// Export to JSON
const data = performanceMonitor.export();

// Send to backend
await fetch('/api/metrics', {
  method: 'POST',
  body: data,
});
```

### 2. Error Boundary

Already active! Errors are caught by:
- `components/error/ErrorBoundary.tsx`

### 3. WebSocket Monitoring

Already tracked:
- Connection status
- Reconnection attempts
- Message latency

---

## Analytics Setup

### Google Analytics 4 (Recommended)

**1. Create GA4 Property**
- Go to https://analytics.google.com
- Create new property
- Get Measurement ID (G-XXXXXXXXXX)

**2. Add to HTML**

In `dist/index.html` (manually after build, or create custom template):

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**3. Track Custom Events**

```typescript
// Track page views
gtag('event', 'page_view', {
  page_path: window.location.pathname,
});

// Track custom events
gtag('event', 'trade_executed', {
  symbol: 'AAPL',
  amount: 1000,
});
```

---

## Monitoring Dashboards

### Supabase Dashboard

Monitor database performance:
- Query performance
- Connection pool
- Database size
- Active connections

**URL:** https://app.supabase.com/project/your-project/reports

### Vercel Analytics

Built-in performance monitoring:
- Core Web Vitals
- Real user monitoring
- Geographic distribution

**URL:** https://vercel.com/your-project/analytics

---

## Alert Configuration

### Sentry Alerts

Configure alerts for:
- **Error rate > 100/hour** → Email team
- **Performance degradation** → Slack notification
- **Critical errors** → PagerDuty

### Supabase Alerts

Configure alerts for:
- **Database connections > 80%** → Warning
- **Query time > 1s** → Investigation
- **Storage > 90%** → Upgrade needed

---

## Monitoring Checklist

After setup, verify:

- [ ] **Errors tracked** - Trigger test error, see in Sentry
- [ ] **Performance metrics** - Check response times
- [ ] **User analytics** - Verify pageviews tracked
- [ ] **Database metrics** - Check Supabase dashboard
- [ ] **Alerts configured** - Set up critical alerts
- [ ] **Team notifications** - Add team members
- [ ] **Dashboard access** - Share with team

---

## Cost Estimates

### Sentry
- Free: 5K errors/month
- Team: $26/month (50K errors)
- Business: $80/month (200K errors)

### LogRocket
- Free: 1K sessions/month
- Team: $99/month (10K sessions)
- Pro: $249/month (50K sessions)

### Google Analytics
- Free: Unlimited

### Vercel Analytics
- Free: 100K events/month
- Pro: $150/month (10M events)

---

## Quick Setup (Minimal)

If you want basic monitoring RIGHT NOW:

**1. Console Errors (Free, 2 minutes)**

Add this to `app/_layout.tsx`:
```typescript
useEffect(() => {
  // Catch all unhandled errors
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);
    // Send to your backend
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise]', event.reason);
    // Send to your backend
  });
}, []);
```

**2. Performance Monitoring (Already Active)**

Use existing `performanceMonitor` utility - already tracking everything.

**3. Google Analytics (Free, 5 minutes)**

Just add the GA4 script to your HTML.

---

## Recommended Setup for Launch

**Minimal (1 hour):**
1. ✅ Sentry free tier
2. ✅ Google Analytics
3. ✅ Supabase built-in monitoring
4. ✅ Vercel built-in analytics

**Complete (2 hours):**
1. ✅ All minimal items
2. ✅ LogRocket (session replay)
3. ✅ Custom alert rules
4. ✅ Dashboard setup
5. ✅ Team access configured

---

## Next Steps

1. Choose monitoring option (Sentry recommended)
2. Follow setup guide
3. Deploy to production
4. Trigger test error
5. Verify error appears in dashboard
6. Configure alerts
7. Share dashboard with team

---

**Your app will have enterprise-grade monitoring!** 📊
