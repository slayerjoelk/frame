import { Platform } from "react-native";
import Purchases from "react-native-purchases";

export function configurePurchases() {
  Purchases.configure({
    apiKey: Platform.OS === "ios" ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "") : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || ""),
  });
}

export { Purchases };
