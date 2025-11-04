import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

interface MinimalLogoProps {
  size?: number;
}

export function MinimalLogo({ size = 64 }: MinimalLogoProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
      >
        <Defs>
          <SvgGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="rgba(220, 220, 220, 1)" />
            <Stop offset="50%" stopColor="rgba(200, 200, 200, 0.95)" />
            <Stop offset="100%" stopColor="rgba(180, 180, 180, 0.9)" />
          </SvgGradient>
        </Defs>

        {/* Left stroke - top to bottom */}
        <Path
          d="M 20 15 L 80 85"
          stroke="url(#xGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right stroke - top to bottom */}
        <Path
          d="M 80 15 L 20 85"
          stroke="url(#xGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highlight on left stroke */}
        <Path
          d="M 25 20 L 75 70"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Highlight on right stroke */}
        <Path
          d="M 75 20 L 25 70"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
