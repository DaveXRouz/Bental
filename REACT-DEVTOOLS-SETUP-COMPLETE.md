# React DevTools Standalone Setup - Complete

## Installation Summary

The standalone React DevTools has been successfully installed and configured to avoid the Chrome extension semver error with React 19.x.

---

## What Was Installed

- **Package:** react-devtools v7.0.1
- **Location:** /tmp/.npm-global/lib/node_modules/react-devtools
- **Binary:** /tmp/.npm-global/bin/react-devtools

---

## How to Use

### Option 1: Using npm script (Recommended)

```bash
# In a separate terminal window
npm run devtools
```

This will open a standalone React DevTools window that automatically connects to your running app.

### Option 2: Using the shell script

```bash
# In a separate terminal window
./start-devtools.sh
```

### Option 3: Direct command

```bash
# In a separate terminal window
/tmp/.npm-global/bin/react-devtools
```

---

## Usage Workflow

1. **Start React DevTools first:**
   ```bash
   npm run devtools
   ```
   A new window will open showing "Waiting for React to connect..."

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
/tmp/.npm-global/bin/react-devtools --port=8098
```

### Window not appearing

Make sure your display settings allow new windows. On some systems, the window might open in the background.

---

## Alternative: Chrome Extension

If you prefer to use the Chrome extension, you can:

1. Disable it temporarily: `chrome://extensions/`
2. Filter console errors to hide the semver error
3. Wait for an extension update that supports React 19.x

**Note:** The error is already suppressed in your app code (see `app/_layout.tsx` lines 40-93), so it won't affect functionality either way.

---

## Files Modified

1. **package.json** - Added `"devtools"` script
2. **README.md** - Added usage instructions and known issues section
3. **start-devtools.sh** - Created convenience script
4. **This file** - Setup documentation

---

## Quick Reference

```bash
# Start DevTools (standalone)
npm run devtools

# Start app
npm run dev

# Use DevTools
# (window opens automatically, connects to running app)
```

---

## Documentation

- Full workaround guide: `REACT-DEVTOOLS-WORKAROUND.md`
- Official docs: https://www.npmjs.com/package/react-devtools
- React docs: https://react.dev/learn/react-developer-tools

---

**Status:** Setup Complete
**Date:** November 9, 2025
**React Version:** 19.1.0
**DevTools Version:** 7.0.1
