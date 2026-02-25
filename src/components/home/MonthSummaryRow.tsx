import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { MonthSummary } from "../../types/finance";
import { formatAmount } from "../../utils/currency";

interface MonthSummaryRowProps {
  summary: MonthSummary;
  baseCurrency: string;
  onIncomePress?: () => void;
  onExpensePress?: () => void;
  onNetPress?: () => void;
}

export default function MonthSummaryRow({
  summary,
  baseCurrency,
  onIncomePress,
  onExpensePress,
  onNetPress,
}: MonthSummaryRowProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const isNetPositive = summary.net >= 0;

  const rows = [
    {
      icon: "arrow-down-circle-outline" as const,
      label: "Income",
      value: summary.income,
      color: theme.primary.main,
      onPress: onIncomePress,
    },
    {
      icon: "arrow-up-circle-outline" as const,
      label: "Expenses",
      value: summary.expense,
      color: "#F14A6E",
      onPress: onExpensePress,
    },
    {
      icon: "equal" as const,
      label: "Net",
      value: summary.net,
      color: isNetPositive ? theme.primary.main : "#F14A6E",
      onPress: onNetPress,
      showSign: true,
    },
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, i) => (
        <Pressable
          key={row.label}
          style={({ pressed }) => [
            styles.row,
            i < rows.length - 1 && styles.rowBorder,
            pressed && styles.pressed,
          ]}
          onPress={row.onPress}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: `${row.color}18` }]}
          >
            <MaterialCommunityIcons
              name={row.icon}
              size={16}
              color={row.color}
            />
          </View>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={[styles.rowValue, { color: row.color }]}>
            {row.showSign && row.value > 0
              ? "+"
              : row.showSign && row.value < 0
                ? "-"
                : ""}
            {formatAmount(Math.abs(row.value), baseCurrency)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={theme.foreground.gray}
          />
        </Pressable>
      ))}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#2C3139",
    },
    pressed: {
      backgroundColor: theme.background.darker,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "500",
    },
    rowValue: {
      fontSize: 15,
      fontWeight: "700",
      marginRight: 4,
    },
  });
}
