import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Share2 as ShareIcon,
  Trash2,
  Image as ImageIcon,
  Plus,
} from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { posthog } from '@/lib/posthog';
import { useTheme } from '@/lib/design-system';
import ComparisonSlider from '@/components/ComparisonSlider';
import CategoryPill from '@/components/CategoryPill';

interface PhotoCategory {
  name: string;
}

interface Photo {
  id: string;
  user_id: string;
  category_id: string;
  image_url: string;
  is_cover: boolean;
  taken_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  photo_categories?: PhotoCategory | null;
}

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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function LoadingShimmer(): JSX.Element {
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View className="flex-1 bg-dsBackground">
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[{ height: SCREEN_HEIGHT * 0.5 }, pulseStyle]}
        className="bg-dsSurface rounded-2xl mx-4 mt-4"
      />
      <Animated.View
        style={pulseStyle}
        className="bg-dsSurface rounded-xl mx-4 mt-6 h-4"
      />
      <Animated.View
        style={pulseStyle}
        className="bg-dsSurface rounded-xl mx-4 mt-3 h-4 w-2/3"
      />
      <Animated.View
        style={pulseStyle}
        className="bg-dsSurface rounded-xl mx-4 mt-6 h-24"
      />
      <Animated.View
        style={pulseStyle}
        className="bg-dsSurface rounded-xl mx-4 mt-4 h-12"
      />
    </View>
  );
}

