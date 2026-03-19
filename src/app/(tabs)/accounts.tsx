import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useNavigation } from "expo-router";
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
  Modal,
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
  convertFromBase,
  convertToBase,
  formatAmount,
} from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Account card (redesigned)
// ─────────────────────────────────────────────────────────────────────────────

function AccountCard({
  account,
  balanceInBase,
  baseCurrency,
  showBase,
  theme,
  onLongPress,
}: {
  account: Account;
  balanceInBase: number;
  baseCurrency: string;
  showBase: boolean;
  theme: Theme;
  onLongPress?: () => void;
}) {
  const s = makeStyles(theme);

  return (
    <Pressable
      style={({ pressed }) => [
        s.accountCard,
        {
          borderWidth: 1,
          borderColor: account.isPinned ? theme.primary.main : "transparent",
        },
        pressed && { opacity: 0.78 },
      ]}
      onPress={() => router.navigate(`/account/${account.id}` as any)}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
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
        <Text style={s.accountName} numberOfLines={1}>
          {account.name}
        </Text>
        {(account.type === "loan" || account.type === "charity") && (
          <View style={s.accountBadgesRow}>
            {account.type === "loan" && account.subAccounts && (
              <View style={s.loanCountBadge}>
                <Text style={s.loanCountBadgeText}>
                  {account.subAccounts.length}{" "}
                  {account.subAccounts.length === 1 ? "person" : "people"}
                </Text>
              </View>
            )}
            {account.type === "charity" && (
              <View style={s.charityBadge}>
                <Text style={s.charityBadgeText}>Neutral</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Balance */}
      <View style={s.accountBalanceCol}>
        <Text
          style={[
            s.balanceNative,
            { color: account.balance < 0 && account.type !== "loan" ? "#F14A6E" : theme.foreground.white },
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
  expanded,
  onToggle,
  onTogglePin,
}: {
  type: AccountType;
  accounts: Account[];
  groupTotal: number;
  baseCurrency: string;
  rateMap: Record<string, number>;
  showBase: boolean;
  theme: Theme;
  expanded: boolean;
  onToggle: () => void;
  onTogglePin: (account: Account) => void;
}) {
  const meta = getAccountTypeMeta(type);
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const s = makeStyles(theme);

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
    onToggle();
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
                onLongPress={() => onTogglePin(acc)}
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
    updateAccount,
  } = useFinance();

  const [showArchived, setShowArchived] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState(baseCurrency);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [rateEditorVisible, setRateEditorVisible] = useState(false);
  const [basePickerVisible, setBasePickerVisible] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
  const [editingRateStr, setEditingRateStr] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<AccountType>>(
    new Set(),
  );
  const rateInputRef = useRef<TextInput>(null);
  const lastTabPressRef = useRef<number>(0);
  const navigation = useNavigation();

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

  const openRateEditor = useCallback(
    (currency: string) => {
      const existing = exchangeRates.find((r) => r.from === currency);
      setEditingCurrency(currency);
      setEditingRateStr(existing ? String(existing.rate) : "");
      setRateEditorVisible(true);
    },
    [exchangeRates],
  );

  const handleSaveRateFromEditor = useCallback(async () => {
    if (!editingCurrency) return;
    const n = parseFloat(editingRateStr);
    if (!isNaN(n) && n > 0) {
      await handleSaveRate(editingCurrency, n);
    }
    setRateEditorVisible(false);
    setEditingCurrency(null);
  }, [editingCurrency, editingRateStr, handleSaveRate]);

  const togglePin = useCallback(
    async (account: Account) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateAccount({ ...account, isPinned: !account.isPinned });
    },
    [updateAccount],
  );

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

  // Expand all groups on initial load
  useEffect(() => {
    setExpandedTypes(new Set(grouped.map((g) => g.type)));
  }, [grouped]);

  // Double-tap detection: collapse all if any expanded, else expand all
  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("tabPress", () => {
      const now = Date.now();
      const timeSinceLastPress = now - lastTabPressRef.current;

      // Double-tap window: 300ms
      if (timeSinceLastPress < 300) {
        // Double-tap detected
        setExpandedTypes((prev) =>
          prev.size > 0
            ? new Set<AccountType>()
            : new Set(grouped.map((g) => g.type)),
        );
        lastTabPressRef.current = 0; // Reset
      } else {
        // Single tap or start of new double-tap sequence
        lastTabPressRef.current = now;
      }
    });
    return unsubscribe;
  }, [navigation, grouped]);

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
  const displayNetWorth = useMemo(
    () => convertFromBase(netWorth, displayCurrency, baseCurrency, rateMap),
    [netWorth, displayCurrency, baseCurrency, rateMap],
  );

  const handleChangeBaseCurrency = useCallback(() => {
    if (availableCurrencies.length <= 1) {
      Alert.alert(
        "No other currencies",
        "Add exchange rates to enable switching the base currency.",
      );
      return;
    }
    setBasePickerVisible(true);
  }, [availableCurrencies, setBasePickerVisible]);

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

          {/* Display value - clickable to open modal */}
          <Pressable
            onPress={() => setPickerVisible(true)}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={s.netWorthValue}>
              {formatAmount(displayNetWorth, displayCurrency)}
            </Text>
          </Pressable>

          {/* Tappable currency pills - only non-base currencies, tap to edit rate */}
          {foreignRates.length > 0 && (
            <View style={s.currencyPillsRow}>
              {availableCurrencies
                .filter((c) => c !== baseCurrency)
                .map((cur) => {
                  const isDisplay = cur === displayCurrency;
                  return (
                    <Pressable
                      key={cur}
                      style={({ pressed }) => [
                        s.currencyPill,
                        isDisplay && s.currencyPillActive,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        openRateEditor(cur);
                      }}
                    >
                      <Text
                        style={[
                          s.currencyPillText,
                          isDisplay && s.currencyPillTextActive,
                        ]}
                      >
                        {cur}
                      </Text>
                    </Pressable>
                  );
                })}
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
                expanded={expandedTypes.has(type)}
                onToggle={() => {
                  const newExpanded = new Set(expandedTypes);
                  if (newExpanded.has(type)) {
                    newExpanded.delete(type);
                  } else {
                    newExpanded.add(type);
                  }
                  setExpandedTypes(newExpanded);
                }}
                onTogglePin={togglePin}
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

      {/* Rate editor modal */}
      <Modal
        visible={rateEditorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRateEditorVisible(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setRateEditorVisible(false)}
        >
          <Pressable
            style={[
              s.modalSheet,
              {
                backgroundColor: theme.background.accent,
                borderColor: theme.background.darker,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[s.modalTitle, { color: theme.foreground.white }]}>
              Exchange Rate
            </Text>
            <Text style={[s.rateEditorDesc, { color: theme.foreground.gray }]}>
              1 {editingCurrency} =
            </Text>
            <View style={s.rateEditorInputRow}>
              <TextInput
                ref={rateInputRef}
                style={[
                  s.rateEditorInput,
                  {
                    color: theme.foreground.white,
                    backgroundColor: theme.background.darker,
                    borderColor: `${theme.foreground.gray}25`,
                  },
                ]}
                value={editingRateStr}
                onChangeText={setEditingRateStr}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleSaveRateFromEditor}
                placeholderTextColor={theme.foreground.gray}
                placeholder="0.00"
              />
              <Text
                style={[s.rateEditorSuffix, { color: theme.foreground.gray }]}
              >
                {baseCurrency}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                s.rateEditorSaveBtn,
                { backgroundColor: theme.primary.main },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleSaveRateFromEditor}
            >
              <Text
                style={[
                  s.rateEditorSaveBtnText,
                  { color: theme.background.dark },
                ]}
              >
                Save Rate
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Currency picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setPickerVisible(false)}
        >
          <Pressable
            style={[
              s.modalSheet,
              {
                backgroundColor: theme.background.accent,
                borderColor: theme.background.darker,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[s.modalTitle, { color: theme.foreground.white }]}>
              Display Currency
            </Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {availableCurrencies.map((c) => {
                const isSelected = c === displayCurrency;
                return (
                  <Pressable
                    key={c}
                    style={({ pressed }) => [
                      s.currencyRow,
                      {
                        borderBottomColor: theme.background.darker,
                        backgroundColor: pressed
                          ? theme.background.darker
                          : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setDisplayCurrency(c);
                      setPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        s.currencyRowText,
                        {
                          color: isSelected
                            ? theme.primary.main
                            : theme.foreground.white,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {c}
                    </Text>
                    {c === baseCurrency && (
                      <Text
                        style={[
                          s.baseBadgeText,
                          { color: theme.foreground.gray },
                        ]}
                      >
                        base
                      </Text>
                    )}
                    {isSelected && (
                      <Text
                        style={[s.checkmark, { color: theme.primary.main }]}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Base currency picker modal */}
      <Modal
        visible={basePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBasePickerVisible(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setBasePickerVisible(false)}
        >
          <Pressable
            style={[
              s.baseCurrencySheet,
              {
                backgroundColor: theme.background.accent,
                borderColor: `${theme.foreground.gray}20`,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={s.baseCurrencyHeader}>
              <View
                style={[
                  s.baseCurrencyIconWrap,
                  { backgroundColor: `${theme.primary.main}18` },
                ]}
              >
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={20}
                  color={theme.primary.main}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[s.baseCurrencyTitle, { color: theme.foreground.white }]}
                >
                  Change Base Currency
                </Text>
                <Text
                  style={[
                    s.baseCurrencySubtitle,
                    { color: theme.foreground.gray },
                  ]}
                >
                  All rates will be recalculated
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View
              style={[
                s.baseCurrencyDivider,
                { backgroundColor: `${theme.foreground.gray}18` },
              ]}
            />

            {/* Currency list */}
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {availableCurrencies.map((c) => {
                const isBase = c === baseCurrency;
                return (
                  <Pressable
                    key={c}
                    style={({ pressed }) => [
                      s.baseCurrencyRow,
                      {
                        borderBottomColor: `${theme.foreground.gray}12`,
                        backgroundColor: pressed
                          ? theme.background.darker
                          : isBase
                            ? `${theme.primary.main}0C`
                            : "transparent",
                      },
                    ]}
                    onPress={async () => {
                      if (!isBase) {
                        setBasePickerVisible(false);
                        try {
                          await updateBaseCurrency(c);
                        } catch {
                          Alert.alert("Error", "Failed to change base currency.");
                        }
                      }
                    }}
                  >
                    <View
                      style={[
                        s.baseCurrencyBadge,
                        {
                          backgroundColor: isBase
                            ? `${theme.primary.main}20`
                            : theme.background.darker,
                          borderColor: isBase
                            ? `${theme.primary.main}40`
                            : "transparent",
                          borderWidth: isBase ? 1 : 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.baseCurrencyCode,
                          {
                            color: isBase
                              ? theme.primary.main
                              : theme.foreground.white,
                          },
                        ]}
                      >
                        {c}
                      </Text>
                    </View>

                    <Text
                      style={[
                        s.baseCurrencyRowLabel,
                        {
                          color: isBase
                            ? theme.primary.main
                            : theme.foreground.white,
                          fontWeight: isBase ? "700" : "500",
                        },
                      ]}
                    >
                      {isBase ? "Current base" : "Set as base"}
                    </Text>

                    {isBase && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={theme.primary.main}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
      paddingTop: 16,
      paddingBottom: 14,
      marginBottom: 16,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.foreground.white,
      letterSpacing: -0.5,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16 },

    // Section label row
    sectionLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      marginBottom: 20,
      borderWidth: 1,
      borderColor: `${theme.primary.main}30`,
    },
    netWorthHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
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
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
    },
    baseCurrencyChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    netWorthValue: {
      fontSize: 36,
      fontWeight: "800",
      color: theme.primary.main,
      letterSpacing: -0.5,
      marginBottom: 12,
      marginTop: 2,
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
      marginBottom: 8,
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
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
      paddingVertical: 13,
      paddingRight: 12,
      paddingLeft: 12,
      backgroundColor: theme.background.darker,
      borderRadius: 13,
      overflow: "hidden",
    },
    accountIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    accountInfo: { flex: 1, gap: 4 },
    accountNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    accountBadgesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 2,
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
    loanCountBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: "#FF950022",
      borderWidth: 1,
      borderColor: "#FF950044",
    },
    loanCountBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#FF9500",
      letterSpacing: 0.2,
    },
    charityBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: "#A44AF122",
      borderWidth: 1,
      borderColor: "#A44AF144",
    },
    charityBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#A44AF1",
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

    pillBaseDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.primary.main,
      marginLeft: 4,
    },
    rateEditorDesc: {
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
      marginBottom: 16,
    },
    rateEditorInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    rateEditorInput: {
      flex: 1,
      fontSize: 22,
      fontWeight: "700",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    rateEditorSuffix: {
      fontSize: 18,
      fontWeight: "700",
    },
    rateEditorSaveBtn: {
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },
    rateEditorSaveBtnText: {
      fontSize: 15,
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    modalSheet: {
      width: "100%",
      borderRadius: 16,
      borderWidth: 1,
      paddingTop: 20,
      paddingBottom: 8,
      maxHeight: 360,
      overflow: "hidden",
    },
    modalTitle: {
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.5,
      textAlign: "center",
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    currencyRowText: {
      fontSize: 16,
      flex: 1,
    },
    baseBadgeText: {
      fontSize: 11,
      marginRight: 8,
    },
    checkmark: {
      fontSize: 16,
      fontWeight: "700",
    },

    // ── Base currency picker modal ──
    baseCurrencySheet: {
      width: "100%",
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
      maxHeight: 420,
    },
    baseCurrencyHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 16,
    },
    baseCurrencyIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    baseCurrencyTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    baseCurrencySubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    baseCurrencyDivider: {
      height: 1,
      marginHorizontal: 0,
    },
    baseCurrencyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    baseCurrencyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      minWidth: 52,
      alignItems: "center",
    },
    baseCurrencyCode: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    baseCurrencyRowLabel: {
      fontSize: 14,
      flex: 1,
    },
  });
}
