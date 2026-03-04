import { router, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
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

const EASTER_EGGS = [
  {
    emoji: "😂💀😂",
    title: "OH WOW.",
    body: "You really thought something would happen here, didn't you?\nYou poor FUCK. 🤡",
    btn: "yeah yeah... 🙄",
  },
  {
    emoji: "😐😐😐",
    title: "Really??",
    body: "Shouldn't you be making money or something? Like... literally anything else. 🧱",
    sub: "Your bank account is judging you.\nJust saying. 📉",
    btn: "ok fine 😑",
  },
  {
    emoji: "😤🤬😤",
    title: "ARE YOU SERIOUS.",
    body: '"Do they pay you to be stupid on purpose or something?"',
    btn: "...sorry 😬",
  },
  {
    emoji: "🍳👀🍳",
    title: "You want an easter egg?",
    body: "Fine. HERE YOU GO. 🥚\nEnjoy your brand new $0.00 net worth. 😊",
    sub: "Reload the app to get your\nmoney back. Maybe. 🪴",
    btn: "WHAT DID YOU DO 😱",
  },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
    triggerEggZero,
  } = useFinance();

  const [activePeriod, setActivePeriod] = useState<Period>("month");
  const [easterEggVisible, setEasterEggVisible] = useState(false);
  const easterEggIndexRef = useRef(0);
  const [easterEggIndex, setEasterEggIndex] = useState(0);
  const eggScale = useRef(new Animated.Value(0.3)).current;
  const eggRotate = useRef(new Animated.Value(0)).current;
  const lastTabPressRef = useRef<number>(0);
  const navigation = useNavigation();
  const displayedSummary = quickStats[activePeriod];
  const monthLabel = formatMonthYear(new Date());

  // All currencies available in the wallet (base + exchange rate froms)
  const homeAvailableCurrencies = useMemo(() => {
    const set = new Set<string>([baseCurrency]);
    exchangeRates.forEach((r) => set.add(r.from));
    return Array.from(set);
  }, [baseCurrency, exchangeRates]);

  const showEasterEgg = useCallback(() => {
    const idx = easterEggIndexRef.current % EASTER_EGGS.length;
    easterEggIndexRef.current += 1;
    setEasterEggIndex(idx);
    if (idx === 3) triggerEggZero();
    setEasterEggVisible(true);
    eggScale.setValue(0.3);
    eggRotate.setValue(0);
    Animated.parallel([
      Animated.spring(eggScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 6,
      }),
      Animated.sequence([
        Animated.timing(eggRotate, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(eggRotate, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(eggRotate, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(eggRotate, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(eggRotate, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [eggScale, eggRotate, triggerEggZero]);

  const rotateInterp = eggRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-8deg", "0deg", "8deg"],
  });

  // Double-tap detection on home tab
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("tabPress", () => {
      const now = Date.now();
      const timeSinceLastPress = now - lastTabPressRef.current;
      if (timeSinceLastPress < 300) {
        showEasterEgg();
        lastTabPressRef.current = 0;
      } else {
        lastTabPressRef.current = now;
      }
    });
    return unsubscribe;
  }, [navigation, showEasterEgg]);

  const currentEgg = EASTER_EGGS[easterEggIndex];

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
  const mostUsedAccounts = useMemo(() => {
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
  }, [allTransactions, accounts]);

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
          availableCurrencies={homeAvailableCurrencies}
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

      {/* ── Easter egg modal ── */}
      <Modal
        visible={easterEggVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEasterEggVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.eggOverlay}
          onPress={() => setEasterEggVisible(false)}
        >
          <Animated.View
            style={[
              styles.eggSheet,
              { transform: [{ scale: eggScale }, { rotate: rotateInterp }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Text style={styles.eggEmoji}>{currentEgg.emoji}</Text>
              <Text style={styles.eggTitle}>{currentEgg.title}</Text>
              <Text style={styles.eggBody}>{currentEgg.body}</Text>
              <Text style={styles.eggSub}>{currentEgg.sub}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.eggBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setEasterEggVisible(false)}
              >
                <Text style={styles.eggBtnText}>{currentEgg.btn}</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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

    // ── Easter egg modal ──
    eggOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.75)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    eggSheet: {
      width: "100%",
      backgroundColor: theme.background.accent,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}20`,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: 24,
      alignItems: "center",
    },
    eggEmoji: {
      fontSize: 52,
      textAlign: "center",
      marginBottom: 16,
    },
    eggTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.foreground.white,
      textAlign: "center",
      letterSpacing: 2,
      marginBottom: 16,
    },
    eggBody: {
      fontSize: 16,
      fontWeight: "500",
      color: theme.foreground.white,
      textAlign: "center",
      lineHeight: 26,
      marginBottom: 12,
    },
    eggSub: {
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 28,
    },
    eggBtn: {
      backgroundColor: theme.primary.main,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 50,
      alignItems: "center",
    },
    eggBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.background.dark,
    },
  });
}
