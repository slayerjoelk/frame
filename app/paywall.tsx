import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { usePremium } from "../hooks/usePremium";
import { posthog } from "../lib/posthog";
import { createTheme } from "../lib/design-system";
import Paywall from "../components/Paywall";
import GlassCard from "../components/GlassCard";

const features = [
  "Unlimited usage",
  "Advanced analytics",
  "Priority support",
  "Cloud backup",
  "Ad-free experience",
];

export default function PaywallScreen() {
  const router = useRouter();
  const { isPremium, packages, purchase } = usePremium();
  const theme = createTheme("Frame", "");

  useEffect(() => {
    posthog.capture("paywall_viewed");
  }, []);

  const tiers = packages.map((pkg: any) => ({
    id: pkg.identifier,
    name: pkg.product.title || pkg.packageType,
    price: pkg.product.priceString,
    period: pkg.packageType === "MONTHLY" ? "/month" : pkg.packageType === "ANNUAL" ? "/year" : "",
    features: [pkg.product.description || "Premium access"],
    highlighted: pkg.packageType === "ANNUAL",
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.palette.background }}>
      {isPremium ? (
        <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <GlassCard appName="Frame" tagline="" style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: theme.palette.primary, marginBottom: 8 }}>You're Premium!</Text>
            <Text style={{ color: theme.palette.textSecondary, textAlign: "center" }}>Thanks for supporting the app.</Text>
          </GlassCard>
        </View>
      ) : (
        <Paywall
          appName="Frame"
          visible={true}
          title="Unlock Frame Pro"
          subtitle="Get the most out of your app."
          features={features}
          tiers={tiers}
          onSelectTier={(tier: any) => {
            const pkg = packages.find((p: any) => p.identifier === tier.id);
            if (pkg) {
              posthog.capture("purchase_attempted", { package: pkg.identifier });
              purchase(pkg);
              posthog.capture("purchase_completed", { package: pkg.identifier });
            }
          }}
          onClose={() => router.back()}
        />
      )}
    </SafeAreaView>
  );
}
