import { PostHog, PostHogProvider } from "posthog-react-native";
import { ReactNode, createElement } from "react";

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY || "",
  { host: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com" }
);

export function PostHogClientProvider({ children }: { children: ReactNode }) {
  return createElement(PostHogProvider, { client: posthog }, children);
}