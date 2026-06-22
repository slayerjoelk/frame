/**
 * Celebration — Confetti particle overlay with gravity, rotation, and fade.
 * Uses react-native-reanimated for physics-based particle animation.
 */

import React, { useMemo, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface CelebrationProps {
  appName: string;
  tagline?: string;
  active: boolean;
  particleCount?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  onComplete?: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  shape: "circle" | "square" | "triangle";
}

function generateParticles(
  count: number,
  palette: ReturnType<typeof createTheme>["palette"]
): Particle[] {
  const colors = [
    palette.primary,
    palette.secondary,
    palette.accent,
    palette.success,
    palette.warning,
    palette.danger,
  ];
  const shapes: Particle["shape"][] = ["circle", "square", "triangle"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 10,
    delay: Math.random() * 400,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }));
}

export default function Celebration({
  appName,
  tagline,
  active,
  particleCount = 60,
  duration = 3000,
  style,
  onComplete,
}: CelebrationProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const [particles] = useState(() => generateParticles(particleCount, theme.palette));
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration + 500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }, style]}>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} theme={theme} duration={duration} />
      ))}
    </View>
  );
}

function ConfettiParticle({
  particle,
  theme,
  duration,
}: {
  particle: Particle;
  theme: ReturnType<typeof createTheme>;
  duration: number;
}) {
  const startY = useSharedValue(-20);
  const endY = SCREEN_HEIGHT + 40 + Math.random() * 100;
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    const fallDuration = duration * (0.6 + Math.random() * 0.6);

    startY.value = withDelay(
      particle.delay,
      withTiming(endY, {
        duration: fallDuration,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      })
    );

    rotate.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(720 + Math.random() * 360, {
          duration: fallDuration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: fallDuration - 600 }),
        withTiming(0, { duration: 400 })
      )
    );

    drift.value = withDelay(
      particle.delay,
      withTiming((Math.random() - 0.5) * 120, {
        duration: fallDuration,
        easing: Easing.inOut(Easing.ease),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: startY.value },
      { translateX: particle.x + drift.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: particle.size,
          height: particle.shape === "triangle" ? particle.size * 1.2 : particle.size,
          backgroundColor: particle.shape === "triangle" ? "transparent" : particle.color,
          borderRadius: particle.shape === "circle" ? particle.size / 2 : particle.shape === "square" ? 2 : 0,
          borderTopWidth: particle.shape === "triangle" ? particle.size : 0,
          borderLeftWidth: particle.shape === "triangle" ? particle.size / 2 : 0,
          borderRightWidth: particle.shape === "triangle" ? particle.size / 2 : 0,
          borderTopColor: particle.shape === "triangle" ? particle.color : "transparent",
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
        },
        animatedStyle,
      ]}
    />
  );
}
