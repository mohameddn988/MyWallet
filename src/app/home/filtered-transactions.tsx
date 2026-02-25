import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Transaction } from "../../types/finance";
import { formatAmount, formatDateLabel } from "../../utils/currency";

type FilterType = "income" | "expense" | "all";

const FILTER_CONFIG: Record<
  FilterType,
  { label: string; color: string; icon: string }
> = {
  income: {
    label: "Income",
    color: "#C8F14A",
    icon: "arrow-down-circle-outline",
  },
  expense: {
    label: "Expenses",
    color: "#F14A6E",
    icon: "arrow-up-circle-outline",
  },
  all: {
    label: "All Transactions",
    color: "#4A9FF1",
    icon: "swap-horizontal",
  },
};

function groupByDate(
  txs: Transaction[],
): { date: string; items: Transaction[] }[] {
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

export default function FilteredTransactionsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { recentTransactions, baseCurrency } = useFinance();

  const { filter } = useLocalSearchParams<{ filter: string }>();
  const filterType: FilterType =
    filter === "income" || filter === "expense" || filter === "all"
      ? filter
      : "all";

  const config = FILTER_CONFIG[filterType];

  const filtered = useMemo(() => {
    if (filterType === "all") return recentTransactions;
    return recentTransactions.filter((tx) => tx.type === filterType);
  }, [recentTransactions, filterType]);

  const groups = groupByDate(filtered);

  const total = useMemo(
    () => filtered.reduce((sum, tx) => sum + tx.amount, 0),
    [filtered],
  );

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>

        <View style={styles.headerTitle}>
          <MaterialCommunityIcons
            name={config.icon as any}
            size={18}
            color={config.color}
          />
          <Text style={styles.title}>{config.label}</Text>
        </View>

        {/* Spacer to balance the back button */}
        <View style={{ width: 38 }} />
      </View>

      {/* ── Total summary chip ── */}
      <View style={[styles.totalChip, { borderColor: `${config.color}33` }]}>
        <Text style={styles.totalLabel}>
          {filterType === "income"
            ? "Total Received"
            : filterType === "expense"
              ? "Total Spent"
              : "Total"}
        </Text>
        <Text style={[styles.totalAmount, { color: config.color }]}>
          {filterType === "income" ? "+" : filterType === "expense" ? "-" : ""}
          {formatAmount(total, baseCurrency)}
        </Text>
        <Text style={styles.totalCount}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* ── Transaction list ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-outline"
              size={48}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {groups.map((group) => (
              <View key={group.date} style={styles.group}>
                <Text style={styles.dateLabel}>
                  {formatDateLabel(group.date)}
                </Text>
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
                    : (isIncome ? "+" : "-") +
                      formatAmount(tx.amount, tx.currency);

                  return (
                    <View
                      key={tx.id}
                      style={[
                        styles.txRow,
                        idx < group.items.length - 1 && styles.txRowBorder,
                      ]}
                    >
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor: tx.categoryColor
                              ? `${tx.categoryColor}22`
                              : theme.background.darker,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={(tx.categoryIcon ?? "circle-outline") as any}
                          size={18}
                          color={tx.categoryColor ?? theme.foreground.gray}
                        />
                      </View>

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

                      <Text style={[styles.txAmount, { color }]}>
                        {amountStr}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    headerTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      color: theme.foreground.white,
      fontSize: 17,
      fontWeight: "700",
    },
    totalChip: {
      marginHorizontal: 16,
      marginBottom: 20,
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: "center",
      gap: 4,
    },
    totalLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    totalAmount: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    totalCount: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    listCard: {
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
  });
}
