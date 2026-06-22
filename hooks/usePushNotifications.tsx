import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

const DEVICE_ID_KEY = "device_id";

async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  const requestPermission = useCallback(async () => {
    if (!Device.isDevice) return;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    setPermissionStatus(finalStatus);
    if (finalStatus === "granted") {
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        setExpoPushToken(token.data);
        const deviceId = await getOrCreateDeviceId();
        await supabase.from("device_tokens").upsert({
          token: token.data,
          device_id: deviceId,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, { onConflict: "token" });
      } catch (e) {
        // getExpoPushTokenAsync requires a real projectId on EAS; swallow so dev still runs
        console.warn("[push] token register failed", e);
      }
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string" && url.length > 0) {
        Linking.openURL(url);
      }
    });
    return () => {
      responseListener.remove();
    };
  }, []);

  return { expoPushToken, notification, permissionStatus, requestPermission };
}
