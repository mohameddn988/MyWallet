import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { formatAmount } from "../../utils/currency";

interface NetWorthCardProps {
  netWorth: number;
  monthNet: number;
  baseCurrency: string;
  displayCurrency: string;
  availableCurrencies: string[];
  onCurrencyChange: (currency: string) => void;
}

export default function NetWorthCard({
  netWorth,
  monthNet,
  baseCurrency,
  displayCurrency,
  availableCurrencies,
  onCurrencyChange,
}: NetWorthCardProps) {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);

  const isPositive = monthNet >= 0;
  const changeColor = isPositive ? theme.primary.main : "#F14A6E";
  const changeSign = isPositive ? "+" : "";

  const hasManyOptions = availableCurrencies.length > 1;

  return (
    <>
      <View style={styles.hero}>
        <Text style={[styles.label, { color: theme.foreground.gray }]}>
          Net Worth
        </Text>

        {hasManyOptions ? (
          <Pressable
            onPress={() => setPickerVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.amount, { color: theme.foreground.white }]}>
              {formatAmount(netWorth, displayCurrency)}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.amount, { color: theme.foreground.white }]}>
            {formatAmount(netWorth, displayCurrency)}
          </Text>
        )}

        {monthNet !== 0 && (
          <View style={styles.changeRow}>
            <Text style={[styles.changeText, { color: changeColor }]}>
              {changeSign}
              {(() => {
                const value = Math.abs(monthNet) / 100;
                if (value >= 1_000_000) {
                  return `${(value / 1_000_000).toFixed(1)}M`;
                } else if (value >= 1_000) {
                  return `${(value / 1_000).toFixed(1)}K`;
                } else {
                  return value.toFixed(2);
                }
              })()}
            </Text>
            <Text
              style={[styles.changeSuffix, { color: theme.foreground.gray }]}
            >
              {"  this month"}
            </Text>
          </View>
        )}
      </View>

      {/* Currency picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setPickerVisible(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background.accent,
                borderColor: theme.background.darker,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={[styles.sheetTitle, { color: theme.foreground.white }]}
            >
              Display Currency
            </Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {availableCurrencies.map((c) => {
                const isSelected = c === displayCurrency;
                return (
                  <Pressable
                    key={c}
                    style={({ pressed }) => [
                      styles.currencyRow,
                      {
                        borderBottomColor: theme.background.darker,
                        backgroundColor: pressed
                          ? theme.background.darker
                          : "transparent",
                      },
                    ]}
                    onPress={() => {
                      onCurrencyChange(c);
                      setPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.currencyRowText,
                        {
                          color: isSelected
                            ? theme.primary.main
                            : theme.foreground.white,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {c}
                    </Text>
                    {c === baseCurrency && (
                      <Text
                        style={[
                          styles.baseBadge,
                          { color: theme.foreground.gray },
                        ]}
                      >
                        base
                      </Text>
                    )}
                    {isSelected && (
                      <Text
                        style={[
                          styles.checkmark,
                          { color: theme.primary.main },
                        ]}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    marginBottom: 12,
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
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  sheet: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 20,
    paddingBottom: 8,
    maxHeight: 360,
    overflow: "hidden",
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencyRowText: {
    fontSize: 16,
    flex: 1,
  },
  baseBadge: {
    fontSize: 11,
    marginRight: 8,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
  },
});
