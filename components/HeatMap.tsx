/**
 * HeatMap — GitHub-style contribution calendar grid
 * 7 rows (days) x N columns (weeks) with staggered spring entrance animation.
 */

import React, { useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Dimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { createTheme } from "../lib/design-system";

export interface HeatMapData {
  date: string; // ISO date string
  value: number; // 0 - 4 intensity level
}

export interface HeatMapProps {
  appName: string;
  tagline?: string;
  data: HeatMapData[];
  weeks?: number;
  cellSize?: number;
  cellGap?: number;
  style?: StyleProp<ViewStyle>;
  showLabels?: boolean;
  colorIntensity?: string[]; // optional custom 5-level palette (0-4)
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function HeatMap({
  appName,
  tagline,
  data,
  weeks = 20,
  cellSize = 12,
  cellGap = 3,
  style,
  showLabels = true,
  colorIntensity,
}: HeatMapProps) {
  const theme = useMemo(() => createTheme(appName, tagline), [appName, tagline]);

  const intensityColors = colorIntensity ?? [
    `${theme.palette.border}40`,
    `${theme.palette.primary}30`,
    `${theme.palette.primary}60`,
    `${theme.palette.primary}90`,
    theme.palette.primary,
  ];

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - weeks * 7);

  // Build grid: 7 rows (days) x weeks columns
  const grid = useMemo(() => {
    const result: (HeatMapData | null)[][] = [];
    for (let row = 0; row < 7; row++) {
      result[row] = [];
      for (let col = 0; col < weeks; col++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + col * 7 + row);
        const iso = cellDate.toISOString().split("T")[0];
        const entry = data.find((d) => d.date === iso);
        result[row][col] = entry ?? null;
      }
    }
    return result;
  }, [data, weeks, startDate.getTime()]);

  const monthLabels = useMemo(() => {
    const labels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < weeks; col++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + col * 7);
      const month = cellDate.getMonth();
      if (month !== lastMonth) {
        labels.push({ month: MONTH_LABELS[month], col });
        lastMonth = month;
      }
    }
    return labels;
  }, [weeks, startDate.getTime()]);

  const totalWidth = weeks * (cellSize + cellGap) - cellGap;

  return (
    <View style={[styles.container, style]}>
      {showLabels && (
        <View style={[styles.monthRow, { width: totalWidth + 30 }]}>
          <View style={{ width: 30 }} />
          <View style={[styles.monthTrack, { width: totalWidth }]}>
            {monthLabels.map((m, i) => (
              <Text
                key={i}
                style={{
                  position: "absolute",
                  left: m.col * (cellSize + cellGap),
                  fontSize: theme.typography.xs.fontSize,
                  color: theme.palette.textMuted,
                  fontWeight: "500",
                }}
              >
                {m.month}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={{ flexDirection: "row" }}>
        {showLabels && (
          <View style={{ width: 30, marginRight: 4 }}>
            {DAY_LABELS.map((day, i) => (
              <Text
                key={day}
                style={{
                  height: cellSize + cellGap,
                  fontSize: 10,
                  color: theme.palette.textMuted,
                  textAlign: "right",
                  lineHeight: cellSize,
                  marginTop: i === 0 ? 0 : 0,
                }}
              >
                {i % 2 === 1 ? "" : day[0]}
              </Text>
            ))}
          </View>
        )}

        <View style={{ width: totalWidth }}>
          {grid.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                flexDirection: "row",
                gap: cellGap,
                marginBottom: rowIndex < 6 ? cellGap : 0,
              }}
            >
              {row.map((cell, colIndex) => {
                const level = Math.min(4, Math.max(0, cell?.value ?? 0));
                const delay = (rowIndex * weeks + colIndex) * 12;
                return (
                  <HeatCell
                    key={`${rowIndex}-${colIndex}`}
                    size={cellSize}
                    color={intensityColors[level]}
                    delay={delay}
                    springs={theme.springs.gentle}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function HeatCell({
  size,
  color,
  delay,
  springs,
}: {
  size: number;
  color: string;
  delay: number;
  springs: { damping: number; stiffness: number; mass?: number };
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, springs));
    opacity.value = withDelay(delay, withSpring(1, springs));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 3,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  monthRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  monthTrack: {
    height: 14,
    position: "relative",
  },
});
