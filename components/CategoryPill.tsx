import React, { useCallback, useEffect } from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { posthog } from '@/lib/posthog';

interface Category {
  id: string;
  name: string;
}

interface CategoryPillProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  loading?: boolean;
}

function ShimmerPill({ width = 96 }: { width?: number }): JSX.Element {
  const translateX = useSharedValue(-width / 2);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, { duration: 1500 }),
      -1,
      false
    );
  }, [translateX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      className="h-10 rounded-full bg-dsElevated overflow-hidden"
      style={{ width }}
    >
      <Animated.View
        className="absolute top-0 bottom-0 bg-white/10"
        style={[{ width: width / 2, left: 0 }, animatedStyle]}
      />
    </View>
  );
}

export default function CategoryPill({
  categories,
  activeId,
  onSelect,
  onLongPress,
  loading = false,
}: CategoryPillProps): JSX.Element {
  const handleSelect = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      posthog.capture('select_category', { category_id: id });
      onSelect(id);
    },
    [onSelect]
  );

  const handleLongPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      posthog.capture('category_context_menu', { category_id: id });
      onLongPress(id);
    },
    [onLongPress]
  );

  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading categories"
      >
        <View className="flex-row px-4 gap-2 items-center py-1">
          <ShimmerPill width={96} />
          <ShimmerPill width={80} />
          <ShimmerPill width={104} />
          <ShimmerPill width={88} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row px-4 gap-2 items-center py-1">
        {categories.length === 0 ? (
          <Pressable
            onPress={() => handleSelect('+')}
            accessibilityLabel="Add new category"
            accessibilityRole="button"
            className="h-10 w-10 rounded-full bg-dsSurface border border-dashed border-dsBorder items-center justify-center active:opacity-70"
          >
            <Plus
              size={18}
              color="#9CA3AF"
              accessibilityElementsHidden
            />
          </Pressable>
        ) : (
          categories.map((cat) => {
            const isActive = cat.id === activeId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleSelect(cat.id)}
                onLongPress={() => handleLongPress(cat.id)}
                accessibilityLabel={`${cat.name} category${isActive ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={`h-10 px-4 rounded-full items-center justify-center active:opacity-80 ${
                  isActive ? 'bg-dsPrimary' : 'bg-dsSurface'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-dsTextInverse' : 'text-dsTextSecondary'
                  }`}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}