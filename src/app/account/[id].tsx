import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getAccountTypeMeta, LOAN_DIRECTIONS } from "../../data/accounts";
import { ConfirmDeleteModal } from "../../components/ui/ConfirmDeleteModal";
import { Transaction } from "../../types/finance";
import {
  convertToBase,
  formatAmount,
  formatAmountSigned,
  getCurrencySymbol,
  parseDate,
} from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Mini sparkline (last 8 weeks net flow)
// ─────────────────────────────────────────────────────────────────────────────

function SparkBar({
  value,
  maxAbs,
  color,
}: {
  value: number;
  maxAbs: number;
  color: string;
}) {
  const pct = maxAbs === 0 ? 0 : Math.min(Math.abs(value) / maxAbs, 1);
  const h = Math.max(3, Math.round(pct * 36));
  const barColor = value >= 0 ? color : "#F14A6E";

  return (
    <View
      style={{
        flex: 1,
        height: 44,
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 3,
      }}
    >
      <View
        style={{
          width: "70%",
          height: h,
          borderRadius: 4,
          backgroundColor: barColor,
          opacity: 0.85,
        }}
      />
    </View>
  );
}

function buildWeeklyFlow(
  transactions: Transaction[],
  accountId: string,
): number[] {
  const now = new Date();
  const weeks: number[] = new Array(8).fill(0);

  for (const tx of transactions) {
    if (
      tx.type === "transfer" &&
      tx.accountId !== accountId &&
      tx.toAccountId !== accountId
    )
      continue;
    if (tx.type !== "transfer" && tx.accountId !== accountId) continue;

    const d = parseDate(tx.date);
    const diffMs = now.getTime() - d.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 3600 * 1000));
    if (diffWeeks < 0 || diffWeeks >= 8) continue;

    const weekIdx = 7 - diffWeeks; // rightmost = current week

    if (tx.type === "income" && tx.accountId === accountId) {
      weeks[weekIdx] += tx.amount;
    } else if (tx.type === "expense" && tx.accountId === accountId) {
      weeks[weekIdx] -= tx.amount;
    } else if (tx.type === "transfer") {
      if (tx.accountId === accountId) weeks[weekIdx] -= tx.amount;
      else if (tx.toAccountId === accountId) weeks[weekIdx] += tx.amount;
    }
  }
  return weeks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction row
// ─────────────────────────────────────────────────────────────────────────────

