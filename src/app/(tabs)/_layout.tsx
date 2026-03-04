import { Tabs, usePathname } from "expo-router";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CustomTabBar } from "../../components/layout/CustomTabBar";
import AddButton from "../../components/ui/AddButton";
import { Toast } from "../../components/ui/Toast";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function HomeTabsLayout() {
  const pathname = usePathname();
  const showAddButton = !pathname.includes("/settings");
  const { theme } = useTheme();
  const { lastDeletedTransaction, restoreLastDeleted, clearLastDeleted } =
    useFinance();

  const [showUndoToast, setShowUndoToast] = useState(false);

  useEffect(() => {
    if (lastDeletedTransaction) {
      setShowUndoToast(true);
    }
  }, [lastDeletedTransaction]);

  const handleUndoDelete = useCallback(async () => {
    setShowUndoToast(false);
    await restoreLastDeleted();
  }, [restoreLastDeleted]);

  const handleToastDismiss = useCallback(() => {
    setShowUndoToast(false);
    clearLastDeleted();
  }, [clearLastDeleted]);

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

      <Toast
        visible={showUndoToast}
        message="Transaction deleted"
        icon="trash-can-outline"
        iconColor="#F14A6E"
        actionLabel="Undo"
        actionColor={theme.primary.main}
        onAction={handleUndoDelete}
        onDismiss={handleToastDismiss}
        duration={4000}
        bottom={72}
      />
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
    zIndex: 10,
  },
});
