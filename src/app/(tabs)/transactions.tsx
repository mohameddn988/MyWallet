import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Transaction, TransactionType } from "../../types/finance";
import {
  formatAmount,
  formatDateLabel,
  getCurrencySymbol,
} from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────

type FilterType = "all" | TransactionType;

interface Section {
  date: string;
  data: Transaction[];
  dayNet: number;
}

function groupByDate(txs: Transaction[]): Section[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const arr = map.get(tx.date) ?? [];
    arr.push(tx);
    map.set(tx.date, arr);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => {
      const dayNet = items.reduce((sum, tx) => {
        if (tx.type === "income") return sum + tx.amount;
        if (tx.type === "expense") return sum - tx.amount;
        return sum;
      }, 0);
      return { date, data: items, dayNet };
    });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionsTabScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const { allTransactions, baseCurrency, isRefreshing, refresh } = useFinance();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // ── Filter & search ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let txs = allTransactions;
    if (filter !== "all") txs = txs.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      txs = txs.filter(
        (t) =>
          t.categoryName?.toLowerCase().includes(q) ||
          t.merchant?.toLowerCase().includes(q) ||
          t.note?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return txs;
  }, [allTransactions, filter, search]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const { totalIncome, totalExpense } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const tx of filtered) {
      if (tx.type === "income") totalIncome += tx.amount;
      if (tx.type === "expense") totalExpense += tx.amount;
    }
    return { totalIncome, totalExpense };
  }, [filtered]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Transactions</Text>
        <Pressable
          style={({ pressed }) => [styles.addFab, pressed && { opacity: 0.8 }]}
          onPress={() => router.push("/transaction/add?type=expense" as any)}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={theme.background.dark}
          />
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={theme.foreground.gray}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by category, merchant, note…"
          placeholderTextColor={theme.foreground.gray}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={16}
              color={theme.foreground.gray}
            />
          </Pressable>
        )}
      </View>

      {/* ── Filter chips ── */}
      <View style={styles.filterRow}>
        {(["all", "expense", "income", "transfer"] as FilterType[]).map((f) => {
          const active = filter === f;
          const color =
            f === "income"
              ? theme.primary.main
              : f === "transfer"
                ? "#4A9FF1"
                : f === "expense"
                  ? "#F14A6E"
                  : theme.foreground.white;
          return (
            <Pressable
              key={f}
              style={[
                styles.filterChip,
                active && {
                  backgroundColor: `${color}22`,
                  borderColor: color,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && { color, fontWeight: "700" },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Summary strip ── */}
      {filtered.length > 0 && (
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Income</Text>
            <Text style={[styles.summaryItemValue, { color: theme.primary.main }]}>
              +{formatAmount(totalIncome, baseCurrency)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Spent</Text>
            <Text style={[styles.summaryItemValue, { color: "#F14A6E" }]}>
              -{formatAmount(totalExpense, baseCurrency)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryItemLabel}>Net</Text>
            <Text
              style={[
                styles.summaryItemValue,
                {
                  color:
                    totalIncome - totalExpense >= 0
                      ? theme.primary.main
                      : "#F14A6E",
                },
              ]}
            >
              {totalIncome - totalExpense >= 0 ? "+" : ""}
              {formatAmount(totalIncome - totalExpense, baseCurrency)}
            </Text>
          </View>
        </View>
      )}

      {/* ── Transactions list ── */}
      <SectionList
        sections={sections}
        keyExtractor={(tx) => tx.id}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.primary.main}
            colors={[theme.primary.main]}
          />
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader
            section={section}
            theme={theme}
            currency={baseCurrency}
            styles={styles}
          />
        )}
        renderItem={({ item: tx, index, section }) => (
          <TxRow
            tx={tx}
            isLast={index === section.data.length - 1}
            theme={theme}
            styles={styles}
            onPress={() => router.push(`/transaction/${tx.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-outline"
              size={48}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyTitle}>
              {search || filter !== "all"
                ? "No matching transactions"
                : "No transactions yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search || filter !== "all"
                ? "Try adjusting your search or filters"
                : "Tap the + button to add your first transaction"}
            </Text>
            {!search && filter === "all" && (
              <Pressable
                style={({ pressed }) => [
                  styles.emptyAddBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() =>
                  router.push("/transaction/add?type=expense" as any)
                }
              >
                <Text style={styles.emptyAddBtnText}>Add Transaction</Text>
              </Pressable>
            )}
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? <View style={styles.listFooter} /> : null
        }
        contentContainerStyle={
          sections.length === 0 ? styles.emptyContainer : undefined
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  section,
  theme,
  currency,
  styles,
}: {
  section: Section;
  theme: Theme;
  currency: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const net = section.dayNet;
  const netStr = (net >= 0 ? "+" : "") + formatAmount(net, currency);
  const netColor =
    net > 0
      ? theme.primary.main
      : net < 0
        ? "#F14A6E"
        : theme.foreground.gray;

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionDate}>{formatDateLabel(section.date)}</Text>
      <Text style={[styles.sectionNet, { color: netColor }]}>{netStr}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction row
// ─────────────────────────────────────────────────────────────────────────────

function TxRow({
  tx,
  isLast,
  theme,
  styles,
  onPress,
}: {
  tx: Transaction;
  isLast: boolean;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const isIncome = tx.type === "income";
  const isTransfer = tx.type === "transfer";
  const amountColor = isTransfer
    ? "#4A9FF1"
    : isIncome
      ? theme.primary.main
      : "#F14A6E";
  const amountStr = isTransfer
    ? formatAmount(tx.amount, tx.currency)
    : (isIncome ? "+" : "−") + formatAmount(tx.amount, tx.currency);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.txRow,
        !isLast && styles.txRowBorder,
        pressed && styles.txRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor: tx.categoryColor
              ? `${tx.categoryColor}22`
              : theme.background.accent,
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
          {tx.categoryName ?? (isTransfer ? "Transfer" : "Uncategorized")}
        </Text>
        {tx.merchant ? (
          <Text style={styles.txMerchant} numberOfLines={1}>
            {tx.merchant}
          </Text>
        ) : tx.note ? (
          <Text style={styles.txMerchant} numberOfLines={1}>
            {tx.note}
          </Text>
        ) : null}
      </View>

      {/* Amount */}
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: amountColor }]}>
          {amountStr}
        </Text>
        {tx.paymentMethod && (
          <Text style={styles.txPayment}>
            {tx.paymentMethod.replace("_", " ")}
          </Text>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={16}
        color={theme.foreground.gray}
        style={styles.txChevron}
      />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 10,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.foreground.white,
    },
    addFab: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    searchInput: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 14,
      padding: 0,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    filterChip: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
      alignItems: "center",
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    summaryStrip: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      overflow: "hidden",
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      gap: 3,
    },
    summaryItemLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    summaryItemValue: {
      fontSize: 13,
      fontWeight: "700",
    },
    summaryDivider: {
      width: 1,
      backgroundColor: "#2C3139",
      marginVertical: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: theme.background.dark,
      borderBottomWidth: 1,
      borderBottomColor: "#2C3139",
    },
    sectionDate: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionNet: {
      fontSize: 12,
      fontWeight: "700",
    },
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background.darker,
      gap: 12,
    },
    txRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#2C3139",
    },
    txRowPressed: {
      backgroundColor: theme.background.accent,
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    txInfo: {
      flex: 1,
      gap: 2,
    },
    txCategory: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    txMerchant: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    txRight: {
      alignItems: "flex-end",
      gap: 2,
    },
    txAmount: {
      fontSize: 14,
      fontWeight: "700",
    },
    txPayment: {
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    txChevron: {
      opacity: 0.5,
    },
    emptyContainer: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 8,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.foreground.white,
      marginTop: 8,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
    },
    emptyAddBtn: {
      marginTop: 16,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
    },
    emptyAddBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },
    listFooter: {
      height: 40,
    },
  });
}
