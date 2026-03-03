import { Tabs, usePathname } from "expo-router";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { CustomTabBar } from "../../components/layout/CustomTabBar";
import AddButton from "../../components/ui/AddButton";

export default function HomeTabsLayout() {
  const pathname = usePathname();
  const showAddButton = !pathname.includes("/settings");

  return (
    <View style={styles.root}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
        <Tabs.Screen name="accounts" options={{ title: "Accounts" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>

      {showAddButton && (
        <View style={styles.addButtonContainer}>
          <AddButton
            onAddTransaction={() => router.navigate("/transaction/add" as any)}
            onAddAccount={() => router.navigate("/account/add" as any)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 80,
    right: 24,
  },
});