export default function PhotoDetailScreen(): JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const rawId = useLocalSearchParams<{ id: string }>().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [previousPhoto, setPreviousPhoto] = useState<Photo | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastScrubRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('Invalid photo ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: photoRow, error: photoErr } = await supabase
        .from('photos')
        .select('*, photo_categories(name)')
        .eq('id', id)
        .single();

      if (photoErr) {
        throw new Error(photoErr.message);
      }

      if (!photoRow) {
        if (isMountedRef.current) {
          setPhoto(null);
          setLoading(false);
        }
        return;
      }

      const currentPhoto = photoRow as unknown as Photo;
      if (isMountedRef.current) {
        setPhoto(currentPhoto);
        setNotesDraft(currentPhoto.notes ?? '');
      }

      if (currentPhoto.category_id) {
        const { data: prevRows } = await supabase
          .from('photos')
          .select('*')
          .eq('category_id', currentPhoto.category_id)
          .lt('taken_at', currentPhoto.taken_at)
          .order('taken_at', { ascending: false })
          .limit(1);

        if (isMountedRef.current) {
          setPreviousPhoto(
            prevRows && prevRows.length > 0
              ? (prevRows[0] as unknown as Photo)
              : null
          );
        }
      } else if (isMountedRef.current) {
        setPreviousPhoto(null);
      }

      const { data: measRows } = await supabase
        .from('measurements')
        .select('*')
        .eq('photo_id', id)
        .order('measured_at', { ascending: false });

      if (isMountedRef.current) {
        setMeasurements((measRows as unknown as Measurement[]) ?? []);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load photo';
      if (isMountedRef.current) {
        setError(message);
      }
      posthog.capture('photo_detail_load_error', {
        photo_id: id,
        error: String(err),
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSlide = useCallback(() => {
    const now = Date.now();
    if (now - lastScrubRef.current < 400) return;
    lastScrubRef.current = now;

    Haptics.selectionAsync();
    posthog.capture('scrub_comparison', {
      photo_id: photo?.id,
      previous_photo_id: previousPhoto?.id,
    });
  }, [photo?.id, previousPhoto?.id]);

  const handleNotesBlur = async () => {
    if (!photo || notesDraft === (photo.notes ?? '')) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavingNotes(true);

    try {
      const { error: updateErr } = await supabase
        .from('photos')
        .update({ notes: notesDraft, updated_at: new Date().toISOString() })
        .eq('id', photo.id);

      if (updateErr) throw new Error(updateErr.message);

      setPhoto((prev) => (prev ? { ...prev, notes: notesDraft } : null));
      posthog.capture('update_notes', { photo_id: photo.id });
    } catch (err) {
      posthog.capture('update_notes_error', {
        photo_id: photo.id,
        error: String(err),
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSetCover = async () => {
    if (!photo?.category_id || photo.is_cover) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSettingCover(true);

    try {
      await supabase
        .from('photos')
        .update({ is_cover: false, updated_at: new Date().toISOString() })
        .eq('category_id', photo.category_id)
        .neq('id', photo.id);

      const { error: updateErr } = await supabase
        .from('photos')
        .update({ is_cover: true, updated_at: new Date().toISOString() })
        .eq('id', photo.id);

      if (updateErr) throw new Error(updateErr.message);

      setPhoto((prev) => (prev ? { ...prev, is_cover: true } : null));
      posthog.capture('set_cover_photo', {
        photo_id: photo.id,
        category_id: photo.category_id,
      });
    } catch (err) {
      posthog.capture('set_cover_photo_error', {
        photo_id: photo.id,
        error: String(err),
      });
    } finally {
      setIsSettingCover(false);
    }
  };

  const handleDelete = () => {
    if (!photo) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            posthog.capture('delete_photo_cancelled', { photo_id: photo.id });
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setIsDeleting(true);

            try {
              const url = photo.image_url;
              const storagePath = url.includes('/object/public/')
                ? url.split('/object/public/').pop()
                : null;

              if (storagePath) {
                const bucket = storagePath.split('/')[0];
                const path = storagePath.split('/').slice(1).join('/');
                if (bucket && path) {
                  await supabase.storage.from(bucket).remove([path]);
                }
              }

              const { error: deleteErr } = await supabase
                .from('photos')
                .delete()
                .eq('id', photo.id);

              if (deleteErr) throw new Error(deleteErr.message);

              posthog.capture('delete_photo', { photo_id: photo.id });
              router.back();
            } catch (err) {
              setIsDeleting(false);
              posthog.capture('delete_photo_error', {
                photo_id: photo.id,
                error: String(err),
              });
              Alert.alert(
                'Error',
                'Failed to delete photo. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!photo) return;

    try {
      await Share.share({
        url: photo.image_url,
        message: `My progress photo from ${new Date(
          photo.taken_at
        ).toLocaleDateString()}`,
      });
      posthog.capture('share_photo', { photo_id: photo.id });
    } catch {
      // User cancelled or share failed silently
    }
  };

  const handleAddMeasurement = () => {
    if (!photo) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture('add_measurement_from_detail', {
      photo_id: photo.id,
      category_id: photo.category_id,
    });
    router.push({
      pathname: '/measurements',
      params: {
        categoryId: photo.category_id,
        photoId: photo.id,
      },
    });
  };

  if (loading) {
    return <LoadingShimmer />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-dsBackground items-center justify-center px-6">
        <Text className="text-dsDanger text-base text-center mb-2">
          {error}
        </Text>
        <Text className="text-dsTextMuted text-sm text-center mb-6">
          Failed to load photo details. Check your connection and try again.
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            fetchData();
          }}
          accessibilityLabel="Retry loading photo"
          accessibilityRole="button"
          className="bg-dsPrimary px-6 py-3 rounded-xl mb-4"
        >
          <Text className="text-dsTextInverse font-semibold text-base">
            Retry
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back to history"
          accessibilityRole="button"
          className="px-6 py-3"
        >
          <Text className="text-dsTextSecondary text-base">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!photo) {
    return (
      <View className="flex-1 bg-dsBackground items-center justify-center px-6">
        <Text className="text-dsText text-lg font-medium mb-2">
          Photo not found
        </Text>
        <Text className="text-dsTextMuted text-sm text-center mb-6">
          This photo may have been deleted or the link is invalid.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back to history"
          accessibilityRole="button"
          className="bg-dsSurface px-6 py-3 rounded-xl border border-dsBorder"
        >
          <Text className="text-dsText font-medium text-base">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      className="flex-1 bg-dsBackground"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View style={{ height: SCREEN_HEIGHT * 0.58 }}>
          <ComparisonSlider
            currentImageUrl={photo.image_url}
            previousImageUrl={previousPhoto?.image_url ?? null}
            disabled={!previousPhoto}
            onSlide={handleSlide}
          />
        </View>

        <View className="px-4 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-dsTextSecondary text-sm">
              {new Date(photo.taken_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {photo.photo_categories?.name ? (
              <CategoryPill name={photo.photo_categories.name} />
            ) : null}
          </View>

          <View className="mb-6">
            <Text className="text-dsText text-sm font-semibold mb-2">
              Notes
            </Text>
            <TextInput
              value={notesDraft}
              onChangeText={setNotesDraft}
              onBlur={handleNotesBlur}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder="Add notes about lighting, pump, diet, or how you felt..."
              placeholderTextColor={theme.palette.textMuted}
              className="bg-dsSurface text-dsText p-3 rounded-xl min-h-[80px] border border-dsBorder"
              accessibilityLabel="Photo notes input"
              accessibilityRole="text"
              editable={!isSavingNotes}
            />
            {isSavingNotes && (
              <View className="flex-row items-center mt-2">
                <ActivityIndicator
                  size="small"
                  color={theme.palette.primary}
                />
                <Text className="text-dsTextMuted text-xs ml-2">
                  Saving notes...
                </Text>
              </View>
            )}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-dsText text-sm font-semibold">
                Measurements
              </Text>
              <Pressable
                onPress={handleAddMeasurement}
                accessibilityLabel="Add measurement"
                accessibilityRole="button"
                className="flex-row items-center bg-dsSurface px-3 py-1.5 rounded-lg border border-dsBorder"
              >
                <Plus
                  size={16}
                  color={theme.palette.primary}
                  accessibilityElementsHidden
                />
                <Text className="text-dsPrimary text-sm font-medium ml-1">
                  Add
                </Text>
              </Pressable>
            </View>

            {measurements.length === 0 ? (
              <View className="bg-dsSurface rounded-xl p-4 border border-dsBorder">
                <Text className="text-dsTextMuted text-sm text-center">
                  No measurements logged for this photo.
                </Text>
                <Pressable
                  onPress={handleAddMeasurement}
                  accessibilityLabel="Log your first measurement"
                  accessibilityRole="button"
                  className="mt-2"
                >
                  <Text className="text-dsPrimary text-sm text-center font-medium">
                    Log your first measurement
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-dsSurface rounded-xl border border-dsBorder overflow-hidden">
                {measurements.map((m, index) => (
                  <View
                    key={m.id}
                    className={`flex-row items-center justify-between px-4 py-3 ${
                      index < measurements.length - 1
                        ? 'border-b border-dsBorder'
                        : ''
                    }`}
                  >
                    <Text className="text-dsText font-medium">
                      {m.metric_name}
                    </Text>
                    <Text className="text-dsTextSecondary">
                      {m.value} {m.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={handleShare}
              accessibilityLabel="Share photo"
              accessibilityRole="button"
              className="flex-1 bg-dsSurface py-3 rounded-xl items-center justify-center border border-dsBorder"
            >
              <ShareIcon
                size={20}
                color={theme.palette.textPrimary}
                accessibilityElementsHidden
              />
              <Text className="text-dsText text-sm font-medium mt-1">
                Share
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSetCover}
              disabled={isSettingCover || photo.is_cover}
              accessibilityLabel="Set as cover photo"
              accessibilityRole="button"
              accessibilityState={{ disabled: photo.is_cover }}
              className={`flex-1 py-3 rounded-xl items-center justify-center border ${
                photo.is_cover
                  ? 'bg-dsSurface border-dsBorder opacity-60'
                  : 'bg-dsSurface border-dsBorder'
              }`}
            >
              <ImageIcon
                size={20}
                color={
                  photo.is_cover
                    ? theme.palette.textMuted
                    : theme.palette.textPrimary
                }
                accessibilityElementsHidden
              />
              <Text
                className={`text-sm font-medium mt-1 ${
                  photo.is_cover ? 'text-dsTextMuted' : 'text-dsText'
                }`}
              >
                {photo.is_cover ? 'Cover' : 'Set Cover'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              disabled={isDeleting}
              accessibilityLabel="Delete photo"
              accessibilityRole="button"
              className="flex-1 bg-dsDanger/10 py-3 rounded-xl items-center justify-center border border-dsDanger/20"
            >
              <Trash2
                size={20}
                color={theme.palette.danger}
                accessibilityElementsHidden
              />
              <Text className="text-dsDanger text-sm font-medium mt-1">
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}