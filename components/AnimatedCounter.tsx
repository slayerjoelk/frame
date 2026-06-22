/**
 * AnimatedCounter — Number that animates with spring physics when value changes.
 * Supports decimal places, prefix/suffix, and custom formatting.
 */

import React, { useMemo, useEffect, useRef, useState } from "react";
import { Text, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface AnimatedCounterProps {
  appName: string;
  tagline?: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  color?: string;
  weight?: "400" | "500" | "600" | "700" | "800";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
  animateOnMount?: boolean;
}

export default function AnimatedCounter({
  appName,
  tagline,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  size = "2xl",
  color,
  weight = "700",
  style,
  textStyle,
  animateOnMount = true,
}: AnimatedCounterProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const previousValue = useRef(value);
  const animatedValue = useSharedValue(animateOnMount ? 0 : value);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (previousValue.current !== value) {
      animatedValue.value = withSpring(value, theme.springs.gentle);
      scale.value = withSpring(1.08, theme.springs.bounce, () => {
        scale.value = withSpring(1, theme.springs.button);
      });
      previousValue.current = value;
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => {
    const displayValue = animatedValue.value;
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const textStyleDef = theme.typography[size];
  const textColor = color ?? theme.palette.textPrimary;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Text
        style={[
          {
            fontSize: textStyleDef.fontSize,
            lineHeight: textStyleDef.lineHeight,
            letterSpacing: textStyleDef.letterSpacing,
            fontWeight: weight,
            color: textColor,
          },
          textStyle,
        ]}
      >
        {prefix}
        <AnimatedCountValue
          animatedValue={animatedValue}
          decimals={decimals}
        />
        {suffix}
      </Text>
    </Animated.View>
  );
}

function AnimatedCountValue({
  animatedValue,
  decimals,
}: {
  animatedValue: Animated.SharedValue<number>;
  decimals: number;
}) {
  const [display, setDisplay] = React.useState("0");

  // We use a workaround: listen to shared value changes via animated style
  // and update React state for text rendering.
  const listenerStyle = useAnimatedStyle(() => {
    const val = animatedValue.value;
    // We can't call setDisplay directly from UI thread in production safely,
    // but we run a small hack via runOnJS. For simplicity and reliability
    // in generated apps, we just use a derived text approach below.
    return {};
  });

  // Use a requestAnimationFrame loop to sync shared value to display text
  useEffect(() => {
    let frame: number;
    const tick = () => {
      const val = animatedValue.value;
      setDisplay(val.toFixed(decimals));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [decimals]);

  return <>{display}</>;
}
