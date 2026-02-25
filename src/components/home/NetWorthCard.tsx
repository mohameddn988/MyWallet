import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { formatAmount } from "../../utils/currency";

interface NetWorthCardProps {
  netWorth: number;
  monthNet: number;
  baseCurrency: string;
  onPress?: () => void;
}

export default function NetWorthCard({
  netWorth,
  monthNet,
  baseCurrency,
  onPress,
}: NetWorthCardProps) {
  const { theme } = useTheme();
  const isPositive = monthNet >= 0;
  const changeColor = isPositive ? theme.primary.main : "#F14A6E";
  const changeSign = isPositive ? "+" : "";

  return (
    <Pressable
      style={({ pressed }) => [styles.hero, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <Text style={[styles.label, { color: theme.foreground.gray }]}>
        Net Worth
      </Text>

      <Text style={[styles.amount, { color: theme.foreground.white }]}>
        {formatAmount(netWorth, baseCurrency)}
      </Text>

      {monthNet !== 0 && (
        <View style={styles.changeRow}>
          <Text style={[styles.changeText, { color: changeColor }]}>
            {changeSign}
            {formatAmount(Math.abs(monthNet), baseCurrency, { compact: true })}
          </Text>
          <Text style={[styles.changeSuffix, { color: theme.foreground.gray }]}>
            {"  this month"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  amount: {
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 50,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  changeSuffix: {
    fontSize: 13,
  },
});
