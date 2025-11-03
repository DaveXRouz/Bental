# Welcome Screen Documentation

## Overview

The Welcome Screen is a professional, animated first-launch experience for your gaming application. It features sophisticated 3D parallax animations, glassmorphic design elements, and a black, gray, and silk white color scheme.

## Features

### Visual Design
- **3D Parallax Background**: Five layers of animated geometric shapes creating depth and motion
- **Glassmorphic Container**: Frosted glass effect with blur and subtle borders
- **Professional Typography**: Clean, bold welcome message with proper hierarchy
- **Black & Gray Theme**: Sophisticated color palette with silk white accents
- **Symmetric Layout**: Centered, grid-based design with balanced spacing

### Animations
- **Background Layers**: Each layer animates independently at different speeds
- **Smooth Transitions**: Entrance animations with staggered timing
- **Performance Optimized**: Uses React Native Reanimated for 60fps UI thread animations
- **Accessibility Support**: Respects device reduce motion settings
- **Scale & Opacity**: Dynamic depth simulation with transform animations

### User Experience
- **First Launch Only**: Automatically detects and shows only on first app open
- **AsyncStorage Integration**: Persists welcome screen status
- **Manual Continue**: Optional "Get Started" button
- **Auto Advance**: Configurable auto-transition after delay
- **Haptic Feedback**: Touch feedback on button press (mobile only)
- **Screen Reader Support**: Full accessibility labels and roles

## File Structure

```
components/glass/
├── WelcomeScreen.tsx          # Main welcome screen component
├── ParallaxBackground.tsx     # 3D parallax animation layer
└── index.ts                   # Updated exports

app/
├── welcome.tsx                # Welcome route handler
└── index.tsx                  # Updated with welcome detection

utils/
└── welcome-screen.ts          # Utility functions for welcome management
```

## Usage

### Basic Implementation

The welcome screen is automatically integrated into the app's navigation flow. On first launch, users will see:

1. App splash screen (native)
2. Welcome screen with animations
3. Login/auth flow

### Route Configuration

The welcome screen is registered in `app/_layout.tsx`:

```typescript
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="welcome" />
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(tabs)" />
</Stack>
```

### Component Props

```typescript
interface WelcomeScreenProps {
  onContinue?: () => void;      // Callback when user continues
  autoAdvance?: boolean;         // Auto-transition after delay
  autoAdvanceDelay?: number;     // Delay in milliseconds (default: 3000)
}
```

### Custom Implementation

```typescript
import { WelcomeScreen } from '@/components/glass/WelcomeScreen';

function CustomWelcome() {
  const handleContinue = () => {
    // Custom navigation logic
  };

  return (
    <WelcomeScreen
      onContinue={handleContinue}
      autoAdvance={false}
    />
  );
}
```

## Utility Functions

### Reset Welcome Screen (For Testing)

```typescript
import { welcomeScreenUtils } from '@/utils/welcome-screen';

// Reset to show welcome screen again
await welcomeScreenUtils.resetWelcome();

// Check if user has seen welcome
const seen = await welcomeScreenUtils.hasSeenWelcome();

// Manually mark as seen
await welcomeScreenUtils.markWelcomeSeen();
```

### Reset from Console (Development)

