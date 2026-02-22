import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import SplashScreen from "../components/ui/SplashScreen";

export default function Index() {
  const { authMode, isLoading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  // Once splash is done AND auth has loaded, navigate
  useEffect(() => {
    if (showSplash || isLoading) return;

    if (authMode === null) {
      router.navigate("/auth");
    } else {
      router.navigate("/home");
    }
  }, [showSplash, isLoading, authMode, router]);

  if (showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  return null;
}
