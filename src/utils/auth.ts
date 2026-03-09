import { AuthMode, AuthUser } from "../contexts/AuthContext";
import {
  clearAuthSession,
  getRealm,
  readAuthSession,
  writeAuthSession,
} from "../lib/realm";

export const auth = {
  loadSession: async (): Promise<{
    mode: AuthMode;
    user: AuthUser | null;
  } | null> => {
    try {
      const realm = await getRealm();
      const session = readAuthSession(realm);
      if (!session?.mode) return null;

      // Cloud sessions are only valid when a JWT token exists.
      if (session.mode === "online" && !session.token) return null;

      const user = session.userJSON
        ? (JSON.parse(session.userJSON) as AuthUser)
        : null;
      return { mode: session.mode as AuthMode, user };
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
      const realm = await getRealm();
      const patch: Parameters<typeof writeAuthSession>[1] = {
        mode: mode ?? undefined,
        userJSON: user ? JSON.stringify(user) : undefined,
      };
      if (token !== undefined) patch.token = token;
      writeAuthSession(realm, patch);
    } catch (error) {
      console.error("[Auth] Failed to save session:", error);
    }
  },

  clearSession: async (): Promise<void> => {
    try {
      const realm = await getRealm();
      clearAuthSession(realm);
    } catch (error) {
      console.error("[Auth] Failed to clear session:", error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      const realm = await getRealm();
      const session = readAuthSession(realm);
      return session?.token ?? null;
    } catch {
      return null;
    }
  },

  hasCompletedSetup: async (): Promise<boolean> => {
    try {
      const realm = await getRealm();
      const session = readAuthSession(realm);
      return session?.setupCompleted ?? false;
    } catch {
      return false;
    }
  },

  setSetupCompleted: async (): Promise<void> => {
    try {
      const realm = await getRealm();
      writeAuthSession(realm, { setupCompleted: true });
    } catch (error) {
      console.error("[Auth] Failed to set setup status:", error);
    }
  },

  resetSetup: async (): Promise<void> => {
    try {
      const realm = await getRealm();
      writeAuthSession(realm, { setupCompleted: false });
    } catch (error) {
      console.error("[Auth] Failed to reset setup status:", error);
    }
  },
};
