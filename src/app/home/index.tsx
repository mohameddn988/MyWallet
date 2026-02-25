import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AccountsList from "../../components/home/AccountsList";
import MonthSummaryRow from "../../components/home/MonthSummaryRow";
import NetWorthCard from "../../components/home/NetWorthCard";
import QuickAddBar from "../../components/home/QuickAddBar";
import QuickStatsBar from "../../components/home/QuickStatsBar";
import RecentTransactionsList from "../../components/home/RecentTransactionsList";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { formatMonthYear } from "../../utils/currency";

export default function HomeScreen() {
  const { theme } = useTheme();
  const {
    baseCurrency,
    exchangeRates,
    accounts,
    netWorth,
    monthSummary,
    quickStats,
    recentTransactions,
    isRefreshing,
    refresh,
  } = useFinance();

  const styles = makeStyles(theme);
  const now = new Date();
  const monthLabel = formatMonthYear(now);

  const comingSoon = (label: string) =>
    Alert.alert("Coming Soon", `${label} is not yet implemented.`);

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
          netWorth={netWorth}
          monthNet={monthSummary.net}
          baseCurrency={baseCurrency}
          onPress={() => comingSoon("Net Worth detail")}
        />

        {/* ── Month summary: Income / Expenses / Net ── */}
        <MonthSummaryRow
          summary={monthSummary}
          baseCurrency={baseCurrency}
          onIncomePress={() => comingSoon("Filtered income transactions")}
          onExpensePress={() => comingSoon("Filtered expense transactions")}
          onNetPress={() => comingSoon("Net detail")}
        />

        {/* ── Quick stats: Today / Week / Month ── */}
        <QuickStatsBar
          stats={quickStats}
          baseCurrency={baseCurrency}
          onPress={(period) => comingSoon(`${period} transactions`)}
        />

        {/* ── Account balances ── */}
        <AccountsList
          accounts={accounts}
          netWorth={netWorth}
          baseCurrency={baseCurrency}
          exchangeRates={exchangeRates}
          onAccountPress={(id) => comingSoon(`Account detail`)}
        />

        {/* ── Recent transactions ── */}
        <RecentTransactionsList
          transactions={recentTransactions}
          onTransactionPress={(_id) => comingSoon("Transaction detail")}
          onViewAllPress={() => comingSoon("All transactions")}
        />

        {/* Bottom padding so content clears the QuickAddBar */}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── Quick add bar (fixed bottom) ── */}
      <QuickAddBar
        onAddExpense={() => comingSoon("Add Expense")}
        onAddIncome={() => comingSoon("Add Income")}
        onAddTransfer={() => comingSoon("Add Transfer")}
      />
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
      height: 32,
    },
  });
}
