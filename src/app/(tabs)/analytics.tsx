import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  Alert,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useCategories } from "../../contexts/CategoriesContext";

type Period = "week" | "month" | "year" | "custom";

interface CategorySpending {
  id: string;
  name: string;
  color: string;
  icon?: string;
  amount: number;
  percentage: number;
  count: number;
}

interface MerchantSpending {
  merchant: string;
  amount: number;
  count: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { allTransactions, baseCurrency } = useFinance();
  const { expenseCategories, incomeCategories } = useCategories();

  const [period, setPeriod] = useState<Period>("month");
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const s = makeStyles(theme);

  // Calculate date range
  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    let periodLabel = "";

    switch (period) {
      case "week":
        start.setDate(start.getDate() - 7);
        periodLabel = "Last 7 Days";
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        periodLabel = "Last 30 Days";
        break;
      case "year":
        start.setFullYear(start.getFullYear() - 1);
        periodLabel = "Last Year";
        break;
      case "custom":
        // TODO: Implement custom date picker
        start.setMonth(start.getMonth() - 1);
        periodLabel = "Custom Range";
        break;
    }

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: periodLabel,
    };
  }, [period]);

  // Filter transactions by period
  const periodTransactions = useMemo(() => {
    return allTransactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate
    );
  }, [allTransactions, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    periodTransactions.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      if (tx.type === "expense") expense += tx.amount;
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [periodTransactions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, CategorySpending>();
    let totalExpense = 0;

    periodTransactions
      .filter((tx) => tx.type === "expense" && tx.categoryId)
      .forEach((tx) => {
        const existing = categoryMap.get(tx.categoryId!);
        if (existing) {
          existing.amount += tx.amount;
          existing.count += 1;
        } else {
          categoryMap.set(tx.categoryId!, {
            id: tx.categoryId!,
            name: tx.categoryName || "Unknown",
            color: tx.categoryColor || theme.primary.main,
            icon: tx.categoryIcon,
            amount: tx.amount,
            percentage: 0,
            count: 1,
          });
        }
        totalExpense += tx.amount;
      });

    const categories: CategorySpending[] = [];
    categoryMap.forEach((cat) => {
      cat.percentage = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
      categories.push(cat);
    });

    categories.sort((a, b) => b.amount - a.amount);

    // Top 5 + Others
    const top5 = categories.slice(0, 5);
    const others = categories.slice(5);

    if (others.length > 0) {
      const othersTotal = others.reduce((sum, cat) => sum + cat.amount, 0);
      const othersCount = others.reduce((sum, cat) => sum + cat.count, 0);
      top5.push({
        id: "others",
        name: "Others",
        color: theme.foreground.gray,
        amount: othersTotal,
        percentage: totalExpense > 0 ? (othersTotal / totalExpense) * 100 : 0,
        count: othersCount,
      });
    }

    return top5;
  }, [periodTransactions, theme]);

  // Top merchants
  const topMerchants = useMemo(() => {
    const merchantMap = new Map<string, MerchantSpending>();

    periodTransactions
      .filter((tx) => tx.type === "expense" && tx.merchant)
      .forEach((tx) => {
        const existing = merchantMap.get(tx.merchant!);
        if (existing) {
          existing.amount += tx.amount;
          existing.count += 1;
        } else {
          merchantMap.set(tx.merchant!, {
            merchant: tx.merchant!,
            amount: tx.amount,
            count: 1,
          });
        }
      });

    const merchants: MerchantSpending[] = [];
    merchantMap.forEach((m) => merchants.push(m));
    merchants.sort((a, b) => b.amount - a.amount);

    return merchants.slice(0, 5);
  }, [periodTransactions]);

  // Largest transaction
  const largestTransaction = useMemo(() => {
    if (periodTransactions.length === 0) return null;

    return periodTransactions.reduce((largest, tx) => {
      return tx.amount > largest.amount ? tx : largest;
    });
  }, [periodTransactions]);

  // Trend data (simplified - daily aggregation)
  const trendData = useMemo(() => {
    const days = period === "week" ? 7 : period === "month" ? 30 : 365;
    const dailyData: { date: string; expense: number; income: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayTransactions = periodTransactions.filter(
        (tx) => tx.date === dateStr
      );

      const expense = dayTransactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      const income = dayTransactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);

      dailyData.push({ date: dateStr, expense, income });
    }

    return dailyData;
  }, [periodTransactions, period]);

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === period) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    setPeriod(newPeriod);

    // Simulate data loading
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleExport = (type: "image" | "pdf") => {
    setShowExportModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Export", `Exporting as ${type.toUpperCase()}...`);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Analytics</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowExportModal(true);
          }}
          style={({ pressed }) => [s.exportButton, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons
            name="export-variant"
            size={20}
            color={theme.primary.main}
          />
        </Pressable>
      </View>

      {/* Period Selector */}
      <View style={s.periodSelector}>
        {(["week", "month", "year", "custom"] as Period[]).map((p) => (
          <PeriodButton
            key={p}
            period={p}
            active={period === p}
            onPress={() => handlePeriodChange(p)}
            theme={theme}
          />
        ))}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary.main} />
            <Text style={s.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            {/* Period Label */}
            <Animated.View entering={FadeIn.duration(300)} style={s.periodLabel}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={14}
                color={theme.foreground.gray}
              />
              <Text style={s.periodLabelText}>{label}</Text>
            </Animated.View>

            {/* Income vs Expense Card */}
            <IncomeExpenseCard
              income={totals.income}
              expense={totals.expense}
              balance={totals.balance}
              currency={baseCurrency}
              theme={theme}
              formatAmount={formatAmount}
            />

            {/* Spending by Category */}
            <SpendingByCategoryCard
              categories={categoryBreakdown}
              total={totals.expense}
              currency={baseCurrency}
              theme={theme}
              formatAmount={formatAmount}
            />

            {/* Trend Over Time */}
            <TrendCard
              data={trendData}
              period={period}
              theme={theme}
              formatAmount={formatAmount}
            />

            {/* Top Categories */}
            <TopCategoriesCard
              categories={categoryBreakdown.slice(0, 3)}
              currency={baseCurrency}
              theme={theme}
              formatAmount={formatAmount}
            />

            {/* Top Merchants */}
            {topMerchants.length > 0 && (
              <TopMerchantsCard
                merchants={topMerchants}
                currency={baseCurrency}
                theme={theme}
                formatAmount={formatAmount}
              />
            )}

            {/* Largest Transaction */}
            {largestTransaction && (
              <LargestTransactionCard
                transaction={largestTransaction}
                currency={baseCurrency}
                theme={theme}
                formatAmount={formatAmount}
              />
            )}

            <View style={s.bottomSpacer} />
          </>
        )}
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowExportModal(false)}
        >
          <Animated.View
            entering={FadeInDown.springify().damping(15)}
            style={s.exportSheet}
          >
            <View style={s.exportHeader}>
              <Text style={s.exportTitle}>Export Report</Text>
              <Pressable onPress={() => setShowExportModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.foreground.white}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                s.exportOption,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleExport("image")}
            >
              <MaterialCommunityIcons
                name="image-outline"
                size={24}
                color={theme.primary.main}
              />
              <Text style={s.exportOptionText}>Export as Image</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                s.exportOption,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleExport("pdf")}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={24}
                color={theme.primary.main}
              />
              <Text style={s.exportOptionText}>Export as PDF</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Period Button Component ─────────────────────────────────────────────────

