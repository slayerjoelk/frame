import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ArrowLeft, Bell, Shield, Crown, Palette, LogOut } from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { usePremium } from "../hooks/usePremium";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useDeepLink } from "../hooks/useDeepLink";
import { posthog } from "../lib/posthog";
import { createTheme } from "../lib/design-system";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium } = usePremium();
  const { permissionStatus, requestPermission } = usePushNotifications();
  const { url } = useDeepLink();
  const theme = createTheme("Settings", "");

  useEffect(() => {
    posthog.capture("settings_viewed");
  }, []);

  const Row = ({ icon: Icon, label, value, onPress, toggle }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b"
      style={{ borderBottomColor: theme.palette.textPrimary + "0D" }}
    >
      <View className="flex-row items-center">
        <Icon size={18} color={theme.palette.textSecondary} />
        <Text className="ml-3 text-base" style={{ color: theme.palette.textPrimary }}>{label}</Text>
      </View>
      {toggle !== undefined ? (
        <Switch value={toggle} onValueChange={onPress} trackColor={{ false: "#374151", true: theme.palette.primary }} />
      ) : (
        <Text style={{ color: theme.palette.textSecondary }}>{value || "›"}</Text>
      )}
    </TouchableOpacity>
  );
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.palette.background }}>
      <View className="px-5 pt-4 flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full" style={{ backgroundColor: theme.palette.textPrimary + "1A" }}>
          <ArrowLeft size={20} color={theme.palette.textPrimary} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-3" style={{ color: theme.palette.textPrimary }}>Settings</Text>
      </View>
      <ScrollView className="px-5">
        <GlassCard appName="Settings" tagline="" style={{ marginBottom: 16 }}>
          <Row icon={Bell} label="Notifications" value={permissionStatus || "Unknown"} onPress={requestPermission} />
          <Row icon={Shield} label="Biometric Lock" toggle={false} />
          <Row icon={Palette} label="Theme" value="Dark" />
        </GlassCard>
        <GlassCard appName="Settings" tagline="" style={{ marginBottom: 16 }}>
          <Row icon={Crown} label="Premium" value={isPremium ? "Active" : "Free"} onPress={() => router.push("/paywall")} />
        </GlassCard>
        {url ? (
          <GlassCard appName="Settings" tagline="" style={{ marginBottom: 16 }}>
            <Text className="text-xs font-mono" style={{ color: theme.palette.textMuted }}>Deep link: {url}</Text>
          </GlassCard>
        ) : null}
        {user ? (
          <AnimatedButton
            appName="Settings"
            title="Sign Out"
            variant="danger"
            onPress={async () => {
              posthog.capture("settings_sign_out");
              await signOut();
            }}
            icon={<LogOut size={18} color="#FFFFFF" />}
            style={{ marginTop: 8 }}
          />
        ) : (
          <AnimatedButton
            appName="Settings"
            title="Sign In"
            variant="primary"
            onPress={() => router.push("/auth")}
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
