/**
 * ThemedView — Base container with automatic theme-aware background and styling.
 * Provides consistent surface/background handling across the app.
 */

import React, { useMemo } from "react";
import { View, ViewStyle, StyleProp, StyleSheet } from "react-native";
import { createTheme, AppDomain } from "../lib/design-system";

export interface ThemedViewProps {
  appName: string;
  tagline?: string;
  children: React.ReactNode;
  variant?: "background" | "surface" | "elevated" | "transparent";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  domain?: AppDomain;
}

export default function ThemedView({
  appName,
  tagline,
  children,
  variant = "background",
  padding = "none",
  rounded = "none",
  bordered = false,
  style,
  domain,
}: ThemedViewProps) {
  const theme = useMemo(() => {
    if (domain) {
      return createTheme(appName, tagline);
    }
    return createTheme(appName, tagline);
  }, [appName, tagline, domain]);

  const backgroundColor = {
    background: theme.palette.background,
    surface: theme.palette.surface,
    elevated: theme.palette.elevated,
    transparent: "transparent",
  }[variant];

  const paddingStyles = {
    none: {},
    sm: { padding: 8 },
    md: { padding: 16 },
    lg: { padding: 24 },
    xl: { padding: 32 },
  }[padding];

  const borderRadius = {
    none: 0,
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    "2xl": 28,
    full: 9999,
  }[rounded];

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius,
          borderColor: bordered ? theme.palette.border : "transparent",
          borderWidth: bordered ? 1 : 0,
        },
        paddingStyles,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function getThemedStyles(
  appName: string,
  tagline?: string,
  domain?: AppDomain
) {
  const theme = createTheme(appName, tagline);
  return StyleSheet.create({
    background: {
      backgroundColor: theme.palette.background,
    },
    surface: {
      backgroundColor: theme.palette.surface,
      borderRadius: 16,
      borderColor: theme.palette.border,
      borderWidth: 1,
    },
    elevated: {
      backgroundColor: theme.palette.elevated,
      borderRadius: 20,
      borderColor: theme.palette.border,
      borderWidth: 1,
    },
    card: {
      backgroundColor: theme.palette.surface,
      borderRadius: 16,
      padding: 16,
      borderColor: theme.palette.border,
      borderWidth: 1,
    },
    section: {
      backgroundColor: theme.palette.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
    },
    divider: {
      height: 1,
      backgroundColor: theme.palette.border,
    },
    textPrimary: {
      color: theme.palette.textPrimary,
    },
    textSecondary: {
      color: theme.palette.textSecondary,
    },
    textMuted: {
      color: theme.palette.textMuted,
    },
    textInverse: {
      color: theme.palette.textInverse,
    },
  });
}
