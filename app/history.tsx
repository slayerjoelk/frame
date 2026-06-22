import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  Share,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  Share2,
  Trash2,
  GitCompare,
  RefreshCw,
  X,
} from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { posthog } from '@/lib/posthog';

type Photo = {
  id: string;
  user_id: string;
  category_id: string;
  image_url: string;
  is_cover: boolean;
  taken_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
};

type Category = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function groupPhotosByMonth(photos: Photo[]): Record<string, Photo[]> {
  const groups: Record<string, Photo[]> = {};
  const sorted = [...photos].sort(
    (a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
  );

  sorted.forEach((photo) => {
    const date = new Date(photo.taken_at);
    const key = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(photo);
  });

  return groups;
}

function PhotoCard({
  photo,
  hasMeasurements,
  onPress,
  onLongPress,
}: {
  photo: Photo;
  hasMeasurements: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dateStr = new Date(photo.taken_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      accessibilityLabel={`Photo from ${photo.category_name} taken on ${dateStr}`}
      accessibilityRole="button"
      className="mb-2"
    >
      <Animated.View
        style={animatedStyle}
        className="rounded-xl overflow-hidden bg-dsSurface"
      >
        <Image
          source={{ uri: photo.image_url }}
          className="w-full aspect-[3/4]"
          resizeMode="cover"
        />
        <View className="absolute top-2 left-2 bg-dsBackground/80 px-2 py-1 rounded-md">
          <Text className="text-dsText text-xs font-medium">
            {photo.category_name}
          </Text>
        </View>
        {hasMeasurements && (
          <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-dsSuccess border-2 border-dsBackground" />
        )}
        <View className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
          <Text className="text-white text-xs font-medium">{dateStr}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function MonthSection({
  month,
  photos,
  measurementMap,
  onPhotoPress,
  onPhotoLongPress,
}: {
  month: string;
  photos: Photo[];
  measurementMap: Record<string, boolean>;
  onPhotoPress: (photo: Photo) => void;
  onPhotoLongPress: (photo: Photo) => void;
}) {
  const left: Photo[] = [];
  const right: Photo[] = [];
  photos.forEach((photo, index) => {
    if (index % 2 === 0) left.push(photo);
    else right.push(photo);
  });

  return (
    <View>
      <View className="sticky top-0 z-10 bg-dsBackground px-4 py-2 border-b border-dsBorder">
        <Text className="text-dsTextSecondary font-semibold text-sm uppercase tracking-wider">
          {month}
        </Text>
      </View>
      <View className="flex-row px-2 pt-2 pb-4">
        <View className="flex-1 px-1">
          {left.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              hasMeasurements={!!measurementMap[photo.id]}
              onPress={() => onPhotoPress(photo)}
              onLongPress={() => onPhotoLongPress(photo)}
            />
          ))}
        </View>
        <View className="flex-1 px-1">
          {right.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              hasMeasurements={!!measurementMap[photo.id]}
              onPress={() => onPhotoPress(photo)}
              onLongPress={() => onPhotoLongPress(photo)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SkeletonGrid() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shimmer.value,
      [0, 1],
      [0.3, 0.7],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View className="flex-row px-2 pt-2">
      <View className="flex-1 px-1">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={`sk-left-${i}`}
            style={shimmerStyle}
            className="bg-dsSurface rounded-xl mb-2 aspect-[3/4]"
          />
        ))}
      </View>
      <View className="flex-1 px-1">
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={`sk-right-${i}`}
            style={shimmerStyle}
            className="bg-dsSurface rounded-xl mb-2 aspect-[3/4]"
          />
        ))}
      </View>
    </View>
  );
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8"
    >
      <Camera
        size={64}
        color="#666"
        strokeWidth={1.5}
        accessibilityElementsHidden
      />
      <Text className="text-dsText text-xl font-semibold text-center mt-4 mb-2">
        {isFiltered ? 'No photos in this category' : 'No progress photos yet'}
      </Text>
      <Text className="text-dsTextSecondary text-base text-center mb-6">
        {isFiltered
          ? 'Try selecting a different category filter.'
          : 'Take your first aligned shot to start tracking your transformation.'}
      </Text>
      {!isFiltered && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            posthog.capture('history_open_camera_tapped');
            router.push('/');
          }}
          className="bg-dsPrimary px-6 py-3 rounded-xl"
          accessibilityLabel="Open camera"
          accessibilityRole="button"
        >
          <Text className="text-dsTextInverse font-semibold text-base">
            Open Camera
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8"
    >
      <Text className="text-dsDanger text-lg font-semibold text-center mb-2">
        Couldn't load timeline
      </Text>
      <Text className="text-dsTextSecondary text-base text-center mb-6">
        Something went wrong while fetching your photos. Pull down to try again.
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          posthog.capture('history_retry_tapped');
          onRetry();
        }}
        className="bg-dsPrimary px-6 py-3 rounded-xl flex-row items-center"
        accessibilityLabel="Retry loading timeline"
        accessibilityRole="button"
      >
        <RefreshCw
          size={18}
          color="#fff"
          accessibilityElementsHidden
          className="mr-2"
        />
        <Text className="text-dsTextInverse font-semibold text-base">Retry</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HistoryScreen(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const { height: screenHeight } = useWindowDimensions();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [measurementMap, setMeasurementMap] = useState<Record<string, boolean>>(
    {}
  );

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(screenHeight);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (!isRefresh) setIsLoading(true);
      setError(null);

      try {
        const [
          { data: catData, error: catErr },
          { data: photoData, error: photoErr },
          { data: measData },
        ] = await Promise.all([
          supabase
            .from('photo_categories')
            .select('*')
            .eq('user_id', user.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('photos')
            .select('*')
            .eq('user_id', user.id)
            .order('taken_at', { ascending: false }),
          supabase
            .from('measurements')
            .select('photo_id')
            .eq('user_id', user.id),
        ]);

        if (catErr) throw catErr;
        if (photoErr) throw photoErr;

        const catMap: Record<string, string> = {};
        catData?.forEach((c) => {
          catMap[c.id] = c.name;
        });
        setCategories(catData || []);

        const enrichedPhotos: Photo[] = (photoData || []).map((p) => ({
          ...p,
          category_name: catMap[p.category_id] || 'Unknown',
        }));
        setPhotos(enrichedPhotos);

        const map: Record<string, boolean> = {};
        measData?.forEach((m) => {
          if (m.photo_id) map[m.photo_id] = true;
        });
        setMeasurementMap(map);
      } catch (e) {
        setError('Couldn\'t load timeline');
        posthog.capture('history_load_error', { error: String(e) });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const filteredPhotos = useMemo(() => {
    if (filterCategoryId === 'all') return photos;
    return photos.filter((p) => p.category_id === filterCategoryId);
  }, [photos, filterCategoryId]);

  const groupedPhotos = useMemo(() => {
    return groupPhotosByMonth(filteredPhotos);
  }, [filteredPhotos]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    posthog.capture('refresh_history');
    fetchData(true);
  }, [fetchData]);

  const handleFilterChange = useCallback((categoryId: string) => {
    Haptics.selectionAsync();
    posthog.capture('filter_history', { category_id: categoryId });
    setFilterCategoryId(categoryId);
  }, []);

  const handlePhotoPress = useCallback(
    (photo: Photo) => {
      Haptics.selectionAsync();
      posthog.capture('view_photo_detail', {
        photo_id: photo.id,
        category: photo.category_name,
      });
      router.push(`/detail/${photo.id}`);
    },
    [router]
  );

  const openActionSheet = useCallback(
    (photo: Photo) => {
      setSelectedPhoto(photo);
      setShowActionSheet(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withSpring(0, {
        damping: 25,
        stiffness: 300,
      });
    },
    [backdropOpacity, sheetTranslateY]
  );

  const closeActionSheet = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    sheetTranslateY.value = withSpring(
      screenHeight,
      { damping: 25, stiffness: 300 },
      () => {
        runOnJS(setShowActionSheet)(false);
        runOnJS(setSelectedPhoto)(null);
      }
    );
  }, [backdropOpacity, sheetTranslateY, screenHeight]);

  const handlePhotoLongPress = useCallback(
    (photo: Photo) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      posthog.capture('photo_context_menu', { photo_id: photo.id });
      openActionSheet(photo);
    },
    [openActionSheet]
  );

  const handleCompare = useCallback(() => {
    if (!selectedPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    posthog.capture('photo_compare_tapped', { photo_id: selectedPhoto.id });
    closeActionSheet();
    router.push(`/detail/${selectedPhoto.id}?mode=compare`);
  }, [selectedPhoto, closeActionSheet, router]);

  const handleShare = useCallback(async () => {
    if (!selectedPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture('photo_share_tapped', { photo_id: selectedPhoto.id });
    try {
      await Share.share({
        url: selectedPhoto.image_url,
        message: `Check out my progress photo from ${selectedPhoto.category_name}!`,
      });
    } catch {
      // User cancelled or share failed
    }
    closeActionSheet();
  }, [selectedPhoto, closeActionSheet]);

  const handleDelete = useCallback(async () => {
    if (!selectedPhoto) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', selectedPhoto.id)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;

      posthog.capture('photo_deleted', { photo_id: selectedPhoto.id });
      setPhotos((prev) => prev.filter((p) => p.id !== selectedPhoto.id));
      closeActionSheet();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
      posthog.capture('photo_delete_failed', {
        photo_id: selectedPhoto.id,
        error: String(e),
      });
    }
  }, [selectedPhoto, user?.id, closeActionSheet]);

  return (
    <SafeAreaView className="flex-1 bg-dsBackground">
      <View className="px-4 pt-2 pb-3">
        <Text className="text-dsText text-2xl font-bold">Your Timeline</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <Pressable
          onPress={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-full mr-2 ${
            filterCategoryId === 'all'
              ? 'bg-dsPrimary'
              : 'bg-dsSurface border border-dsBorder'
          }`}
          accessibilityLabel="Filter by all categories"
          accessibilityRole="button"
          accessibilityState={{ selected: filterCategoryId === 'all' }}
        >
          <Text
            className={`text-sm font-medium ${
              filterCategoryId === 'all'
                ? 'text-dsTextInverse'
                : 'text-dsText'
            }`}
          >
            All
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => handleFilterChange(cat.id)}
            className={`px-4 py-2 rounded-full mr-2 ${
              filterCategoryId === cat.id
                ? 'bg-dsPrimary'
                : 'bg-dsSurface border border-dsBorder'
            }`}
            accessibilityLabel={`Filter by ${cat.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: filterCategoryId === cat.id }}
          >
            <Text
              className={`text-sm font-medium ${
                filterCategoryId === cat.id
                  ? 'text-dsTextInverse'
                  : 'text-dsText'
              }`}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!isPremium && photos.length > 10 && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          className="mx-4 mb-3 p-4 bg-dsElevated rounded-xl border border-dsBorder"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-dsText font-semibold">
                Unlock full timeline
              </Text>
              <Text className="text-dsTextSecondary text-sm mt-1">
                You've saved {photos.length} progress photos. Upgrade for
                unlimited history.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                posthog.capture('history_premium_gate_tapped');
                router.push('/paywall');
              }}
              className="bg-dsPrimary px-4 py-2 rounded-lg ml-3"
              accessibilityLabel="Upgrade to premium"
              accessibilityRole="button"
            >
              <Text className="text-dsTextInverse font-semibold text-sm">
                Upgrade
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      <View className="flex-1">
        {isLoading ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <SkeletonGrid />
          </ScrollView>
        ) : error ? (
          <ErrorState onRetry={() => fetchData()} />
        ) : filteredPhotos.length === 0 ? (
          <EmptyState isFiltered={filterCategoryId !== 'all'} />
        ) : (
          <Animated.View entering={FadeIn.duration(350)} className="flex-1">
            <ScrollView
              className="flex-1"
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#999"
                />
              }
            >
              {Object.entries(groupedPhotos).map(([month, monthPhotos]) => (
                <MonthSection
                  key={month}
                  month={month}
                  photos={monthPhotos}
                  measurementMap={measurementMap}
                  onPhotoPress={handlePhotoPress}
                  onPhotoLongPress={handlePhotoLongPress}
                />
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {showActionSheet && (
        <View className="absolute inset-0 z-50">
          <Animated.View
            style={[{ backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}
            className="absolute inset-0"
          >
            <Pressable className="flex-1" onPress={closeActionSheet} />
          </Animated.View>
          <Animated.View
            style={[
              { position: 'absolute', bottom: 0, left: 0, right: 0 },
              sheetStyle,
            ]}
            className="bg-dsSurface rounded-t-3xl p-4 pb-8"
          >
            <View className="w-12 h-1 bg-dsBorder rounded-full self-center mb-4" />
            <Pressable
              onPress={handleCompare}
              className="flex-row items-center p-4 rounded-xl bg-dsElevated mb-2"
              accessibilityLabel="Compare photos"
              accessibilityRole="button"
            >
              <GitCompare
                size={20}
                color="#fff"
                accessibilityElementsHidden
              />
              <Text className="text-dsText ml-3 font-medium">Compare</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="flex-row items-center p-4 rounded-xl bg-dsElevated mb-2"
              accessibilityLabel="Share photo"
              accessibilityRole="button"
            >
              <Share2
                size={20}
                color="#fff"
                accessibilityElementsHidden
              />
              <Text className="text-dsText ml-3 font-medium">Share</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center p-4 rounded-xl bg-dsElevated mb-2"
              accessibilityLabel="Delete photo"
              accessibilityRole="button"
            >
              <Trash2
                size={20}
                color="#ef4444"
                accessibilityElementsHidden
              />
              <Text className="text-dsDanger ml-3 font-medium">Delete</Text>
            </Pressable>
            <Pressable
              onPress={closeActionSheet}
              className="flex-row items-center justify-center p-4 rounded-xl bg-dsElevated mt-2"
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text className="text-dsTextSecondary font-medium">Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}