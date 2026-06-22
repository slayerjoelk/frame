import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Camera, Ghost, History, Settings } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import CategoryPill from '@/components/CategoryPill';
import CategorySheet from '@/components/CategorySheet';
import ComparisonSlider from '@/components/ComparisonSlider';
import GhostOverlay from '@/components/GhostOverlay';

interface Category {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function LoadingSkeleton(): JSX.Element {
  const pulse = useSharedValue(0.3);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Animated.View
        style={animStyle}
        className="absolute top-0 left-0 right-0 h-24 bg-dsSurface rounded-b-3xl"
      />
      <Text className="text-dsTextMuted text-base font-medium">Initializing…</Text>
      <Animated.View
        style={animStyle}
        className="absolute bottom-0 left-0 right-0 h-32 bg-dsSurface rounded-t-3xl"
      />
    </View>
  );
}

export default function IndexScreen(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [permission, requestPermission] = useCameraPermissions();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(0.4);
  const [lastSnapOpacity, setLastSnapOpacity] = useState(0.4);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isUploading, setIsUploading] = useState(false);
  const [isCategorySheetVisible, setIsCategorySheetVisible] = useState(false);
  const [categorySheetMode, setCategorySheetMode] = useState<'select' | 'manage'>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const cameraRef = useRef<CameraView>(null);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  useEffect(() => {
    if (permission?.status) {
      setCameraPermission(permission.status as 'granted' | 'denied' | 'undetermined');
      if (permission.status === 'undetermined') {
        requestPermission();
      }
    }
  }, [permission, requestPermission]);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('photo_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (supaError) throw supaError;

      const fetched = data || [];
      setCategories(fetched);
      if (fetched.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(fetched[0].id);
      }
    } catch (e) {
      setError('Failed to load your categories. Check your connection and try again.');
      posthog.capture('categories_load_failed', { error: String(e) });
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedCategoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!selectedCategoryId || !user) return;

    const loadLastPhoto = async () => {
      try {
        const { data, error: supaError } = await supabase
          .from('photos')
          .select('image_url')
          .eq('category_id', selectedCategoryId)
          .eq('user_id', user.id)
          .order('taken_at', { ascending: false })
          .limit(1);

        if (supaError) throw supaError;
        setLastPhotoUri(data && data.length > 0 ? data[0].image_url : null);
      } catch (e) {
        posthog.capture('last_photo_load_failed', {
          error: String(e),
          category_id: selectedCategoryId,
        });
        setLastPhotoUri(null);
      }
    };

    loadLastPhoto();
  }, [selectedCategoryId, user]);

  const handleOpenCategorySheet = () => {
    Haptics.selectionAsync();
    posthog.capture('open_category_sheet');
    setCategorySheetMode('select');
    setIsCategorySheetVisible(true);
  };

  const handleOpenCategorySheetEmpty = () => {
    posthog.capture('open_category_sheet_empty');
    setCategorySheetMode('select');
    setIsCategorySheetVisible(true);
  };

  const handleManageCategories = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    posthog.capture('manage_categories');
    setCategorySheetMode('manage');
    setIsCategorySheetVisible(true);
  };

  const handleCreateCategory = async (name: string) => {
    if (!user) return;

    if (!isPremium && categories.length >= 3) {
      setIsCategorySheetVisible(false);
      router.push('/paywall');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    posthog.capture('create_category', { name });

    try {
      const { data, error: supaError } = await supabase
        .from('photo_categories')
        .insert({
          user_id: user.id,
          name: name.trim(),
          sort_order: categories.length,
        })
        .select()
        .single();

      if (supaError) throw supaError;

      if (data) {
        setCategories((prev) => [...prev, data]);
        setSelectedCategoryId(data.id);
        setIsCategorySheetVisible(false);
      }
    } catch (e) {
      posthog.capture('create_category_failed', { error: String(e) });
      setError('Failed to create category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error: supaError } = await supabase
        .from('photo_categories')
        .delete()
        .eq('id', id);

      if (supaError) throw supaError;

      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (selectedCategoryId === id) {
          setSelectedCategoryId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
      posthog.capture('delete_category', { category_id: id });
    } catch (e) {
      posthog.capture('delete_category_failed', { error: String(e) });
    }
  };

  const handleOpacityChange = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setGhostOpacity(clamped);

    const snaps = [0, 0.25, 0.5, 0.75, 1.0];
    const nearest = snaps.find((s) => Math.abs(clamped - s) < 0.05);
    if (nearest !== undefined && Math.abs(nearest - lastSnapOpacity) > 0.01) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLastSnapOpacity(nearest);
      posthog.capture('adjust_ghost_opacity', { opacity: clamped });
    }
  };

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    posthog.capture('capture_photo', { category_id: selectedCategoryId });

    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        setCapturedImageUri(photo.uri);
        setIsPreviewVisible(true);
      }
    } catch (e) {
      posthog.capture('capture_failed', { error: String(e) });
      setError('Failed to capture photo.');
    }
  };

  const handleSave = async () => {
    if (!capturedImageUri || !selectedCategoryId || !user) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    posthog.capture('save_photo', { category_id: selectedCategoryId });
    setIsUploading(true);
    setError(null);

    try {
      const fileName = `${user.id}/${selectedCategoryId}/${Date.now()}.jpg`;
      const response = await fetch(capturedImageUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('photos').insert({
        user_id: user.id,
        category_id: selectedCategoryId,
        image_url: urlData.publicUrl,
        taken_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      setLastPhotoUri(urlData.publicUrl);
      setCapturedImageUri(null);
      setIsPreviewVisible(false);
    } catch (e) {
      posthog.capture('save_photo_failed', { error: String(e) });
      setError('Failed to save photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    posthog.capture('discard_photo');
    setCapturedImageUri(null);
    setIsPreviewVisible(false);
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture('settings_tapped', { from: 'index' });
    router.push('/settings');
  };

  const handleRetryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    posthog.capture('categories_load_retry');
    loadCategories();
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error && categories.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Camera size={48} color="#ef4444" accessibilityElementsHidden />
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          Couldn&apos;t Load Categories
        </Text>
        <Text className="text-dsTextMuted text-center mt-2">{error}</Text>
        <Pressable
          onPress={handleRetryPress}
          className="mt-6 bg-dsPrimary px-8 py-3 rounded-xl"
          accessibilityLabel="Retry loading categories"
          accessibilityRole="button"
        >
          <Text className="text-dsTextInverse font-semibold text-base">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Ghost size={64} color="white" accessibilityElementsHidden />
        <Text className="text-white text-xl font-semibold mt-6 text-center">
          No Categories Yet
        </Text>
        <Text className="text-dsTextMuted text-center mt-2 mb-8">
          Create a category like &quot;Front Physique&quot; to start aligning your
          progress photos.
        </Text>
        <Pressable
          onPress={handleOpenCategorySheetEmpty}
          className="bg-dsPrimary px-8 py-4 rounded-xl w-full items-center"
          accessibilityLabel="Create your first category"
          accessibilityRole="button"
        >
          <Text className="text-dsTextInverse font-semibold text-base">
            Create Your First Category
          </Text>
        </Pressable>

        <CategorySheet
          visible={isCategorySheetVisible}
          onClose={() => setIsCategorySheetVisible(false)}
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
          mode={categorySheetMode}
        />
      </View>
    );
  }

  if (cameraPermission === 'denied') {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Camera size={48} color="white" accessibilityElementsHidden />
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          Camera Access Denied
        </Text>
        <Text className="text-dsTextMuted text-center mt-2">
          Frame needs camera access to show the ghost overlay and capture progress
          photos.
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          className="mt-6 bg-dsPrimary px-8 py-3 rounded-xl"
          accessibilityLabel="Open system settings"
          accessibilityRole="button"
        >
          <Text className="text-dsTextInverse font-semibold text-base">
            Open Settings
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        active={!isPreviewVisible}
      />

      {lastPhotoUri && <GhostOverlay uri={lastPhotoUri} opacity={ghostOpacity} />}

      {/* Top Header */}
      <SafeAreaView
        edges={['top']}
        className="absolute top-0 left-0 right-0 z-10"
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <CategoryPill
            label={selectedCategory?.name || 'Select Category'}
            onPress={handleOpenCategorySheet}
            onLongPress={handleManageCategories}
          />
          <Pressable
            onPress={handleSettingsPress}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Settings size={24} color="white" accessibilityElementsHidden />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom Controls */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute bottom-0 left-0 right-0 z-10 bg-black/70"
      >
        <View className="px-6 pt-4 pb-6">
          <View className="mb-4">
            <Text className="text-white/80 text-xs font-medium mb-2 uppercase tracking-wider">
              Ghost Opacity
            </Text>
            <View
              className="h-10 justify-center"
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e: GestureResponderEvent) => {
                if (trackWidth <= 0) return;
                handleOpacityChange(e.nativeEvent.locationX / trackWidth);
              }}
              onResponderMove={(e: GestureResponderEvent) => {
                if (trackWidth <= 0) return;
                handleOpacityChange(e.nativeEvent.locationX / trackWidth);
              }}
            >
              <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-dsPrimary rounded-full"
                  style={{ width: `${ghostOpacity * 100}%` }}
                />
              </View>
              <View
                className="absolute w-6 h-6 bg-white rounded-full border-2 border-dsPrimary"
                style={{
                  left: ghostOpacity * trackWidth - 12,
                  top: '50%',
                  marginTop: -12,
                }}
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                posthog.capture('history_tapped_from_camera');
                router.push('/history');
              }}
              className="w-14 h-14 rounded-xl overflow-hidden border border-white/20 bg-dsSurface"
              accessibilityLabel="View photo history"
              accessibilityRole="button"
            >
              {lastPhotoUri ? (
                <Image
                  source={{ uri: lastPhotoUri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <History size={20} color="white" accessibilityElementsHidden />
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white bg-red-500 items-center justify-center shadow-xl"
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
            >
              <View className="w-16 h-16 rounded-full bg-red-600" />
            </Pressable>

            <View className="w-14" />
          </View>
        </View>
      </SafeAreaView>

      {/* Preview Modal */}
      {isPreviewVisible && capturedImageUri && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute inset-0 bg-black z-50"
        >
          <View className="flex-1">
            {lastPhotoUri ? (
              <ComparisonSlider
                beforeUri={lastPhotoUri}
                afterUri={capturedImageUri}
              />
            ) : (
              <Image
                source={{ uri: capturedImageUri }}
                className="flex-1"
                resizeMode="contain"
              />
            )}
          </View>

          <SafeAreaView edges={['bottom']} className="px-6 py-4 bg-black/90">
            {error ? (
              <Text className="text-dsDanger text-center mb-3 text-sm">
                {error}
              </Text>
            ) : null}
            <Pressable
              onPress={handleSave}
              disabled={isUploading}
              className="bg-dsPrimary py-4 rounded-xl items-center mb-3"
              accessibilityLabel="Save photo to timeline"
              accessibilityRole="button"
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-dsTextInverse font-semibold text-lg">
                  Save to Timeline
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleRetake}
              disabled={isUploading}
              className="py-4 rounded-xl items-center"
              accessibilityLabel="Retake photo"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold text-lg">Retake</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      )}

      <CategorySheet
        visible={isCategorySheetVisible}
        onClose={() => setIsCategorySheetVisible(false)}
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={(id: string) => {
          setSelectedCategoryId(id);
          setIsCategorySheetVisible(false);
        }}
        onCreate={handleCreateCategory}
        onDelete={handleDeleteCategory}
        mode={categorySheetMode}
      />
    </View>
  );
}