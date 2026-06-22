import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  TrendingUp,
  Plus,
  Trash2,
  Tag,
  X,
  ChevronRight,
  RotateCcw,
  Ruler,
  Save,
} from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/hooks/useAuth';

/* ------------------------------------------------------------------ */
// Types
/* ------------------------------------------------------------------ */

interface Measurement {
  id: string;
  user_id: string;
  category_id: string | null;
  photo_id: string | null;
  metric_name: string;
  value: number;
  unit: string;
  measured_at: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
// Sub-components
/* ------------------------------------------------------------------ */

function SkeletonPulse({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 900 }),
      -1,
      true
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  );
}

interface SwipeableRowProps {
  measurement: Measurement;
  category?: Category;
  isEditing: boolean;
  editDraft: Partial<Measurement> | null;
  onStartEdit: () => void;
  onUpdateDraft: (patch: Partial<Measurement>) => void;
  onFieldFocus: () => void;
  onFieldBlur: (id: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancelEdit: () => void;
}

function SwipeableMeasurementRow({
  measurement,
  category,
  isEditing,
  editDraft,
  onStartEdit,
  onUpdateDraft,
  onFieldFocus,
  onFieldBlur,
  onSave,
  onDelete,
  onCancelEdit,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  useEffect(() => {
    if (isEditing) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      isOpen.value = false;
    }
  }, [isEditing, isOpen, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isEditing,
      onMoveShouldSetPanResponder: (_, gs) =>
        !isEditing && Math.abs(gs.dx) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) {
          translateX.value = Math.max(gs.dx, -80);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (isOpen.value && gs.dx > -10 && gs.dx < 10) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
          isOpen.value = false;
          return;
        }
        if (gs.dx > -10 && gs.dx < 10 && Math.abs(gs.dy) < 10) {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
          onStartEdit();
        } else if (gs.dx < -40) {
          translateX.value = withSpring(-80, { damping: 20, stiffness: 200 });
          isOpen.value = true;
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
          isOpen.value = false;
        }
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDeletePress = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    isOpen.value = false;
    onDelete();
  };

  const draft = isEditing ? editDraft : null;

  return (
    <View className="relative overflow-hidden mb-3 rounded-xl">
      <View className="absolute right-0 top-0 bottom-0 w-20 bg-dsDanger items-center justify-center rounded-r-xl">
        <TouchableOpacity
          onPress={handleDeletePress}
          accessibilityLabel="Delete measurement"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Trash2 size={20} color="#FFFFFF" accessibilityElementsHidden />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={animatedStyle}
        {...panResponder.panHandlers}
        accessible={!isEditing}
        accessibilityLabel={`${measurement.metric_name} ${measurement.value} ${measurement.unit}`}
        accessibilityRole="button"
      >
        <View
          className={`bg-dsSurface p-4 rounded-xl border ${
            isEditing ? 'border-dsPrimary' : 'border-dsBorder'
          }`}
        >
          {isEditing && draft ? (
            <View>
              <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-2">
                Editing
              </Text>
              <TextInput
                className="text-dsText text-base font-semibold mb-2 bg-dsBackground rounded-lg px-3 py-2 border border-dsBorder"
                value={String(draft.metric_name ?? '')}
                onChangeText={(text) => onUpdateDraft({ metric_name: text })}
                onFocus={onFieldFocus}
                onBlur={() => onFieldBlur(measurement.id)}
                placeholder="Metric name"
                placeholderTextColor="#6B7280"
                accessibilityLabel="Edit metric name"
                accessibilityRole="text"
              />
              <View className="flex-row gap-2 mb-2">
                <TextInput
                  className="flex-1 text-dsText text-base bg-dsBackground rounded-lg px-3 py-2 border border-dsBorder"
                  value={String(draft.value ?? '')}
                  onChangeText={(text) => {
                    const num = parseFloat(text);
                    onUpdateDraft({ value: Number.isNaN(num) ? 0 : num });
                  }}
                  keyboardType="decimal-pad"
                  onFocus={onFieldFocus}
                  onBlur={() => onFieldBlur(measurement.id)}
                  placeholder="0.0"
                  placeholderTextColor="#6B7280"
                  accessibilityLabel="Edit value"
                  accessibilityRole="text"
                />
                <TextInput
                  className="w-20 text-dsText text-base bg-dsBackground rounded-lg px-3 py-2 border border-dsBorder"
                  value={String(draft.unit ?? '')}
                  onChangeText={(text) => onUpdateDraft({ unit: text })}
                  onFocus={onFieldFocus}
                  onBlur={() => onFieldBlur(measurement.id)}
                  placeholder="kg"
                  placeholderTextColor="#6B7280"
                  accessibilityLabel="Edit unit"
                  accessibilityRole="text"
                />
              </View>
              <TextInput
                className="text-dsTextSecondary text-sm bg-dsBackground rounded-lg px-3 py-2 border border-dsBorder mb-3"
                value={
                  draft.measured_at
                    ? new Date(draft.measured_at).toISOString().split('T')[0]
                    : ''
                }
                onChangeText={(text) => {
                  try {
                    const d = new Date(text);
                    if (!Number.isNaN(d.getTime())) {
                      onUpdateDraft({ measured_at: d.toISOString() });
                    }
                  } catch {
                    // ignore invalid dates
                  }
                }}
                onFocus={onFieldFocus}
                onBlur={() => onFieldBlur(measurement.id)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6B7280"
                accessibilityLabel="Edit date"
                accessibilityRole="text"
              />
              <View className="flex-row justify-end gap-2">
                <Pressable
                  onPress={onCancelEdit}
                  className="px-4 py-2 rounded-lg bg-dsSurface border border-dsBorder"
                  accessibilityLabel="Cancel edit"
                  accessibilityRole="button"
                >
                  <Text className="text-dsTextSecondary font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onSave}
                  className="px-4 py-2 rounded-lg bg-dsPrimary flex-row items-center gap-1"
                  accessibilityLabel="Save edit"
                  accessibilityRole="button"
                >
                  <Save size={14} color="#FFFFFF" accessibilityElementsHidden />
                  <Text className="text-dsTextInverse font-medium">Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-dsElevated items-center justify-center mr-3">
                  <Ruler size={18} color="#9CA3AF" accessibilityElementsHidden />
                </View>
                <View className="flex-1">
                  <Text className="text-dsText font-semibold text-base">
                    {measurement.metric_name}
                  </Text>
                  <Text className="text-dsTextSecondary text-sm">
                    {Number(measurement.value).toFixed(2)} {measurement.unit} •{' '}
                    {new Date(measurement.measured_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  {category && (
                    <View className="flex-row items-center mt-1">
                      <Tag size={12} color="#6B7280" accessibilityElementsHidden />
                      <Text className="text-dsTextMuted text-xs ml-1">
                        {category.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={18} color="#6B7280" accessibilityElementsHidden />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
// Screen
/* ------------------------------------------------------------------ */

export default function MeasurementsScreen(): JSX.Element {
  const { user } = useAuth();

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Measurement> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [newMetricName, setNewMetricName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);

  const editTimerRef = useRef<NodeJS.Timeout | null>(null);

  // FAB animation
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  /* --------------------------- Data -------------------------------- */

  const fetchData = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [mRes, cRes] = await Promise.all([
        supabase
          .from('measurements')
          .select('*')
          .eq('user_id', user.id)
          .order('measured_at', { ascending: false })
          .returns<Measurement[]>(),
        supabase
          .from('photo_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .returns<Category[]>(),
      ]);

      if (mRes.error) throw mRes.error;
      if (cRes.error) throw cRes.error;

      setMeasurements(mRes.data ?? []);
      setCategories(cRes.data ?? []);
    } catch (e) {
      setError('Couldn\'t load measurements');
      posthog.capture('measurements_load_error', { error: String(e) });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchData();
    }
  }, [user, fetchData]);

  /* ------------------------- Derived ----------------------------- */

  const metricOptions = useMemo(() => {
    const unique = new Set(measurements.map((m) => m.metric_name));
    return ['all', ...Array.from(unique).sort()];
  }, [measurements]);

  const filteredMeasurements = useMemo(() => {
    if (selectedMetric === 'all') return measurements;
    return measurements.filter((m) => m.metric_name === selectedMetric);
  }, [measurements, selectedMetric]);

  const chartData = useMemo(() => {
    if (selectedMetric === 'all') return [];

    const filtered = measurements
      .filter((m) => m.metric_name === selectedMetric)
      .sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())
      .slice(0, 7)
      .reverse();

    if (filtered.length === 0) return [];

    const values = filtered.map((m) => Number(m.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return filtered.map((m) => {
      const val = Number(m.value);
      const pct = Math.max(8, ((val - min) / range) * 92 + 8);
      return {
        ...m,
        heightPercent: pct,
        displayValue: val,
      };
    });
  }, [measurements, selectedMetric]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  /* ------------------------ Handlers ----------------------------- */

  const handleFilterChange = (metric: string) => {
    Haptics.selectionAsync();
    setSelectedMetric(metric);
    posthog.capture('filter_measurements', { metric });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    posthog.capture('refresh_measurements');
    fetchData();
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError(null);
    fetchData();
  };

  const handleOpenAddModal = () => {
    Haptics.selectionAsync();
    posthog.capture('open_add_measurement');
    setIsAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalVisible(false);
    setNewMetricName('');
    setNewValue('');
    setNewUnit('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewCategoryId(null);
  };

  const handleAddMeasurement = async () => {
    if (!user) return;
    const name = newMetricName.trim();
    const unit = newUnit.trim();
    const valNum = parseFloat(newValue);
    if (!name || Number.isNaN(valNum) || !unit) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error } = await supabase.from('measurements').insert({
        user_id: user.id,
        category_id: newCategoryId,
        metric_name: name,
        value: valNum,
        unit,
        measured_at: new Date(newDate).toISOString(),
      });
      if (error) throw error;

      posthog.capture('measurement_added', { metric: name });
      handleCloseAddModal();
      setIsLoading(true);
      await fetchData();
    } catch (e) {
      posthog.capture('measurement_add_error', { error: String(e) });
    }
  };

  const handleStartEdit = (m: Measurement) => {
    posthog.capture('edit_measurement', { metric: m.metric_name });
    setEditingId(m.id);
    setEditDraft({ ...m });
  };

  const handleCancelEdit = () => {
    if (editTimerRef.current) {
      clearTimeout(editTimerRef.current);
      editTimerRef.current = null;
    }
    setEditingId(null);
    setEditDraft(null);
  };

  const handleUpdateDraft = (patch: Partial<Measurement>) => {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleEditFieldFocus = () => {
    if (editTimerRef.current) {
      clearTimeout(editTimerRef.current);
      editTimerRef.current = null;
    }
  };

  const handleEditFieldBlur = (id: string) => {
    editTimerRef.current = setTimeout(() => {
      handleSaveEdit(id);
    }, 350);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editDraft) return;
    const original = measurements.find((m) => m.id === id);
    if (!original) return;

    const changed =
      editDraft.metric_name !== original.metric_name ||
      editDraft.value !== original.value ||
      editDraft.unit !== original.unit ||
      editDraft.measured_at !== original.measured_at ||
      editDraft.category_id !== original.category_id;

    if (!changed) {
      setEditingId(null);
      setEditDraft(null);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error } = await supabase
        .from('measurements')
        .update({
          metric_name: editDraft.metric_name,
          value: editDraft.value,
          unit: editDraft.unit,
          measured_at: editDraft.measured_at,
          category_id: editDraft.category_id,
        })
        .eq('id', id);

      if (error) throw error;

      posthog.capture('save_measurement_edit', { metric: editDraft.metric_name });
      setEditingId(null);
      setEditDraft(null);
      setIsLoading(true);
      await fetchData();
    } catch (e) {
      posthog.capture('measurement_edit_error', { error: String(e) });
    }
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error } = await supabase.from('measurements').delete().eq('id', id);
      if (error) throw error;
      posthog.capture('delete_measurement');
      setIsLoading(true);
      await fetchData();
    } catch (e) {
      posthog.capture('measurement_delete_error', { error: String(e) });
    }
  };

  /* ------------------------ Render ------------------------------- */

  if (isLoading && !isRefreshing && measurements.length === 0) {
    return (
      <View className="flex-1 bg-dsBackground px-4 pt-4">
        {/* Skeleton segmented */}
        <SkeletonPulse className="h-10 w-full rounded-full bg-dsSurface mb-4" />
        {/* Skeleton bars */}
        <View className="flex-row items-end justify-between h-32 bg-dsSurface rounded-2xl p-4 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonPulse
              key={`sk-bar-${i}`}
              className="flex-1 mx-1 bg-dsElevated rounded-t-lg"
              style={{ height: `${20 + (i % 3) * 25}%` }}
            />
          ))}
        </View>
        {/* Skeleton rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonPulse
            key={`sk-row-${i}`}
            className="h-20 w-full rounded-xl bg-dsSurface mb-3"
          />
        ))}
      </View>
    );
  }

  if (error && measurements.length === 0) {
    return (
      <View className="flex-1 bg-dsBackground items-center justify-center px-6">
        <Text className="text-dsDanger text-base text-center mb-6">
          Couldn&apos;t load measurements
        </Text>
        <Pressable
          onPress={handleRetry}
          className="bg-dsPrimary px-6 py-3 rounded-xl flex-row items-center gap-2"
          accessibilityLabel="Retry loading measurements"
          accessibilityRole="button"
        >
          <RotateCcw size={16} color="#FFFFFF" accessibilityElementsHidden />
          <Text className="text-dsTextInverse font-semibold text-base">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!isLoading && measurements.length === 0) {
    return (
      <View className="flex-1 bg-dsBackground items-center justify-center px-6">
        <TrendingUp size={48} color="#6B7280" accessibilityElementsHidden />
        <Text className="text-dsTextSecondary text-center mt-4 mb-2 text-base">
          Start logging numbers to see trends emerge
        </Text>
        <Pressable
          onPress={handleOpenAddModal}
          className="bg-dsPrimary px-6 py-3 rounded-xl mt-4"
          accessibilityLabel="Add first measurement"
          accessibilityRole="button"
        >
          <Text className="text-dsTextInverse font-semibold text-base">
            Add First Measurement
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dsBackground">
      <ScrollView
        contentContainerClassName="pb-32"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
      >
        <Animated.View entering={FadeIn.duration(350)}>
          {/* Segmented Control */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-3"
          >
            {metricOptions.map((metric) => (
              <Pressable
                key={metric}
                onPress={() => handleFilterChange(metric)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedMetric === metric ? 'bg-dsPrimary' : 'bg-dsSurface'
                }`}
                accessibilityLabel={`Filter by ${metric === 'all' ? 'All' : metric}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedMetric === metric }}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedMetric === metric
                      ? 'text-dsTextInverse'
                      : 'text-dsTextSecondary'
                  }`}
                >
                  {metric === 'all' ? 'All' : metric}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Bar Chart */}
          {selectedMetric !== 'all' ? (
            <View className="px-4 py-4">
              <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-3">
                Last 7 {selectedMetric} readings
              </Text>
              <View className="flex-row items-end justify-between h-32 bg-dsSurface rounded-2xl p-4">
                {Array.from({ length: 7 }).map((_, i) => {
                  const bar = chartData[i];
                  if (!bar) {
                    return (
                      <View
                        key={`empty-${i}`}
                        className="flex-1 items-center justify-end mx-1"
                      >
                        <View
                          className="w-full bg-dsElevated rounded-t-lg"
                          style={{ height: 8 }}
                        />
                      </View>
                    );
                  }
                  return (
                    <View
                      key={bar.id}
                      className="flex-1 items-center justify-end mx-1"
                    >
                      <Text className="text-dsTextMuted text-[10px] mb-1">
                        {bar.displayValue.toFixed(1)}
                      </Text>
                      <View
                        className="w-full bg-dsPrimary rounded-t-lg"
                        style={{ height: `${bar.heightPercent}%` }}
                      />
                      <Text className="text-dsTextMuted text-[10px] mt-1">
                        {new Date(bar.measured_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  );
                })}
                {chartData.length === 0 && (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-dsTextMuted text-sm">
                      No data for this metric
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View className="px-4 py-6 items-center">
              <Text className="text-dsTextMuted text-sm">
                Select a metric above to view trend bars
              </Text>
            </View>
          )}

          {/* List */}
          <View className="px-4 pt-2">
            {filteredMeasurements.length === 0 && (
              <View className="items-center py-8">
                <Text className="text-dsTextMuted text-sm">
                  No measurements for this filter
                </Text>
              </View>
            )}

            {filteredMeasurements.map((m, index) => (
              <Animated.View
                key={m.id}
                entering={FadeInUp.delay(index * 30).duration(250)}
              >
                <SwipeableMeasurementRow
                  measurement={m}
                  category={
                    m.category_id ? categoryById.get(m.category_id) : undefined
                  }
                  isEditing={editingId === m.id}
                  editDraft={editDraft}
                  onStartEdit={() => handleStartEdit(m)}
                  onUpdateDraft={handleUpdateDraft}
                  onFieldFocus={handleEditFieldFocus}
                  onFieldBlur={handleEditFieldBlur}
                  onSave={() => handleSaveEdit(m.id)}
                  onDelete={() => handleDelete(m.id)}
                  onCancelEdit={handleCancelEdit}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPressIn={() => {
          fabScale.value = withTiming(0.9, { duration: 100 });
        }}
        onPressOut={() => {
          fabScale.value = withTiming(1, { duration: 100 });
        }}
        onPress={handleOpenAddModal}
        className="absolute bottom-6 right-6 w-14 h-14 bg-dsPrimary rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 6 }}
        accessibilityLabel="Add measurement"
        accessibilityRole="button"
      >
        <Animated.View style={fabStyle}>
          <Plus size={28} color="#FFFFFF" accessibilityElementsHidden />
        </Animated.View>
      </Pressable>

      {/* Add Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseAddModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <Pressable
              className="absolute inset-0"
              onPress={handleCloseAddModal}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            />
            <View className="bg-dsSurface rounded-t-3xl px-5 pt-6 pb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-dsText text-xl font-bold">
                  Log Measurement
                </Text>
                <Pressable
                  onPress={handleCloseAddModal}
                  className="p-2 rounded-full bg-dsElevated"
                  accessibilityLabel="Close add measurement modal"
                  accessibilityRole="button"
                >
                  <X size={20} color="#9CA3AF" accessibilityElementsHidden />
                </Pressable>
              </View>

              <ScrollView>
                <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-2">
                  Metric
                </Text>
                <TextInput
                  className="text-dsText text-base bg-dsBackground rounded-xl px-4 py-3 border border-dsBorder mb-4"
                  value={newMetricName}
                  onChangeText={setNewMetricName}
                  placeholder="e.g. Weight, Waist, Body Fat"
                  placeholderTextColor="#6B7280"
                  accessibilityLabel="Metric name"
                  accessibilityRole="text"
                />

                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-2">
                      Value
                    </Text>
                    <TextInput
                      className="text-dsText text-base bg-dsBackground rounded-xl px-4 py-3 border border-dsBorder"
                      value={newValue}
                      onChangeText={setNewValue}
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                      placeholderTextColor="#6B7280"
                      accessibilityLabel="Numeric value"
                      accessibilityRole="text"
                    />
                  </View>
                  <View className="w-24">
                    <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-2">
                      Unit
                    </Text>
                    <TextInput
                      className="text-dsText text-base bg-dsBackground rounded-xl px-4 py-3 border border-dsBorder"
                      value={newUnit}
                      onChangeText={setNewUnit}
                      placeholder="kg"
                      placeholderTextColor="#6B7280"
                      accessibilityLabel="Unit"
                      accessibilityRole="text"
                    />
                  </View>
                </View>

                <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-2">
                  Date
                </Text>
                <TextInput
                  className="text-dsText text-base bg-dsBackground rounded-xl px-4 py-3 border border-dsBorder mb-4"
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6B7280"
                  accessibilityLabel="Date"
                  accessibilityRole="text"
                />

                <Text className="text-dsTextMuted text-xs uppercase tracking-wider mb-2">
                  Link to Category
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-6"
                >
                  <Pressable
                    onPress={() => setNewCategoryId(null)}
                    className={`px-4 py-2 rounded-full mr-2 border ${
                      newCategoryId === null
                        ? 'bg-dsPrimary border-dsPrimary'
                        : 'bg-dsBackground border-dsBorder'
                    }`}
                    accessibilityLabel="No category"
                    accessibilityRole="button"
                  >
                    <Text
                      className={`text-sm font-medium ${
                        newCategoryId === null
                          ? 'text-dsTextInverse'
                          : 'text-dsTextSecondary'
                      }`}
                    >
                      None
                    </Text>
                  </Pressable>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setNewCategoryId(cat.id)}
                      className={`px-4 py-2 rounded-full mr-2 border ${
                        newCategoryId === cat.id
                          ? 'bg-dsPrimary border-dsPrimary'
                          : 'bg-dsBackground border-dsBorder'
                      }`}
                      accessibilityLabel={`Select category ${cat.name}`}
                      accessibilityRole="button"
                    >
                      <Text
                        className={`text-sm font-medium ${
                          newCategoryId === cat.id
                            ? 'text-dsTextInverse'
                            : 'text-dsTextSecondary'
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={handleAddMeasurement}
                  className="bg-dsPrimary py-4 rounded-xl items-center"
                  accessibilityLabel="Save new measurement"
                  accessibilityRole="button"
                >
                  <Text className="text-dsTextInverse font-semibold text-base">
                    Save Measurement
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}