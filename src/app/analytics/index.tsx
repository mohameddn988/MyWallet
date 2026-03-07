import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { convertToBase, formatAmount } from "../../utils/currency";

type Period = "day" | "week" | "month" | "quarter" | "year";
type TypeFilter = "all" | "expense" | "income";

const INCOME_COLOR = "#4DD68C";
const EXPENSE_COLOR = "#F14A6E";
const H_PAD = 16;

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
];

const screenWidth = Dimensions.get("window").width;

// ── SVG Helpers ───────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const o1 = polarToCartesian(cx, cy, outerR, startDeg);
  const o2 = polarToCartesian(cx, cy, outerR, endDeg);
  const i1 = polarToCartesian(cx, cy, innerR, startDeg);
  const i2 = polarToCartesian(cx, cy, innerR, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(1)} ${o1.y.toFixed(1)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(1)} ${o2.y.toFixed(1)}`,
    `L ${i2.x.toFixed(1)} ${i2.y.toFixed(1)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x.toFixed(1)} ${i1.y.toFixed(1)}`,
    "Z",
  ].join(" ");
}

function buildSparkline(data: number[], w: number, h: number) {
  if (data.length < 2 || data.every((v) => v === 0)) {
    const fy = (h * 0.6).toFixed(1);
    return { line: `M 0 ${fy} L ${w.toFixed(1)} ${fy}`, area: null as null | string, lastX: w, lastY: h * 0.6 };
  }
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = h * 0.14;
  const xs = data.map((_, i) => (i / (data.length - 1)) * w);
  const ys = data.map((v) => h - pad - ((v - min) / range) * (h - 2 * pad));

  let line = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 1; i < xs.length; i++) {
    const mx = ((xs[i - 1] + xs[i]) / 2).toFixed(1);
    line += ` C ${mx} ${ys[i - 1].toFixed(1)}, ${mx} ${ys[i].toFixed(1)}, ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
  }

  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  const area = `${line} L ${lastX.toFixed(1)} ${h} L 0 ${h} Z`;
  return { line, area, lastX, lastY };
}

// ── Period Helpers ────────────────────────────────────────────────────────────

function getPeriodLabel(p: Period): string {
  const now = new Date();
  switch (p) {
    case "day":
      return now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    case "week":
      return "Last 7 Days";
    case "month":
      return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "quarter":
      return "Last 3 Months";
    case "year":
      return String(now.getFullYear());
  }
}

function getPeriodRange(p: Period): {
  start: Date;
  end: Date;
  priorStart: Date;
  priorEnd: Date;
} {
  const now = new Date();
  const end = new Date();
  let start: Date;
  let priorStart: Date;
  let priorEnd: Date;
  switch (p) {
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      priorStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      priorEnd = new Date(start.getTime() - 1);
      break;
    case "week":
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      priorEnd = new Date(start.getTime() - 1);
      priorStart = new Date(start);
      priorStart.setDate(priorStart.getDate() - 7);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      priorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      priorEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case "quarter":
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      priorEnd = new Date(start.getTime() - 1);
      priorStart = new Date(start.getFullYear(), start.getMonth() - 3, 1);
      break;
    default: // year
      start = new Date(now.getFullYear(), 0, 1);
      priorStart = new Date(now.getFullYear() - 1, 0, 1);
      priorEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  }
  return { start, end, priorStart, priorEnd };
}

