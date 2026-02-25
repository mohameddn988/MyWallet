import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { QuickStats } from "../../types/finance";
import { formatAmount } from "../../utils/currency";

type Period = "today" | "week" | "month";

interface QuickStatsBarProps {
  stats: QuickStats;
  baseCurrency: string;
  onPress?: (period: Period) => void;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function QuickStatsBar({
  stats,
  baseCurrency,
  onPress,
}: QuickStatsBarProps) {
  const { theme } = useTheme();
  const [active, setActive] = useState<Period>("today");
  const styles = makeStyles(theme);

  const valueMap: Record<Period, number> = {
    today: stats.today,
    week: stats.week,
    month: stats.month,
  };

  const handlePress = (p: Period) => {
    setActive(p);
    onPress?.(p);
  };

  return (
    <View style={styles.row}>
      {PERIODS.map((p) => {
        const isActive = active === p.key;
        const amount = valueMap[p.key];
        const hasSpend = amount > 0;

        return (
          <Pressable
            key={p.key}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
            onPress={() => handlePress(p.key)}
          >
            <Text
              style={[
                styles.chipLabel,
                {
                  color: isActive
                    ? theme.background.dark
                    : theme.foreground.gray,
                },
              ]}
            >
              {p.label}
            </Text>
            <Text
              style={[
                styles.chipAmount,
                {
                  color: isActive
                    ? theme.background.dark
                    : hasSpend
                      ? "#F14A6E"
                      : theme.foreground.gray,
                },
              ]}
            >
              {hasSpend
                ? formatAmount(amount, baseCurrency, { compact: true })
                : "—"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginTop: 20,
      gap: 8,
    },
    chip: {
      flex: 1,
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      gap: 4,
    },
    chipActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    chipPressed: {
      opacity: 0.7,
    },
    chipLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    chipAmount: {
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
