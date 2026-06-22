import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  useEffect(() => {
    Purchases.configure({
      apiKey: Platform.OS === "ios" ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "") : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || ""),
    });
    Purchases.getOfferings()
      .then((offerings) => {
        const current = offerings.current;
        if (current) {
          setPackages(current.availablePackages);
        }
        return Purchases.getCustomerInfo();
      })
      .then((customerInfo) => {
        setIsPremium(customerInfo.entitlements.active["premium"]?.isActive === true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const purchase = async (pkg: PurchasesPackage) => {
    try {
      const result = await Purchases.purchasePackage(pkg);
      setIsPremium(result.customerInfo.entitlements.active["premium"]?.isActive === true);
    } catch (e) {
      console.error("Purchase failed", e);
    }
  };

  const restore = async () => {
    try {
      const result = await Purchases.restorePurchases();
      setIsPremium(result.entitlements.active["premium"]?.isActive === true);
    } catch (e) {
      console.error("Restore failed", e);
    }
  };

  return { isPremium, loading, packages, purchase, restore };
}
