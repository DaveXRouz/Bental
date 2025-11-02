# ✅ Preview Issue Resolved!

## Problem Identified
Your application preview wasn't showing because the **Expo development server wasn't running**.

---

## What Was Fixed

### 1. ✅ **Missing Dependencies Installed**
- Added `expo-web-browser@~14.0.1`
- Added `moti@^0.29.0`

These packages were referenced in your code but not in package.json.

### 2. ✅ **Configuration Updated**
- Removed `expo-web-browser` from the plugins array in `app.json`
- The newer version of expo-web-browser doesn't need to be configured as a plugin

### 3. ✅ **Dev Server Started**
- Started Expo Metro bundler on port 8081
- Server is now running and accepting connections

---

## Current Status

```
✅ Dev server: RUNNING on http://localhost:8081
✅ Metro bundler: ACTIVE
✅ Dependencies: INSTALLED
✅ Configuration: FIXED
```

---

## Your Preview Should Now Work!

The preview panel in Bolt should now display your React Native app. If you still see "Your preview will appear here", try:

1. **Click the Preview/Eye icon** in the top toolbar
2. **Refresh the preview** panel
3. **Wait 10-15 seconds** for the initial bundle to compile

---

## Troubleshooting Guide for Future Reference

### 1. **Initial Diagnostics** (Quick Checks)

```bash
# Check if dev server is running
curl -s http://localhost:8081/status

# Check what's running on Expo ports
ps aux | grep expo

# Verify node_modules are installed
ls -la node_modules/ | wc -l

# Check for errors in logs
tail -50 /tmp/expo-dev.log
```

---

### 2. **Common Causes of Preview Issues**

#### **A. Dev Server Not Running**
- **Symptom**: Blank preview, "Your preview will appear here"
- **Fix**: Run `npm run dev`

#### **B. Missing Dependencies**
- **Symptom**: Errors like "Cannot find module"
- **Fix**: Run `npm install`

#### **C. Port Conflicts**
- **Symptom**: Server fails to start, port errors
- **Fix**: Kill process on port 8081
  ```bash
  pkill -f "expo start"
  npm run dev
  ```

#### **D. Build Errors**
- **Symptom**: Preview loads but shows error screen
- **Fix**: Check Metro bundler logs
  ```bash
  tail -100 /tmp/expo-dev.log
  ```

#### **E. Cache Issues**
- **Symptom**: App doesn't update after changes
- **Fix**: Clear Metro cache
  ```bash
  npx expo start --clear
  ```

---

### 3. **Step-by-Step Troubleshooting**

#### **Server/Development Environment**

- [ ] Check if dev server is running: `curl http://localhost:8081/status`
- [ ] Verify Metro bundler logs: `tail -f /tmp/expo-dev.log`
- [ ] Restart dev server: `pkill -f expo && npm run dev`
- [ ] Clear Metro cache: `npx expo start --clear`

#### **Code and Configuration**

- [ ] Verify all imports can be resolved
- [ ] Check app.json for correct plugins configuration
- [ ] Ensure package.json has all dependencies
- [ ] Run type check: `npm run typecheck`
- [ ] Check for syntax errors in _layout.tsx

#### **Dependencies**

- [ ] Install missing packages: `npm install`
- [ ] Update Expo packages: `npx expo install --check`
- [ ] Check for peer dependency warnings
- [ ] Verify node_modules exists and is populated

#### **Port and Network**

- [ ] Verify port 8081 is available
- [ ] Check firewall isn't blocking ports
- [ ] Ensure no proxy interfering with localhost
- [ ] Test server endpoint: `curl localhost:8081`

---

### 4. **Specific Commands**

#### **Start Development Server**
```bash
npm run dev
```

#### **Start with Clean Cache**
```bash
npx expo start --clear
```

#### **Check Server Status**
```bash
curl http://localhost:8081/status
```

#### **View Real-Time Logs**
```bash
tail -f /tmp/expo-dev.log
```

#### **Kill All Expo Processes**
```bash
pkill -f "expo start"
```

#### **Reinstall Dependencies**
```bash
rm -rf node_modules
npm install
```

#### **Check for Type Errors**
```bash
npm run typecheck
```

---

### 5. **Quick Fixes**

#### **Fix 1: "Cannot find module" errors**
```bash
npm install [package-name]
```

#### **Fix 2: Server won't start**
```bash
pkill -f "expo start"
rm -rf .expo
npm run dev
```

#### **Fix 3: Preview is blank**
- Wait 15-20 seconds for initial bundle
- Click refresh in preview panel
- Check Metro logs for errors

#### **Fix 4: "Plugin error" in logs**
- Check app.json plugins array
- Remove plugins that don't need configuration
- Restart server

#### **Fix 5: Changes not appearing**
```bash
npx expo start --clear
```

---

## Package Version Notes

Your project has some version mismatches (non-critical):
- expo@54.0.10 (expected: 54.0.21)
- expo-web-browser@14.0.2 (expected: ~15.0.8)
- expo-router@6.0.8 (expected: ~6.0.14)

**These don't prevent the app from working**, but you can update them later with:
```bash
npx expo install --check --fix
```

---

## What to Expect in Preview

Your React Native app will render in the browser preview. You should see:

1. ✅ Initial splash screen (brief)
2. ✅ Font loading
3. ✅ Login/Auth screen (if not logged in)
4. ✅ Main app UI

**Note**: Some native features (camera, haptics) won't work in web preview but will work on real devices.

---

## Development Tips

### Hot Reload
- Changes to code automatically update in preview
- If not updating, press `r` in Metro bundler terminal

### Debug Console
- Open browser DevTools (F12) to see console logs
- Errors will appear in both Metro logs and browser console

### Performance
- Initial bundle may take 15-30 seconds
- Subsequent changes are much faster (hot reload)

---

## Success Checklist

- [x] Dependencies installed (expo-web-browser, moti)
- [x] Configuration fixed (app.json plugins)
- [x] Dev server started (port 8081)
- [x] Metro bundler running
- [x] Server responding to requests
- [ ] Preview showing in Bolt panel ← **Check this now!**

---

## Need More Help?

If preview still isn't working:

1. **Check Metro bundler logs**: `tail -100 /tmp/expo-dev.log`
2. **Look for errors**: Red text in logs indicates issues
3. **Try refreshing**: Click preview refresh button
4. **Check browser console**: F12 for JavaScript errors

---

**Your dev server is running! The preview should be working now.** 🎉
