import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the base URL of the Expo dev server so native apps
 * (iOS / Android) can call API routes just like the web does.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL env var (production / custom)
 *  2. Derived from Constants.expoConfig.hostUri (dev)
 *  3. Empty string (web — relative URLs work natively)
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      // hostUri is like "192.168.1.5:8081" — use it directly.
      // Android emulator special-case: swap to 10.0.2.2 when host is localhost.
      const host = hostUri.split(":")[0];
      const resolvedHost =
        Platform.OS === "android" && (host === "localhost" || host === "127.0.0.1")
          ? "10.0.2.2"
          : host;
      return `http://${resolvedHost}:8081`;
    }
  }

  // Web: relative URLs work without a base.
  return "";
}

/** Build a full URL for an API route path, e.g. "/api/auth/google" */
export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}
