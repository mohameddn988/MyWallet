import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthMode, AuthUser } from "../contexts/AuthContext";

const AUTH_KEY = "@mywallet_auth";
// Must match the key used by FinanceContext
const GET_STARTED_KEY = "@mywallet_onboarding_complete";

export const auth = {
  // ── Session ──────────────────────────────────────────────────────────────

  /** Load the persisted auth session from storage. Returns null if none. */
  loadSession: async (): Promise<{ mode: AuthMode; user: AuthUser | null } | null> => {
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

  /** Persist the current auth session to storage. */
  saveSession: async (mode: AuthMode, user: AuthUser | null): Promise<void> => {
    try {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ mode, user }));
    } catch (error) {
      console.error("[Auth] Failed to save session:", error);
    }
  },

  /** Clear the persisted auth session (sign out). */
  clearSession: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("[Auth] Failed to clear session:", error);
    }
  },

  // ── Get-started / Onboarding ──────────────────────────────────────────────

  /** Returns true if the user has already completed the get-started / finance setup flow. */
  hasCompletedSetup: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(GET_STARTED_KEY);
      return value === "true";
    } catch (error) {
      console.error("[Auth] Failed to check setup status:", error);
      return false;
    }
  },

  /** Mark the get-started flow as completed. */
  setSetupCompleted: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(GET_STARTED_KEY, "true");
    } catch (error) {
      console.error("[Auth] Failed to set setup status:", error);
    }
  },

  /** Reset the get-started flag (useful for testing or account reset). */
  resetSetup: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(GET_STARTED_KEY);
    } catch (error) {
      console.error("[Auth] Failed to reset setup status:", error);
    }
  },
};
