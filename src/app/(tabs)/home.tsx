import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AccountsList from "../../components/home/AccountsList";
import MonthSummaryRow from "../../components/home/MonthSummaryRow";
import NetWorthCard from "../../components/home/NetWorthCard";
import QuickStatsBar, { Period } from "../../components/home/QuickStatsBar";
import RecentTransactionsList from "../../components/home/RecentTransactionsList";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { convertFromBase, formatMonthYear } from "../../utils/currency";

export default function HomeScreen() {
  const { theme } = useTheme();
  const {
    baseCurrency,
    exchangeRates,
    accounts,
    netWorth,
    quickStats,
    recentTransactions,
    allTransactions,
    isRefreshing,
    refresh,
    displayCurrency,
    setDisplayCurrency,
    availableCurrencies,
  } = useFinance();

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const displayedSummary = quickStats[activePeriod];
  const monthLabel = formatMonthYear(new Date());

  const styles = makeStyles(theme);

  // Build rate map for currency conversion
  const rateMap = useMemo(
    () => Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate])),
    [exchangeRates],
  );

  // Convert net worth figures to the selected display currency
  const displayNetWorth = useMemo(
    () => convertFromBase(netWorth, displayCurrency, baseCurrency, rateMap),
    [netWorth, displayCurrency, baseCurrency, rateMap],
  );
  const displayMonthNet = useMemo(
    () =>
      convertFromBase(
        quickStats.month.net,
        displayCurrency,
        baseCurrency,
        rateMap,
      ),
    [quickStats.month.net, displayCurrency, baseCurrency, rateMap],
  );

  // Get the latest 4 transactions
  const latestTransactions = recentTransactions.slice(0, 4);

  // Get the 4 most used accounts
  const getMostUsedAccounts = () => {
    const accountUsage = new Map<string, number>();

    // Count how many times each account appears in transactions
    allTransactions.forEach((tx) => {
      accountUsage.set(tx.accountId, (accountUsage.get(tx.accountId) ?? 0) + 1);
      if (tx.toAccountId) {
        accountUsage.set(
          tx.toAccountId,
          (accountUsage.get(tx.toAccountId) ?? 0) + 1,
        );
      }
    });

    // Get account IDs sorted by usage (most used first)
    const sortedAccountIds = Array.from(accountUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => id);

    // Return filtered accounts in the sorted order
    return accounts.filter((aw) => sortedAccountIds.includes(aw.account.id));
  };

  const mostUsedAccounts = getMostUsedAccounts();

  return (
    <View style={styles.root}>
      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.primary.main}
            colors={[theme.primary.main]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day 👋</Text>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
          </View>
        </View>

        {/* ── Net Worth hero card ── */}
        <NetWorthCard
          netWorth={displayNetWorth}
          monthNet={displayMonthNet}
          baseCurrency={baseCurrency}
          displayCurrency={displayCurrency}
          availableCurrencies={availableCurrencies}
          onCurrencyChange={setDisplayCurrency}
        />

        {/* ── Period summary: Income / Expenses / Net ── */}
        <MonthSummaryRow
          summary={displayedSummary}
          baseCurrency={baseCurrency}
          displayCurrency={displayCurrency}
          rateMap={rateMap}
          onIncomePress={() =>
            router.navigate("/(tabs)/transactions?filter=income" as any)
          }
          onExpensePress={() =>
            router.navigate("/(tabs)/transactions?filter=expense" as any)
          }
          onNetPress={() =>
            router.navigate("/(tabs)/transactions?filter=all" as any)
          }
        />

        {/* ── Quick stats chips: Today / Week / Month ── */}
        <QuickStatsBar
          stats={quickStats}
          baseCurrency={baseCurrency}
          displayCurrency={displayCurrency}
          rateMap={rateMap}
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />

        {/* ── Account balances ── */}
        <AccountsList
          accounts={mostUsedAccounts}
          netWorth={netWorth}
          baseCurrency={baseCurrency}
          exchangeRates={exchangeRates}
          onAccountPress={(id) => router.navigate(`/account/${id}` as any)}
          onViewAllPress={() => router.navigate("/(tabs)/accounts" as any)}
        />

        {/* ── Recent transactions ── */}
        <RecentTransactionsList
          transactions={latestTransactions}
          onTransactionPress={(id) =>
            router.navigate(`/transaction/${id}` as any)
          }
          onViewAllPress={() => router.navigate("/(tabs)/transactions" as any)}
        />

        {/* Bottom padding so content clears the add button */}
        <View style={styles.bottomPad} />
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    greeting: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 2,
    },
    monthTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    bottomPad: {
      height: 80,
    },
  });
}
