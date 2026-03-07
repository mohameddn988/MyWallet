import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthMode, AuthUser } from "../contexts/AuthContext";

const AUTH_KEY = "@mywallet_auth";
const AUTH_TOKEN_KEY = "@mywallet_token";
const GET_STARTED_KEY = "@mywallet_onboarding_complete";

export const auth = {
  loadSession: async (): Promise<{
    mode: AuthMode;
    user: AuthUser | null;
  } | null> => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      if (!stored) return null;
      const { mode, user } = JSON.parse(stored);
      return { mode: mode ?? null, user: user ?? null };
    } catch (error) {
      console.error("[Auth] Failed to load session:", error);
      return null;
    }
  },

  saveSession: async (
    mode: AuthMode,
    user: AuthUser | null,
    token?: string,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ mode, user }));
      if (token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      }
    } catch (error) {
      console.error("[Auth] Failed to save session:", error);
    }
  },

  clearSession: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([AUTH_KEY, AUTH_TOKEN_KEY]);
    } catch (error) {
      console.error("[Auth] Failed to clear session:", error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  hasCompletedSetup: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(GET_STARTED_KEY);
      return value === "true";
    } catch (error) {
      console.error("[Auth] Failed to check setup status:", error);
      return false;
    }
  },

  setSetupCompleted: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(GET_STARTED_KEY, "true");
    } catch (error) {
      console.error("[Auth] Failed to set setup status:", error);
    }
  },

  resetSetup: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(GET_STARTED_KEY);
    } catch (error) {
      console.error("[Auth] Failed to reset setup status:", error);
    }
  },
};
