/**
 * Style helpers to avoid React Native Web issues
 *
 * React Native Web 0.21.0 has a known issue where the `gap` CSS property
 * creates phantom text nodes that trigger "text node cannot be a child of View" errors.
 *
 * Use these helpers instead of the `gap` property.
 */

import { ViewStyle } from 'react-native';

/**
 * Create spacing between flex children without using gap.
 * Wrap each child in a View with the style returned by this function.
 *
 * @example
 * <View style={{ flexDirection: 'row' }}>
 *   <View style={flexSpacing('right', 8)}><Child1 /></View>
 *   <View style={flexSpacing('right', 8)}><Child2 /></View>
 *   <Child3 />
 * </View>
 */
export function flexSpacing(
  direction: 'right' | 'bottom' | 'left' | 'top',
  spacing: number
): ViewStyle {
  switch (direction) {
    case 'right':
      return { marginRight: spacing };
    case 'bottom':
      return { marginBottom: spacing };
    case 'left':
      return { marginLeft: spacing };
    case 'top':
      return { marginTop: spacing };
  }
}

/**
 * Create a container style that uses space-between instead of gap.
 * This works well for evenly distributed items.
 */
export function flexContainer(
  direction: 'row' | 'column' = 'row'
): ViewStyle {
  return {
    flexDirection: direction,
    justifyContent: 'space-between',
  };
}
