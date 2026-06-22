/**
 * AnimatedButton — Pressable with bounce scale animation and haptic feedback.
 * Uses react-native-reanimated for spring physics and expo-haptics for tactile response.
 */

import React, { useMemo, useCallback } from "react";
import {
  Pressable,
  Text,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { createTheme } from "../lib/design-system";

export interface AnimatedButtonProps {
  appName: string;
  tagline?: string;
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  hapticStyle?: "light" | "medium" | "heavy";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedButton({
  appName,
  tagline,
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  hapticStyle = "medium",
  style,
  textStyle,
  icon,
}: AnimatedButtonProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    switch (hapticStyle) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }, [hapticStyle]);

  const handlePressIn = () => {
    scale.value = withSpring(0.94, theme.springs.button);
    opacity.value = withSpring(0.9, theme.springs.button);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.springs.button);
    opacity.value = withSpring(1, theme.springs.button);
  };

  const handlePress = (event: GestureResponderEvent) => {
    triggerHaptic();
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
      backgroundColor: theme.palette.primary,
      borderColor: "transparent",
      color: theme.palette.textInverse,
    },
    secondary: {
      backgroundColor: "transparent",
      borderColor: `${theme.palette.primary}66`,
      color: theme.palette.primary,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: theme.palette.textSecondary,
    },
    danger: {
      backgroundColor: `${theme.palette.danger}DD`,
      borderColor: "transparent",
      color: "#FFFFFF",
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
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          borderWidth: variant === "secondary" || variant === "ghost" ? 1.5 : 0,
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          gap: 8,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          {
            fontSize: currentSize.fontSize,
            fontWeight: "600",
            color: disabled ? theme.palette.textMuted : currentVariant.color,
            letterSpacing: -0.01,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}
