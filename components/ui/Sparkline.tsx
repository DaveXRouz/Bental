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

  const minValue = Math.min(...validData);
  const maxValue = Math.max(...validData);
  const range = maxValue - minValue || 1;

  const points = validData.map((value, index) => {
    const x = (index / (validData.length - 1 || 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x: isFinite(x) ? x : 0, y: isFinite(y) ? y : height };
  });

  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }
    const prevPoint = points[index - 1];
    const cpX = (prevPoint.x + point.x) / 2;
    return `${acc} Q ${cpX},${prevPoint.y} ${cpX},${point.y} Q ${cpX},${point.y} ${point.x},${point.y}`;
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
          strokeWidth={2}
          fill="none"
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
