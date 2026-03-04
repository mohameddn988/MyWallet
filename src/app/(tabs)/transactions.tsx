import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
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
import { formatAmount, formatDateLabel } from "../../utils/currency";
import TransactionFilterSheet, {
  countActiveFilters,
  DEFAULT_TX_FILTERS,
  TransactionFilters,
} from "../../components/ui/TransactionFilterSheet";

// -----------------------------------------------------------------------------

type FilterType = "all" | TransactionType;

interface DayGroup {
  date: string;
  data: Transaction[];
  dayNet: number;
}

function groupByDate(
  txs: Transaction[],
  sortBy: "date" | "amount" = "date",
  sortDir: "asc" | "desc" = "desc",
): DayGroup[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const arr = map.get(tx.date) ?? [];
    arr.push(tx);
    map.set(tx.date, arr);
  }
  const groups: DayGroup[] = [...map.entries()].map(([date, items]) => {
    // When sorting by amount, sort items within each day group
    const sortedItems =
      sortBy === "amount"
        ? [...items].sort((a, b) =>
            sortDir === "desc" ? b.amount - a.amount : a.amount - b.amount,
          )
        : items;
    const dayNet = sortedItems.reduce((sum, tx) => {
      if (tx.type === "income") return sum + tx.amount;
      if (tx.type === "expense") return sum - tx.amount;
      return sum;
    }, 0);
    return { date, data: sortedItems, dayNet };
  });
  // Groups are always ordered by date; direction applies for date sort
  groups.sort((a, b) =>
    sortBy === "amount" || sortDir === "desc"
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date),
  );
  return groups;
}

const FILTER_CONFIG: {
  key: FilterType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "all", label: "All", icon: "format-list-bulleted", color: "" },
  {
    key: "expense",
    label: "Expense",
    icon: "arrow-up-circle-outline",
    color: "#F14A6E",
  },
  {
    key: "income",
    label: "Income",
    icon: "arrow-down-circle-outline",
    color: "",
  },
  {
    key: "transfer",
    label: "Transfer",
    icon: "swap-horizontal",
    color: "#4A9FF1",
  },
];

export default function TransactionsTabScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const searchParams = useLocalSearchParams<{ filter?: string }>();
  const { allTransactions, isRefreshing, refresh, allAccounts } = useFinance();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.filter as FilterType) || "all",
  );
  const [advFilters, setAdvFilters] =
    useState<TransactionFilters>(DEFAULT_TX_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const activeFilterCount = countActiveFilters(advFilters);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const lastTabPressRef = useRef<number>(0);

  const navigation = useNavigation();

  const handleToggle = useCallback((date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (searchParams.filter) {
      setFilter((searchParams.filter as FilterType) || "all");
    }
  }, [searchParams.filter]);

  const filtered = useMemo(() => {
    let txs = allTransactions;
    // --- type filter (existing) ---
    if (filter !== "all") txs = txs.filter((t) => t.type === filter);
    // --- text search (existing) ---
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
    // --- date range filter ---
    if (advFilters.dateFrom) {
      txs = txs.filter((t) => t.date >= advFilters.dateFrom!);
    }
    if (advFilters.dateTo) {
      txs = txs.filter((t) => t.date <= advFilters.dateTo!);
    }
    // --- category filter ---
    if (advFilters.categoryIds.length > 0) {
      txs = txs.filter(
        (t) => t.categoryId && advFilters.categoryIds.includes(t.categoryId),
      );
    }
    // --- account type filter ---
    if (advFilters.accountTypes.length > 0) {
      txs = txs.filter((t) => {
        const accountType = allAccounts.find((a) => a.id === t.accountId)?.type;
        const toAccountType = t.toAccountId
          ? allAccounts.find((a) => a.id === t.toAccountId)?.type
          : undefined;
        return (
          (accountType && advFilters.accountTypes.includes(accountType)) ||
          (toAccountType && advFilters.accountTypes.includes(toAccountType))
        );
      });
    }
    return txs;
  }, [allTransactions, filter, search, advFilters, allAccounts]);

  const groups = useMemo(
    () => groupByDate(filtered, advFilters.sortBy, advFilters.sortDir),
    [filtered, advFilters.sortBy, advFilters.sortDir],
  );

  // Expand all cards whenever groups change (on first load or filter/search change)
  useEffect(() => {
    setExpandedDates(new Set(groups.map((g) => g.date)));
  }, [groups]);

  // Double-tap detection: collapse all if any expanded, else expand all
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("tabPress", () => {
      const now = Date.now();
      const timeSinceLastPress = now - lastTabPressRef.current;

      // Double-tap window: 300ms
      if (timeSinceLastPress < 300) {
        // Double-tap detected
        setExpandedDates((prev) =>
          prev.size > 0
            ? new Set<string>()
            : new Set(groups.map((g) => g.date)),
        );
        lastTabPressRef.current = 0; // Reset
      } else {
        // Single tap or start of new double-tap sequence
        lastTabPressRef.current = now;
      }
    });
    return unsubscribe;
  }, [navigation, groups]);

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Transactions</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <MaterialCommunityIcons
            name="magnify"
            size={18}
            color={theme.foreground.gray}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={theme.foreground.gray}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color={theme.foreground.gray}
              />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[
            styles.filterBtn,
            activeFilterCount > 0 && styles.filterBtnActive,
          ]}
          onPress={() => setFilterSheetOpen(true)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={18}
            color={
              activeFilterCount > 0 ? theme.primary.main : theme.foreground.gray
            }
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTER_CONFIG.map((f) => {
          const active = filter === f.key;
          const color =
            f.color ||
            (f.key === "income" ? theme.primary.main : theme.foreground.white);
          return (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                active && { backgroundColor: `${color}22`, borderColor: color },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <MaterialCommunityIcons
                name={f.icon as any}
                size={13}
                color={active ? color : theme.foreground.gray}
              />
              <Text
                style={[
                  styles.filterChipText,
                  active && { color, fontWeight: "700" },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        style={styles.list}
        data={groups}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <DayCard
            group={item}
            theme={theme}
            styles={styles}
            isExpanded={expandedDates.has(item.date)}
            onToggle={handleToggle}
          />
        )}
        contentContainerStyle={
          groups.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="receipt-outline"
                size={38}
                color={theme.foreground.gray}
                style={{ opacity: 0.4 }}
              />
            </View>
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.primary.main}
            colors={[theme.primary.main]}
          />
        }
      />
      <TransactionFilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={advFilters}
        onApply={setAdvFilters}
      />
    </View>
  );
}

const DayCard = React.memo(function DayCard({
  group,
  theme,
  styles,
  isExpanded,
  onToggle,
}: {
  group: DayGroup;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  isExpanded: boolean;
  onToggle: (date: string) => void;
}) {
  const net = group.dayNet;
  const netColor =
    net > 0 ? theme.primary.main : net < 0 ? "#F14A6E" : theme.foreground.gray;

  return (
    <View style={styles.dayCard}>
      <Pressable style={styles.dayCardHeaderPress} onPress={() => onToggle(group.date)}>
        <View style={styles.dayCardHeaderContent}>
          <Text style={styles.dayCardDate}>{formatDateLabel(group.date)}</Text>
          <Text style={[styles.dayCardNet, { color: netColor }]}>
            {net > 0 ? "+" : ""}
            {group.data[0] ? formatAmount(net, group.data[0].currency) : ""}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.foreground.gray}
          style={styles.dayCardChevron}
        />
      </Pressable>
      {isExpanded &&
        group.data.map((tx, i) => (
          <TxRow
            key={tx.id}
            tx={tx}
            isLast={i === group.data.length - 1}
            theme={theme}
            styles={styles}
            onPress={() => router.push(`/transaction/${tx.id}` as any)}
          />
        ))}
    </View>
  );
});

