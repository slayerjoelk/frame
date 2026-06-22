/**
 * GlassButton — Frosted glass button with blur effect and spring animation.
 * Uses expo-blur + expo-linear-gradient for premium iOS-style translucent button.
 */

import React, { useMemo, useCallback } from "react";
import {
  Pressable,
  Text,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface GlassButtonProps {
  appName: string;
  tagline?: string;
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  intensity?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GlassButton({
  appName,
  tagline,
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  style,
  textStyle,
  icon,
  intensity = 50,
}: GlassButtonProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, theme.springs.button);
    opacity.value = withSpring(0.85, theme.springs.button);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.springs.button);
    opacity.value = withSpring(1, theme.springs.button);
  };

  const handlePress = (event: GestureResponderEvent) => {
    scale.value = withSequence(
      withSpring(0.92, theme.springs.button),
      withSpring(1, theme.springs.bounce)
    );
    onPress?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
  };

  const variantStyles = {
    primary: {
      gradientColors: [`${theme.palette.primary}DD`, `${theme.palette.secondary}DD`],
      textColor: theme.palette.textInverse,
      borderColor: "transparent",
    },
    secondary: {
      gradientColors: ["transparent", "transparent"],
      textColor: theme.palette.primary,
      borderColor: `${theme.palette.primary}66`,
    },
    ghost: {
      gradientColors: ["transparent", "transparent"],
      textColor: theme.palette.textSecondary,
      borderColor: "transparent",
    },
    danger: {
      gradientColors: [`${theme.palette.danger}DD`, `${theme.palette.danger}`],
      textColor: "#FFFFFF",
      borderColor: "transparent",
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        {
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: variant === "secondary" ? 1.5 : 0,
          borderColor: currentVariant.borderColor,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        animatedStyle,
        style,
      ]}
    >
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={currentVariant.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
      >
        {icon}
        <Text
          style={[
            {
              fontSize: currentSize.fontSize,
              fontWeight: "600",
              color: disabled ? theme.palette.textMuted : currentVariant.textColor,
              letterSpacing: -0.01,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </AnimatedPressable>
  );
}
