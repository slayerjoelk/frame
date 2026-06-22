import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { createTheme } from "../../lib/design-system";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(null);
  const theme = createTheme("Auth", "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (params.error_description) {
        if (!cancelled) setError(String(params.error_description));
        return;
      }
      const code = typeof params.code === "string" ? params.code : null;
      if (!code) {
        if (!cancelled) setError("Missing auth code in callback URL.");
        return;
      }
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
        if (!cancelled) router.replace("/");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Sign-in failed.";
        if (!cancelled) setError(msg);
      }
    })();
    return () => { cancelled = true; };
  }, [params.code, params.error_description, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.palette.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {error ? (
          <>
            <Text style={{ color: theme.palette.danger, fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Sign-in failed</Text>
            <Text style={{ color: theme.palette.textSecondary, textAlign: "center" }}>{error}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator color={theme.palette.primary} />
            <Text style={{ color: theme.palette.textSecondary, marginTop: 12 }}>Finalizing sign-in…</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
