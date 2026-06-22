import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { posthog } from '@/lib/posthog';

interface Category {
  id: string;
  name: string;
}

interface CategorySheetProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  isVisible: boolean;
  onClose: () => void;
  loading?: boolean;
}

function SkeletonRow(): JSX.Element {
  return (
    <View className="h-14 px-4 flex-row items-center border-b border-dsBorder">
      <View className="w-5 h-5 rounded-full bg-dsElevated mr-3" />
      <View className="h-4 bg-dsElevated rounded flex-1" />
      <View className="w-16 h-4 bg-dsElevated rounded ml-3" />
    </View>
  );
}

interface CategoryRowProps {
  cat: Category;
  isActive: boolean;
  isRenaming: boolean;
  draftRename: string;
  onSelect: () => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onDraftRenameChange: (text: string) => void;
  onDelete: () => void;
}

function CategoryRow({
  cat,
  isActive,
  isRenaming,
  draftRename,
  onSelect,
  onStartRename,
  onSubmitRename,
  onDraftRenameChange,
  onDelete,
}: CategoryRowProps): JSX.Element {
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    if (isRenaming) {
      swipeableRef.current?.close();
    }
  }, [isRenaming]);

  const renderRightActions = useCallback(() => {
    return (
      <View className="bg-dsDanger w-20 items-center justify-center">
        <Pressable
          onPress={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
          className="w-full h-full items-center justify-center"
          accessibilityLabel="Delete category"
          accessibilityRole="button"
        >
          <Trash2 size={20} color="#ffffff" accessibilityElementsHidden />
        </Pressable>
      </View>
    );
  }, [onDelete]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      enabled={!isRenaming}
    >
      <Pressable
        onPress={isRenaming ? undefined : onSelect}
        className="flex-row items-center h-14 px-4 bg-dsBackground border-b border-dsBorder active:bg-dsElevated"
        accessibilityLabel={
          isRenaming ? undefined : `Select ${cat.name} category`
        }
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <View className="w-6 mr-3 items-center justify-center">
          {isActive && !isRenaming && (
            <Check size={18} color="#10B981" accessibilityElementsHidden />
          )}
        </View>

        {isRenaming ? (
          <TextInput
            value={draftRename}
            onChangeText={onDraftRenameChange}
            onBlur={onSubmitRename}
            onSubmitEditing={onSubmitRename}
            autoFocus
            className="flex-1 text-dsText text-base font-medium bg-dsSurface rounded px-2 py-1"
            accessibilityLabel={`Rename ${cat.name} input`}
            accessibilityRole="text"
          />
        ) : (
          <Text
            className="flex-1 text-dsText text-base font-medium"
            numberOfLines={1}
          >
            {cat.name}
          </Text>
        )}

        {!isRenaming && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
            className="px-3 py-1 active:opacity-70"
            accessibilityLabel={`Rename ${cat.name}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-dsPrimary text-sm font-medium">Rename</Text>
          </Pressable>
        )}
      </Pressable>
    </Swipeable>
  );
}

export default function CategorySheet({
  categories,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  isVisible,
  onClose,
  loading = false,
}: CategorySheetProps): JSX.Element {
  const [draftName, setDraftName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftRename, setDraftRename] = useState('');
  const [isRendered, setIsRendered] = useState(isVisible);

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      sheetTranslateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      sheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 250 });
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, SCREEN_HEIGHT, sheetTranslateY, backdropOpacity]);

  useEffect(() => {
    if (!isVisible) {
      setDraftName('');
      setRenamingId(null);
      setDraftRename('');
    }
  }, [isVisible]);

  const handleBackdropPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      posthog.capture('select_category_sheet', { category_id: id });
      onSelect(id);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleCreate = useCallback(() => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    posthog.capture('create_category', { name: trimmed });
    onCreate(trimmed);
    setDraftName('');
  }, [draftName, onCreate]);

  const handleStartRename = useCallback((id: string, currentName: string) => {
    posthog.capture('start_rename_category', { category_id: id });
    setRenamingId(id);
    setDraftRename(currentName);
  }, []);

  const handleSubmitRename = useCallback(
    (id: string) => {
      const trimmed = draftRename.trim();
      if (trimmed) {
        onRename(id, trimmed);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        posthog.capture('rename_category', {
          category_id: id,
          name: trimmed,
        });
      }
      setRenamingId(null);
      setDraftRename('');
    },
    [draftRename, onRename]
  );

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      posthog.capture('delete_category', { category_id: id });
      onDelete(id);
    },
    [onDelete]
  );

  if (!isRendered) return <></>;

  return (
    <View className="absolute inset-0 z-50">
      <Animated.View
        style={[{ opacity: backdropOpacity.value }]}
        className="absolute inset-0 bg-black/60"
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Pressable
          className="flex-1"
          onPress={handleBackdropPress}
          accessibilityLabel="Close category sheet"
          accessibilityRole="button"
        />
      </Animated.View>

      <Animated.View
        style={[
          { transform: [{ translateY: sheetTranslateY.value }] },
          { height: SCREEN_HEIGHT * 0.75 },
        ]}
        className="absolute bottom-0 left-0 right-0 bg-dsSurface rounded-t-3xl overflow-hidden"
      >
        <View className="items-center pt-3 pb-1">
          <View
            className="w-10 h-1 rounded-full bg-dsBorder"
            accessibilityElementsHidden
          />
        </View>

        <View className="px-4 pb-3">
          <Text className="text-dsText text-lg font-semibold">Categories</Text>
        </View>

        <View className="px-4 py-2 flex-row items-center gap-2 border-b border-dsBorder">
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            onSubmitEditing={handleCreate}
            placeholder="New category..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 h-10 px-3 rounded-lg bg-dsElevated text-dsText text-base"
            accessibilityLabel="New category name input"
            accessibilityRole="text"
          />
          <Pressable
            onPress={handleCreate}
            disabled={!draftName.trim()}
            className={`w-10 h-10 rounded-lg items-center justify-center active:opacity-80 ${
              draftName.trim() ? 'bg-dsPrimary' : 'bg-dsElevated'
            }`}
            accessibilityLabel="Create category"
            accessibilityRole="button"
          >
            <Plus
              size={20}
              color={draftName.trim() ? '#ffffff' : '#9CA3AF'}
              accessibilityElementsHidden
            />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : categories.length === 0 ? (
            <View className="py-8 px-6">
              <Text className="text-dsTextMuted text-base text-center">
                No categories yet. Type above to create your first.
              </Text>
            </View>
          ) : (
            categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                isActive={cat.id === activeId}
                isRenaming={renamingId === cat.id}
                draftRename={draftRename}
                onSelect={() => handleSelect(cat.id)}
                onStartRename={() => handleStartRename(cat.id, cat.name)}
                onSubmitRename={() => handleSubmitRename(cat.id)}
                onDraftRenameChange={setDraftRename}
                onDelete={() => handleDelete(cat.id)}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}