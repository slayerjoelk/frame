import React, { useState, useCallback, useEffect } from 'react';
import { View, Image, Text, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ImageOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { posthog } from '@/lib/posthog';

interface ComparisonSliderProps {
  beforeUri: string | null;
  afterUri: string;
  containerHeight: number;
}

export default function ComparisonSlider({
  beforeUri,
  afterUri,
  containerHeight,
}: ComparisonSliderProps): JSX.Element {
  const [containerWidth, setContainerWidth] = useState(0);
  const [afterStatus, setAfterStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [beforeStatus, setBeforeStatus] = useState<'loading' | 'error' | 'success'>(
    beforeUri ? 'loading' : 'success'
  );

  const dividerX = useSharedValue(0);
  const startX = useSharedValue(0);

  useEffect(() => {
    setAfterStatus('loading');
  }, [afterUri]);

  useEffect(() => {
    setBeforeStatus(beforeUri ? 'loading' : 'success');
  }, [beforeUri]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  useEffect(() => {
    if (containerWidth > 0) {
      dividerX.value = containerWidth / 2;
    }
  }, [containerWidth, dividerX]);

  const notifyPanEnd = useCallback((snapped: boolean) => {
    posthog.capture('scrub_comparison_slider', { snapped });
    if (snapped) {
      Haptics.selectionAsync();
    }
  }, []);

  const notifySnap = useCallback((side: 'before' | 'after') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture(side === 'before' ? 'snap_before' : 'snap_after');
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(!!beforeUri && containerWidth > 0)
    .onBegin(() => {
      startX.value = dividerX.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      if (newX < 0) {
        dividerX.value = 0;
      } else if (newX > containerWidth) {
        dividerX.value = containerWidth;
      } else {
        dividerX.value = newX;
      }
    })
    .onEnd(() => {
      const center = containerWidth / 2;
      const dist = Math.abs(dividerX.value - center);
      const snapped = dist < 20;
      if (snapped) {
        dividerX.value = withTiming(center, { duration: 150 });
      }
      runOnJS(notifyPanEnd)(snapped);
    });

  const tapGesture = Gesture.Tap()
    .enabled(!!beforeUri && containerWidth > 0)
    .onEnd((event) => {
      const isLeft = event.x < containerWidth / 2;
      if (isLeft) {
        dividerX.value = withTiming(containerWidth, { duration: 200 });
        runOnJS(notifySnap)('before');
      } else {
        dividerX.value = withTiming(0, { duration: 200 });
        runOnJS(notifySnap)('after');
      }
    });

  const beforeClipStyle = useAnimatedStyle(() => ({
    width: dividerX.value,
  }));

  const dividerContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dividerX.value - 22 }],
  }));

  const isLoading =
    afterStatus === 'loading' || (beforeUri !== null && beforeStatus === 'loading');
  const isError =
    afterStatus === 'error' || (beforeUri !== null && beforeStatus === 'error');

  return (
    <View
      className="relative overflow-hidden bg-dsSurface"
      style={{ height: containerHeight }}
      onLayout={handleLayout}
      accessibilityRole="image"
      accessibilityLabel={
        beforeUri ? 'Before and after photo comparison' : 'First progress photo'
      }
    >
      {isLoading && (
        <View
          className="absolute inset-0 flex-row"
          accessibilityRole="progressbar"
          accessibilityLabel="Loading comparison images"
        >
          <View className="flex-1 bg-dsElevated animate-pulse" />
          <View className="w-px bg-white/20" accessibilityElementsHidden />
          <View className="flex-1 bg-dsElevated animate-pulse" />
        </View>
      )}

      {isError && (
        <View
          className="absolute inset-0 bg-dsSurface items-center justify-center px-6"
          accessibilityRole="alert"
          accessibilityLabel="Images failed to load"
        >
          <ImageOff size={40} color="#ffffff" accessibilityElementsHidden />
          <Text className="text-dsDanger text-base font-medium mt-3 text-center">
            Images failed to load
          </Text>
        </View>
      )}

      {!isLoading && !isError && (
        <>
          <Image
            source={{ uri: afterUri }}
            className="absolute inset-0"
            resizeMode="cover"
            onLoad={() => setAfterStatus('success')}
            onError={() => setAfterStatus('error')}
            accessibilityLabel="After photo"
            accessibilityRole="image"
          />

          {beforeUri && (
            <Animated.View
              className="absolute left-0 top-0 bottom-0 overflow-hidden"
              style={beforeClipStyle}
            >
              <Image
                source={{ uri: beforeUri }}
                style={{ width: containerWidth, height: containerHeight }}
                resizeMode="cover"
                onLoad={() => setBeforeStatus('success')}
                onError={() => setBeforeStatus('error')}
                accessibilityLabel="Before photo"
                accessibilityRole="image"
              />
            </Animated.View>
          )}

          {beforeUri && (
            <GestureDetector gesture={tapGesture}>
              <View
                className="absolute inset-0"
                accessibilityLabel="Photo comparison tap area"
                accessibilityRole="button"
              />
            </GestureDetector>
          )}

          {beforeUri && (
            <Animated.View
              className="absolute top-0 bottom-0 w-11 items-center justify-center"
              style={dividerContainerStyle}
            >
              <GestureDetector gesture={panGesture}>
                <View
                  className="w-full h-full items-center justify-center"
                  accessibilityLabel="Drag handle to compare photos"
                  accessibilityRole="adjustable"
                >
                  <View
                    className="absolute w-0.5 h-full bg-white/80"
                    accessibilityElementsHidden
                  />
                  <View
                    className="w-10 h-10 rounded-full bg-white items-center justify-center"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 6,
                    }}
                  >
                    <View className="flex-row gap-1">
                      <View className="w-0.5 h-3 bg-dsBorder rounded-full" />
                      <View className="w-0.5 h-3 bg-dsBorder rounded-full" />
                    </View>
                  </View>
                </View>
              </GestureDetector>
            </Animated.View>
          )}

          {beforeUri ? (
            <>
              <View className="absolute top-3 left-3 bg-black/50 px-2 py-1 rounded-md">
                <Text className="text-white text-xs font-medium">Before</Text>
              </View>
              <View className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded-md">
                <Text className="text-white text-xs font-medium">After</Text>
              </View>
            </>
          ) : (
            <View className="absolute top-3 left-3 bg-dsPrimary/80 px-2 py-1 rounded-md">
              <Text className="text-white text-xs font-medium">First photo</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}