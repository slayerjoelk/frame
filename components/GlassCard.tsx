/**
 * GlassCard — Frosted glass surface using expo-blur + expo-linear-gradient
 * Premium iOS-style translucent card with configurable intensity, border, and tint.
 */

import React, { useMemo, useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface GlassCardProps {
  appName: string;
  tagline?: string;
  children: React.ReactNode;
  intensity?: number; // 1-100 blur intensity
  borderOpacity?: number;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  tint?: "light" | "dark" | "default";
  gradientOverlay?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function GlassCard({
  appName,
  tagline,
  children,
  intensity = 40,
  borderOpacity = 0.12,
  borderWidth = 1,
  borderRadius = 20,
  padding = 20,
  style,
  tint = "dark",
  gradientOverlay = true,
  onPressIn,
  onPressOut,
}: GlassCardProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withDelay(80, withSpring(1, theme.springs.gentle));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, theme.springs.button);
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.springs.button);
    onPressOut?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderRadius,
          borderWidth,
          borderColor: theme.palette.border,
          opacity: borderOpacity,
        },
        animatedStyle,
        style,
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <AnimatedBlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {gradientOverlay && (
        <LinearGradient
          colors={[
            `${theme.palette.primary}10`,
            `${theme.palette.secondary}05`,
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
        />
      )}
      <View style={{ padding, zIndex: 1 }}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
});
