import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from "../../data/categories";
import { Transaction, TransactionType } from "../../types/finance";
import { formatAmount, getCurrencySymbol, parseDate, toDateStr } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────

function shiftDate(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

function formatDateDisplay(dateStr: string): string {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return parseDate(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const params = useLocalSearchParams<{ type?: string; editId?: string }>();
  const isEdit = Boolean(params.editId);

  const {
    accounts,
    allTransactions,
    addTransaction,
    updateTransaction,
  } = useFinance();

  // ── Derive edit target ────────────────────────────────────────────────────
  const editTx = useMemo(
    () =>
      params.editId
        ? allTransactions.find((t) => t.id === params.editId)
        : undefined,
    [params.editId, allTransactions],
  );

  // ── Form state ────────────────────────────────────────────────────────────
  const [txType, setTxType] = useState<TransactionType>(
    (editTx?.type ?? params.type ?? "expense") as TransactionType,
  );
  const [amountStr, setAmountStr] = useState(
    editTx ? String(editTx.amount / 100) : "",
  );
  const [accountId, setAccountId] = useState(
    editTx?.accountId ?? accounts[0]?.account.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(editTx?.toAccountId ?? "");
  const [categoryId, setCategoryId] = useState(editTx?.categoryId ?? "");
  const [date, setDate] = useState(editTx?.date ?? toDateStr(new Date()));
  const [note, setNote] = useState(editTx?.note ?? "");
  const [merchant, setMerchant] = useState(editTx?.merchant ?? "");
  const [tagsStr, setTagsStr] = useState(editTx?.tags?.join(", ") ?? "");
  const [paymentMethod, setPaymentMethod] = useState(editTx?.paymentMethod ?? "");
  const [saving, setSaving] = useState(false);

  // Re-init if editing and editTx loaded late
  useEffect(() => {
    if (editTx) {
      setTxType(editTx.type);
      setAmountStr(String(editTx.amount / 100));
      setAccountId(editTx.accountId);
      setToAccountId(editTx.toAccountId ?? "");
      setCategoryId(editTx.categoryId ?? "");
      setDate(editTx.date);
      setNote(editTx.note ?? "");
      setMerchant(editTx.merchant ?? "");
      setTagsStr(editTx.tags?.join(", ") ?? "");
      setPaymentMethod(editTx.paymentMethod ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTx?.id]);

  // ── Derived values ────────────────────────────────────────────────────────
  const selectedAccount = accounts.find((a) => a.account.id === accountId);
  const currency = selectedAccount?.account.currency ?? "DZD";
  const currencySymbol = getCurrencySymbol(currency);

  const categories =
    txType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const selectedCategory = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(
    (c) => c.id === categoryId,
  );

  // ── Validation ────────────────────────────────────────────────────────────
  const amountNum = parseFloat(amountStr.replace(",", "."));
  const isAmountValid = !isNaN(amountNum) && amountNum > 0;
  const isAccountValid = Boolean(accountId);
  const isToAccountValid =
    txType !== "transfer" || (Boolean(toAccountId) && toAccountId !== accountId);
  const isCategoryValid = txType === "transfer" || Boolean(categoryId);
  const canSave =
    isAmountValid && isAccountValid && isToAccountValid && isCategoryValid;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);

    const cat = selectedCategory;
    const minorUnits = Math.round(amountNum * 100);

    const txData: Omit<Transaction, "id"> = {
      type: txType,
      amount: minorUnits,
      currency,
      accountId,
      toAccountId: txType === "transfer" ? toAccountId : undefined,
      categoryId: txType !== "transfer" ? categoryId : undefined,
      categoryName: txType !== "transfer" ? cat?.name : "Transfer",
      categoryIcon: txType !== "transfer" ? cat?.icon : "swap-horizontal",
      categoryColor: txType !== "transfer" ? cat?.color : "#4A9FF1",
      date,
      note: note.trim() || undefined,
      merchant: merchant.trim() || undefined,
      tags: tagsStr.trim()
        ? tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      paymentMethod: paymentMethod || undefined,
    };

    try {
      if (isEdit && editTx) {
        await updateTransaction({ ...txData, id: editTx.id });
      } else {
        await addTransaction(txData);
      }
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    saving,
    isEdit,
    editTx,
    txType,
    amountNum,
    currency,
    accountId,
    toAccountId,
    categoryId,
    date,
    note,
    merchant,
    tagsStr,
    paymentMethod,
    selectedCategory,
    addTransaction,
    updateTransaction,
  ]);

  // ── Type colors ───────────────────────────────────────────────────────────
  const typeColor =
    txType === "income"
      ? theme.primary.main
      : txType === "transfer"
        ? "#4A9FF1"
        : "#F14A6E";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="close"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEdit ? "Edit Transaction" : "Add Transaction"}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveBtnDisabled,
            pressed && canSave && { opacity: 0.8 },
          ]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* ── Type selector ── */}
      <View style={styles.typeRow}>
        {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
          <Pressable
            key={t}
            style={[
              styles.typeTab,
              txType === t && {
                backgroundColor:
                  t === "income"
                    ? `${theme.primary.main}22`
                    : t === "transfer"
                      ? "rgba(74,159,241,0.18)"
                      : "rgba(241,74,110,0.18)",
                borderColor:
                  t === "income"
                    ? theme.primary.main
                    : t === "transfer"
                      ? "#4A9FF1"
                      : "#F14A6E",
              },
            ]}
            onPress={() => {
              setTxType(t);
              setCategoryId("");
            }}
          >
            <Text
              style={[
                styles.typeTabText,
                txType === t && {
                  color:
                    t === "income"
                      ? theme.primary.main
                      : t === "transfer"
                        ? "#4A9FF1"
                        : "#F14A6E",
                  fontWeight: "700",
                },
              ]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Amount ── */}
        <View style={styles.amountSection}>
          <Text style={[styles.currencySymbol, { color: typeColor }]}>
            {currencySymbol}
          </Text>
          <TextInput
            style={[styles.amountInput, { color: typeColor }]}
            value={amountStr}
            onChangeText={setAmountStr}
            placeholder="0"
            placeholderTextColor={`${typeColor}55`}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        {/* ── Account picker ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {txType === "transfer" ? "From Account" : "Account"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {accounts.map(({ account: acc }) => (
              <Pressable
                key={acc.id}
                style={[
                  styles.accountChip,
                  accountId === acc.id && {
                    backgroundColor: `${acc.color}22`,
                    borderColor: acc.color,
                  },
                ]}
                onPress={() => setAccountId(acc.id)}
              >
                <MaterialCommunityIcons
                  name={acc.icon as any}
                  size={14}
                  color={accountId === acc.id ? acc.color : theme.foreground.gray}
                />
                <Text
                  style={[
                    styles.chipText,
                    accountId === acc.id && { color: acc.color, fontWeight: "600" },
                  ]}
                >
                  {acc.name}
                </Text>
                <Text style={styles.chipBalance}>
                  {formatAmount(acc.balance, acc.currency, { compact: true })}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── To Account (transfer only) ── */}
        {txType === "transfer" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>To Account</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {accounts
                .filter(({ account: acc }) => acc.id !== accountId)
                .map(({ account: acc }) => (
                  <Pressable
                    key={acc.id}
                    style={[
                      styles.accountChip,
                      toAccountId === acc.id && {
                        backgroundColor: `${acc.color}22`,
                        borderColor: acc.color,
                      },
                    ]}
                    onPress={() => setToAccountId(acc.id)}
                  >
                    <MaterialCommunityIcons
                      name={acc.icon as any}
                      size={14}
                      color={
                        toAccountId === acc.id ? acc.color : theme.foreground.gray
                      }
                    />
                    <Text
                      style={[
                        styles.chipText,
                        toAccountId === acc.id && {
                          color: acc.color,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {acc.name}
                    </Text>
                    <Text style={styles.chipBalance}>
                      {formatAmount(acc.balance, acc.currency, { compact: true })}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
            {toAccountId === accountId && (
              <Text style={styles.errorText}>
                Source and destination accounts must differ.
              </Text>
            )}
          </View>
        )}

        {/* ── Category picker ── */}
        {txType !== "transfer" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    categoryId === cat.id && {
                      backgroundColor: `${cat.color}22`,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          categoryId === cat.id
                            ? `${cat.color}33`
                            : theme.background.darker,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={20}
                      color={
                        categoryId === cat.id ? cat.color : theme.foreground.gray
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      categoryId === cat.id && { color: cat.color },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Date ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <View style={styles.dateRow}>
            <Pressable
              style={({ pressed }) => [styles.dateArrow, pressed && { opacity: 0.5 }]}
              onPress={() => setDate((d) => shiftDate(d, -1))}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={theme.foreground.white}
              />
            </Pressable>
            <Pressable
              style={styles.dateLabel}
              onLongPress={() => setDate(toDateStr(new Date()))}
            >
              <MaterialCommunityIcons
                name="calendar-outline"
                size={16}
                color={theme.primary.main}
              />
              <Text style={styles.dateLabelText}>{formatDateDisplay(date)}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.dateArrow, pressed && { opacity: 0.5 }]}
              onPress={() => setDate((d) => shiftDate(d, 1))}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={theme.foreground.white}
              />
            </Pressable>
          </View>
          <Text style={styles.dateTip}>Long-press the date to reset to today</Text>
        </View>

        {/* ── Merchant ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Merchant / Payee (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Where did you spend?"
            placeholderTextColor={theme.foreground.gray}
            value={merchant}
            onChangeText={setMerchant}
            returnKeyType="next"
          />
        </View>

        {/* ── Note ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="What was this for?"
            placeholderTextColor={theme.foreground.gray}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            returnKeyType="next"
          />
        </View>

        {/* ── Tags ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tags (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="work, urgent, family..."
            placeholderTextColor={theme.foreground.gray}
            value={tagsStr}
            onChangeText={setTagsStr}
            returnKeyType="next"
          />
          <Text style={styles.inputHint}>Separate with commas</Text>
        </View>

        {/* ── Payment method ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Payment Method (Optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {PAYMENT_METHODS.map((pm) => (
              <Pressable
                key={pm.id}
                style={[
                  styles.pmChip,
                  paymentMethod === pm.id && {
                    backgroundColor: `${theme.primary.main}22`,
                    borderColor: theme.primary.main,
                  },
                ]}
                onPress={() =>
                  setPaymentMethod((prev) => (prev === pm.id ? "" : pm.id))
                }
              >
                <Text
                  style={[
                    styles.pmChipText,
                    paymentMethod === pm.id && { color: theme.primary.main },
                  ]}
                >
                  {pm.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    },
    saveBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.primary.main,
    },
    saveBtnDisabled: {
      backgroundColor: theme.background.accent,
    },
    saveBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },
    saveBtnTextDisabled: {
      color: theme.foreground.gray,
    },
    typeRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    typeTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      alignItems: "center",
      backgroundColor: theme.background.accent,
    },
    typeTabText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    amountSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      gap: 4,
    },
    currencySymbol: {
      fontSize: 32,
      fontWeight: "300",
      marginTop: 6,
    },
    amountInput: {
      fontSize: 52,
      fontWeight: "700",
      minWidth: 80,
      textAlign: "center",
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
      marginBottom: 10,
    },
    chipsContainer: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 4,
    },
    accountChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    chipBalance: {
      fontSize: 11,
      color: theme.foreground.gray,
      opacity: 0.7,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    categoryItem: {
      width: "23%",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      gap: 6,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryName: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      textAlign: "center",
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      overflow: "hidden",
    },
    dateArrow: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    dateLabel: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
    },
    dateLabelText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    dateTip: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 6,
      textAlign: "center",
    },
    input: {
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingHorizontal: 14,
      paddingVertical: 13,
      color: theme.foreground.white,
      fontSize: 15,
    },
    noteInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    inputHint: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 5,
    },
    pmChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
    },
    pmChipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    errorText: {
      fontSize: 12,
      color: "#F14A6E",
      marginTop: 6,
    },
    bottomPad: {
      height: 40,
    },
  });
}