function getSparklinePoints(
  txs: { type: string; date: string; amount: number; currency: string }[],
  period: Period,
  baseCurrency: string,
  rateMap: Record<string, number>,
): number[] {
  const now = new Date();

  if (period === "year") {
    return Array.from({ length: 12 }, (_, i) => {
      const offset = now.getMonth() - 11 + i;
      const yr = now.getFullYear() + Math.floor(offset / 12);
      const mo = ((offset % 12) + 12) % 12;
      return txs
        .filter((tx) => {
          if (tx.type !== "expense") return false;
          const d = new Date(tx.date);
          return d.getMonth() === mo && d.getFullYear() === yr;
        })
        .reduce((s, tx) => s + convertToBase(tx.amount, tx.currency, baseCurrency, rateMap), 0);
    });
  }

  if (period === "quarter") {
    return Array.from({ length: 13 }, (_, i) => {
      const anchor = new Date(now);
      anchor.setDate(now.getDate() - (12 - i) * 7);
      const wEnd = new Date(anchor);
      wEnd.setHours(23, 59, 59);
      const wStart = new Date(anchor);
      wStart.setDate(anchor.getDate() - 6);
      wStart.setHours(0, 0, 0, 0);
      return txs
        .filter((tx) => {
          if (tx.type !== "expense") return false;
          const d = new Date(tx.date);
          return d >= wStart && d <= wEnd;
        })
        .reduce((s, tx) => s + convertToBase(tx.amount, tx.currency, baseCurrency, rateMap), 0);
    });
  }

  const dayCount = period === "month" ? 30 : 7;
  return Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (dayCount - 1 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return txs
      .filter((tx) => tx.type === "expense" && tx.date === dateStr)
      .reduce((s, tx) => s + convertToBase(tx.amount, tx.currency, baseCurrency, rateMap), 0);
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroAmount({
  amount,
  currency,
  accentColor,
  foreColor,
}: {
  amount: number;
  currency: string;
  accentColor: string;
  foreColor: string;
}) {
  const full = formatAmount(amount, currency);
  const dotIdx = full.lastIndexOf(".");
  const intPart = dotIdx >= 0 ? full.slice(0, dotIdx) : full;
  const decPart = dotIdx >= 0 ? full.slice(dotIdx) : "";
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", marginVertical: 10 }}>
      <Text
        style={{
          fontSize: 42,
          fontWeight: "800",
          color: foreColor,
          letterSpacing: -1,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {intPart}
      </Text>
      {decPart ? (
        <Text style={{ fontSize: 26, fontWeight: "700", color: accentColor }}>
          {decPart}
        </Text>
      ) : null}
    </View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
  badge: { value: number; isPositive: boolean } | null;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}

function StatCard({ label, value, icon, iconColor, badge, theme, styles }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.background.accent }]}>
      <View style={[styles.statIconWrap, { backgroundColor: `${iconColor}20` }]}>
        <MaterialCommunityIcons name={icon as any} size={17} color={iconColor} />
      </View>
      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {badge && (
        <View
          style={[
            styles.statBadge,
            { backgroundColor: badge.isPositive ? `${INCOME_COLOR}22` : `${EXPENSE_COLOR}22` },
          ]}
        >
          <MaterialCommunityIcons
            name={badge.isPositive ? "arrow-down" : "arrow-up"}
            size={9}
            color={badge.isPositive ? INCOME_COLOR : EXPENSE_COLOR}
          />
          <Text
            style={[
              styles.statBadgeText,
              { color: badge.isPositive ? INCOME_COLOR : EXPENSE_COLOR },
            ]}
          >
            {Math.abs(badge.value).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
}

interface MonthBucket {
  month: number;
  year: number;
  label: string;
  expense: number;
  isCurrent: boolean;
}

function MonthlyBars({
  data,
  theme,
  styles,
}: {
  data: MonthBucket[];
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}) {
  const maxExpense = Math.max(...data.map((d) => d.expense), 1);
  const BAR_H = 88;
  return (
    <View style={styles.barChartWrap}>
      {data.map((item) => {
        const barH = item.expense > 0 ? Math.max((item.expense / maxExpense) * BAR_H, 4) : 0;
        return (
          <View key={`${item.year}-${item.month}`} style={styles.barCol}>
            <View style={styles.barColInner}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barH,
                    backgroundColor: item.isCurrent
                      ? theme.primary.main
                      : theme.background.darker,
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.barLabel,
                item.isCurrent && { color: theme.primary.main, fontWeight: "700" },
              ]}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface CatEntry {
  name: string;
  icon: string;
  color: string;
  value: number;
}

const DONUT_SIZE = 130;
const OUTER_R = 55;
const INNER_R = 34;
const CX = DONUT_SIZE / 2;
const CY = DONUT_SIZE / 2;
const SEG_GAP = 2.5;

function DonutRow({
  data,
  totalExpense,
  baseCurrency,
  theme,
  styles,
}: {
  data: CatEntry[];
  totalExpense: number;
  baseCurrency: string;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <View style={styles.donutRow}>
      <View style={styles.donutContainer}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>

          {data.map((seg, i) => {
            const pct = total > 0 ? seg.value / total : 0;
            if (pct === 0) return null;
            const startAngle = -90 + data.slice(0, i).reduce((s, d) => s + (d.value / total) * 360, 0) + SEG_GAP / 2;
            const endAngle = -90 + data.slice(0, i + 1).reduce((s, d) => s + (d.value / total) * 360, 0) - SEG_GAP / 2;
            return (
              <Path
                key={i}
                d={donutSegmentPath(CX, CY, OUTER_R, INNER_R, startAngle, endAngle)}
                fill={seg.color}
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenterWrap}>
          <Text
            style={styles.donutCenterValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatAmount(totalExpense, baseCurrency, { compact: true })}
          </Text>
          <Text style={styles.donutCenterLabel}>spent</Text>
        </View>
      </View>

      <View style={styles.donutLegend}>
        {data.slice(0, 5).map((seg, i) => (
          <View key={i} style={styles.donutLegendRow}>
            <View style={[styles.donutLegendDot, { backgroundColor: seg.color }]} />
            <Text style={styles.donutLegendName} numberOfLines={1}>
              {seg.name}
            </Text>
            <Text style={styles.donutLegendPct}>
              {total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { allTransactions, baseCurrency, exchangeRates } = useFinance();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("month");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const rateMap = useMemo(
    () => Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate])),
    [exchangeRates],
  );

  const { start, end, priorStart, priorEnd } = useMemo(
    () => getPeriodRange(selectedPeriod),
    [selectedPeriod],
  );

  const periodTxs = useMemo(
    () =>
      allTransactions.filter((tx) => {
        const d = new Date(tx.date);
        return d >= start && d <= end;
      }),
    [allTransactions, start, end],
  );

  const priorTxs = useMemo(
    () =>
      allTransactions.filter((tx) => {
        const d = new Date(tx.date);
        return d >= priorStart && d <= priorEnd;
      }),
    [allTransactions, priorStart, priorEnd],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of periodTxs) {
      if (tx.type === "transfer") continue;
      const base = convertToBase(tx.amount, tx.currency, baseCurrency, rateMap);
      if (tx.type === "income") income += base;
      else expense += base;
    }
    return { income, expense, net: income - expense };
  }, [periodTxs, baseCurrency, rateMap]);

  const priorExpense = useMemo(
    () =>
      priorTxs
        .filter((tx) => tx.type === "expense")
        .reduce(
          (s, tx) => s + convertToBase(tx.amount, tx.currency, baseCurrency, rateMap),
          0,
        ),
    [priorTxs, baseCurrency, rateMap],
  );

  const expenseChangePct =
    priorExpense > 0 ? ((totals.expense - priorExpense) / priorExpense) * 100 : null;

  const savingsRate =
    totals.income > 0
      ? Math.max(0, Math.min(100, (totals.net / totals.income) * 100))
      : null;

  const avgDailyExpense = useMemo(() => {
    const daysMap: Record<Period, number> = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 91,
      year: 365,
    };
    return Math.round(totals.expense / daysMap[selectedPeriod]);
  }, [totals.expense, selectedPeriod]);

  const categoryData = useMemo<CatEntry[]>(() => {
    const map = new Map<string, CatEntry>();
    for (const tx of periodTxs) {
      if (tx.type !== "expense") continue;
      const key = tx.categoryId ?? "other";
      const base = convertToBase(tx.amount, tx.currency, baseCurrency, rateMap);
      if (map.has(key)) {
        map.get(key)!.value += base;
      } else {
        map.set(key, {
          name: tx.categoryName ?? "Other",
          icon: tx.categoryIcon ?? "dots-horizontal-circle-outline",
          color: tx.categoryColor ?? "#888888",
          value: base,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [periodTxs, baseCurrency, rateMap]);

  const monthlyTrendData = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const offset = now.getMonth() - 5 + i;
      const yr = now.getFullYear() + Math.floor(offset / 12);
      const mo = ((offset % 12) + 12) % 12;
      const expense = allTransactions
        .filter((tx) => {
          if (tx.type !== "expense") return false;
          const d = new Date(tx.date);
          return d.getMonth() === mo && d.getFullYear() === yr;
        })
        .reduce(
          (s, tx) => s + convertToBase(tx.amount, tx.currency, baseCurrency, rateMap),
          0,
        );
      const label = new Date(yr, mo, 1).toLocaleDateString("en-US", { month: "short" });
      const isCurrent = mo === now.getMonth() && yr === now.getFullYear();
      return { month: mo, year: yr, label, expense, isCurrent };
    });
  }, [allTransactions, baseCurrency, rateMap]);

  const trendChangePct = useMemo(() => {
    const d = monthlyTrendData;
    if (d.length < 2) return null;
    const curr = d[d.length - 1].expense;
    const prev = d[d.length - 2].expense;
    return prev > 0 ? ((curr - prev) / prev) * 100 : null;
  }, [monthlyTrendData]);

  const sparklineData = useMemo(
    () => getSparklinePoints(allTransactions, selectedPeriod, baseCurrency, rateMap),
    [allTransactions, selectedPeriod, baseCurrency, rateMap],
  );

  const topTransactions = useMemo(() => {
    const filtered =
      typeFilter === "all"
        ? periodTxs.filter((tx) => tx.type !== "transfer")
        : periodTxs.filter((tx) => tx.type === typeFilter);
    return filtered
      .map((tx) => ({
        ...tx,
        baseAmount: convertToBase(tx.amount, tx.currency, baseCurrency, rateMap),
      }))
      .sort((a, b) => b.baseAmount - a.baseAmount)
      .slice(0, 7);
  }, [periodTxs, typeFilter, baseCurrency, rateMap]);

  const hasData = periodTxs.filter((tx) => tx.type !== "transfer").length > 0;

  const sparklineW = screenWidth - H_PAD * 2 - 32;
  const sparklineH = 54;
  const spark = useMemo(
    () => buildSparkline(sparklineData, sparklineW, sparklineH),
    [sparklineData, sparklineW],
  );

  const cycleFilter = () => {
    setTypeFilter((f) => (f === "all" ? "expense" : f === "expense" ? "income" : "all"));
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={cycleFilter}
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color={theme.foreground.white} />
          {typeFilter !== "all" && (
            <View style={[styles.filterDot, { backgroundColor: theme.primary.main }]} />
          )}
        </Pressable>
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

        {/* ── Hero Spending Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroPeriodPill}>
              <Text style={styles.heroPeriodText}>{getPeriodLabel(selectedPeriod)}</Text>
            </View>
            {expenseChangePct !== null && (
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor:
                      expenseChangePct <= 0 ? `${INCOME_COLOR}22` : `${EXPENSE_COLOR}22`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={expenseChangePct <= 0 ? "trending-down" : "trending-up"}
                  size={12}
                  color={expenseChangePct <= 0 ? INCOME_COLOR : EXPENSE_COLOR}
                />
                <Text
                  style={[
                    styles.heroBadgeText,
                    { color: expenseChangePct <= 0 ? INCOME_COLOR : EXPENSE_COLOR },
                  ]}
                >
                  {Math.abs(expenseChangePct).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          <HeroAmount
            amount={totals.expense}
            currency={baseCurrency}
            accentColor={theme.primary.main}
            foreColor={theme.foreground.white}
          />

          <Text style={styles.heroCompare}>
            {expenseChangePct !== null
              ? `vs ${formatAmount(priorExpense, baseCurrency, { compact: true })} prior period`
              : "No prior period data"}
          </Text>

          {/* Sparkline */}
          <View style={styles.sparklineWrap}>
            <Svg width={sparklineW} height={sparklineH}>
              <Defs>
                <SvgLinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.primary.main} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={theme.primary.main} stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              {spark.area && <Path d={spark.area} fill="url(#sparkGrad)" />}
              <Path
                d={spark.line}
                fill="none"
                stroke={theme.primary.main}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx={spark.lastX}
                cy={spark.lastY}
                r={7}
                fill={theme.primary.main}
                opacity={0.25}
              />
              <Circle cx={spark.lastX} cy={spark.lastY} r={3.5} fill={theme.primary.main} />
            </Svg>
          </View>
        </View>

        {/* ── 2×2 Stat Grid ── */}
        <View style={styles.statGrid}>
          <StatCard
            label="Income"
            value={formatAmount(totals.income, baseCurrency, { compact: true })}
            icon="arrow-down-circle-outline"
            iconColor={INCOME_COLOR}
            badge={null}
            theme={theme}
            styles={styles}
          />
          <StatCard
            label="Expenses"
            value={formatAmount(totals.expense, baseCurrency, { compact: true })}
            icon="arrow-up-circle-outline"
            iconColor={EXPENSE_COLOR}
            badge={
              expenseChangePct !== null
                ? { value: expenseChangePct, isPositive: expenseChangePct <= 0 }
                : null
            }
            theme={theme}
            styles={styles}
          />
          <StatCard
            label="Net Balance"
            value={formatAmount(Math.abs(totals.net), baseCurrency, { compact: true })}
            icon="scale-balance"
            iconColor={totals.net >= 0 ? INCOME_COLOR : EXPENSE_COLOR}
            badge={null}
            theme={theme}
            styles={styles}
          />
          <StatCard
            label={savingsRate !== null ? "Savings Rate" : "Daily Avg"}
            value={
              savingsRate !== null
                ? `${savingsRate.toFixed(0)}%`
                : formatAmount(avgDailyExpense, baseCurrency, { compact: true })
            }
            icon={savingsRate !== null ? "piggy-bank-outline" : "calendar-today"}
            iconColor={theme.primary.main}
            badge={null}
            theme={theme}
            styles={styles}
          />
        </View>

        {hasData ? (
          <>
            {/* ── Monthly Trend ── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>Monthly Trend</Text>
                  <Text style={styles.cardSubtitle}>Last 6 months spending</Text>
                </View>
                {trendChangePct !== null && (
                  <View
                    style={[
                      styles.trendBadge,
                      {
                        backgroundColor:
                          trendChangePct <= 0 ? `${INCOME_COLOR}22` : `${EXPENSE_COLOR}22`,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={trendChangePct <= 0 ? "trending-down" : "trending-up"}
                      size={12}
                      color={trendChangePct <= 0 ? INCOME_COLOR : EXPENSE_COLOR}
                    />
                    <Text
                      style={[
                        styles.trendBadgeText,
                        { color: trendChangePct <= 0 ? INCOME_COLOR : EXPENSE_COLOR },
                      ]}
                    >
                      {Math.abs(trendChangePct).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
              <MonthlyBars data={monthlyTrendData} theme={theme} styles={styles} />
            </View>

            {/* ── Donut + Legend ── */}
            {categoryData.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>SPENDING BY CATEGORY</Text>
                <DonutRow
                  data={categoryData}
                  totalExpense={totals.expense}
                  baseCurrency={baseCurrency}
                  theme={theme}
                  styles={styles}
                />
              </View>
            )}

            {/* ── Category Breakdown ── */}
            {categoryData.length > 0 && (
              <View style={styles.card}>
                <Text style={[styles.sectionLabel, { marginBottom: 14 }]}>
                  CATEGORY BREAKDOWN
                </Text>
                {categoryData.map((cat, idx) => {
                  const pct =
                    totals.expense > 0 ? (cat.value / totals.expense) * 100 : 0;
                  const isLast = idx === categoryData.length - 1;
                  return (
                    <View key={cat.name}>
                      <View style={styles.catBreakRow}>
                        <View
                          style={[styles.catBreakDot, { backgroundColor: cat.color }]}
                        />
                        <Text style={styles.catBreakName} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <View style={styles.catBreakBarWrap}>
                          <View
                            style={[
                              styles.catBreakBarFill,
                              {
                                width: `${Math.max(pct, 1)}%` as any,
                                backgroundColor: cat.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.catBreakAmount}>
                          {formatAmount(cat.value, baseCurrency, { compact: true })}
                        </Text>
                        <Text style={styles.catBreakPct}>{pct.toFixed(0)}%</Text>
                      </View>
                      {!isLast && <View style={styles.insetDivider} />}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Top Transactions ── */}
            {topTransactions.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionLabel}>TOP TRANSACTIONS</Text>
                  {typeFilter !== "all" && (
                    <View
                      style={[
                        styles.filterActivePill,
                        { backgroundColor: `${theme.primary.main}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterActivePillText,
                          { color: theme.primary.main },
                        ]}
                      >
                        {typeFilter === "expense" ? "Expenses" : "Income"}
                      </Text>
                    </View>
                  )}
                </View>
                {topTransactions.map((tx, idx) => {
                  const isLast = idx === topTransactions.length - 1;
                  const amtColor = tx.type === "income" ? INCOME_COLOR : EXPENSE_COLOR;
                  const sign = tx.type === "income" ? "+" : "-";
                  const iconColor = tx.categoryColor ?? "#888888";
                  return (
                    <View key={tx.id}>
                      <View style={styles.txRow}>
                        <View
                          style={[
                            styles.txIconWrap,
                            { backgroundColor: `${iconColor}22` },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={(tx.categoryIcon ?? "help-circle-outline") as any}
                            size={18}
                            color={iconColor}
                          />
                        </View>
                        <View style={styles.txBody}>
                          <Text style={styles.txName} numberOfLines={1}>
                            {tx.merchant || tx.note || tx.categoryName || "Transaction"}
                          </Text>
                          <Text style={styles.txMeta}>
                            {tx.date} · {tx.categoryName ?? "Uncategorized"}
                          </Text>
                        </View>
                        <Text style={[styles.txAmount, { color: amtColor }]}>
                          {sign}
                          {formatAmount(tx.amount, tx.currency, { compact: true })}
                        </Text>
                      </View>
                      {!isLast && <View style={styles.insetDivider} />}
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

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: H_PAD,
      paddingTop: 16,
      paddingBottom: 10,
      gap: 12,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 22,
      fontWeight: "bold",
      color: theme.foreground.white,
      letterSpacing: 0.2,
    },
    filterDot: {
      position: "absolute",
      top: 5,
      right: 5,
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: H_PAD,
      paddingTop: 8,
    },

    // Period Selector
    periodSelector: {
      flexDirection: "row",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 4,
      gap: 3,
      marginBottom: 14,
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
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    periodBtnTextActive: {
      color: theme.background.dark,
      fontWeight: "700",
    },

    // Hero Card
    heroCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      marginBottom: 14,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    heroPeriodPill: {
      backgroundColor: theme.background.darker,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    heroPeriodText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    heroBadgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    heroCompare: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 14,
    },
    sparklineWrap: {
      marginTop: 4,
      overflow: "hidden",
    },

    // Stat Grid
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      width: (screenWidth - H_PAD * 2 - 10) / 2,
      borderRadius: 14,
      padding: 14,
      gap: 4,
    },
    statIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    statLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
      fontWeight: "500",
    },
    statBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      alignSelf: "flex-start",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 3,
      marginTop: 4,
    },
    statBadgeText: {
      fontSize: 10,
      fontWeight: "700",
    },

    // Cards
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
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    cardSubtitle: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.1,
      color: theme.foreground.gray,
      marginBottom: 14,
    },
    trendBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    trendBadgeText: {
      fontSize: 12,
      fontWeight: "700",
    },

    // Monthly Bars
    barChartWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 6,
      height: 110,
    },
    barCol: {
      flex: 1,
      alignItems: "center",
      height: 110,
      justifyContent: "flex-end",
    },
    barColInner: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      width: "100%",
    },
    bar: {
      width: "75%",
      minWidth: 16,
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      marginTop: 6,
    },

    // Donut
    donutRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    donutContainer: {
      width: DONUT_SIZE,
      height: DONUT_SIZE,
      position: "relative",
    },
    donutCenterWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    donutCenterValue: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.foreground.white,
      textAlign: "center",
    },
    donutCenterLabel: {
      fontSize: 10,
      color: theme.foreground.gray,
      marginTop: 1,
    },
    donutLegend: {
      flex: 1,
      gap: 8,
    },
    donutLegendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    donutLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    donutLegendName: {
      flex: 1,
      fontSize: 12,
      color: theme.foreground.gray,
    },
    donutLegendPct: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.foreground.white,
    },

    // Category Breakdown
    catBreakRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
    },
    catBreakDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    catBreakName: {
      fontSize: 13,
      color: theme.foreground.white,
      fontWeight: "500",
      width: 80,
    },
    catBreakBarWrap: {
      flex: 1,
      height: 5,
      backgroundColor: theme.background.darker,
      borderRadius: 3,
      overflow: "hidden",
    },
    catBreakBarFill: {
      height: 5,
      borderRadius: 3,
      opacity: 0.8,
    },
    catBreakAmount: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.white,
      width: 48,
      textAlign: "right",
    },
    catBreakPct: {
      fontSize: 11,
      color: theme.foreground.gray,
      width: 30,
      textAlign: "right",
    },
    insetDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.background.darker,
      marginLeft: 17,
    },

    // Top Transactions
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
    },
    txIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    txBody: {
      flex: 1,
      gap: 3,
    },
    txName: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    txMeta: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    txAmount: {
      fontSize: 13,
      fontWeight: "700",
    },
    filterActivePill: {
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    filterActivePillText: {
      fontSize: 11,
      fontWeight: "700",
    },

    // Empty State
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

