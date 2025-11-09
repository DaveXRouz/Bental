# React DevTools Standalone Setup - Complete

## Installation Summary

Standalone React DevTools has been configured to avoid the Chrome extension semver error with React 19.x.

---

## What Was Configured

- **Method:** Using `npx react-devtools` (on-demand execution)
- **Version:** react-devtools@7.0.1 (downloads automatically when run)
- **Benefit:** No global installation needed, always uses latest version

---

## How to Use

### Method 1: Using npm script (Recommended)

```bash
# In a separate terminal window
npm run devtools
```

This will download react-devtools if needed and open the standalone window.

### Method 2: Using the shell script

```bash
# In a separate terminal window
./start-devtools.sh
```

### Method 3: Direct npx command

```bash
# In a separate terminal window
npx react-devtools
```

---

## Usage Workflow

1. **Start React DevTools first:**
   ```bash
   npm run devtools
   ```
   Wait for the window to open showing "Waiting for React to connect..."

2. **Then start your app:**
   ```bash
   npm run dev
   ```

3. **The DevTools will automatically connect** when your app loads in the browser

4. **Use the DevTools window** to inspect React components, props, state, and performance

5. **Keep both windows open** during development

---

## Benefits Over Chrome Extension

1. **No semver errors** - Fully compatible with React 19.x
2. **Better performance** - Dedicated app, not limited by browser extension constraints
3. **Works across browsers** - Not tied to Chrome
4. **More stable** - Direct connection to React without browser middleware
5. **Cleaner console** - No extension-related errors cluttering your console
6. **Always up-to-date** - npx downloads latest version automatically

---

## Troubleshooting

### DevTools won't connect

1. Make sure React DevTools is running BEFORE you start your app
2. Refresh your browser after starting DevTools
3. Check that both windows are open (DevTools + Browser)
4. Restart both DevTools and your app

### Port conflicts

If you see port errors, the DevTools uses port 8097 by default. You can change it:

```bash
npx react-devtools --port=8098
```

### Window not appearing

Make sure your display settings allow new windows. On some systems, the window might open in the background.

### Slow first launch

The first time you run `npm run devtools`, npx will download the package. Subsequent runs will be faster.

---

## Alternative: Chrome Extension

If you prefer to use the Chrome extension, you can:

1. Disable it temporarily: `chrome://extensions/`
2. Filter console errors to hide the semver error
3. Wait for an extension update that supports React 19.x

**Note:** The error is already suppressed in your app code (see `app/_layout.tsx` lines 40-93), so it won't affect functionality either way.

---

## Files Modified

1. **package.json** - Added `"devtools": "npx react-devtools"` script
2. **README.md** - Added usage instructions and known issues section
3. **start-devtools.sh** - Updated to use npx
4. **This file** - Complete setup documentation

---

## Quick Reference

```bash
# Start DevTools (standalone) - Terminal 1
npm run devtools

# Start app - Terminal 2
npm run dev

# DevTools window opens automatically and connects
```

---

## Why npx Instead of Global Install?

Using `npx` provides several advantages:
- No need for global installation
- Always uses the latest version
- Works in any environment without setup
- No path or permission issues
- Downloads automatically on first use

---

## Documentation

- Full workaround guide: `REACT-DEVTOOLS-WORKAROUND.md`
- Official docs: https://www.npmjs.com/package/react-devtools
- React docs: https://react.dev/learn/react-developer-tools

---

**Status:** Ready to Use
**Date:** November 9, 2025
**React Version:** 19.1.0
**Method:** npx (on-demand)
