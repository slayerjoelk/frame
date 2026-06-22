import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Zap, Check } from "lucide-react-native";
import { posthog } from "../lib/posthog";

const features = [
  "Smart automation",
  "Beautiful UI",
  "Secure cloud sync",
  "Works offline",
];

export default function Marketing() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-dark">
      <View className="px-6 pt-12 items-center">
        <View className="bg-primary/20 p-4 rounded-full mb-4">
          <Zap size={32} color="#F59E0B" />
        </View>
        <Text className="text-white text-3xl font-bold text-center mb-2">Frame</Text>
        <Text className="text-white/60 text-center text-base mb-8">Align your progress photos</Text>
        <View className="w-full mb-8">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-center py-2">
              <Check size={18} color="#22C55E" />
              <Text className="text-white/80 ml-3 text-base">{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => {
            posthog.capture("marketing_cta_tapped");
            router.push("/auth");
          }}
          className="bg-primary rounded-2xl py-4 px-8 items-center w-full"
        >
          <Text className="text-dark font-bold text-base">Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}