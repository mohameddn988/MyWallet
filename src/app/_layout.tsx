import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { FinanceProvider } from "../contexts/FinanceContext";
import { OnboardingProvider } from "../contexts/OnboardingContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <FinanceProvider>
              <SafeAreaProvider>
                <RootLayoutWithTheme />
              </SafeAreaProvider>
            </FinanceProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutWithTheme() {
  const { theme } = useTheme();

  return (
    // edges={['top','left','right']} — handles top status bar globally.
    // 'bottom' is intentionally excluded so the Tabs navigator manages it,
    // preventing a double bottom inset on the home tab bar.
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background.dark }}
      edges={["top", "left", "right"]}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background.dark },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/index" />
        <Stack.Screen name="get-started/index" />
        <Stack.Screen name="home" />
      </Stack>
    </SafeAreaView>
  );
}
