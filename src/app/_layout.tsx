import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { FinanceProvider } from "../contexts/FinanceContext";
import { GetStartedProvider } from "../contexts/GetStartedContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <FinanceProvider>
            <GetStartedProvider>
              <SafeAreaProvider>
                <RootLayoutWithTheme />
              </SafeAreaProvider>
            </GetStartedProvider>
          </FinanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutWithTheme() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background.dark }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background.dark },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/index" />
        <Stack.Screen
          name="get-started/welcome"
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="get-started/currency"
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="get-started/accounts"
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="get-started/exchange-rates"
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="get-started/first-transaction"
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="get-started/done"
          options={{ animation: "none" }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="transaction/add"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </SafeAreaView>
  );
}
