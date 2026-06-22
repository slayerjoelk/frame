import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
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

interface GhostOverlayProps {
  imageUri: string;
  baseOpacity: number;
  allowPinchScale: boolean;
}

export default function GhostOverlay({
  imageUri,
  baseOpacity,
  allowPinchScale,
}: GhostOverlayProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    setLoading(true);
    setError(false);
    scale.value = 1;
    savedScale.value = 1;
  }, [imageUri]);

  const notifyScaleEnd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture('scale_ghost');
  }, []);

  const notifyReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    posthog.capture('reset_ghost_scale');
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pinchGesture = Gesture.Pinch()
    .enabled(allowPinchScale)
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(notifyScaleEnd)();
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 200 });
      savedScale.value = 1;
      runOnJS(notifyReset)();
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, doubleTapGesture);

  return (
    <View className="absolute inset-0">
      {loading && !error && (
        <View
          className="absolute inset-0 z-20 bg-black/60 items-center justify-center"
          accessibilityRole="progressbar"
          accessibilityLabel="Loading ghost image"
        >
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {error && (
        <View
          className="absolute inset-0 z-20 bg-black/60 items-center justify-center"
          accessibilityRole="alert"
          accessibilityLabel="Ghost image unavailable"
        >
          <ImageOff size={48} color="#ffffff" accessibilityElementsHidden />
          <Text className="text-white text-base mt-3 font-medium">
            Ghost unavailable
          </Text>
        </View>
      )}

      {!error && (
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            className="flex-1"
            style={[{ opacity: baseOpacity }, animatedStyle]}
          >
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="contain"
              onLoadStart={() => setLoading(true)}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              accessibilityLabel="Ghost alignment image"
              accessibilityRole="image"
            />
            <View
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(200,220,255,0.1)' }}
              pointerEvents="none"
              accessibilityElementsHidden
            />
          </Animated.View>
        </GestureDetector>
      )}

      {!error && (
        <>
          <View
            className="absolute left-0 right-0 h-px bg-dsPrimary/30 top-1/2"
            pointerEvents="none"
            accessibilityElementsHidden
          />
          <View
            className="absolute top-0 bottom-0 w-px bg-dsPrimary/30 left-1/2"
            pointerEvents="none"
            accessibilityElementsHidden
          />
        </>
      )}
    </View>
  );
}