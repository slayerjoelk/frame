/**
 * TemplatePicker — Bottom-sheet modal with category filter chips
 * and a 2-column template grid. Uses Reanimated spring for sheet entrance.
 */

import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  thumbnail?: string; // uri or placeholder color
  color?: string;
}

export interface TemplatePickerProps {
  appName: string;
  tagline?: string;
  visible: boolean;
  templates: TemplateItem[];
  categories: string[];
  onSelect: (template: TemplateItem) => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function TemplatePicker({
  appName,
  tagline,
  visible,
  templates,
  categories,
  onSelect,
  onClose,
  style,
}: TemplatePickerProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0] ?? "All");

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, theme.springs.sheet);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, theme.springs.sheet);
      backdropOpacity.value = withTiming(0, { duration: 200 });
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
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const filtered = useMemo(() => {
    if (activeCategory === "All" || !activeCategory) return templates;
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  const itemWidth = (Dimensions.get("window").width - 48 - 12) / 2;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? "auto" : "none" }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.palette.overlay },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.palette.elevated,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: `${theme.palette.border}40`,
          },
          sheetStyle,
        ]}
      >
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

        <Text
          style={{
            fontSize: theme.typography.xl.fontSize,
            fontWeight: theme.typography.xl.fontWeight,
            color: theme.palette.textPrimary,
            paddingHorizontal: 24,
            marginBottom: 16,
            letterSpacing: theme.typography.xl.letterSpacing,
          }}
        >
          Choose Template
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          style={{ marginBottom: 16 }}
        >
          <CategoryChip
            label="All"
            active={activeCategory === "All"}
            onPress={() => setActiveCategory("All")}
            theme={theme}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
              theme={theme}
            />
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {filtered.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              width={itemWidth}
              onPress={() => {
                onSelect(template);
                handleClose();
              }}
              theme={theme}
              index={index}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ReturnType<typeof createTheme>;
}) {
  const scale = useSharedValue(1);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, theme.springs.button);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.springs.button);
      }}
    >
      <Animated.View
        style={[
          {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 999,
            borderWidth: 1,
            backgroundColor: active ? theme.palette.primary : "transparent",
            borderColor: active ? theme.palette.primary : `${theme.palette.border}60`,
            transform: [{ scale }],
          },
        ]}
      >
        <Text
          style={{
            fontSize: theme.typography.sm.fontSize,
            fontWeight: "600",
            color: active ? theme.palette.textInverse : theme.palette.textSecondary,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function TemplateCard({
  template,
  width,
  onPress,
  theme,
  index,
}: {
  template: TemplateItem;
  width: number;
  onPress: () => void;
  theme: ReturnType<typeof createTheme>;
  index: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withDelay(index * 40, withSpring(1, theme.springs.gentle));
    translateY.value = withDelay(index * 40, withSpring(0, theme.springs.gentle));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, theme.springs.button);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.springs.button);
      }}
    >
      <Animated.View
        style={[
          {
            width,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: theme.palette.surface,
            borderWidth: 1,
            borderColor: `${theme.palette.border}30`,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: "100%",
            height: width * 0.8,
            backgroundColor: template.color ?? theme.palette.primary + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: theme.typography["2xl"].fontSize,
              fontWeight: "700",
              color: template.color ?? theme.palette.primary,
            }}
          >
            {template.name[0]}
          </Text>
        </View>
        <View style={{ padding: 12 }}>
          <Text
            style={{
              fontSize: theme.typography.sm.fontSize,
              fontWeight: "600",
              color: theme.palette.textPrimary,
            }}
          >
            {template.name}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.xs.fontSize,
              color: theme.palette.textMuted,
              marginTop: 2,
            }}
          >
            {template.category}
          </Text>
        </View>
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
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingTop: 12,
  },
  handle: {
    alignItems: "center",
    marginBottom: 12,
  },
});
