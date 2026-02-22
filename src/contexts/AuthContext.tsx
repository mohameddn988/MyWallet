import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type AuthMode = "online" | "offline" | null;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  isLoading: boolean;
  authMode: AuthMode;
  user: AuthUser | null;
  signInWithGoogle: () => void;
  signInLocal: (email: string, password: string) => Promise<void>;
  continueOffline: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "@mywallet_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const { mode, user: u } = JSON.parse(stored);
          setAuthMode(mode ?? null);
          setUser(u ?? null);
        }
      } catch (e) {
        console.error("[Auth] Failed to load session:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const persist = async (mode: AuthMode, u: AuthUser | null) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ mode, user: u }));
  };

  const signInWithGoogle = () => {
    // TODO: integrate Google OAuth (expo-auth-session + Google provider)
    console.log("[Auth] Google sign-in pressed — not yet implemented");
  };

  const signInLocal = async (email: string, password: string) => {
    // TODO: validate against real backend or local credential store
    console.log("[Auth] Local sign-in attempt:", email, password);
    const u: AuthUser = { id: "local-1", email, name: email.split("@")[0] };
    setUser(u);
    setAuthMode("online");
    await persist("online", u);
  };

  const continueOffline = async () => {
    setUser(null);
    setAuthMode("offline");
    await persist("offline", null);
  };

  const signOut = async () => {
    setUser(null);
    setAuthMode(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        authMode,
        user,
        signInWithGoogle,
        signInLocal,
        continueOffline,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
