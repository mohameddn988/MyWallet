import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolves the base URL of the backend API server.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL env var (production / staging)
 *  2. Derived from Constants.expoConfig.hostUri + EXPO_PUBLIC_API_PORT (dev)
 *  3. localhost fallback for web dev
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const port = process.env.EXPO_PUBLIC_API_PORT ?? "4000";

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      // hostUri is like "192.168.1.5:8081" — extract only the host part.
      // Android emulator special-case: swap to 10.0.2.2 when host is localhost.
      const host = hostUri.split(":")[0];
      const resolvedHost =
        Platform.OS === "android" && (host === "localhost" || host === "127.0.0.1")
          ? "10.0.2.2"
          : host;
      return `http://${resolvedHost}:${port}`;
    }
  }

  // Web dev fallback.
  return `http://localhost:${port}`;
}

/** Build a full URL for an API route path, e.g. "/api/auth/google" */
export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}
