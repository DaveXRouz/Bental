import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useThemeStore } from '@/stores/useThemeStore';

interface SparklineProps {
  data: number[];
  color?: string;
  fillColor?: string;
  height?: number;
  width?: number;
  testID?: string;
}

export function Sparkline({
  data,
  color,
  fillColor,
  height = 40,
  width = Dimensions.get('window').width - 32,
  testID
}: SparklineProps) {
  const { colors } = useThemeStore();
  const chartColor = color || colors.primary;
  const areaFillColor = fillColor || chartColor;

  // Filter out invalid data (NaN, null, undefined)
  const validData = data.filter(val => typeof val === 'number' && !isNaN(val) && isFinite(val));

  if (!validData || validData.length === 0) {
    return null;
  }

  // Smooth data to reduce extreme spikes using moving average
  const smoothData = validData.length > 3 ? validData.map((val, idx) => {
    if (idx === 0 || idx === validData.length - 1) return val;

    // 3-point moving average
    const prev = validData[idx - 1];
    const next = validData[idx + 1];
    return (prev + val + next) / 3;
  }) : validData;

  const minValue = Math.min(...smoothData);
  const maxValue = Math.max(...smoothData);
  const range = maxValue - minValue || 1;

  const points = smoothData.map((value, index) => {
    const x = (index / (smoothData.length - 1 || 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x: isFinite(x) ? x : 0, y: isFinite(y) ? y : height };
  });

  // Use smooth cubic bezier curves for better line rendering
  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }

    const prevPoint = points[index - 1];

    // Calculate control points for smooth cubic bezier curve
    const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
    const cp1y = prevPoint.y;
    const cp2x = prevPoint.x + (2 * (point.x - prevPoint.x)) / 3;
    const cp2y = point.y;

    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
  }, '');

  const areaPathData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <View style={[styles.container, { height, width }]} testID={testID}>
      <Svg width={width} height={height}>
        <Path
          d={areaPathData}
          fill={areaFillColor}
        />
        <Path
          d={pathData}
          stroke={chartColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
