import { Stack } from "expo-router";

export default function AnalyticsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
