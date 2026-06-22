import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { posthog } from "../lib/posthog";
import { createTheme } from "../lib/design-system";
import GlassCard from "../components/GlassCard";
import AnimatedButton from "../components/AnimatedButton";
import Constants from "expo-constants";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = createTheme("Auth", "");
  const scheme = Constants.expoConfig?.scheme || "app";

  const sendMagicLink = async () => {
    if (!email || loading) return;
    setLoading(true);
    try {
      posthog.capture("sign_in_attempted", { method: "magic_link" });
      await signIn(email, `${scheme}://auth/callback`);
      setSent(true);
    } catch (e) {
      console.error("Magic link failed", e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.palette.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="px-5 pt-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full" style={{ backgroundColor: theme.palette.textPrimary + "1A" }}>
            <ArrowLeft size={20} color={theme.palette.textPrimary} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold ml-3" style={{ color: theme.palette.textPrimary }}>Sign In</Text>
        </View>
        <View className="flex-1 justify-center px-5">
          <Text className="text-2xl font-bold mb-2" style={{ color: theme.palette.textPrimary }}>Welcome back</Text>
          <Text className="mb-8" style={{ color: theme.palette.textSecondary }}>Enter your email and we'll send you a magic link.</Text>
          <GlassCard appName="Auth" tagline="" style={{ marginBottom: 16 }}>
            <View className="flex-row items-center">
              <Mail size={18} color={theme.palette.textSecondary} />
              <TextInput
                className="flex-1 ml-3"
                style={{ color: theme.palette.textPrimary }}
                placeholder="you@example.com"
                placeholderTextColor={theme.palette.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </GlassCard>
          <AnimatedButton
            appName="Auth"
            title={loading ? "Sending…" : sent ? "Check your inbox" : "Send Magic Link"}
            variant="primary"
            onPress={sendMagicLink}
            disabled={loading || !email}
          />
          {sent && (
            <Text className="text-green-400 text-center mt-4">
              Magic link sent! Open it on this device to sign in.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
