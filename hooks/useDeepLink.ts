import { useEffect, useState, useCallback } from "react";
import * as Linking from "expo-linking";

export function useDeepLink() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then((u) => {
      if (u) setUrl(u);
    });
    const subscription = Linking.addEventListener("url", ({ url: u }) => {
      setUrl(u);
    });
    return () => subscription.remove();
  }, []);

  const processLink = useCallback(() => {
    if (!url) return null;
    const parsed = Linking.parse(url);
    return parsed;
  }, [url]);

  return { url, processLink };
}
