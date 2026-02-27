import { useRouter } from "expo-router";
import { useState } from "react";
import SplashScreen from "../components/ui/SplashScreen";
import { auth } from "../utils/auth";

export default function Index() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = async () => {
    setShowSplash(false);

    try {
      const session = await auth.loadSession();
      const hasCompleted = await auth.hasCompletedSetup();

      // Navigation logic (runs once — never re-triggers on state changes):
      // 1. Setup not done → always go to auth (user must explicitly sign in each time)
      // 2. Setup done but no valid session → go to auth
      // 3. Setup done + valid session → go to home
      if (!hasCompleted || !session || session.mode === null) {
        router.navigate("/auth");
      } else {
        router.navigate("/(tabs)/home" as any);
      }
    } catch (error) {
      console.error("[Index] Error checking app state:", error);
      router.navigate("/auth");
    }
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return null;
}
