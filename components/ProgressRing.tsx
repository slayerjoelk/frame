/**
 * ProgressRing — SVG animated circular progress indicator
 * Uses react-native-svg + react-native-reanimated via strokeDashoffset.
 */

import React, { useMemo, useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withDelay,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  appName: string;
  tagline?: string;
  progress: number; // 0 - 1
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ProgressRing({
  appName,
  tagline,
  progress,
  size = 140,
  strokeWidth = 12,
  trackColor,
  progressColor,
  showPercentage = true,
  label,
  style,
}: ProgressRingProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfSize = size / 2;

  const animatedProgress = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withDelay(
      200,
      withSpring(progress, theme.springs.gentle)
    );
    scale.value = withDelay(100, withSpring(1, theme.springs.sheet));
    opacity.value = withDelay(100, withSpring(1, theme.springs.gentle));
  }, [progress]);

  const circleProps = useAnimatedProps(() => {
    const offset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset: offset,
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const percentageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedProgress.value, [0, 0.2, 1], [0, 0, 1]),
  }));

  const fill = progressColor ?? theme.palette.primary;
  const track = trackColor ?? theme.palette.border;

  return (
    <Animated.View style={[styles.container, containerStyle, style]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${halfSize}, ${halfSize}`}>
            <Circle
              cx={halfSize}
              cy={halfSize}
              r={radius}
              stroke={track}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
            <AnimatedCircle
              cx={halfSize}
              cy={halfSize}
              r={radius}
              stroke={fill}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animatedProps={circleProps}
            />
          </G>
        </Svg>
        <View style={[styles.center, { width: size, height: size }]}>
          {showPercentage && (
            <Animated.Text
              style={[
                {
                  fontSize: theme.typography["2xl"].fontSize,
                  fontWeight: theme.typography["2xl"].fontWeight,
                  color: theme.palette.textPrimary,
                  lineHeight: theme.typography["2xl"].lineHeight,
                  letterSpacing: theme.typography["2xl"].letterSpacing,
                },
                percentageStyle,
              ]}
            >
              {Math.round(progress * 100)}%
            </Animated.Text>
          )}
          {label && (
            <Text
              style={{
                fontSize: theme.typography.xs.fontSize,
                fontWeight: "500",
                color: theme.palette.textMuted,
                marginTop: 2,
              }}
            >
              {label}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