function TxRow({
  tx,
  accountId,
  theme,
}: {
  tx: Transaction;
  accountId: string;
  theme: Theme;
}) {
  const isCredit =
    tx.type === "income" ||
    (tx.type === "transfer" && tx.toAccountId === accountId);
  const color =
    tx.type === "transfer"
      ? "#4A9FF1"
      : tx.type === "income"
        ? theme.primary.main
        : "#F14A6E";

  return (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 13,
          paddingHorizontal: 16,
          gap: 12,
          backgroundColor: pressed ? theme.background.accent : "transparent",
        },
      ]}
      onPress={() => router.navigate(`/transaction/${tx.id}` as any)}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `${color}22`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons
          name={(tx.categoryIcon ?? "swap-horizontal") as any}
          size={20}
          color={color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: theme.foreground.white,
          }}
          numberOfLines={1}
        >
          {tx.merchant ?? tx.categoryName ?? tx.type}
        </Text>
        {tx.note ? (
          <Text
            style={{
              fontSize: 11,
              color: theme.foreground.gray,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {tx.note}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color,
        }}
      >
        {isCredit ? "+" : "-"}
        {formatAmount(tx.amount, tx.currency)}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

function formatDateHeading(dateStr: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateStr === todayStr) return "Today";
  if (dateStr === yStr) return "Yesterday";
  return parseDate(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function AccountDetailScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    allAccounts,
    allTransactions,
    exchangeRates,
    baseCurrency,
    updateAccount,
    deleteAccount,
    addSubAccount,
    removeSubAccount,
  } = useFinance();

  const account = useMemo(
    () => allAccounts.find((a) => a.id === id),
    [allAccounts, id],
  );

  // Transactions for this account
  const accountTxs = useMemo(
    () =>
      allTransactions
        .filter((t) => t.accountId === id || t.toAccountId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allTransactions, id],
  );

  // Grouped by date for SectionList
  const sections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of accountTxs) {
      const existing = map.get(tx.date) ?? [];
      existing.push(tx);
      map.set(tx.date, existing);
    }
    return Array.from(map.entries()).map(([date, data]) => ({ date, data }));
  }, [accountTxs]);

  // Stats
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    for (const tx of accountTxs) {
      if (tx.type === "income" && tx.accountId === id) totalIn += tx.amount;
      else if (tx.type === "expense" && tx.accountId === id)
        totalOut += tx.amount;
      else if (tx.type === "transfer") {
        if (tx.toAccountId === id) totalIn += tx.amount;
        else if (tx.accountId === id) totalOut += tx.amount;
      }
    }
    return { totalIn, totalOut };
  }, [accountTxs, id]);

  // Weekly flow for sparkline
  const weeklyFlow = useMemo(
    () => buildWeeklyFlow(accountTxs, id),
    [accountTxs, id],
  );
  const maxAbs = Math.max(...weeklyFlow.map(Math.abs), 1);

  // Rate map for base conversion
  const rateMap = useMemo(
    () => Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate])),
    [exchangeRates],
  );

  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(
    null,
  );

  // Loan sub-account add state
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonAmount, setNewPersonAmount] = useState("");

  const isLoanAccount = account?.type === "loan";
  const isCharityAccount = account?.type === "charity";

  const handleAddPerson = useCallback(async () => {
    if (!account) return;
    const personName = newPersonName.trim();
    const amount = Math.round((parseFloat(newPersonAmount) || 0) * 100);
    if (!personName || amount <= 0) return;
    await addSubAccount(account.id, { name: personName, balance: amount });
    setNewPersonName("");
    setNewPersonAmount("");
  }, [account, newPersonName, newPersonAmount, addSubAccount]);

  const handleRemovePerson = useCallback(
    (index: number) => {
      if (!account) return;
      setPendingRemoveIndex(index);
    },
    [account],
  );

  const handleConfirmRemovePerson = useCallback(async () => {
    if (!account || pendingRemoveIndex === null) return;
    await removeSubAccount(account.id, pendingRemoveIndex);
    setPendingRemoveIndex(null);
  }, [account, pendingRemoveIndex, removeSubAccount]);

  const handleArchiveToggle = useCallback(async () => {
    if (!account || archiving) return;
    setArchiving(true);
    try {
      await updateAccount({ ...account, isArchived: !account.isArchived });
      router.back();
    } finally {
      setArchiving(false);
    }
  }, [account, archiving, updateAccount]);

  const handleDelete = useCallback(() => {
    if (accountTxs.length > 0) {
      Alert.alert(
        "Delete Account",
        `This account has ${accountTxs.length} transaction(s). You must delete all of them first, or archive the account instead.`,
        [{ text: "OK" }],
      );
    } else {
      setShowDeleteConfirm(true);
    }
  }, [accountTxs.length]);

  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await deleteAccount(id);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [deleteAccount, id]);

  if (!account) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Account not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const meta = getAccountTypeMeta(account.type);
  const balanceInBase = convertToBase(
    account.balance,
    account.currency,
    baseCurrency,
    rateMap,
  );
  const showBaseConversion = account.currency !== baseCurrency;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {account.name}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() =>
            router.navigate(`/account/add?editId=${account.id}` as any)
          }
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={20}
            color={theme.foreground.white}
          />
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Account card ── */}
            <View style={[styles.accountCard, { borderColor: account.color }]}>
              <View
                style={[
                  styles.accountIconWrap,
                  { backgroundColor: `${account.color}22` },
                ]}
              >
                <MaterialCommunityIcons
                  name={account.icon as any}
                  size={32}
                  color={account.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>{account.name}</Text>
                <View style={styles.accountBadges}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${meta.defaultColor}22` },
                    ]}
                  >
                    <Text
                      style={[styles.badgeText, { color: meta.defaultColor }]}
                    >
                      {meta.label}
                    </Text>
                  </View>
                  {account.loanDirection && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            account.loanDirection === "owe"
                              ? "#F14A6E22"
                              : `${theme.primary.main}22`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              account.loanDirection === "owe"
                                ? "#F14A6E"
                                : theme.primary.main,
                          },
                        ]}
                      >
                        {LOAN_DIRECTIONS.find(
                          (d) => d.value === account.loanDirection,
                        )?.label ?? ""}
                      </Text>
                    </View>
                  )}
                  {isCharityAccount && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: `${theme.primary.main}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: theme.primary.main },
                        ]}
                      >
                        Neutral
                      </Text>
                    </View>
                  )}
                  {account.isArchived && (
                    <View style={styles.archivedBadge}>
                      <Text style={styles.archivedBadgeText}>Archived</Text>
                    </View>
                  )}
                </View>
                {account.accountRef ? (
                  <Text style={styles.accountRef}>
                    Ref: {account.accountRef}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* ── Balance block ── */}
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: account.balance < 0 ? "#F14A6E" : account.color },
                ]}
              >
                {formatAmountSigned(account.balance, account.currency)}
              </Text>
              {showBaseConversion && (
                <Text style={styles.balanceBase}>
                  ≈ {formatAmount(balanceInBase, baseCurrency)} {baseCurrency}
                </Text>
              )}
              {account.note ? (
                <Text style={styles.accountNote}>{account.note}</Text>
              ) : null}
            </View>

            {/* ── Stats strip ── */}
            <View style={styles.statsStrip}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Transactions</Text>
                <Text style={styles.statValue}>{accountTxs.length}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total In</Text>
                <Text style={[styles.statValue, { color: theme.primary.main }]}>
                  +
                  {formatAmount(stats.totalIn, account.currency, {
                    compact: true,
                  })}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Out</Text>
                <Text style={[styles.statValue, { color: "#F14A6E" }]}>
                  -
                  {formatAmount(stats.totalOut, account.currency, {
                    compact: true,
                  })}
                </Text>
              </View>
            </View>

            {/* ── Sparkline: weekly flow ── */}
            {accountTxs.length > 0 && (
              <View style={styles.sparkSection}>
                <Text style={styles.sparkTitle}>Last 8 Weeks — Net Flow</Text>
                <View style={styles.sparkBars}>
                  {weeklyFlow.map((v, i) => (
                    <SparkBar
                      key={i}
                      value={v}
                      maxAbs={maxAbs}
                      color={account.color}
                    />
                  ))}
                </View>
                <View style={styles.sparkLabels}>
                  <Text style={styles.sparkLabelText}>8w ago</Text>
                  <Text style={styles.sparkLabelText}>Now</Text>
                </View>
              </View>
            )}

            {/* ── Sub-accounts / Loan people ── */}
            {isLoanAccount ? (
              <View style={styles.subSection}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text style={styles.subTitle}>
                    {account.loanDirection === "owe"
                      ? "People I Owe"
                      : "People Who Owe Me"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: theme.primary.main,
                    }}
                  >
                    {formatAmount(account.balance, account.currency)}
                  </Text>
                </View>

                {/* Existing entries */}
                {account.subAccounts?.map((sub, i) => (
                  <View key={i} style={styles.subRow}>
                    <Text style={styles.subName}>{sub.name}</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={styles.subBalance}>
                        {formatAmount(sub.balance, account.currency)}
                      </Text>
                      <Pressable
                        style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                        onPress={() => handleRemovePerson(i)}
                      >
                        <MaterialCommunityIcons
                          name="close-circle-outline"
                          size={18}
                          color="#F14A6E"
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}

                {(!account.subAccounts || account.subAccounts.length === 0) && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.foreground.gray,
                      textAlign: "center",
                      paddingVertical: 12,
                      opacity: 0.6,
                    }}
                  >
                    No entries yet
                  </Text>
                )}

                {/* Add new person */}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.background.darker,
                    marginTop: 8,
                    paddingTop: 12,
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: theme.foreground.gray,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Add Person
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: theme.background.darker,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#2C3139",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      color: theme.foreground.white,
                      fontSize: 14,
                    }}
                    placeholder="Name"
                    placeholderTextColor={theme.foreground.gray}
                    value={newPersonName}
                    onChangeText={setNewPersonName}
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.background.darker,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#2C3139",
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: theme.foreground.gray,
                          marginRight: 8,
                        }}
                      >
                        {getCurrencySymbol(account.currency)}
                      </Text>
                      <TextInput
                        style={{
                          flex: 1,
                          color: theme.foreground.white,
                          fontSize: 14,
                          paddingVertical: 10,
                        }}
                        placeholder="0"
                        placeholderTextColor={theme.foreground.gray}
                        value={newPersonAmount}
                        onChangeText={(v) =>
                          setNewPersonAmount(v.replace(/[^0-9.]/g, ""))
                        }
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        {
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: theme.primary.main,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        pressed && { opacity: 0.7 },
                        (!newPersonName.trim() ||
                          !(parseFloat(newPersonAmount) > 0)) && {
                          opacity: 0.4,
                        },
                      ]}
                      onPress={handleAddPerson}
                      disabled={
                        !newPersonName.trim() ||
                        !(parseFloat(newPersonAmount) > 0)
                      }
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={20}
                        color={theme.background.dark}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : account.subAccounts && account.subAccounts.length > 0 ? (
              <View style={styles.subSection}>
                <Text style={styles.subTitle}>Breakdown</Text>
                {account.subAccounts.map((sub, i) => (
                  <View key={i} style={styles.subRow}>
                    <Text style={styles.subName}>{sub.name}</Text>
                    <Text style={styles.subBalance}>
                      {formatAmount(sub.balance, account.currency)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* ── Actions ── */}
            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() =>
                  router.navigate(`/account/add?editId=${account.id}` as any)
                }
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={theme.foreground.white}
                />
                <Text style={styles.actionBtnText}>Edit</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  account.isArchived && {
                    borderColor: theme.primary.main,
                    backgroundColor: `${theme.primary.main}18`,
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleArchiveToggle}
                disabled={archiving}
              >
                <MaterialCommunityIcons
                  name={
                    account.isArchived
                      ? "archive-arrow-up-outline"
                      : "archive-arrow-down-outline"
                  }
                  size={18}
                  color={
                    account.isArchived
                      ? theme.primary.main
                      : theme.foreground.white
                  }
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    account.isArchived && { color: theme.primary.main },
                  ]}
                >
                  {account.isArchived ? "Unarchive" : "Archive"}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.actionBtnDanger,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleDelete}
                disabled={deleting}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color="#F14A6E"
                />
                <Text style={[styles.actionBtnText, { color: "#F14A6E" }]}>
                  Delete
                </Text>
              </Pressable>
            </View>

            {/* ── Transactions heading ── */}
            {sections.length > 0 && (
              <Text style={styles.txSectionTitle}>Transactions</Text>
            )}
          </>
        }
        renderSectionHeader={({ section: { date } }) => (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatDateHeading(date)}</Text>
            <Text style={styles.dateHeaderSub}>{date}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TxRow tx={item} accountId={id} theme={theme} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="swap-horizontal"
              size={40}
              color={theme.foreground.gray}
              style={{ opacity: 0.4 }}
            />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyStateCta,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() =>
                router.navigate("/transaction/add?type=expense" as any)
              }
            >
              <Text style={styles.emptyStateCtaText}>Add Transaction</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
      <ConfirmDeleteModal
        visible={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        busy={deleting}
        title="Delete Account"
        description="Are you sure you want to permanently delete this account? This cannot be undone."
      />
      <ConfirmDeleteModal
        visible={pendingRemoveIndex !== null}
        onConfirm={handleConfirmRemovePerson}
        onCancel={() => setPendingRemoveIndex(null)}
        title="Remove Entry"
        description={
          pendingRemoveIndex !== null &&
          account?.subAccounts?.[pendingRemoveIndex]
            ? `Remove "${account.subAccounts[pendingRemoveIndex].name}" (${getCurrencySymbol(account.currency)} ${(account.subAccounts[pendingRemoveIndex].balance / 100).toLocaleString()}) from this list?`
            : "Remove this entry from the list?"
        }
        confirmLabel="Remove"
        busyLabel="Removing…"
        icon="account-remove-outline"
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    notFound: {
      flex: 1,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    notFoundText: {
      fontSize: 16,
      color: theme.foreground.gray,
    },
    backBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.background.accent,
    },
    backBtnText: {
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
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
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    // Account card
    accountCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      margin: 16,
      marginBottom: 0,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: theme.background.accent,
    },
    accountIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    accountName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 6,
    },
    accountBadges: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    archivedBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: "#BFC3C722",
    },
    archivedBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#BFC3C7",
    },
    accountRef: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 5,
    },
    // Balance
    balanceBlock: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
      marginBottom: 8,
    },
    balanceValue: {
      fontSize: 38,
      fontWeight: "800",
    },
    balanceBase: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 4,
    },
    accountNote: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 8,
      textAlign: "center",
      fontStyle: "italic",
    },
    // Stats strip
    statsStrip: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      overflow: "hidden",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.background.darker,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: theme.foreground.gray,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    // Sparkline
    sparkSection: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 14,
    },
    sparkTitle: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: theme.foreground.gray,
      marginBottom: 10,
    },
    sparkBars: {
      flexDirection: "row",
      height: 44,
      gap: 2,
    },
    sparkLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    sparkLabelText: {
      fontSize: 9,
      color: theme.foreground.gray,
      opacity: 0.7,
    },
    // Sub-accounts
    subSection: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 14,
    },
    subTitle: {
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: theme.foreground.gray,
      marginBottom: 8,
    },
    subRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.background.darker,
    },
    subName: {
      fontSize: 14,
      color: theme.foreground.white,
    },
    subBalance: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    // Actions
    actionsRow: {
      flexDirection: "row",
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 24,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
    },
    actionBtnDanger: {
      borderColor: "#F14A6E33",
      backgroundColor: "#F14A6E11",
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    // Transactions
    txSectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
      color: theme.foreground.gray,
      paddingHorizontal: 16,
      paddingBottom: 8,
      textTransform: "uppercase",
    },
    dateHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.background.dark,
    },
    dateHeaderText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    dateHeaderSub: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    // Empty
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyStateText: {
      fontSize: 15,
      color: theme.foreground.gray,
    },
    emptyStateCta: {
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
  });
}
