import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Transaction } from "../../types/finance";
import { formatAmount, formatDateLabel } from "../../utils/currency";

interface RecentTransactionsListProps {
  transactions: Transaction[];
  onTransactionPress?: (id: string) => void;
  onViewAllPress?: () => void;
}

/** Group transactions by date string */
function groupByDate(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const group = map.get(tx.date) ?? [];
    group.push(tx);
    map.set(tx.date, group);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }));
}

export default function RecentTransactionsList({
  transactions,
  onTransactionPress,
  onViewAllPress,
}: RecentTransactionsListProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const groups = groupByDate(transactions);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Recent Transactions</Text>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          onPress={onViewAllPress}
        >
          <Text style={[styles.viewAll, { color: theme.primary.main }]}>
            View all
          </Text>
        </Pressable>
      </View>

      {/* Groups */}
      <View style={styles.listContainer}>
        {groups.map((group) => (
          <View key={group.date} style={styles.group}>
            {/* Date label */}
            <Text style={styles.dateLabel}>{formatDateLabel(group.date)}</Text>

            {/* Items */}
            {group.items.map((tx, idx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";
              const color = isTransfer
                ? "#4A9FF1"
                : isIncome
                  ? theme.primary.main
                  : "#F14A6E";

              const amountStr = isTransfer
                ? formatAmount(tx.amount, tx.currency)
                : (isIncome ? "+" : "-") + formatAmount(tx.amount, tx.currency);

              return (
                <Pressable
                  key={tx.id}
                  style={({ pressed }) => [
                    styles.txRow,
                    idx < group.items.length - 1 && styles.txRowBorder,
                    pressed && styles.txPressed,
                  ]}
                  onPress={() => onTransactionPress?.(tx.id)}
                >
                  {/* Category icon */}
                  <View
                    style={[
                      styles.txIcon,
                      {
                        backgroundColor: tx.categoryColor
                          ? `${tx.categoryColor}22`
                          : `${theme.background.accent}`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={(tx.categoryIcon ?? "circle-outline") as any}
                      size={18}
                      color={tx.categoryColor ?? theme.foreground.gray}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory} numberOfLines={1}>
                      {tx.categoryName ?? "Uncategorized"}
                    </Text>
                    {tx.merchant ? (
                      <Text style={styles.txMerchant} numberOfLines={1}>
                        {tx.merchant}
                      </Text>
                    ) : null}
                  </View>

                  {/* Amount */}
                  <Text style={[styles.txAmount, { color }]}>{amountStr}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-outline"
              size={40}
              color={theme.foreground.gray}
              style={{ opacity: 0.4 }}
            />
            <Text style={[styles.emptyText, { color: theme.foreground.gray, opacity: 0.6 }]}>
              No transactions yet
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: {
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 12,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    viewAll: {
      fontSize: 13,
      fontWeight: "600",
    },
    listContainer: {
      marginHorizontal: 16,
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
      overflow: "hidden",
    },
    group: {
      paddingTop: 12,
    },
    dateLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.5,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    txRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#2C3139",
    },
    txPressed: {
      backgroundColor: theme.background.darker,
    },
    txIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    txInfo: {
      flex: 1,
    },
    txCategory: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "500",
    },
    txMerchant: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 2,
    },
    txAmount: {
      fontSize: 15,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      padding: 32,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
    },
  });
}
