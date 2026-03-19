import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocale } from "../../contexts/LocaleContext";
import { useTheme } from "../../contexts/ThemeContext";
import { QuickStats } from "../../types/finance";
import { convertFromBase } from "../../utils/currency";

export type Period = "today" | "week" | "month";

interface QuickStatsBarProps {
  stats: QuickStats;
  baseCurrency: string;
  displayCurrency: string;
  rateMap: Record<string, number>;
  activePeriod: Period;
  onPeriodChange: (p: Period) => void;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function QuickStatsBar({
  stats,
  baseCurrency,
  displayCurrency,
  rateMap,
  activePeriod,
  onPeriodChange,
}: QuickStatsBarProps) {
  const { theme } = useTheme();
  const { formatAmount } = useLocale();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const convertedStats = useMemo(
    () => ({
      today: {
        net: convertFromBase(stats.today.net, displayCurrency, baseCurrency, rateMap),
        income: stats.today.income,
        expense: stats.today.expense,
      },
      week: {
        net: convertFromBase(stats.week.net, displayCurrency, baseCurrency, rateMap),
        income: stats.week.income,
        expense: stats.week.expense,
      },
      month: {
        net: convertFromBase(stats.month.net, displayCurrency, baseCurrency, rateMap),
        income: stats.month.income,
        expense: stats.month.expense,
      },
    }),
    [stats, displayCurrency, baseCurrency, rateMap],
  );

  return (
    <View style={styles.row}>
      {PERIODS.map((p) => {
        const isActive = activePeriod === p.key;
        const net = convertedStats[p.key].net;
        const hasActivity = convertedStats[p.key].income > 0 || convertedStats[p.key].expense > 0;
        const netColor = net >= 0 ? theme.primary.main : "#F14A6E";

        return (
          <Pressable
            key={p.key}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
            onPress={() => onPeriodChange(p.key)}
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
                    : hasActivity
                      ? netColor
                      : theme.foreground.gray,
                },
              ]}
            >
              {formatAmount(net, displayCurrency, {
                compact: true,
                showSign: hasActivity,
              })}
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
