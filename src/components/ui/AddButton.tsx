import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface AddButtonProps {
  onAddTransaction?: () => void;
  onAddAccount?: () => void;
}

const ACTIONS = [
  {
    label: "Transaction",
    icon: "swap-horizontal" as const,
    color: "#4A9FF1",
    description: "Add income, expense or transfer",
  },
  {
    label: "Account",
    icon: "bank-outline" as const,
    color: "#C8F14A",
    description: "Create a new account",
  },
];

export default function AddButton({
  onAddTransaction,
  onAddAccount,
}: AddButtonProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [open, setOpen] = useState(false);

  const handleAction = (cb?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(false);
    cb?.();
  };

  const callbacks = [onAddTransaction, onAddAccount];

  return (
    <>
      {/* Add button */}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setOpen(true);
        }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={24}
          color={theme.background.dark}
        />
      </Pressable>

      {/* Modal menu */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setOpen(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Add New</Text>

            {ACTIONS.map((action, i) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => handleAction(callbacks[i])}
              >
                <View
                  style={[
                    styles.menuIconCircle,
                    { backgroundColor: action.color + "22" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={action.icon}
                    size={24}
                    color={action.color}
                  />
                </View>

                <View style={styles.menuText}>
                  <Text style={styles.menuItemLabel}>{action.label}</Text>
                  <Text style={styles.menuItemDescription}>
                    {action.description}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.foreground.gray}
                />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    button: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    menuContainer: {
      backgroundColor: theme.background.accent,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 16,
      width: "85%",
      maxWidth: 340,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    menuTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      gap: 12,
    },
    menuItemPressed: {
      backgroundColor: theme.background.darker,
    },
    menuIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    menuText: {
      flex: 1,
      gap: 4,
    },
    menuItemLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    menuItemDescription: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
  });
}
