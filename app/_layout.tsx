import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createTheme, ThemeProvider } from '@/lib/design-system';
import { AuthProvider } from '@/hooks/useAuth';
import { configurePurchases } from '@/lib/revenuecat';
import { posthog } from '@/lib/posthog';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = '@frame:themeMode';

export default function RootLayout(): JSX.Element {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const theme = useMemo(
    () => createTheme(themeMode, 'Align your progress photos'),
    [themeMode]
  );

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark')) {
          setThemeMode(stored);
        }
      } catch {
        // Ignore read errors; default to dark
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode).catch(() => {});
  }, [themeMode, isReady]);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    const init = async () => {
      try {
        setInitError(null);
        await configurePurchases();
        if (!cancelled) {
          posthog.capture('app_session_started');
        }
      } catch (e) {
        if (!cancelled) {
          setInitError('Failed to initialize app services.');
          posthog.capture('app_init_failed', { error: String(e) });
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [isReady, retryCount]);

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture('settings_tapped', { from: pathname });
    router.push('/settings');
  };

  const handleSettingsLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    posthog.capture('theme_toggled', { mode: next });
  };

  const handleRetryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    posthog.capture('app_init_retry');
    setRetryCount((c) => c + 1);
  };

  if (!isReady || initError) {
    return (
      <SafeAreaProvider>
        <View
          className="flex-1 bg-dsBackground items-center justify-center px-6"
          accessibilityElementsHidden={false}
        >
          {initError ? (
            <View className="items-center">
              <Text className="text-dsDanger text-base text-center mb-6">
                {initError}
              </Text>
              <Pressable
                onPress={handleRetryPress}
                accessibilityLabel="Retry app initialization"
                accessibilityRole="button"
                className="bg-dsPrimary px-6 py-3 rounded-xl"
              >
                <Text className="text-dsTextInverse font-semibold text-base">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            <ActivityIndicator size="large" color={theme.palette.primary} />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
          <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
            <Stack
              screenOptions={({ route }) => ({
                headerShown: route.name !== 'index',
                presentation: 'card',
                contentStyle: { backgroundColor: theme.palette.background },
                headerStyle: { backgroundColor: theme.palette.surface },
                headerTintColor: theme.palette.textPrimary,
                headerRight: () =>
                  route.name !== 'index' ? (
                    <Pressable
                      onPressIn={() => {
                        scale.value = withTiming(0.85, { duration: 100 });
                      }}
                      onPressOut={() => {
                        scale.value = withTiming(1, { duration: 100 });
                      }}
                      onPress={handleSettingsPress}
                      onLongPress={handleSettingsLongPress}
                      accessibilityLabel="Open settings"
                      accessibilityRole="button"
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      className="mr-4"
                    >
                      <Animated.View style={animatedStyle}>
                        <Settings
                          size={24}
                          color={theme.palette.textPrimary}
                          accessibilityElementsHidden
                        />
                      </Animated.View>
                    </Pressable>
                  ) : null,
              })}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="history" options={{ title: 'Timeline' }} />
              <Stack.Screen
                name="detail/[id]"
                options={{ title: 'Photo Detail' }}
              />
              <Stack.Screen
                name="measurements"
                options={{ title: 'Measurement Log' }}
              />
              <Stack.Screen
                name="auth"
                options={{ headerShown: false, presentation: 'modal' }}
              />
              <Stack.Screen
                name="auth/callback"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen
                name="paywall"
                options={{ presentation: 'modal', headerShown: false }}
              />
            </Stack>
          </Animated.View>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}