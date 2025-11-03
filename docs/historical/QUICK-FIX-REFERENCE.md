# Quick Fix Reference: Module Resolution Errors

## Error: `Cannot find module '@/services/...'`

### Instant Fix Checklist

1. **Does the file exist?**
   ```bash
   ls -la services/[module-name]/
   ```

2. **Is the path alias configured?**
   ```bash
   cat tsconfig.json | grep -A 3 "paths"
   ```

3. **Restart dev server**
   ```bash
   pkill -f "expo start" && npm run dev
   ```

4. **Clear Metro cache if needed**
   ```bash
   npx expo start --clear
   ```

---

## Common Module Resolution Errors

### Error 1: Module Not Found
```
Cannot find module '@/services/media'
```

**Fix**: Create the missing file
```bash
mkdir -p services/media
touch services/media/index.ts
```

### Error 2: Path Alias Not Working
```
Module not found: Can't resolve '@/...'
```

**Fix**: Check tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error 3: Import Works in IDE, Fails in Build
```
Build fails but TypeScript doesn't show error
```

**Fix**: Run type check
```bash
npm run typecheck
```

### Error 4: Case Sensitivity Issues
```
Works on Windows, fails on Mac/Linux
```

**Fix**: Use exact casing
```typescript
// ✅ Correct
import { useAuth } from '@/contexts/AuthContext';

// ❌ Wrong
import { useAuth } from '@/Contexts/authContext';
```

---

## Debug Commands

```bash
# Find all imports of a module
grep -r "from '@/services/media'" --include="*.ts" --include="*.tsx"

# Check if file exists
ls -la services/media/index.ts

# Test TypeScript resolution
npx tsc --traceResolution | grep "media"

# Restart with clean cache
npx expo start --clear

# Check dev server status
curl http://localhost:8081/status
```

---

## Module Creation Template

```typescript
// services/[name]/index.ts

export interface [Name]Config {
  // Define your interface
}

export function use[Name](): [ReturnType] {
  // Implement your hook
  return {
    // Return your data
  };
}

export function get[Name](): [ReturnType] {
  // Implement utility function
  return {
    // Return your data
  };
}
```

---

## Prevention

1. **Before deleting files, check imports**
   ```bash
   grep -r "import.*from '@/services/media'" .
   ```

2. **Run type check regularly**
   ```bash
   npm run typecheck
   ```

3. **Test production builds**
   ```bash
   npm run build:web
   ```

---

## Need More Help?

See **MODULE-RESOLUTION-FIXED.md** for comprehensive documentation.
