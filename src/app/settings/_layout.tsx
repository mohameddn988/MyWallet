import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="locale" />
      <Stack.Screen name="data" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