In your app's dev menu or debug console:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('@app/welcome_shown');
```

## Animation Details

### Background Layers

The parallax background consists of 5 animated layers:

| Layer | Shape | Position | Animation Speed | Z-Index |
|-------|-------|----------|----------------|---------|
| 1 | Circle | Top-left | 10s cycle | -5 |
| 2 | Rectangle | Right-center | 11s cycle | -4 |
| 3 | Rectangle | Top-right | 9.5s cycle | -3 |
| 4 | Circle | Bottom-left | 12s cycle | -2 |
| 5 | Rectangle | Bottom-right | 10.5s cycle | -1 |

### Animation Properties

Each layer animates:
- **Translation X**: -25px to +25px
- **Translation Y**: -30px to +30px
- **Scale**: 0.85x to 1.2x
- **Opacity**: 0.06 to 0.3

### Entrance Sequence

1. **Container** (0ms): Fade in + scale up (600ms)
2. **Title** (200ms): Fade in + translate up (800ms)
3. **Subtitle** (500ms): Fade in + translate up (800ms)
4. **Button** (800ms): Fade in + scale bounce (600ms)

## Performance Considerations

### Optimizations
- Uses `useSharedValue` and `useAnimatedStyle` for UI thread animations
- Worklet functions for 60fps performance
- Conditional animation disabling for reduced motion
- Efficient layer structure with absolute positioning
- No layout recalculations during animation

### Testing Performance
- Test on lower-end devices
- Enable "Show Perf Monitor" in dev menu
- Target: Maintain 60fps throughout animations
- Monitor memory usage with profiler

## Accessibility

### Features
- **Reduce Motion**: Respects `AccessibilityInfo.isReduceMotionEnabled()`
- **Screen Readers**: Full VoiceOver/TalkBack support
- **Semantic HTML**: Proper accessibility roles and labels
- **Keyboard Navigation**: Touch targets meet minimum 44px requirement
- **High Contrast**: Silk white text on black ensures readability

### Testing Accessibility
- Enable VoiceOver (iOS) or TalkBack (Android)
- Navigate through all elements
- Verify all text is announced
- Test button activation

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Background | #000000 | Base background |
| Gradient 1 | #1A1A1A | Gradient accent |
| Gradient 2 | #0A0A0A | Gradient accent |
| Shapes | rgba(80-120, 80-120, 80-120, 0.1-0.2) | Animated layers |
| Glass Container | rgba(255, 255, 255, 0.12) | Border |
| Title Text | #FFFFFF | Primary text |
| Subtitle Text | rgba(255, 255, 255, 0.75) | Secondary text |
| Button Border | rgba(255, 255, 255, 0.15) | Button outline |

## Typography

### Title
- **Font**: Inter-Bold
- **Size**: 40px
- **Line Height**: 48px
- **Letter Spacing**: -1.2px
- **Color**: #FFFFFF
- **Shadow**: rgba(0, 0, 0, 0.8) blur 12px

### Subtitle
- **Font**: Inter-Regular
- **Size**: 17px (Typography.size.lg)
- **Line Height**: 24px
- **Letter Spacing**: -0.2px
- **Color**: rgba(255, 255, 255, 0.75)

### Button Text
- **Font**: Inter-SemiBold
- **Size**: 17px (Typography.size.lg)
- **Letter Spacing**: -0.3px
- **Color**: #FFFFFF

## Troubleshooting

### Welcome Screen Not Showing
1. Clear AsyncStorage: `await AsyncStorage.removeItem('@app/welcome_shown')`
2. Verify navigation: Check `app/index.tsx` redirect logic
3. Check console: Look for AsyncStorage errors

### Animations Stuttering
1. Check device performance capabilities
2. Enable reduced motion for testing
3. Verify no heavy operations during mount
4. Profile with React DevTools

### Button Not Working
1. Verify `onContinue` prop is passed
2. Check for touch event conflicts
3. Test touch target size (minimum 44px)
4. Verify navigation route exists

## Future Enhancements

Possible improvements:
- [ ] Gyroscope-based parallax for device tilt response
- [ ] Customizable color themes
- [ ] Multiple welcome slides with swipe navigation
- [ ] Video background option
- [ ] Particle system effects
- [ ] Sound effects integration
- [ ] Skip animation option
- [ ] Localization support for welcome text

## Browser Compatibility

### Web Platform
- Modern browsers with CSS backdrop-filter support
- Fallback: Solid background on older browsers
- No haptic feedback (mobile only)
- Performance may vary based on GPU

### Mobile Platform
- iOS 13+ recommended
- Android 8+ recommended
- Full animation support
- Haptic feedback enabled

## Credits

Design inspired by modern gaming interfaces with emphasis on depth, motion, and professional aesthetics.
