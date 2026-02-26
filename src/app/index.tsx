import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import SplashScreen from "../components/ui/SplashScreen";
import { useFinance } from "../contexts/FinanceContext";

export default function Index() {
  const { authMode, isLoading: authLoading } = useAuth();
  const { hasCompleted, isLoading: onboardingLoading } = useFinance();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  // Once splash is done AND both auth + onboarding have loaded, navigate
  useEffect(() => {
    if (showSplash || authLoading || onboardingLoading) return;

    if (authMode === null || !hasCompleted) {
      router.navigate("/auth");
    } else {
      router.navigate("/(tabs)/home" as any);
    }
  }, [showSplash, authLoading, onboardingLoading, authMode, hasCompleted, router]);

  if (showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  return null;
}
