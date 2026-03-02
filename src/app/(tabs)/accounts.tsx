import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import {
  convertToBase,
  formatAmount,
  getCurrencySymbol,
} from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Account card
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
  const meta = getAccountTypeMeta(account.type);
  const s = makeStyles(theme);

  return (
    <Pressable
      style={({ pressed }) => [
        s.accountCard,
        { borderLeftColor: account.color },
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => router.navigate(`/account/${account.id}` as any)}
    >
      <View
        style={[s.accountCardIcon, { backgroundColor: `${account.color}22` }]}
      >
        <MaterialCommunityIcons
          name={account.icon as any}
          size={22}
          color={account.color}
        />
      </View>
      <View style={s.accountCardInfo}>
        <View style={s.accountCardNameRow}>
          <Text style={s.accountCardName} numberOfLines={1}>
            {account.name}
          </Text>
          {account.isLiability && (
            <View style={s.liabilityTag}>
              <Text style={s.liabilityTagText}>Liability</Text>
            </View>
          )}
        </View>
        <View style={s.accountCardMeta}>
          <Text style={s.accountTypePill}>{meta.label}</Text>
          {account.accountRef ? (
            <Text style={s.accountRef}> · {account.accountRef}</Text>
          ) : null}
        </View>
      </View>
      <View style={s.accountCardBalance}>
        <Text
          style={[
            s.balanceNative,
            { color: account.balance < 0 ? "#F14A6E" : account.color },
          ]}
        >
          {formatAmount(account.balance, account.currency)}
        </Text>
        {showBase && account.currency !== baseCurrency && (
          <Text style={s.balanceBase}>
            ≈ {formatAmount(balanceInBase, baseCurrency, { compact: true })}
          </Text>
        )}
        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={theme.foreground.gray}
          style={{ marginTop: 2 }}
        />
      </View>
    </Pressable>
  );
}

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
    <View style={s.rateRow}>
      <View style={s.rateSymbols}>
        <Text style={s.rateFrom}>{getCurrencySymbol(rate.from)}</Text>
        <MaterialCommunityIcons
          name="arrow-right"
          size={14}
          color={theme.foreground.gray}
        />
        <Text style={s.rateTo}>{getCurrencySymbol(baseCurrency)}</Text>
      </View>
      <View style={s.rateInfo}>
        <Text style={s.rateLabel}>1 {rate.from} =</Text>
        {editing ? (
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
          />
        ) : (
          <Text style={s.rateValue}>
            {rate.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })}{" "}
            {baseCurrency}
          </Text>
        )}
        {rate.isUserDefined && (
          <Text style={s.rateUserDefined}>manual</Text>
        )}
      </View>
      {editing ? (
        <Pressable style={s.rateSaveBtn} onPress={handleSave}>
          <MaterialCommunityIcons
            name="check"
            size={16}
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
// Section title row
// ─────────────────────────────────────────────────────────────────────────────

function SectionTitle({
  label,
  count,
  action,
  theme,
}: {
  label: string;
  count?: number;
  action?: { label: string; onPress: () => void };
  theme: Theme;
}) {
  const s = makeStyles(theme);
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>
        {label}
        {count !== undefined ? (
          <Text style={s.sectionCount}> ({count})</Text>
        ) : null}
      </Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={s.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ORDER: AccountType[] = [
  "cash", "bank", "savings", "credit", "crypto", "gold", "loan", "charity", "other",
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
  } = useFinance();

  const [showArchived, setShowArchived] = useState(false);

  // Rate map
  const rateMap = useMemo(
    () => Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate])),
    [exchangeRates],
  );

  // Split active / archived
  const activeAccounts = useMemo(
    () => allAccounts.filter((a) => !a.isArchived),
    [allAccounts],
  );
  const archivedAccounts = useMemo(
    () => allAccounts.filter((a) => a.isArchived),
    [allAccounts],
  );

  // Group active by type
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

  // Foreign-currency rates to display
  const foreignRates = useMemo(
    () => exchangeRates.filter((r) => r.from !== baseCurrency),
    [exchangeRates, baseCurrency],
  );

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

  return (
    <View style={s.root}>
      {/* ── Screen header ── */}
      <View style={s.screenHeader}>
        <Text style={s.screenTitle}>Accounts</Text>
        <Pressable
          style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.navigate("/account/add" as any)}
        >
          <MaterialCommunityIcons
            name="plus"
            size={20}
            color={theme.background.dark}
          />
        </Pressable>
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
          <Text style={s.netWorthLabel}>Total Net Worth</Text>
          <Text style={s.netWorthValue}>
            {formatAmount(netWorth, baseCurrency)}
          </Text>
          <Text style={s.netWorthSub}>{baseCurrency} base currency</Text>

          {perCurrencySubtotals.length > 1 && (
            <View style={s.subtotalsRow}>
              {perCurrencySubtotals.map((sub) => (
                <View key={sub.currency} style={s.subtotalItem}>
                  <Text style={s.subtotalCurrency}>{sub.currency}</Text>
                  <Text style={s.subtotalAmount}>
                    {formatAmount(sub.totalNative, sub.currency, { compact: true })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Active accounts ── */}
        {grouped.map(({ type, accounts }) => {
          const meta = getAccountTypeMeta(type);
          return (
            <View key={type} style={s.typeGroup}>
              <SectionTitle
                label={meta.label}
                count={accounts.length}
                theme={theme}
              />
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
                    showBase={perCurrencySubtotals.length > 1}
                    theme={theme}
                  />
                );
              })}
            </View>
          );
        })}

        {activeAccounts.length === 0 && (
          <View style={s.emptyState}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={48}
              color={theme.foreground.gray}
              style={{ opacity: 0.4 }}
            />
            <Text style={s.emptyStateText}>No accounts yet</Text>
            <Pressable
              style={({ pressed }) => [
                s.emptyStateCta,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.navigate("/account/add" as any)}
            >
              <MaterialCommunityIcons
                name="plus"
                size={16}
                color={theme.background.dark}
              />
              <Text style={s.emptyStateCtaText}>Add Account</Text>
            </Pressable>
          </View>
        )}

        {/* ── Exchange rates ── */}
        {foreignRates.length > 0 && (
          <View style={s.ratesSection}>
            <SectionTitle label="Exchange Rates" theme={theme} />
            <View style={s.ratesCard}>
              <Text style={s.ratesHint}>
                Tap the pencil icon to manually update a rate. All balance
                conversions use these rates.
              </Text>
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
            <SectionTitle
              label="Archived"
              count={archivedAccounts.length}
              action={{
                label: showArchived ? "Hide" : "Show",
                onPress: () => setShowArchived((v) => !v),
              }}
              theme={theme}
            />
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        style={({ pressed }) => [s.fab, pressed && { opacity: 0.85 }]}
        onPress={() => router.navigate("/account/add" as any)}
      >
        <MaterialCommunityIcons
          name="plus"
          size={26}
          color={theme.background.dark}
        />
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background.dark },
    screenHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.foreground.white,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16 },
    // Net worth
    netWorthCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: `${theme.primary.main}33`,
    },
    netWorthLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
      marginBottom: 6,
    },
    netWorthValue: {
      fontSize: 34,
      fontWeight: "800",
      color: theme.primary.main,
    },
    netWorthSub: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 4,
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
    // Section header
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
    },
    sectionCount: { fontWeight: "400", opacity: 0.7 },
    sectionAction: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary.main,
    },
    typeGroup: { marginBottom: 16 },
    // Account card
    accountCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      marginBottom: 8,
      borderLeftWidth: 3,
    },
    accountCardIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    accountCardInfo: { flex: 1, gap: 3 },
    accountCardNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    accountCardName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
      flexShrink: 1,
    },
    liabilityTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: "#F14A6E22",
    },
    liabilityTagText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#F14A6E",
      letterSpacing: 0.3,
    },
    accountCardMeta: {
      flexDirection: "row",
      alignItems: "center",
    },
    accountTypePill: { fontSize: 11, color: theme.foreground.gray },
    accountRef: { fontSize: 11, color: theme.foreground.gray },
    accountCardBalance: { alignItems: "flex-end", gap: 2 },
    balanceNative: { fontSize: 15, fontWeight: "700" },
    balanceBase: { fontSize: 11, color: theme.foreground.gray },
    // Empty state
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
      gap: 12,
    },
    emptyStateText: { fontSize: 15, color: theme.foreground.gray },
    emptyStateCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.primary.main,
    },
    emptyStateCtaText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },
    // Exchange rates
    ratesSection: { marginBottom: 8 },
    ratesCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 14,
    },
    ratesHint: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginBottom: 10,
      lineHeight: 16,
    },
    rateRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
      gap: 10,
    },
    rateSymbols: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      width: 64,
    },
    rateFrom: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    rateTo: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.gray,
    },
    rateInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    rateLabel: { fontSize: 12, color: theme.foreground.gray },
    rateValue: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    rateInput: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.primary.main,
      borderBottomWidth: 1,
      borderBottomColor: theme.primary.main,
      paddingHorizontal: 4,
      paddingVertical: 2,
      minWidth: 70,
    },
    rateUserDefined: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      backgroundColor: theme.background.darker,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    rateEditBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    rateSaveBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: `${theme.primary.main}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    // Archived
    archivedSection: { marginTop: 8 },
    archivedCardWrap: { opacity: 0.6 },
    // FAB
    fab: {
      position: "absolute",
      bottom: 90,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });
}
