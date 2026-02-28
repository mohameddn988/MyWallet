import { Tabs } from "expo-router";
import { CustomTabBar } from "../../components/layout/CustomTabBar";

export default function HomeTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
      <Tabs.Screen name="accounts" options={{ title: "Accounts" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      {/* Hidden from tab bar — navigated to programmatically */}
      <Tabs.Screen name="filtered-transactions" options={{ href: null }} />
    </Tabs>
  );
}
