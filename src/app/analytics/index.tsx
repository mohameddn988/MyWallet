import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Theme } from "../../constants/themes";
import { EXPENSE_CATEGORIES } from "../../data/categories";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { convertToBase, formatAmount } from "../../utils/currency";

type Period = "week" | "month" | "year" | "all";

const INCOME_COLOR = "#4DD68C";
const EXPENSE_COLOR = "#F14A6E";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "all", label: "All" },
];

const screenWidth = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { allTransactions, baseCurrency, exchangeRates } = useFinance();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");

  const rateMap = useMemo(
    () => Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate])),
    [exchangeRates],
  );

  // ── Filter by period ────────────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start: Date;
    switch (selectedPeriod) {
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        start = new Date(0);
        break;
    }
    return allTransactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d <= now;
    });
  }, [allTransactions, selectedPeriod]);

  // ── Totals (minor units) ────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      const base = convertToBase(tx.amount, tx.currency, baseCurrency, rateMap);
      if (tx.type === "income") income += base;
      else if (tx.type === "expense") expense += base;
    }
    return { income, expense, net: income - expense };
  }, [filteredTransactions, baseCurrency, rateMap]);

  // ── Category breakdown ──────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of filteredTransactions) {
      if (tx.type !== "expense") continue;
      const key = tx.categoryId ?? "other";
      const base = convertToBase(tx.amount, tx.currency, baseCurrency, rateMap);
      map.set(key, (map.get(key) ?? 0) + base);
    }
    return Array.from(map.entries())
      .map(([id, value]) => {
        const cat = EXPENSE_CATEGORIES.find((c) => c.id === id);
        return {
          id,
          name: cat?.name ?? "Other",
          icon: (cat?.icon ?? "help-circle-outline") as string,
          color: cat?.color ?? "#888888",
          value,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredTransactions, baseCurrency, rateMap]);

  // ── Chart data (income vs expenses over time) ───────────────────────────────
  const chartData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; sort: number }>();

    for (const tx of filteredTransactions) {
      if (tx.type === "transfer") continue;
      const d = new Date(tx.date);
      let key: string;
      let sort: number;

      switch (selectedPeriod) {
        case "week":
          key = d.toLocaleDateString("en-US", { weekday: "short" });
          sort = d.getTime();
          break;
        case "month":
          key = `${d.getDate()}`;
          sort = d.getDate();
          break;
        case "year":
          key = d.toLocaleDateString("en-US", { month: "short" });
          sort = d.getMonth();
          break;
        case "all":
          key = d.getFullYear().toString();
          sort = d.getFullYear();
          break;
      }

      if (!map.has(key)) map.set(key, { income: 0, expense: 0, sort });
      const entry = map.get(key)!;
      const base = convertToBase(tx.amount, tx.currency, baseCurrency, rateMap);
      if (tx.type === "income") entry.income += base / 100;
      else if (tx.type === "expense") entry.expense += base / 100;
    }

    return Array.from(map.entries())
      .sort(([, a], [, b]) => a.sort - b.sort)
      .map(([label, { income, expense }]) => ({ label, income, expense }))
      .slice(-7);
  }, [filteredTransactions, selectedPeriod, baseCurrency, rateMap]);

  const hasData = filteredTransactions.filter((t) => t.type !== "transfer").length > 0;
  const chartBarWidth = screenWidth - 32 - 32;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your financial overview</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Period Selector ── */}
        <View style={styles.periodSelector}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.key}
              style={({ pressed }) => [
                styles.periodBtn,
                selectedPeriod === p.key && styles.periodBtnActive,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => setSelectedPeriod(p.key)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  selectedPeriod === p.key && styles.periodBtnTextActive,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Summary Row (horizontal: Income | Expenses | Balance) ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCell, styles.summaryCellDivider]}>
            <Text style={styles.summaryCellLabel}>INCOME</Text>
            <Text
              style={[styles.summaryCellValue, { color: INCOME_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(totals.income, baseCurrency, { compact: true })}
            </Text>
          </View>

          <View style={[styles.summaryCell, styles.summaryCellDivider]}>
            <Text style={styles.summaryCellLabel}>EXPENSES</Text>
            <Text
              style={[styles.summaryCellValue, { color: EXPENSE_COLOR }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatAmount(totals.expense, baseCurrency, { compact: true })}
            </Text>
          </View>

          <View style={styles.summaryCell}>
            <Text style={styles.summaryCellLabel}>BALANCE</Text>
            <Text
              style={[
                styles.summaryCellValue,
                { color: totals.net >= 0 ? INCOME_COLOR : EXPENSE_COLOR },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {totals.net >= 0 ? "+" : ""}
              {formatAmount(Math.abs(totals.net), baseCurrency, { compact: true })}
            </Text>
          </View>
        </View>

        {hasData ? (
          <>
            {/* ── Income vs Expenses Chart ── */}
            {chartData.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Income vs Expenses</Text>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: INCOME_COLOR }]} />
                    <Text style={styles.legendLabel}>Inc</Text>
                    <View style={[styles.legendDot, { backgroundColor: EXPENSE_COLOR }]} />
                    <Text style={styles.legendLabel}>Exp</Text>
                  </View>
                </View>
                <BarChart
                  data={chartData.flatMap((item, idx) => [
                    {
                      value: item.income,
                      label: item.label,
                      frontColor: INCOME_COLOR,
                      spacing: 2,
                    },
                    {
                      value: item.expense,
                      frontColor: EXPENSE_COLOR,
                      spacing: idx === chartData.length - 1 ? 0 : 16,
                    },
                  ])}
                  width={chartBarWidth}
                  height={160}
                  barWidth={16}
                  noOfSections={3}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  xAxisColor={theme.background.darker}
                  yAxisTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
                  xAxisLabelTextStyle={{ color: theme.foreground.gray, fontSize: 9 }}
                  isAnimated
                  roundedTop
                  hideRules
                  backgroundColor="transparent"
                />
              </View>
            )}

            {/* ── Spending by Category ── */}
            {categoryData.length > 0 && (
              <View style={styles.card}>
                <Text style={[styles.cardTitle, { marginBottom: 16 }]}>
                  Top Spending Categories
                </Text>
                {categoryData.map((cat) => {
                  const pct = totals.expense > 0 ? cat.value / totals.expense : 0;
                  return (
                    <View key={cat.id} style={styles.catRow}>
                      <View style={[styles.catIcon, { backgroundColor: `${cat.color}1A` }]}>
                        <MaterialCommunityIcons
                          name={cat.icon as any}
                          size={15}
                          color={cat.color}
                        />
                      </View>
                      <View style={styles.catBody}>
                        <View style={styles.catMetaRow}>
                          <Text style={styles.catName}>{cat.name}</Text>
                          <Text style={styles.catAmount}>
                            {formatAmount(cat.value, baseCurrency, { compact: true })}
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${Math.max(pct * 100, 2)}%` as any,
                                backgroundColor: cat.color,
                                opacity: 0.75,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.catPct}>
                          {(pct * 100).toFixed(0)}% of expenses
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="chart-bar"
                size={40}
                color={theme.foreground.gray}
              />
            </View>
            <Text style={styles.emptyTitle}>No data for this period</Text>
            <Text style={styles.emptyBody}>
              Add some transactions to see your analytics
            </Text>
          </View>
        )}

        <View style={{ height: 28 }} />
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

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.foreground.white,
      letterSpacing: 0.2,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 3,
    },

    // ── Scroll ───────────────────────────────────────────────────────────────
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },

    // ── Period Selector ───────────────────────────────────────────────────────
    periodSelector: {
      flexDirection: "row",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 4,
      gap: 4,
      marginBottom: 16,
    },
    periodBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 9,
      alignItems: "center",
    },
    periodBtnActive: {
      backgroundColor: theme.primary.main,
    },
    periodBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    periodBtnTextActive: {
      color: theme.background.dark,
      fontWeight: "700",
    },

    // ── Summary Row ───────────────────────────────────────────────────────────
    summaryRow: {
      flexDirection: "row",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      marginBottom: 14,
      overflow: "hidden",
    },
    summaryCell: {
      flex: 1,
      paddingVertical: 18,
      paddingHorizontal: 10,
      alignItems: "center",
    },
    summaryCellDivider: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: theme.background.darker,
    },
    summaryCellLabel: {
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.9,
      color: theme.foreground.gray,
      marginBottom: 7,
    },
    summaryCellValue: {
      fontSize: 17,
      fontWeight: "700",
    },

    // ── Cards ─────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
      letterSpacing: 0.1,
    },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    legendLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginRight: 4,
    },

    // ── Category rows ─────────────────────────────────────────────────────────
    catRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 14,
    },
    catIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    catBody: {
      flex: 1,
      gap: 5,
    },
    catMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    catName: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    catAmount: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    barTrack: {
      height: 4,
      backgroundColor: theme.background.darker,
      borderRadius: 2,
      overflow: "hidden",
    },
    barFill: {
      height: 4,
      borderRadius: 2,
    },
    catPct: {
      fontSize: 11,
      color: theme.foreground.gray,
    },

    // ── Empty State ───────────────────────────────────────────────────────────
    emptyState: {
      alignItems: "center",
      paddingVertical: 70,
      gap: 10,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    emptyBody: {
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
    },
  });
}

