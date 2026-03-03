import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useCategories } from "../../contexts/CategoriesContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";

type Period = "month" | "quarter" | "year";

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export default function CategoryAnalyticsScreen() {
  const { theme } = useTheme();
  const { allTransactions, baseCurrency } = useFinance();
  const { expenseCategories, incomeCategories } = useCategories();
  const params = useLocalSearchParams();
  const typeParam = params.type as "expense" | "income" | undefined;

  const [type, setType] = useState<"expense" | "income">(typeParam || "expense");
  const [period, setPeriod] = useState<Period>("month");

  const s = makeStyles(theme);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (period) {
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(start.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return { start: formatDate(start), end: formatDate(end) };
  }, [period]);

  // Calculate category breakdown
  const breakdown = useMemo(() => {
    const filtered = allTransactions.filter(
      (tx) =>
        tx.type === type &&
        tx.date >= dateRange.start &&
        tx.date <= dateRange.end &&
        tx.categoryId
    );

    const categoryMap = new Map<string, CategoryBreakdown>();
    let total = 0;

    filtered.forEach((tx) => {
      const categoryId = tx.categoryId || "";
      const existing = categoryMap.get(categoryId);

      if (existing) {
        existing.amount += tx.amount;
        existing.transactionCount += 1;
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: tx.categoryName || "Unknown",
          categoryIcon: tx.categoryIcon,
          categoryColor: tx.categoryColor,
          amount: tx.amount,
          transactionCount: 1,
          percentage: 0,
        });
      }

      total += tx.amount;
    });

    // Calculate percentages
    const result: CategoryBreakdown[] = [];
    categoryMap.forEach((cat) => {
      cat.percentage = total > 0 ? (cat.amount / total) * 100 : 0;
      result.push(cat);
    });

    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    return { categories: result, total };
  }, [allTransactions, type, dateRange]);

  const formatAmount = (amount: number) => {
    const value = amount / 100;
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const periodLabels: Record<Period, string> = {
    month: "Last Month",
    quarter: "Last 3 Months",
    year: "Last Year",
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backButton, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.foreground.white} />
        </Pressable>
        <Text style={s.headerTitle}>Category Analytics</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Type Filter */}
      <View style={s.filterRow}>
        {(["expense", "income"] as const).map((t) => {
          const active = type === t;
          const color = t === "income" ? "#26A17B" : "#F14A6E";
          const icon = t === "income" ? "trending-up" : "trending-down";

          return (
            <Pressable
              key={t}
              style={[
                s.filterChip,
                active && {
                  backgroundColor: `${color}22`,
                  borderColor: color,
                },
              ]}
              onPress={() => setType(t)}
            >
              <MaterialCommunityIcons
                name={icon}
                size={16}
                color={active ? color : theme.foreground.gray}
              />
              <Text
                style={[
                  s.filterChipText,
                  active && { color, fontWeight: "700" },
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Period Selector */}
      <View style={s.periodRow}>
        {(["month", "quarter", "year"] as const).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              style={[
                s.periodChip,
                active && s.periodChipActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  s.periodChipText,
                  active && s.periodChipTextActive,
                ]}
              >
                {periodLabels[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Total Summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>
          Total {type === "expense" ? "Expenses" : "Income"}
        </Text>
        <Text style={[s.summaryAmount, { color: type === "expense" ? "#F14A6E" : "#26A17B" }]}>
          {baseCurrency} {formatAmount(breakdown.total)}
        </Text>
        <Text style={s.summarySubtext}>
          {breakdown.categories.length} categories • {allTransactions.filter(
            (tx) =>
              tx.type === type &&
              tx.date >= dateRange.start &&
              tx.date <= dateRange.end
          ).length} transactions
        </Text>
      </View>

      {/* Category Breakdown */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {breakdown.categories.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={64}
              color={theme.foreground.gray}
            />
            <Text style={s.emptyStateText}>No data for this period</Text>
            <Text style={s.emptyStateSubtext}>
              Try selecting a different time range
            </Text>
          </View>
        ) : (
          breakdown.categories.map((cat) => (
            <View key={cat.categoryId} style={s.categoryCard}>
              {/* Category Info */}
              <View style={s.categoryHeader}>
                <View style={s.categoryLeft}>
                  <View
                    style={[
                      s.categoryIcon,
                      { backgroundColor: `${cat.categoryColor || "#4A9FF1"}18` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={(cat.categoryIcon || "shape-outline") as any}
                      size={20}
                      color={cat.categoryColor || "#4A9FF1"}
                    />
                  </View>
                  <View style={s.categoryInfo}>
                    <Text style={s.categoryName}>{cat.categoryName}</Text>
                    <Text style={s.categoryCount}>
                      {cat.transactionCount} transaction{cat.transactionCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <View style={s.categoryRight}>
                  <Text style={s.categoryAmount}>
                    {baseCurrency} {formatAmount(cat.amount)}
                  </Text>
                  <Text style={s.categoryPercentage}>{cat.percentage.toFixed(1)}%</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={s.progressBar}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.categoryColor || "#4A9FF1",
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
      letterSpacing: -0.3,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 16,
    },
    filterChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      borderWidth: 2,
      borderColor: "transparent",
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    periodRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 10,
      marginBottom: 20,
    },
    periodChip: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme.background.accent,
    },
    periodChipActive: {
      backgroundColor: theme.primary.main,
    },
    periodChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    periodChipTextActive: {
      color: theme.background.dark,
    },
    summaryCard: {
      marginHorizontal: 20,
      marginBottom: 24,
      padding: 20,
      borderRadius: 16,
      backgroundColor: theme.background.accent,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 8,
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -1,
      marginBottom: 6,
    },
    summarySubtext: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
    },
    categoryCard: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 14,
      backgroundColor: theme.background.accent,
    },
    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    categoryLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 3,
    },
    categoryCount: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    categoryRight: {
      alignItems: "flex-end",
    },
    categoryAmount: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 3,
    },
    categoryPercentage: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.primary.main,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.background.darker,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      marginTop: 16,
      marginBottom: 6,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    bottomSpacer: {
      height: 40,
    },
  });
}
