import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import SplashScreen from "../components/ui/SplashScreen";
import { auth } from "../utils/auth";

export default function Index() {
  const router = useRouter();
  // Start auth check immediately, in parallel with the splash animation
  const authRouteRef = useRef<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await auth.loadSession();
        const hasCompleted = await auth.hasCompletedSetup();
        // 1. Setup not done → go to auth
        // 2. Setup done but no valid session → go to auth
        // 3. Setup done + valid session → go to home
        if (!hasCompleted || !session || session.mode === null) {
          authRouteRef.current = "/auth";
        } else {
          authRouteRef.current = "/(tabs)/home";
        }
      } catch (error) {
        console.error("[Index] Error checking app state:", error);
        authRouteRef.current = "/auth";
      }
    };
    checkAuth();
  }, []);

  const handleSplashComplete = () => {
    // Auth check has had the full animation (~2.4s) to complete in parallel.
    // Replace so the splash is removed from the stack cleanly.
    router.replace((authRouteRef.current ?? "/auth") as any);
  };

  return <SplashScreen onAnimationComplete={handleSplashComplete} />;
}
