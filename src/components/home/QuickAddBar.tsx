import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface QuickAddBarProps {
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onAddTransfer?: () => void;
}

export default function QuickAddBar({
  onAddExpense,
  onAddIncome,
  onAddTransfer,
}: QuickAddBarProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const handlePress = (action?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action?.();
  };

  const buttons = [
    {
      label: "Expense",
      icon: "minus-circle-outline" as const,
      color: "#F14A6E",
      bgColor: "rgba(241,74,110,0.12)",
      onPress: onAddExpense,
    },
    {
      label: "Income",
      icon: "plus-circle-outline" as const,
      color: theme.primary.main,
      bgColor: "rgba(200,241,74,0.12)",
      onPress: onAddIncome,
    },
    {
      label: "Transfer",
      icon: "swap-horizontal" as const,
      color: "#4A9FF1",
      bgColor: "rgba(74,159,241,0.12)",
      onPress: onAddTransfer,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { borderColor: "#2C3139" }]}>
        {buttons.map((btn, i) => (
          <React.Fragment key={btn.label}>
            {i > 0 && <View style={styles.divider} />}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: pressed ? btn.bgColor : "transparent" },
              ]}
              onPress={() => handlePress(btn.onPress)}
            >
              <MaterialCommunityIcons
                name={btn.icon}
                size={22}
                color={btn.color}
              />
              <Text style={[styles.buttonLabel, { color: btn.color }]}>
                {btn.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingBottom: 24,
      paddingTop: 8,
      backgroundColor: theme.background.dark,
      borderTopWidth: 1,
      borderTopColor: "#2C3139",
    },
    bar: {
      flexDirection: "row",
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      borderWidth: 1,
      overflow: "hidden",
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: 6,
    },
    divider: {
      width: 1,
      backgroundColor: "#2C3139",
      marginVertical: 10,
    },
    buttonLabel: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
}