function PeriodButton({
  period,
  active,
  onPress,
  theme,
}: {
  period: Period;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labels: Record<Period, string> = {
    week: "Week",
    month: "Month",
    year: "Year",
    custom: "Custom",
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 400 });
      }}
      style={[
        animatedStyle,
        {
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: active ? theme.primary.main : theme.background.accent,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? "700" : "600",
          color: active ? theme.background.dark : theme.foreground.gray,
        }}
      >
        {labels[period]}
      </Text>
    </AnimatedPressable>
  );
}

// ─── Income vs Expense Card ──────────────────────────────────────────────────

function IncomeExpenseCard({
  income,
  expense,
  balance,
  currency,
  theme,
  formatAmount,
}: {
  income: number;
  expense: number;
  balance: number;
  currency: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
}) {
  const s = makeCardStyles(theme);
  
  // Add 10% padding to prevent bars from reaching 100% width
  const rawMaxAmount = Math.max(income, expense, 1);
  const maxAmount = rawMaxAmount * 1.1; // 10% padding

  const incomeWidth = useSharedValue(0);
  const expenseWidth = useSharedValue(0);

  useEffect(() => {
    // Calculate percentage with clamping to prevent overflow
    const incomePercent = Math.min((income / maxAmount) * 100, 100);
    const expensePercent = Math.min((expense / maxAmount) * 100, 100);
    
    incomeWidth.value = withSpring(incomePercent, {
      damping: 15,
      stiffness: 100,
    });
    expenseWidth.value = withSpring(expensePercent, {
      damping: 15,
      stiffness: 100,
    });
  }, [income, expense, maxAmount]);

  const incomeBarStyle = useAnimatedStyle(() => ({
    width: `${incomeWidth.value}%`,
  }));

  const expenseBarStyle = useAnimatedStyle(() => ({
    width: `${expenseWidth.value}%`,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={s.card}>
      <View style={s.cardHeader}>
        <MaterialCommunityIcons
          name="scale-balance"
          size={20}
          color={theme.primary.main}
        />
        <Text style={s.cardTitle}>Income vs Expense</Text>
      </View>

      <View style={s.cardContent}>
        {/* Income */}
        <View style={{ marginBottom: 20 }}>
          <View style={s.barLabelRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={[s.colorDot, { backgroundColor: "#26A17B" }]} />
              <Text style={s.barLabel}>Income</Text>
            </View>
            <Text style={[s.barValue, { color: "#26A17B" }]}>
              {currency} {formatAmount(income)}
            </Text>
          </View>
          <View style={s.barBackground}>
            <Animated.View style={[s.bar, { backgroundColor: "#26A17B" }, incomeBarStyle]} />
          </View>
        </View>

        {/* Expense */}
        <View style={{ marginBottom: 20 }}>
          <View style={s.barLabelRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={[s.colorDot, { backgroundColor: "#F14A6E" }]} />
              <Text style={s.barLabel}>Expense</Text>
            </View>
            <Text style={[s.barValue, { color: "#F14A6E" }]}>
              {currency} {formatAmount(expense)}
            </Text>
          </View>
          <View style={s.barBackground}>
            <Animated.View style={[s.bar, { backgroundColor: "#F14A6E" }, expenseBarStyle]} />
          </View>
        </View>

        {/* Balance */}
        <View style={s.balanceRow}>
          <Text style={s.balanceLabel}>Balance</Text>
          <Text
            style={[
              s.balanceValue,
              { color: balance >= 0 ? "#26A17B" : "#F14A6E" },
            ]}
          >
            {currency} {formatAmount(Math.abs(balance))}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Spending by Category Card ───────────────────────────────────────────────

function SpendingByCategoryCard({
  categories,
  total,
  currency,
  theme,
  formatAmount,
}: {
  categories: CategorySpending[];
  total: number;
  currency: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
}) {
  const s = makeCardStyles(theme);

  if (categories.length === 0) {
    return (
      <Animated.View entering={FadeInDown.delay(200).springify()} style={s.card}>
        <View style={s.cardHeader}>
          <MaterialCommunityIcons
            name="chart-donut"
            size={20}
            color={theme.primary.main}
          />
          <Text style={s.cardTitle}>Spending by Category</Text>
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyText}>No expense data for this period</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()} style={s.card}>
      <View style={s.cardHeader}>
        <MaterialCommunityIcons
          name="chart-donut"
          size={20}
          color={theme.primary.main}
        />
        <Text style={s.cardTitle}>Spending by Category</Text>
      </View>

      <View style={s.cardContent}>
        {/* Donut Chart */}
        <DonutChart categories={categories} theme={theme} />

        {/* Legend */}
        <View style={{ marginTop: 24 }}>
          {categories.map((cat, index) => (
            <CategoryLegendItem
              key={cat.id}
              category={cat}
              currency={currency}
              theme={theme}
              formatAmount={formatAmount}
              delay={300 + index * 50}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Donut Chart Component ───────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function DonutChart({
  categories,
  theme,
}: {
  categories: CategorySpending[];
  theme: Theme;
}) {
  const size = 220;
  const strokeWidth = 35;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Small gap between segments (in degrees, converted to circumference percentage)
  const gapInDegrees = 2; // 2 degrees gap
  const gapLength = (gapInDegrees / 360) * circumference;
  const totalGapLength = gapLength * categories.length;

  if (categories.length === 0) {
    return null;
  }

  // Calculate available space for segments (total minus gaps)
  const availableSpace = circumference - totalGapLength;

  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {categories.map((cat, index) => {
            // Calculate segment length based on percentage of available space
            const segmentLength = (cat.percentage / 100) * availableSpace;
            
            // Calculate starting position (sum of all previous segments + gaps)
            const prevSegments = categories.slice(0, index);
            const startPosition = prevSegments.reduce((sum, c) => {
              const prevLength = (c.percentage / 100) * availableSpace;
              return sum + prevLength + gapLength;
            }, 0);

            // Progress for animation
            const progress = useSharedValue(0);

            useEffect(() => {
              progress.value = withDelay(
                index * 80,
                withSpring(1, {
                  damping: 15,
                  stiffness: 90,
                  mass: 0.8,
                })
              );
            }, []);

            const animatedProps = useAnimatedProps(() => {
              // Animate the segment growing from 0 to full length
              const currentLength = segmentLength * progress.value;
              
              return {
                strokeDasharray: `${currentLength} ${circumference}`,
                strokeDashoffset: -startPosition,
              };
            });

            return (
              <AnimatedCircle
                key={cat.id}
                cx={center}
                cy={center}
                r={radius}
                stroke={cat.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="butt"
                opacity={0.95}
                animatedProps={animatedProps}
              />
            );
          })}
        </G>

        {/* Center label */}
        <SvgText
          x={center}
          y={center - 10}
          textAnchor="middle"
          fontSize="28"
          fontWeight="800"
          fill={theme.foreground.white}
        >
          {categories.length}
        </SvgText>
        <SvgText
          x={center}
          y={center + 15}
          textAnchor="middle"
          fontSize="12"
          fill={theme.foreground.gray}
        >
          categories
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Category Legend Item ────────────────────────────────────────────────────

function CategoryLegendItem({
  category,
  currency,
  theme,
  formatAmount,
  delay,
}: {
  category: CategorySpending;
  currency: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
  delay: number;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withSpring(category.percentage, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, [category.percentage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {category.icon && (
            <MaterialCommunityIcons
              name={category.icon as any}
              size={16}
              color={category.color}
            />
          )}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.foreground.white,
            }}
          >
            {category.name}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: theme.foreground.white,
          }}
        >
          {category.percentage.toFixed(1)}%
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: `${category.color}20`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            progressStyle,
            {
              height: "100%",
              backgroundColor: category.color,
              borderRadius: 4,
            },
          ]}
        />
      </View>
      <Text
        style={{
          fontSize: 12,
          color: theme.foreground.gray,
          marginTop: 4,
        }}
      >
        {currency} {formatAmount(category.amount)} • {category.count} transactions
      </Text>
    </Animated.View>
  );
}

// ─── Trend Card ──────────────────────────────────────────────────────────────

function TrendCard({
  data,
  period,
  theme,
  formatAmount,
}: {
  data: { date: string; expense: number; income: number }[];
  period: Period;
  theme: Theme;
  formatAmount: (amount: number) => string;
}) {
  const s = makeCardStyles(theme);
  const [trendFilter, setTrendFilter] = useState<"both" | "income" | "expense">("both");

  if (data.length === 0) {
    return null;
  }

  // Calculate max value with 15% padding above tallest bar
  const rawMaxValue = Math.max(
    ...data.map((d) => Math.max(d.expense, d.income)),
    1
  );
  const maxValue = rawMaxValue * 1.15; // Add 15% padding
  const chartHeight = 180;

  const handleFilterChange = (filter: "both" | "income" | "expense") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTrendFilter(filter);
  };

  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={s.card}>
      <View style={s.cardHeader}>
        <MaterialCommunityIcons
          name="chart-line"
          size={20}
          color={theme.primary.main}
        />
        <Text style={s.cardTitle}>Trend Over Time</Text>
      </View>

      {/* Filter Chips */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <FilterChip
          label="Both"
          active={trendFilter === "both"}
          onPress={() => handleFilterChange("both")}
          theme={theme}
          color={theme.primary.main}
        />
        <FilterChip
          label="Income"
          active={trendFilter === "income"}
          onPress={() => handleFilterChange("income")}
          theme={theme}
          color="#26A17B"
        />
        <FilterChip
          label="Expense"
          active={trendFilter === "expense"}
          onPress={() => handleFilterChange("expense")}
          theme={theme}
          color="#F14A6E"
        />
      </View>

      <View style={s.cardContent}>
        {/* Chart Container with clipping */}
        <View
          style={{
            height: chartHeight,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <View
            style={{
              height: chartHeight,
              flexDirection: "row",
              alignItems: "flex-end",
              gap: data.length > 30 ? 1 : 4,
              paddingHorizontal: 4,
            }}
          >
            {data.map((point, index) => {
              const showIncome = trendFilter === "both" || trendFilter === "income";
              const showExpense = trendFilter === "both" || trendFilter === "expense";

              // Calculate heights with proper scaling (will never exceed chartHeight due to padding)
              const expenseHeight = Math.min(
                (point.expense / maxValue) * chartHeight,
                chartHeight
              );
              const incomeHeight = Math.min(
                (point.income / maxValue) * chartHeight,
                chartHeight
              );

              const expenseAnim = useSharedValue(0);
              const incomeAnim = useSharedValue(0);

              useEffect(() => {
                if (showExpense) {
                  expenseAnim.value = withDelay(
                    index * 15,
                    withSpring(expenseHeight, {
                      damping: 15,
                      stiffness: 100,
                    })
                  );
                } else {
                  expenseAnim.value = withTiming(0, { duration: 200 });
                }

                if (showIncome) {
                  incomeAnim.value = withDelay(
                    index * 15,
                    withSpring(incomeHeight, {
                      damping: 15,
                      stiffness: 100,
                    })
                  );
                } else {
                  incomeAnim.value = withTiming(0, { duration: 200 });
                }
              }, [expenseHeight, incomeHeight, trendFilter]);

              const expenseStyle = useAnimatedStyle(() => ({
                height: Math.max(expenseAnim.value, 0),
              }));

              const incomeStyle = useAnimatedStyle(() => ({
                height: Math.max(incomeAnim.value, 0),
              }));

              return (
                <View
                  key={index}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    gap: 2,
                    minWidth: 2,
                  }}
                >
                  {showIncome && (
                    <Animated.View
                      style={[
                        {
                          width: "100%",
                          backgroundColor: "#26A17B",
                          borderRadius: 2,
                          minHeight: 2,
                        },
                        incomeStyle,
                      ]}
                    />
                  )}
                  {showExpense && (
                    <Animated.View
                      style={[
                        {
                          width: "100%",
                          backgroundColor: "#F14A6E",
                          borderRadius: 2,
                          minHeight: 2,
                        },
                        expenseStyle,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 20,
            marginTop: 16,
          }}
        >
          {(trendFilter === "both" || trendFilter === "income") && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#26A17B",
                  borderRadius: 2,
                }}
              />
              <Text style={{ fontSize: 12, color: theme.foreground.gray }}>
                Income
              </Text>
            </View>
          )}
          {(trendFilter === "both" || trendFilter === "expense") && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: "#F14A6E",
                  borderRadius: 2,
                }}
              />
              <Text style={{ fontSize: 12, color: theme.foreground.gray }}>
                Expense
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Filter Chip Component ───────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
  theme,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: Theme;
  color: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 400 });
      }}
      style={[
        animatedStyle,
        {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          backgroundColor: active ? `${color}20` : theme.background.darker,
          borderWidth: 1,
          borderColor: active ? color : "transparent",
        },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: active ? "700" : "600",
          color: active ? color : theme.foreground.gray,
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// ─── Top Categories Card ─────────────────────────────────────────────────────

function TopCategoriesCard({
  categories,
  currency,
  theme,
  formatAmount,
}: {
  categories: CategorySpending[];
  currency: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
}) {
  const s = makeCardStyles(theme);

  if (categories.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(400).springify()} style={s.card}>
      <View style={s.cardHeader}>
        <MaterialCommunityIcons
          name="medal-outline"
          size={20}
          color={theme.primary.main}
        />
        <Text style={s.cardTitle}>Top Categories</Text>
      </View>

      <View style={s.cardContent}>
        {categories.map((cat, index) => (
          <RankItem
            key={cat.id}
            rank={index + 1}
            label={cat.name}
            amount={cat.amount}
            currency={currency}
            color={cat.color}
            icon={cat.icon}
            theme={theme}
            formatAmount={formatAmount}
            delay={450 + index * 50}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Top Merchants Card ──────────────────────────────────────────────────────

function TopMerchantsCard({
  merchants,
  currency,
  theme,
  formatAmount,
}: {
  merchants: MerchantSpending[];
  currency: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
}) {
  const s = makeCardStyles(theme);

  return (
    <Animated.View entering={FadeInDown.delay(500).springify()} style={s.card}>
      <View style={s.cardHeader}>
        <MaterialCommunityIcons
          name="store-outline"
          size={20}
          color={theme.primary.main}
        />
        <Text style={s.cardTitle}>Top Merchants</Text>
      </View>

      <View style={s.cardContent}>
        {merchants.map((merchant, index) => (
          <RankItem
            key={merchant.merchant}
            rank={index + 1}
            label={merchant.merchant}
            amount={merchant.amount}
            currency={currency}
            color={theme.primary.main}
            theme={theme}
            formatAmount={formatAmount}
            delay={550 + index * 50}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Rank Item Component ─────────────────────────────────────────────────────

function RankItem({
  rank,
  label,
  amount,
  currency,
  color,
  icon,
  theme,
  formatAmount,
  delay,
}: {
  rank: number;
  label: string;
  amount: number;
  currency: string;
  color: string;
  icon?: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: `${theme.background.darker}60`,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: `${color}20`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color }}>
          {rank}
        </Text>
      </View>

      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={color}
          style={{ marginRight: 8 }}
        />
      )}

      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: "600",
          color: theme.foreground.white,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: theme.foreground.white,
        }}
      >
        {currency} {formatAmount(amount)}
      </Text>
    </Animated.View>
  );
}

// ─── Largest Transaction Card ────────────────────────────────────────────────

function LargestTransactionCard({
  transaction,
  currency,
  theme,
  formatAmount,
}: {
  transaction: any;
  currency: string;
  theme: Theme;
  formatAmount: (amount: number) => string;
}) {
  const s = makeCardStyles(theme);

  return (
    <Animated.View entering={FadeInDown.delay(600).springify()} style={[s.card, s.highlightCard]}>
      <View style={s.cardHeader}>
        <MaterialCommunityIcons
          name="star-outline"
          size={20}
          color={theme.primary.main}
        />
        <Text style={s.cardTitle}>Largest Transaction</Text>
      </View>

      <View style={s.cardContent}>
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <MaterialCommunityIcons
            name={transaction.categoryIcon || "shape-outline"}
            size={48}
            color={transaction.categoryColor || theme.primary.main}
          />
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: theme.foreground.white,
              marginTop: 16,
              letterSpacing: -1,
            }}
          >
            {currency} {formatAmount(transaction.amount)}
          </Text>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: `${transaction.categoryColor || theme.primary.main}20`,
              marginTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: transaction.categoryColor || theme.primary.main,
              }}
            >
              {transaction.categoryName || "Unknown"}
            </Text>
          </View>
          {transaction.note && (
            <Text
              style={{
                fontSize: 14,
                color: theme.foreground.gray,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {transaction.note}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
      fontSize: 32,
      fontWeight: "800",
      color: theme.foreground.white,
      letterSpacing: -0.5,
    },
    exportButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    periodSelector: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 20,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
    },
    loadingText: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginTop: 12,
    },
    periodLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.background.accent,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginBottom: 16,
    },
    periodLabelText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    bottomSpacer: {
      height: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "flex-end",
    },
    exportSheet: {
      backgroundColor: theme.background.accent,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },
    exportHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    exportTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    exportOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.background.dark,
      borderRadius: 12,
      marginBottom: 12,
    },
    exportOptionText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
  });
}

function makeCardStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: `${theme.background.darker}40`,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    highlightCard: {
      borderWidth: 2,
      borderColor: `${theme.primary.main}40`,
      shadowColor: theme.primary.main,
      shadowOpacity: 0.2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    cardContent: {
      // Container for card content
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: theme.foreground.gray,
      fontStyle: "italic",
    },
    barLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    barLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    barValue: {
      fontSize: 14,
      fontWeight: "700",
    },
    barBackground: {
      height: 12,
      backgroundColor: theme.background.darker,
      borderRadius: 6,
      overflow: "hidden",
    },
    bar: {
      height: "100%",
      borderRadius: 6,
    },
    colorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    balanceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: `${theme.background.darker}60`,
    },
    balanceLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    balanceValue: {
      fontSize: 18,
      fontWeight: "800",
    },
  });
}
