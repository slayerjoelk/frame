/**
 * Paywall — Spring-animated bottom sheet with feature grid,
 * 3 pricing tiers, and a gradient backdrop.
 */

import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export interface PaywallProps {
  appName: string;
  tagline?: string;
  visible: boolean;
  title: string;
  subtitle: string;
  features: string[];
  tiers: PricingTier[];
  onSelectTier: (tier: PricingTier) => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Paywall({
  appName,
  tagline,
  visible,
  title,
  subtitle,
  features,
  tiers,
  onSelectTier,
  onClose,
  style,
}: PaywallProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const [selectedTier, setSelectedTier] = useState<string>(tiers.find((t) => t.highlighted)?.id ?? tiers[0]?.id);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, theme.springs.sheet);
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, theme.springs.sheet);
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = useCallback(() => {
    translateY.value = withSpring(SCREEN_HEIGHT, theme.springs.sheet, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose]);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <LinearGradient
          colors={[
            `${theme.palette.background}E6`,
            `${theme.palette.background}CC`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.palette.elevated,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: 1,
            borderColor: `${theme.palette.border}50`,
          },
          sheetStyle,
        ]}
      >
        <LinearGradient
          colors={[
            `${theme.palette.primary}15`,
            "transparent",
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
          style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 32, borderTopRightRadius: 32 }]}
        />

        <View style={styles.handle}>
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: theme.palette.border,
            }}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        >
          <Text
            style={{
              fontSize: theme.typography["3xl"].fontSize,
              fontWeight: theme.typography["3xl"].fontWeight,
              color: theme.palette.textPrimary,
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: theme.typography["3xl"].letterSpacing,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.base.fontSize,
              color: theme.palette.textSecondary,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: theme.typography.base.lineHeight,
            }}
          >
            {subtitle}
          </Text>

          {/* Feature Grid */}
          <View style={styles.featureGrid}>
            {features.map((feature, i) => (
              <FeaturePill key={i} feature={feature} theme={theme} index={i} />
            ))}
          </View>

          {/* Tiers */}
          <View style={{ gap: 12, marginTop: 24 }}>
            {tiers.map((tier, i) => (
              <TierCard
                key={tier.id}
                tier={tier}
                selected={selectedTier === tier.id}
                onSelect={() => setSelectedTier(tier.id)}
                theme={theme}
                index={i}
              />
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={() => {
              const tier = tiers.find((t) => t.id === selectedTier);
              if (tier) onSelectTier(tier);
            }}
            style={{
              marginTop: 24,
              backgroundColor: theme.palette.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.lg.fontSize,
                fontWeight: "700",
                color: theme.palette.textInverse,
              }}
            >
              Continue
            </Text>
          </Pressable>

          <Pressable onPress={handleClose} style={{ marginTop: 16, alignItems: "center" }}>
            <Text
              style={{
                fontSize: theme.typography.sm.fontSize,
                color: theme.palette.textMuted,
              }}
            >
              Maybe Later
            </Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function FeaturePill({
  feature,
  theme,
  index,
}: {
  feature: string;
  theme: ReturnType<typeof createTheme>;
  index: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withDelay(index * 60, withSpring(1, theme.springs.gentle));
    opacity.value = withDelay(index * 60, withSpring(1, theme.springs.gentle));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${theme.palette.surface}`,
          borderWidth: 1,
          borderColor: `${theme.palette.border}30`,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 8,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.palette.success,
        }}
      />
      <Text
        style={{
          fontSize: theme.typography.sm.fontSize,
          fontWeight: "500",
          color: theme.palette.textSecondary,
        }}
      >
        {feature}
      </Text>
    </Animated.View>
  );
}

function TierCard({
  tier,
  selected,
  onSelect,
  theme,
  index,
}: {
  tier: PricingTier;
  selected: boolean;
  onSelect: () => void;
  theme: ReturnType<typeof createTheme>;
  index: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  React.useEffect(() => {
    opacity.value = withDelay(index * 80, withSpring(1, theme.springs.gentle));
    translateX.value = withDelay(index * 80, withSpring(0, theme.springs.gentle));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={() => {
        scale.value = withSpring(0.98, theme.springs.button);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.springs.button);
      }}
    >
      <Animated.View
        style={[
          {
            borderRadius: 18,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? theme.palette.primary : `${theme.palette.border}40`,
            backgroundColor: selected ? `${theme.palette.primary}10` : theme.palette.surface,
            padding: 18,
            position: "relative",
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        {tier.badge && (
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: theme.palette.accent,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: theme.palette.textInverse,
              }}
            >
              {tier.badge}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: theme.typography["2xl"].fontSize,
              fontWeight: "800",
              color: theme.palette.textPrimary,
            }}
          >
            {tier.price}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.sm.fontSize,
              color: theme.palette.textMuted,
            }}
          >
            {tier.period}
          </Text>
        </View>

        <Text
          style={{
            fontSize: theme.typography.base.fontSize,
            fontWeight: "600",
            color: theme.palette.textSecondary,
            marginBottom: 12,
          }}
        >
          {tier.name}
        </Text>

        {tier.features.map((f, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: selected ? theme.palette.primary : theme.palette.textMuted,
              }}
            />
            <Text
              style={{
                fontSize: theme.typography.sm.fontSize,
                color: theme.palette.textSecondary,
              }}
            >
              {f}
            </Text>
          </View>
        ))}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.88,
    paddingTop: 12,
  },
  handle: {
    alignItems: "center",
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
