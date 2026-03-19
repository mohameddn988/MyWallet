import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppBottomSheet from "../../components/ui/AppBottomSheet";
import { COMMON_CURRENCIES } from "../../constants/getStarted";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ACCOUNT_COLOR_PALETTE,
  ACCOUNT_ICON_PRESETS,
  ACCOUNT_TYPE_META,
  LOAN_DIRECTIONS,
} from "../../data/accounts";
import {
  Account,
  AccountType,
  LoanDirection,
  SubAccount,
} from "../../types/finance";
import { getCurrencySymbol, toMinorUnits, fromMinorUnits } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Toast (same pattern as transaction add)
// ─────────────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, ok = true) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ text, ok });
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 200,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setMsg(null));
      }, 2200);
    },
    [anim],
  );

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return { msg, show, translateY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency picker modal
// ─────────────────────────────────────────────────────────────────────────────

function CurrencyPickerSheet({
  visible,
  selected,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [search, setSearch] = useState("");
  const filtered = COMMON_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppBottomSheet
      snapPoints={["70%"]}
      isOpen={visible}
      onClose={onClose}
      noWrapper
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: theme.foreground.white,
            marginBottom: 14,
          }}
        >
          Select Currency
        </Text>
        <BottomSheetTextInput
          style={{
            backgroundColor: theme.background.accent,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#2C3139",
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: theme.foreground.white,
            fontSize: 14,
            marginBottom: 12,
          }}
          placeholder="Search currencies…"
          placeholderTextColor={theme.foreground.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <BottomSheetScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {filtered.map((c) => {
          const active = selected === c.code;
          const symbol = getCurrencySymbol(c.code);
          return (
            <Pressable
              key={c.code}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
                paddingHorizontal: 12,
                borderRadius: 10,
                marginBottom: 4,
                backgroundColor: active
                  ? `${theme.primary.main}22`
                  : pressed
                    ? theme.background.accent
                    : "transparent",
                borderWidth: active ? 1 : 0,
                borderColor: theme.primary.main,
              })}
              onPress={() => {
                onSelect(c.code);
                onClose();
              }}
            >
              <Text
                style={{
                  width: 38,
                  fontSize: 16,
                  fontWeight: "700",
                  color: active ? theme.primary.main : theme.foreground.gray,
                }}
              >
                {symbol}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: active ? "700" : "500",
                    color: active
                      ? theme.primary.main
                      : theme.foreground.white,
                  }}
                >
                  {c.code}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.foreground.gray,
                    marginTop: 1,
                  }}
                >
                  {c.name}
                </Text>
              </View>
              {active && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={theme.primary.main}
                />
              )}
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AddAccountScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEdit = Boolean(params.editId);
  const { msg: toast, show: showToast, translateY: toastY } = useToast();

  const {
    allAccounts,
    addAccount,
    updateAccount,
    hasLoanDirection,
    baseCurrency,
    updateExchangeRate,
  } = useFinance();

  const editAcc = useMemo(
    () =>
      params.editId
        ? allAccounts.find((a) => a.id === params.editId)
        : undefined,
    [params.editId, allAccounts],
  );

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = useState(editAcc?.name ?? "");
  const [accountType, setAccountType] = useState<AccountType>(
    editAcc?.type ?? "cash",
  );
  const [currency, setCurrency] = useState(editAcc?.currency ?? "DZD");
  const [exchangeRate, setExchangeRate] = useState("");
  const [balanceRaw, setBalanceRaw] = useState(
    editAcc ? String(fromMinorUnits(Math.abs(editAcc.balance), editAcc.currency)) : "0",
  );
  const [color, setColor] = useState(editAcc?.color ?? "#4A9FF1");
  const [icon, setIcon] = useState(editAcc?.icon ?? "wallet-outline");
  const [accountRef, setAccountRef] = useState(editAcc?.accountRef ?? "");
  const [note, setNote] = useState(editAcc?.note ?? "");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Loan-specific state
  const [loanDirection, setLoanDirection] = useState<LoanDirection>(
    editAcc?.loanDirection ?? "owe",
  );
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>(
    editAcc?.subAccounts ?? [],
  );
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonAmount, setNewPersonAmount] = useState("");

  // Check if currency differs from base
  const currencyDiffersFromBase = currency !== baseCurrency;

  // Touched state for validation
  const [touchedName, setTouchedName] = useState(false);

  // Re-init when editing
  useEffect(() => {
    if (editAcc) {
      setName(editAcc.name);
      setAccountType(editAcc.type);
      setCurrency(editAcc.currency);
      setBalanceRaw(String(fromMinorUnits(Math.abs(editAcc.balance), editAcc.currency)));
      setColor(editAcc.color);
      setIcon(editAcc.icon);
      setAccountRef(editAcc.accountRef ?? "");
      setNote(editAcc.note ?? "");
      if (editAcc.loanDirection) setLoanDirection(editAcc.loanDirection);
      if (editAcc.subAccounts) setSubAccounts(editAcc.subAccounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editAcc?.id]);

  // Reset exchange rate when currency changes
  useEffect(() => {
    setExchangeRate("");
  }, [currency]);

  // Auto-set defaults when type changes
  const handleTypeChange = (type: AccountType) => {
    const meta = ACCOUNT_TYPE_META.find((m) => m.value === type)!;
    setAccountType(type);
    if (!editAcc) {
      setColor(meta.defaultColor);
      setIcon(meta.icon);
      // Auto-set name for loan accounts
      if (type === "loan") {
        const dirMeta = LOAN_DIRECTIONS.find((d) => d.value === loanDirection);
        if (dirMeta) setName(dirMeta.defaultName);
      }
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const isLoan = accountType === "loan";
  const isCharity = accountType === "charity";

  // Check if the selected loan direction is already taken (by another account)
  const loanDirectionTaken =
    isLoan && !isEdit && hasLoanDirection(loanDirection);

  const nameError = !name.trim() ? "Account name is required" : null;
  const loanError =
    isLoan && !isEdit && loanDirectionTaken
      ? `A "${LOAN_DIRECTIONS.find((d) => d.value === loanDirection)?.label}" account already exists`
      : null;
  const canSave = !nameError && !loanError;

  const balanceMinorUnits = (() => {
    if (isLoan) {
      // For loans, balance = sum of sub-accounts
      return subAccounts.reduce((sum, s) => sum + s.balance, 0);
    }
    const n = parseFloat(balanceRaw) || 0;
    return toMinorUnits(Math.abs(n), currency);

  })();

  // ── Loan sub-account helpers ──────────────────────────────────────────────
  const handleAddPerson = () => {
    const personName = newPersonName.trim();
    const amount = toMinorUnits(parseFloat(newPersonAmount) || 0, currency);
    if (!personName || amount <= 0) return;
    setSubAccounts((prev) => [...prev, { name: personName, balance: amount }]);
    setNewPersonName("");
    setNewPersonAmount("");
  };

  const handleRemovePerson = (index: number) => {
    setSubAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setTouchedName(true);
    if (!canSave || saving) return;
    setSaving(true);

    const data: Omit<Account, "id"> = {
      name: name.trim(),
      type: accountType,
      currency,
      balance: balanceMinorUnits,
      isArchived: editAcc?.isArchived ?? false,
      icon,
      color,
      accountRef: accountRef.trim() || undefined,
      note: note.trim() || undefined,
      ...(isLoan
        ? {
            loanDirection,
            subAccounts,
          }
        : {}),
    };

    try {
      if (isEdit && editAcc) {
        await updateAccount({ ...data, id: editAcc.id });
      } else {
        await addAccount(data);
      }

      // Update exchange rate if currency differs and rate was provided
      if (currencyDiffersFromBase && exchangeRate.trim()) {
        const rate = parseFloat(exchangeRate);
        if (!isNaN(rate) && rate > 0) {
          await updateExchangeRate({
            from: currency,
            to: baseCurrency,
            rate,
            lastUpdated: new Date().toISOString().slice(0, 10),
            isUserDefined: true,
          });
        }
      }

      showToast(isEdit ? "Account updated" : "Account created", true);
      setTimeout(() => router.back(), 700);
    } catch (e: any) {
      showToast(e?.message ?? "Failed to save account", false);
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    saving,
    isEdit,
    isLoan,
    editAcc,
    name,
    accountType,
    currency,
    balanceMinorUnits,
    loanDirection,
    subAccounts,
    icon,
    color,
    accountRef,
    note,
    addAccount,
    updateAccount,
    showToast,
    baseCurrency,
    currencyDiffersFromBase,
    exchangeRate,
    updateExchangeRate,
  ]);

  const selectedTypeMeta = ACCOUNT_TYPE_META.find(
    (m) => m.value === accountType,
  )!;

  return (
    <>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
              name="close"
              size={22}
              color={theme.foreground.white}
            />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEdit ? "Edit Account" : "Add Account"}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && { opacity: 0.8 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text
              style={[
                styles.saveBtnText,
                !canSave && styles.saveBtnTextDisabled,
              ]}
            >
              {saving ? "Saving…" : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Preview card ── */}
          <View style={[styles.previewCard, { borderColor: color }]}>
            <View
              style={[
                styles.previewIconWrap,
                { backgroundColor: `${color}22` },
              ]}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={28}
                color={color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewName, { color }]}>
                {name.trim() || "Account Name"}
              </Text>
              <Text style={styles.previewMeta}>
                {selectedTypeMeta.label} · {currency}
              </Text>
            </View>
          </View>

          {/* ── Name ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account Name *</Text>
            <TextInput
              style={[
                styles.input,
                touchedName && nameError
                  ? { borderColor: "#F14A6E" }
                  : undefined,
              ]}
              placeholder="e.g. My Bank Account"
              placeholderTextColor={theme.foreground.gray}
              value={name}
              onChangeText={setName}
              onBlur={() => setTouchedName(true)}
              returnKeyType="next"
            />
            {touchedName && nameError && (
              <Text style={styles.errorText}>{nameError}</Text>
            )}
          </View>

          {/* ── Account type ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account Type</Text>
            <View style={styles.typeGrid}>
              {ACCOUNT_TYPE_META.map((meta) => {
                const active = accountType === meta.value;
                return (
                  <Pressable
                    key={meta.value}
                    style={[
                      styles.typeItem,
                      active && {
                        backgroundColor: `${meta.defaultColor}22`,
                        borderColor: meta.defaultColor,
                      },
                    ]}
                    onPress={() => handleTypeChange(meta.value)}
                  >
                    <View
                      style={[
                        styles.typeIconWrap,
                        {
                          backgroundColor: active
                            ? `${meta.defaultColor}33`
                            : theme.background.darker,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={meta.icon as any}
                        size={20}
                        color={
                          active ? meta.defaultColor : theme.foreground.gray
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        active && { color: meta.defaultColor },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Loan Direction Picker (only for loan type) ── */}
          {isLoan && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Loan Direction</Text>
              <View style={{ gap: 8 }}>
                {LOAN_DIRECTIONS.map((dir) => {
                  const active = loanDirection === dir.value;
                  const taken = !isEdit && hasLoanDirection(dir.value);
                  return (
                    <Pressable
                      key={dir.value}
                      style={[
                        styles.loanDirItem,
                        active && {
                          backgroundColor: `${selectedTypeMeta.defaultColor}22`,
                          borderColor: selectedTypeMeta.defaultColor,
                        },
                        taken && !active && { opacity: 0.4 },
                      ]}
                      onPress={() => {
                        if (taken) return;
                        setLoanDirection(dir.value);
                        if (!editAcc) setName(dir.defaultName);
                      }}
                      disabled={taken && !active}
                    >
                      <View
                        style={[
                          styles.loanDirIconWrap,
                          {
                            backgroundColor: active
                              ? `${selectedTypeMeta.defaultColor}33`
                              : theme.background.darker,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={dir.icon as any}
                          size={20}
                          color={
                            active
                              ? selectedTypeMeta.defaultColor
                              : theme.foreground.gray
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.loanDirLabel,
                            active && {
                              color: selectedTypeMeta.defaultColor,
                            },
                          ]}
                        >
                          {dir.label}
                        </Text>
                        <Text style={styles.loanDirDesc}>
                          {dir.description}
                        </Text>
                      </View>
                      {taken && !active && (
                        <View style={styles.loanTakenBadge}>
                          <Text style={styles.loanTakenText}>Exists</Text>
                        </View>
                      )}
                      {active && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={selectedTypeMeta.defaultColor}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {loanError && <Text style={styles.errorText}>{loanError}</Text>}
            </View>
          )}

          {/* ── Currency ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Currency</Text>
            <Pressable
              style={({ pressed }) => [
                styles.currencyRow,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => setShowCurrencyModal(true)}
            >
              <View style={styles.currencySymbolBox}>
                <Text style={styles.currencySymbolText}>
                  {getCurrencySymbol(currency)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.currencyCode}>{currency}</Text>
                <Text style={styles.currencyName}>
                  {COMMON_CURRENCIES.find((c) => c.code === currency)?.name ??
                    "Unknown currency"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.foreground.gray}
              />
            </Pressable>
          </View>

          {/* ── Exchange Rate (if currency differs from base) ── */}
          {currencyDiffersFromBase && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Exchange Rate ({currency} → {baseCurrency})
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.foreground.gray,
                  marginBottom: 10,
                  lineHeight: 17,
                }}
              >
                How many {baseCurrency} equals 1 {currency}?
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceSymbolText}>1 {currency} =</Text>
                <TextInput
                  style={[styles.balanceInput, { fontSize: 18 }]}
                  value={exchangeRate}
                  onChangeText={(v) =>
                    setExchangeRate(v.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="0.00"
                  placeholderTextColor={theme.foreground.gray}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.foreground.gray,
                    marginLeft: 8,
                  }}
                >
                  {baseCurrency}
                </Text>
              </View>
            </View>
          )}

          {/* ── Balance / Sub-accounts ── */}
          {isLoan ? (
            /* Loan: People entries instead of plain balance */
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>People</Text>

              {/* Existing entries */}
              {subAccounts.map((sub, idx) => (
                <View key={idx} style={styles.personRow}>
                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{sub.name}</Text>
                    <Text style={styles.personAmount}>
                      {getCurrencySymbol(currency)}{" "}
                      {fromMinorUnits(sub.balance, currency).toLocaleString()}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.personRemoveBtn,
                      pressed && { opacity: 0.6 },
                    ]}
                    onPress={() => handleRemovePerson(idx)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color="#F14A6E"
                    />
                  </Pressable>
                </View>
              ))}

              {/* Add new person */}
              <View style={styles.addPersonCard}>
                <TextInput
                  style={[styles.input, { marginBottom: 8 }]}
                  placeholder="Person's name"
                  placeholderTextColor={theme.foreground.gray}
                  value={newPersonName}
                  onChangeText={setNewPersonName}
                  returnKeyType="next"
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={[styles.balanceRow, { flex: 1 }]}>
                    <View style={styles.balanceSymbol}>
                      <Text style={styles.balanceSymbolText}>
                        {getCurrencySymbol(currency)}
                      </Text>
                    </View>
                    <TextInput
                      style={[styles.balanceInput, { fontSize: 16 }]}
                      value={newPersonAmount}
                      onChangeText={(v) =>
                        setNewPersonAmount(v.replace(/[^0-9.]/g, ""))
                      }
                      placeholder="0"
                      placeholderTextColor={theme.foreground.gray}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.addPersonBtn,
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
                      size={22}
                      color={theme.background.dark}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Total */}
              {subAccounts.length > 0 && (
                <View style={styles.personTotalRow}>
                  <Text style={styles.personTotalLabel}>Total</Text>
                  <Text style={styles.personTotalAmount}>
                    {getCurrencySymbol(currency)}{" "}
                    {fromMinorUnits(
                      subAccounts.reduce((s, e) => s + e.balance, 0), currency
                    ).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Normal / Charity balance input */
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {isCharity
                  ? "Target Amount"
                  : isEdit
                    ? "Current Balance"
                    : "Initial Balance"}
              </Text>
              {isCharity && (
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.foreground.gray,
                    marginBottom: 10,
                    lineHeight: 17,
                  }}
                >
                  This is the amount you want to set aside for charity. It won&apos;t
                  affect your net worth until you transfer money into it.
                </Text>
              )}
              <View style={styles.balanceRow}>
                <View style={styles.balanceSymbol}>
                  <Text style={styles.balanceSymbolText}>
                    {getCurrencySymbol(currency)}
                  </Text>
                </View>
                <TextInput
                  style={styles.balanceInput}
                  value={balanceRaw}
                  onChangeText={(v) => setBalanceRaw(v.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={theme.foreground.gray}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>
            </View>
          )}

          {/* ── Color palette ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.palette}
            >
              {ACCOUNT_COLOR_PALETTE.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotActive,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#000"
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ── Icon ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Icon</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconsRow}
            >
              {ACCOUNT_ICON_PRESETS.map((ic) => {
                const active = icon === ic;
                return (
                  <Pressable
                    key={ic}
                    style={[
                      styles.iconBtn,
                      active && {
                        backgroundColor: `${color}22`,
                        borderColor: color,
                      },
                    ]}
                    onPress={() => setIcon(ic)}
                  >
                    <MaterialCommunityIcons
                      name={ic as any}
                      size={22}
                      color={active ? color : theme.foreground.gray}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Account reference ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Account Reference (Optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. last 4 digits, CCP ref…"
              placeholderTextColor={theme.foreground.gray}
              value={accountRef}
              onChangeText={setAccountRef}
              returnKeyType="next"
            />
          </View>

          {/* ── Note ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Any extra info about this account…"
              placeholderTextColor={theme.foreground.gray}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      {/* ── Currency sheet ── */}
      <CurrencyPickerSheet
        visible={showCurrencyModal}
        selected={currency}
        onSelect={setCurrency}
        onClose={() => setShowCurrencyModal(false)}
        theme={theme}
      />

      {/* ── Toast ── */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            !toast.ok && { backgroundColor: "#F14A6E" },
            { transform: [{ translateY: toastY }] },
          ]}
          pointerEvents="none"
        >
          <MaterialCommunityIcons
            name={toast.ok ? "check-circle-outline" : "alert-circle-outline"}
            size={18}
            color={toast.ok ? theme.background.dark : "#fff"}
          />
          <Text style={[styles.toastText, !toast.ok && { color: "#fff" }]}>
            {toast.text}
          </Text>
        </Animated.View>
      )}
    </>
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
    saveBtnDisabled: { backgroundColor: theme.background.accent },
    saveBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.background.dark,
    },
    saveBtnTextDisabled: { color: theme.foreground.gray },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    // Preview
    previewCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: theme.background.accent,
      marginBottom: 24,
    },
    previewIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    previewName: {
      fontSize: 17,
      fontWeight: "700",
    },
    previewMeta: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 3,
    },
    // Section
    section: { marginBottom: 20 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
      marginBottom: 10,
    },
    errorText: {
      fontSize: 12,
      color: "#F14A6E",
      marginTop: 5,
    },
    // Name input
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
    // Type grid
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    typeItem: {
      width: "23%",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      gap: 5,
    },
    typeIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    typeLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      textAlign: "center",
    },
    // Currency
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
    },
    currencySymbolBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    currencySymbolText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    currencyCode: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    currencyName: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    // Balance
    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 10,
    },
    balanceSymbol: {
      paddingRight: 8,
      borderRightWidth: 1,
      borderRightColor: "#2C3139",
    },
    balanceSymbolText: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    balanceInput: {
      flex: 1,
      fontSize: 24,
      fontWeight: "700",
      color: theme.foreground.white,
      paddingVertical: 14,
    },
    // Color
    palette: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 4,
    },
    colorDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    colorDotActive: {
      borderWidth: 3,
      borderColor: "#fff",
    },
    // Icons
    iconsRow: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 4,
    },
    iconBtn: {
      width: 48,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    // Loan direction picker
    loanDirItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
    },
    loanDirIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    loanDirLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    loanDirDesc: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    loanTakenBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: "#F14A6E22",
    },
    loanTakenText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#F14A6E",
    },
    // Person entries (loan sub-accounts)
    personRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 8,
    },
    personInfo: {
      flex: 1,
    },
    personName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    personAmount: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    personRemoveBtn: {
      padding: 4,
    },
    addPersonCard: {
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
      borderStyle: "dashed",
      padding: 12,
      marginBottom: 8,
    },
    addPersonBtn: {
      width: 56,
      height: 60,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    personTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      marginTop: 4,
    },
    personTotalLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    personTotalAmount: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.primary.main,
    },
    // Toast
    toast: {
      position: "absolute",
      bottom: 32,
      left: 24,
      right: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: theme.primary.main,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    },
    toastText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.background.dark,
      flex: 1,
    },
  });
}
