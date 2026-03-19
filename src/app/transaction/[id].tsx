import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppModal } from "../../components/ui/AppModal";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  convertFromBase,
  convertToBase,
  formatAmount,
  formatDateLabel,
} from "../../utils/currency";

export default function TransactionDetailScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allTransactions, accounts, deleteTransaction, baseCurrency, exchangeRates } = useFinance();

  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tx = allTransactions.find((t) => t.id === id);

  // ── Handlers — all hooks must be declared before any early return ──────────
  const handleDelete = useCallback(() => {
    if (!tx || busy) return;
    setShowDeleteConfirm(true);
  }, [tx, busy]);

  const handleConfirmDelete = useCallback(async () => {
    if (!tx) return;
    setShowDeleteConfirm(false);
    setBusy(true);
    try {
      await deleteTransaction(tx.id);
      router.back();
    } catch {
      setBusy(false);
    }
  }, [tx, deleteTransaction]);

  const handleEdit = useCallback(() => {
    if (!tx) return;
    router.push(`/transaction/add?editId=${tx.id}` as any);
  }, [tx]);

  if (!tx) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Transaction not found.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const account = accounts.find((a) => a.account.id === tx.accountId);
  const toAccount = tx.toAccountId
    ? accounts.find((a) => a.account.id === tx.toAccountId)
    : undefined;

  const isIncome = tx.type === "income";
  const isTransfer = tx.type === "transfer";
  const typeColor = isTransfer
    ? "#4A9FF1"
    : isIncome
      ? theme.primary.main
      : "#F14A6E";
  const amountStr = isTransfer
    ? formatAmount(tx.amount, tx.currency)
    : (isIncome ? "+" : "−") + formatAmount(tx.amount, tx.currency);

  // For cross-currency transfers, compute the converted amount
  const toCurrency = toAccount?.account.currency;
  const isCrossCurrency = isTransfer && toCurrency && toCurrency !== tx.currency;
  const convertedAmountStr = isCrossCurrency
    ? (() => {
        const rateMap = Object.fromEntries(exchangeRates.map((r) => [r.from, r.rate]));
        const inBase = convertToBase(tx.amount, tx.currency, baseCurrency, rateMap);
        const converted = convertFromBase(inBase, toCurrency, baseCurrency, rateMap);
        return formatAmount(converted, toCurrency);
      })()
    : null;

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
        <Text style={styles.headerTitle}>Transaction</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Amount hero ── */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.categoryIconWrap,
              { backgroundColor: `${tx.categoryColor ?? typeColor}22` },
            ]}
          >
            <MaterialCommunityIcons
              name={(tx.categoryIcon ?? "swap-horizontal") as any}
              size={32}
              color={tx.categoryColor ?? typeColor}
            />
          </View>
          <Text style={[styles.amount, { color: typeColor }]}>{amountStr}</Text>
          {convertedAmountStr && (
            <Text style={[styles.convertedAmount, { color: typeColor }]}>
              → {convertedAmountStr}
            </Text>
          )}
          <Text style={styles.categoryName}>
            {tx.categoryName ?? (isTransfer ? "Transfer" : "Uncategorized")}
          </Text>
          <View
            style={[styles.typeBadge, { backgroundColor: `${typeColor}22` }]}
          >
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
              {tx.type.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Details ── */}
        <View style={styles.card}>
          <DetailRow
            icon="calendar-outline"
            label="Date"
            value={formatDateLabel(tx.date)}
            theme={theme}
          />
          <DetailRow
            icon="bank-outline"
            label="Account"
            value={account?.account.name ?? tx.accountId}
            theme={theme}
          />
          {isTransfer && toAccount && (
            <DetailRow
              icon="arrow-right"
              label="To Account"
              value={toAccount.account.name}
              theme={theme}
            />
          )}
          {tx.merchant && (
            <DetailRow
              icon="store-outline"
              label="Merchant"
              value={tx.merchant}
              theme={theme}
            />
          )}
          {tx.paymentMethod && (
            <DetailRow
              icon="credit-card-outline"
              label="Payment Method"
              value={tx.paymentMethod.replace("_", " ")}
              theme={theme}
            />
          )}
          {tx.note && (
            <DetailRow
              icon="text-box-outline"
              label="Note"
              value={tx.note}
              theme={theme}
              multiline
            />
          )}
          {tx.tags && tx.tags.length > 0 && (
            <View style={styles.tagsRow}>
              <MaterialCommunityIcons
                name="tag-multiple-outline"
                size={16}
                color={theme.foreground.gray}
              />
              <Text style={styles.detailLabel}>Tags</Text>
              <View style={styles.tagsWrap}>
                {tx.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsCard}>
          <ActionButton
            icon="pencil-outline"
            label="Edit"
            onPress={handleEdit}
            color={theme.primary.main}
            theme={theme}
            disabled={busy}
          />
          <View style={styles.actionDivider} />
          <ActionButton
            icon="trash-can-outline"
            label="Delete"
            onPress={handleDelete}
            color="#F14A6E"
            theme={theme}
            disabled={busy}
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <AppModal
        visible={showDeleteConfirm}
        title="Delete Transaction"
        description={`Are you sure you want to delete this ${tx.type}?\nThis action cannot be undone.`}
        icon="trash-can-outline"
        variant="destructive"
        onClose={() => !busy && setShowDeleteConfirm(false)}
        busy={busy}
        actions={[
          {
            label: "Cancel",
            onPress: () => setShowDeleteConfirm(false),
            disabled: busy,
          },
          {
            label: "Delete",
            busyLabel: "Deleting…",
            onPress: handleConfirmDelete,
            destructive: true,
            busy,
          },
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  theme,
  multiline = false,
}: {
  icon: string;
  label: string;
  value: string;
  theme: Theme;
  multiline?: boolean;
}) {
  return (
    <View style={detailStyles.row}>
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={theme.foreground.gray}
      />
      <Text style={[detailStyles.label, { color: theme.foreground.gray }]}>
        {label}
      </Text>
      <Text
        style={[
          detailStyles.value,
          { color: theme.foreground.white },
          multiline && { flex: 1, flexWrap: "wrap" },
        ]}
        numberOfLines={multiline ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  label: {
    fontSize: 13,
    width: 110,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});

function ActionButton({
  icon,
  label,
  onPress,
  color,
  theme,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  theme: Theme;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        actionStyles.btn,
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={[actionStyles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});

// ─────────────────────────────────────────────────────────────────────────────

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
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      flexGrow: 1,
      justifyContent: "center",
    },
    heroCard: {
      alignItems: "center",
      marginBottom: 20,
      gap: 8,
    },
    categoryIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    amount: {
      fontSize: 38,
      fontWeight: "800",
    },
    convertedAmount: {
      fontSize: 20,
      fontWeight: "700",
      opacity: 0.8,
      marginTop: 2,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    typeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    typeBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    detailLabel: {
      fontSize: 13,
      width: 110,
      color: theme.foreground.gray,
    },
    tagsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 12,
    },
    tagsWrap: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      justifyContent: "flex-end",
    },
    tagChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    tagChipText: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    actionsCard: {
      flexDirection: "row",
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
      overflow: "hidden",
      marginBottom: 16,
    },
    actionDivider: {
      width: 1,
      backgroundColor: "#2C3139",
    },
    notFound: {
      flex: 1,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    notFoundText: {
      color: theme.foreground.gray,
      fontSize: 16,
    },
    backBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.background.accent,
    },
    backBtnText: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "600",
    },
    bottomPad: {
      height: 40,
    },
  });
}
