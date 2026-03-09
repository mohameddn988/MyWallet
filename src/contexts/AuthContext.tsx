import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth } from "../utils/auth";
import { apiUrl } from "../lib/apiUrl";

export type AuthMode = "online" | "offline" | "pending-online" | null;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleSignInResult {
  status: "online" | "pending" | "failed";
  hasCompleted: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  authMode: AuthMode;
  user: AuthUser | null;
  signInWithGoogle: (idToken: string) => Promise<GoogleSignInResult>;
  signInLocal: (email: string, password: string) => Promise<void>;
  continueOffline: () => Promise<void>;
  signOut: () => Promise<void>;
  commitPendingGoogleSignIn: () => Promise<void>;
  cancelPendingGoogleSignIn: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const previousSessionRef = useRef<{
    mode: AuthMode;
    user: AuthUser | null;
  } | null>(null);

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

  const signInWithGoogle = async (idToken: string): Promise<GoogleSignInResult> => {
    try {
      const res = await fetch(apiUrl("/api/auth/google"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error(`Auth API returned ${res.status}`);
      const { token, user: serverUser, hasCompleted } = await res.json();
      const u: AuthUser = {
        id: serverUser.id,
        email: serverUser.email,
        name: serverUser.name,
        picture: serverUser.picture,
      };

      previousSessionRef.current = {
        mode: authMode,
        user,
      };
      setPendingToken(token);
      setUser(u);
      setAuthMode("pending-online");

      return {
        status: "pending",
        hasCompleted: Boolean(hasCompleted),
      };
    } catch (err) {
      console.error("[Auth] Google sign-in failed:", err);
      return {
        status: "failed",
        hasCompleted: false,
      };
    }
  };

  const signInLocal = async (email: string, password: string) => {
    console.log("[Auth] Local sign-in attempt:", email, password);
    const u: AuthUser = { id: "local-1", email, name: email.split("@")[0] };
    previousSessionRef.current = null;
    setPendingToken(null);
    setUser(u);
    setAuthMode("online");
    await auth.saveSession("online", u);
  };

  const continueOffline = async () => {
    previousSessionRef.current = null;
    setPendingToken(null);
    setUser(null);
    setAuthMode("offline");
    await auth.saveSession("offline", null);
  };

  const signOut = async () => {
    previousSessionRef.current = null;
    setPendingToken(null);
    setUser(null);
    setAuthMode(null);
    await auth.clearSession();
  };

  const commitPendingGoogleSignIn = async () => {
    if (authMode !== "pending-online" || !user || !pendingToken) return;

    await auth.saveSession("online", user, pendingToken);
    previousSessionRef.current = null;
    setPendingToken(null);
    setAuthMode("online");
  };

  const cancelPendingGoogleSignIn = async () => {
    if (authMode !== "pending-online") return;

    const previous = previousSessionRef.current;
    previousSessionRef.current = null;
    setPendingToken(null);

    if (!previous || previous.mode === null) {
      setUser(null);
      setAuthMode(null);
      return;
    }

    setUser(previous.user);
    setAuthMode(previous.mode);
  };

  const getAccessToken = async () => {
    return pendingToken ?? auth.getToken();
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
        commitPendingGoogleSignIn,
        cancelPendingGoogleSignIn,
        getAccessToken,
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
