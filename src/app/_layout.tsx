import { Stack, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { View } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { FinanceProvider } from "../contexts/FinanceContext";
import { GetStartedProvider } from "../contexts/GetStartedContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutWithTheme() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Splash screen lives at the root index — exclude it from safe area
  const isSplash = pathname === "/";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background.darker,
        paddingBottom: isSplash ? 0 : insets.bottom,
      }}
    >
      <SafeAreaView
        edges={isSplash ? [] : ["top"]}
        style={{ flex: 1, backgroundColor: theme.background.dark }}
      >
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
          <Stack.Screen
            name="account/add"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="account/[id]"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </SafeAreaView>
    </View>
  );
}
