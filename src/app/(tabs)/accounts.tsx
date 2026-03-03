import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getAccountTypeMeta } from "../../data/accounts";
import { Account, AccountType, ExchangeRate } from "../../types/finance";
import { convertToBase, formatAmount } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Account card (redesigned)
// ─────────────────────────────────────────────────────────────────────────────

function AccountCard({
  account,
  balanceInBase,
  baseCurrency,
  showBase,
  theme,
}: {
  account: Account;
  balanceInBase: number;
  baseCurrency: string;
  showBase: boolean;
  theme: Theme;
}) {
  const s = makeStyles(theme);

  return (
    <Pressable
      style={({ pressed }) => [s.accountCard, pressed && { opacity: 0.78 }]}
      onPress={() => router.navigate(`/account/${account.id}` as any)}
    >
      {/* Colored accent strip */}
      <View style={[s.accountAccent, { backgroundColor: account.color }]} />

      {/* Icon */}
      <View style={[s.accountIcon, { backgroundColor: `${account.color}18` }]}>
        <MaterialCommunityIcons
          name={account.icon as any}
          size={20}
          color={account.color}
        />
      </View>

      {/* Info */}
      <View style={s.accountInfo}>
        <View style={s.accountNameRow}>
          <Text style={s.accountName} numberOfLines={1}>
            {account.name}
          </Text>
          {account.isLiability && (
            <View style={s.liabilityBadge}>
              <Text style={s.liabilityBadgeText}>Liability</Text>
            </View>
          )}
        </View>
        {account.accountRef ? (
          <Text style={s.accountRef} numberOfLines={1}>
            {account.accountRef}
          </Text>
        ) : null}
      </View>

      {/* Balance */}
      <View style={s.accountBalanceCol}>
        <Text
          style={[
            s.balanceNative,
            { color: account.balance < 0 ? "#F14A6E" : theme.foreground.white },
          ]}
        >
          {formatAmount(account.balance, account.currency)}
        </Text>
        {showBase && account.currency !== baseCurrency && (
          <Text style={s.balanceBase}>
            ≈ {formatAmount(balanceInBase, baseCurrency, { compact: true })}
          </Text>
        )}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={16}
        color={theme.foreground.gray}
        style={{ opacity: 0.5 }}
      />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible group section per account type
// ─────────────────────────────────────────────────────────────────────────────

function GroupSection({
  type,
  accounts,
  groupTotal,
  baseCurrency,
  rateMap,
  showBase,
  theme,
}: {
  type: AccountType;
  accounts: Account[];
  groupTotal: number;
  baseCurrency: string;
  rateMap: Record<string, number>;
  showBase: boolean;
  theme: Theme;
}) {
  const meta = getAccountTypeMeta(type);
  const [expanded, setExpanded] = useState(true);
  const rotateAnim = useRef(new Animated.Value(1)).current;
  const s = makeStyles(theme);

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
    setExpanded((v) => !v);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View style={s.groupSection}>
      {/* Group header */}
      <Pressable
        style={({ pressed }) => [s.groupHeader, pressed && { opacity: 0.8 }]}
        onPress={toggle}
      >
        <View
          style={[
            s.groupIconWrap,
            { backgroundColor: `${meta.defaultColor}22` },
          ]}
        >
          <MaterialCommunityIcons
            name={meta.icon as any}
            size={16}
            color={meta.defaultColor}
          />
        </View>
        <Text style={s.groupLabel}>{meta.label}</Text>
        <View style={s.groupCountBadge}>
          <Text style={s.groupCountText}>{accounts.length}</Text>
        </View>

        <View style={s.groupHeaderSpacer} />

        <Text
          style={[
            s.groupTotal,
            { color: groupTotal < 0 ? "#F14A6E" : theme.primary.main },
          ]}
        >
          {formatAmount(groupTotal, baseCurrency, { compact: true })}
        </Text>

        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={theme.foreground.gray}
          />
        </Animated.View>
      </Pressable>

      {/* Account cards */}
      {expanded && (
        <View style={s.groupCards}>
          {accounts.map((acc) => {
            const inBase = convertToBase(
              acc.balance,
              acc.currency,
              baseCurrency,
              rateMap,
            );
            return (
              <AccountCard
                key={acc.id}
                account={acc}
                balanceInBase={inBase}
                baseCurrency={baseCurrency}
                showBase={showBase}
                theme={theme}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Net worth hero card with distribution bar
// ─────────────────────────────────────────────────────────────────────────────
// Exchange rate row (inline edit)
// ─────────────────────────────────────────────────────────────────────────────

function ExchangeRateRow({
  rate,
  baseCurrency,
  onSave,
  theme,
}: {
  rate: ExchangeRate;
  baseCurrency: string;
  onSave: (from: string, newRate: number) => void;
  theme: Theme;
}) {
  const [editing, setEditing] = useState(false);
  const [rateStr, setRateStr] = useState(String(rate.rate));
  const inputRef = useRef<TextInput>(null);
  const s = makeStyles(theme);

  const handleEdit = () => {
    setRateStr(String(rate.rate));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleSave = () => {
    const n = parseFloat(rateStr);
    if (!isNaN(n) && n > 0) onSave(rate.from, n);
    else setRateStr(String(rate.rate));
    setEditing(false);
  };

  return (
    <View style={s.rateCard}>
      {/* Currency pair badges */}
      <View style={s.ratePairCol}>
        <View style={s.rateCurrencyBadge}>
          <Text style={s.rateCurrencyCode}>{rate.from}</Text>
        </View>
        <MaterialCommunityIcons
          name="arrow-down"
          size={12}
          color={theme.foreground.gray}
          style={{ opacity: 0.5 }}
        />
        <View style={[s.rateCurrencyBadge, s.rateCurrencyBadgeBase]}>
          <Text style={[s.rateCurrencyCode, { color: theme.primary.main }]}>
            {baseCurrency}
          </Text>
        </View>
      </View>

      {/* Rate value */}
      <View style={s.rateValueCol}>
        <Text style={s.rateEquation}>1 {rate.from} =</Text>
        {editing ? (
          <View style={s.rateInputRow}>
            <TextInput
              ref={inputRef}
              style={s.rateInput}
              value={rateStr}
              onChangeText={setRateStr}
              onBlur={handleSave}
              onSubmitEditing={handleSave}
              keyboardType="decimal-pad"
              returnKeyType="done"
              selectTextOnFocus
              placeholderTextColor={theme.foreground.gray}
            />
            <Text style={s.rateBaseSuffix}>{baseCurrency}</Text>
          </View>
        ) : (
          <Text style={s.rateValueLarge}>
            {rate.rate.toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
            <Text style={s.rateBaseSuffix}>{baseCurrency}</Text>
          </Text>
        )}
        {rate.isUserDefined && (
          <View style={s.rateManualBadge}>
            <MaterialCommunityIcons
              name="pencil"
              size={9}
              color={theme.foreground.gray}
            />
            <Text style={s.rateManualText}>Manual</Text>
          </View>
        )}
      </View>

      {/* Action button */}
      {editing ? (
        <Pressable style={s.rateSaveBtn} onPress={handleSave}>
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={theme.primary.main}
          />
        </Pressable>
      ) : (
        <Pressable style={s.rateEditBtn} onPress={handleEdit}>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={16}
            color={theme.foreground.gray}
          />
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ORDER: AccountType[] = [
  "cash",
  "bank",
  "savings",
  "credit",
  "crypto",
  "gold",
  "loan",
  "charity",
  "other",
];

export default function AccountsTabScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const {
    allAccounts,
    netWorth,
    perCurrencySubtotals,
    exchangeRates,
    baseCurrency,
    isRefreshing,
    refresh,
    updateExchangeRate,
    updateBaseCurrency,
  } = useFinance();

  const [showArchived, setShowArchived] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency);

  // Keep displayCurrency in sync when baseCurrency changes externally
  useEffect(() => {
    setDisplayCurrency(baseCurrency);
  }, [baseCurrency]);

  const rateMap = useMemo(
    () => Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate])),
    [exchangeRates],
  );

  const activeAccounts = useMemo(
    () => allAccounts.filter((a) => !a.isArchived),
    [allAccounts],
  );
  const archivedAccounts = useMemo(
    () => allAccounts.filter((a) => a.isArchived),
    [allAccounts],
  );

  const grouped = useMemo(() => {
    const map = new Map<AccountType, Account[]>();
    for (const acc of activeAccounts) {
      const existing = map.get(acc.type) ?? [];
      existing.push(acc);
      map.set(acc.type, existing);
    }
    return TYPE_ORDER.filter((t) => map.has(t)).map((t) => ({
      type: t,
      accounts: map.get(t)!,
    }));
  }, [activeAccounts]);

  const foreignRates = useMemo(
    () => exchangeRates.filter((r) => r.from !== baseCurrency),
    [exchangeRates, baseCurrency],
  );

  // All currencies available in the wallet (base + exchange rate froms)
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>([baseCurrency]);
    exchangeRates.forEach((r) => set.add(r.from));
    return Array.from(set);
  }, [baseCurrency, exchangeRates]);

  // Net worth converted to the selected display currency
  const displayNetWorth = useMemo(() => {
    if (displayCurrency === baseCurrency) return netWorth;
    const rate = rateMap[displayCurrency];
    if (!rate || rate === 0) return null;
    return netWorth / rate;
  }, [netWorth, displayCurrency, baseCurrency, rateMap]);

  const handleChangeBaseCurrency = useCallback(() => {
    const others = availableCurrencies.filter((c) => c !== baseCurrency);
    if (others.length === 0) {
      Alert.alert(
        "No other currencies",
        "Add exchange rates to enable switching the base currency.",
      );
      return;
    }
    Alert.alert(
      "Change Base Currency",
      `Current base: ${baseCurrency}\n\nAll exchange rates will be recalculated.`,
      [
        ...others.map((c) => ({
          text: c,
          onPress: async () => {
            try {
              await updateBaseCurrency(c);
            } catch {
              Alert.alert("Error", "Failed to change base currency.");
            }
          },
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  }, [availableCurrencies, baseCurrency, updateBaseCurrency]);

  const handleSaveRate = useCallback(
    async (from: string, newRate: number) => {
      const updated: ExchangeRate = {
        from,
        to: baseCurrency,
        rate: newRate,
        lastUpdated: new Date().toISOString().slice(0, 10),
        isUserDefined: true,
      };
      try {
        await updateExchangeRate(updated);
      } catch {
        Alert.alert("Error", "Failed to update exchange rate");
      }
    },
    [baseCurrency, updateExchangeRate],
  );

  const getGroupTotal = useCallback(
    (accounts: Account[]) =>
      accounts.reduce((sum, a) => {
        const inBase = convertToBase(
          a.balance,
          a.currency,
          baseCurrency,
          rateMap,
        );
        return sum + inBase;
      }, 0),
    [baseCurrency, rateMap],
  );

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.screenHeader}>
        <Text style={s.screenTitle}>Accounts</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.primary.main}
          />
        }
      >
        {/* ── Net worth card ── */}
        <View style={s.netWorthCard}>
          {/* Header row */}
          <View style={s.netWorthHeaderRow}>
            <Text style={s.netWorthLabel}>Total Net Worth</Text>
            <Pressable
              style={({ pressed }) => [
                s.baseCurrencyChip,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleChangeBaseCurrency}
            >
              <MaterialCommunityIcons
                name="database-outline"
                size={11}
                color={theme.foreground.gray}
              />
              <Text style={s.baseCurrencyChipText}>Base: {baseCurrency}</Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={12}
                color={theme.foreground.gray}
              />
            </Pressable>
          </View>

          {/* Display value */}
          <Text style={s.netWorthValue}>
            {displayNetWorth !== null
              ? formatAmount(displayNetWorth, displayCurrency)
              : "—"}
          </Text>

          {/* Currency selector pills */}
          {availableCurrencies.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.currencyPillsRow}
            >
              {availableCurrencies.map((cur) => {
                const isSelected = cur === displayCurrency;
                return (
                  <Pressable
                    key={cur}
                    style={({ pressed }) => [
                      s.currencyPill,
                      isSelected && s.currencyPillActive,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setDisplayCurrency(cur)}
                  >
                    <Text
                      style={[
                        s.currencyPillText,
                        isSelected && s.currencyPillTextActive,
                      ]}
                    >
                      {cur}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Per-currency subtotals */}
          {perCurrencySubtotals.length > 1 && (
            <View style={s.subtotalsRow}>
              {perCurrencySubtotals.map((sub) => (
                <View key={sub.currency} style={s.subtotalItem}>
                  <Text style={s.subtotalCurrency}>{sub.currency}</Text>
                  <Text style={s.subtotalAmount}>
                    {formatAmount(sub.totalNative, sub.currency, {
                      compact: true,
                    })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Grouped account sections ── */}
        {grouped.length > 0 ? (
          <View style={s.groupList}>
            <View style={s.sectionLabelRow}>
              <Text style={s.sectionLabel}>MY ACCOUNTS</Text>
            </View>
            {grouped.map(({ type, accounts }) => (
              <GroupSection
                key={type}
                type={type}
                accounts={accounts}
                groupTotal={getGroupTotal(accounts)}
                baseCurrency={baseCurrency}
                rateMap={rateMap}
                showBase={perCurrencySubtotals.length > 1}
                theme={theme}
              />
            ))}
          </View>
        ) : (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={40}
                color={theme.foreground.gray}
                style={{ opacity: 0.4 }}
              />
            </View>
            <Text style={s.emptyTitle}>No accounts yet</Text>
            <Text style={s.emptySubtitle}>
              Add your first account to start tracking
            </Text>
            <Pressable
              style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.8 }]}
              onPress={() => router.navigate("/account/add" as any)}
            >
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={theme.background.dark}
              />
              <Text style={s.emptyBtnText}>Add Account</Text>
            </Pressable>
          </View>
        )}

        {/* ── Exchange rates ── */}
        {foreignRates.length > 0 && (
          <View style={s.ratesSection}>
            <View style={s.sectionLabelRow}>
              <Text style={s.sectionLabel}>EXCHANGE RATES</Text>
              <Pressable
                style={({ pressed }) => [
                  s.changeBaseBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleChangeBaseCurrency}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={12}
                  color={theme.primary.main}
                />
                <Text style={s.changeBaseBtnText}>Change base</Text>
              </Pressable>
            </View>
            <View style={s.ratesGrid}>
              {foreignRates.map((rate) => (
                <ExchangeRateRow
                  key={rate.from}
                  rate={rate}
                  baseCurrency={baseCurrency}
                  onSave={handleSaveRate}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Archived accounts ── */}
        {archivedAccounts.length > 0 && (
          <View style={s.archivedSection}>
            <Pressable
              style={({ pressed }) => [
                s.archivedHeader,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setShowArchived((v) => !v)}
            >
              <MaterialCommunityIcons
                name="archive-outline"
                size={16}
                color={theme.foreground.gray}
              />
              <Text style={s.archivedTitle}>
                Archived ({archivedAccounts.length})
              </Text>
              <View style={{ flex: 1 }} />
              <MaterialCommunityIcons
                name={showArchived ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.foreground.gray}
              />
            </Pressable>
            {showArchived &&
              archivedAccounts.map((acc) => {
                const inBase = convertToBase(
                  acc.balance,
                  acc.currency,
                  baseCurrency,
                  rateMap,
                );
                return (
                  <View key={acc.id} style={s.archivedCardWrap}>
                    <AccountCard
                      account={acc}
                      balanceInBase={inBase}
                      baseCurrency={baseCurrency}
                      showBase={false}
                      theme={theme}
                    />
                  </View>
                );
              })}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background.dark },

    // Header
    screenHeader: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 16,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: theme.foreground.white,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16 },

    // Section label
    sectionLabelRow: {
      marginBottom: 10,
      marginTop: 4,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
      color: theme.foreground.gray,
      opacity: 0.7,
    },

    // ── Net worth card ──
    netWorthCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: `${theme.primary.main}33`,
    },
    netWorthHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    netWorthLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
    },
    baseCurrencyChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.background.darker,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}20`,
    },
    baseCurrencyChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    netWorthValue: {
      fontSize: 34,
      fontWeight: "800",
      color: theme.primary.main,
      marginBottom: 10,
    },
    currencyPillsRow: {
      flexDirection: "row",
      gap: 6,
      paddingBottom: 2,
      marginBottom: 4,
    },
    currencyPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}20`,
    },
    currencyPillActive: {
      backgroundColor: `${theme.primary.main}22`,
      borderColor: theme.primary.main,
    },
    currencyPillText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 0.3,
    },
    currencyPillTextActive: {
      color: theme.primary.main,
    },
    subtotalsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
    },
    subtotalItem: {
      alignItems: "center",
      backgroundColor: theme.background.darker,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 70,
    },
    subtotalCurrency: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    subtotalAmount: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.foreground.white,
    },

    // ── Group section ──
    groupList: { marginBottom: 8 },
    groupSection: {
      marginBottom: 10,
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}14`,
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 10,
    },
    groupIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    groupLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    groupCountBadge: {
      backgroundColor: theme.background.darker,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 20,
    },
    groupCountText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    groupHeaderSpacer: { flex: 1 },
    groupTotal: {
      fontSize: 14,
      fontWeight: "700",
    },
    groupCards: {
      paddingHorizontal: 10,
      paddingBottom: 10,
      gap: 6,
    },

    // ── Account card ──
    accountCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingRight: 12,
      paddingLeft: 10,
      backgroundColor: theme.background.darker,
      borderRadius: 13,
      overflow: "hidden",
    },
    accountAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: 2,
    },
    accountIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 6,
    },
    accountInfo: { flex: 1, gap: 2 },
    accountNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    accountName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
      flexShrink: 1,
    },
    liabilityBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: "#F14A6E1A",
      borderWidth: 1,
      borderColor: "#F14A6E44",
    },
    liabilityBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#F14A6E",
      letterSpacing: 0.2,
    },
    accountRef: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    accountBalanceCol: { alignItems: "flex-end", gap: 2 },
    balanceNative: {
      fontSize: 14,
      fontWeight: "700",
    },
    balanceBase: {
      fontSize: 11,
      color: theme.foreground.gray,
    },

    // ── Empty state ──
    emptyState: {
      alignItems: "center",
      paddingVertical: 56,
      gap: 10,
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
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingHorizontal: 32,
    },
    emptyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
      marginTop: 6,
    },
    emptyBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },

    // ── Exchange rates ──
    ratesSection: { marginBottom: 8 },
    changeBaseBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    changeBaseBtnText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.primary.main,
    },
    ratesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    rateCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}14`,
      flexBasis: "47%",
      flexGrow: 1,
    },
    ratePairCol: {
      alignItems: "center",
      gap: 3,
    },
    rateCurrencyBadge: {
      backgroundColor: theme.background.darker,
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 46,
      alignItems: "center",
    },
    rateCurrencyBadgeBase: {
      backgroundColor: `${theme.primary.main}18`,
      borderWidth: 1,
      borderColor: `${theme.primary.main}30`,
    },
    rateCurrencyCode: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.foreground.white,
      letterSpacing: 0.5,
    },
    rateValueCol: {
      flex: 1,
      gap: 3,
    },
    rateEquation: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    rateValueLarge: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    rateBaseSuffix: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    rateInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rateInput: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.primary.main,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.primary.main,
      paddingHorizontal: 2,
      paddingVertical: 1,
      minWidth: 60,
    },
    rateManualBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      alignSelf: "flex-start",
      backgroundColor: theme.background.darker,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      marginTop: 2,
    },
    rateManualText: {
      fontSize: 9,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.2,
    },
    rateEditBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    rateSaveBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: `${theme.primary.main}20`,
      borderWidth: 1,
      borderColor: `${theme.primary.main}40`,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Archived ──
    archivedSection: { marginBottom: 8 },
    archivedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}14`,
    },
    archivedTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    archivedCardWrap: { opacity: 0.55, marginTop: 6 },
  });
}