const TxRow = React.memo(function TxRow({
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
  const accentColor = isTransfer
    ? "#4A9FF1"
    : isIncome
      ? theme.primary.main
      : "#F14A6E";
  const amountStr = isTransfer
    ? formatAmount(tx.amount, tx.currency)
    : (isIncome ? "+" : "-") + formatAmount(tx.amount, tx.currency);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.txRow,
        !isLast && styles.txRowDivider,
        pressed && styles.txRowPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor: tx.categoryColor
              ? `${tx.categoryColor}1A`
              : `${accentColor}1A`,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={(tx.categoryIcon ?? "circle-outline") as any}
          size={19}
          color={tx.categoryColor ?? accentColor}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txCategory} numberOfLines={1}>
          {tx.categoryName ?? (isTransfer ? "Transfer" : "Uncategorized")}
        </Text>
        {tx.merchant || tx.note ? (
          <Text style={styles.txSub} numberOfLines={1}>
            {tx.merchant ?? tx.note}
          </Text>
        ) : tx.paymentMethod ? (
          <Text style={styles.txSub} numberOfLines={1}>
            {tx.paymentMethod.replace("_", " ")}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.txAmount, { color: accentColor }]} numberOfLines={1}>
        {amountStr}
      </Text>
    </Pressable>
  );
});

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background.dark },
    list: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      marginBottom: 16,
    },
    searchWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.foreground.white,
      letterSpacing: -0.5,
    },
    filterBtn: {
      width: 43,
      height: 43,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
    },
    filterBtnActive: {
      borderColor: theme.primary.main,
      backgroundColor: `${theme.primary.main}14`,
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: theme.background.dark,
    },
    searchRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}18`,
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
      marginBottom: 16,
    },
    filterChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.accent,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 110,
    },
    dayCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
    },
    dayCardHeaderPress: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: `${theme.foreground.gray}10`,
    },
    dayCardHeaderContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    dayCardChevron: {
      marginLeft: 8,
    },
    dayCardDate: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      flex: 1,
    },
    dayCardNet: {
      fontSize: 13,
      fontWeight: "700",
    },
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      gap: 12,
    },
    txRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}14`,
    },
    txRowPressed: {
      backgroundColor: `${theme.foreground.gray}08`,
    },
    txIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    txInfo: { flex: 1, gap: 3 },
    txCategory: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    txSub: {
      fontSize: 12,
      color: theme.foreground.gray,
      textTransform: "capitalize",
    },
    txAmount: {
      fontSize: 15,
      fontWeight: "700",
    },
    emptyContainer: { flexGrow: 1 },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 40,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.foreground.white,
      marginTop: 4,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
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
  });
}
