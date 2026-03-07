import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../utils/auth";
import { apiUrl } from "../lib/apiUrl";

export type AuthMode = "online" | "offline" | null;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

interface AuthContextType {
  isLoading: boolean;
  authMode: AuthMode;
  user: AuthUser | null;
  signInWithGoogle: () => Promise<void>;
  signInLocal: (email: string, password: string) => Promise<void>;
  continueOffline: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Load persisted auth session on mount
  useEffect(() => {
    const load = async () => {
      try {
        const session = await auth.loadSession();
        if (session) {
          setAuthMode(session.mode);
          setUser(session.user);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Auth API returned ${res.status}`);
      const { token, user: serverUser } = await res.json();
      const u: AuthUser = {
        id: serverUser.id,
        email: serverUser.email,
        name: serverUser.name,
        picture: serverUser.picture,
      };
      setUser(u);
      setAuthMode("online");
      await auth.saveSession("online", u, token);
    } catch (err) {
      console.error("[Auth] Google sign-in failed:", err);
    }
  };

  const signInLocal = async (email: string, password: string) => {
    console.log("[Auth] Local sign-in attempt:", email, password);
    const u: AuthUser = { id: "local-1", email, name: email.split("@")[0] };
    setUser(u);
    setAuthMode("online");
    await auth.saveSession("online", u);
  };

  const continueOffline = async () => {
    setUser(null);
    setAuthMode("offline");
    await auth.saveSession("offline", null);
  };

  const signOut = async () => {
    setUser(null);
    setAuthMode(null);
    await auth.clearSession();
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
