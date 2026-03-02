import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COMMON_CURRENCIES } from "../../constants/getStarted";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ACCOUNT_COLOR_PALETTE,
  ACCOUNT_ICON_PRESETS,
  ACCOUNT_TYPE_META,
} from "../../data/accounts";
import { Account, AccountType } from "../../types/finance";
import { getCurrencySymbol } from "../../utils/currency";

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

function CurrencyPickerModal({
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: theme.background.darker,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: Platform.OS === "ios" ? 36 : 20,
          maxHeight: "70%",
        }}
      >
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
        <TextInput
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
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      </View>
    </Modal>
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

  const { allAccounts, addAccount, updateAccount } = useFinance();

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
  const [balanceRaw, setBalanceRaw] = useState(
    editAcc
      ? String(Math.abs(editAcc.balance) / 100)
      : "0",
  );
  const [isLiability, setIsLiability] = useState(editAcc?.isLiability ?? false);
  const [color, setColor] = useState(editAcc?.color ?? "#4A9FF1");
  const [icon, setIcon] = useState(editAcc?.icon ?? "wallet-outline");
  const [accountRef, setAccountRef] = useState(editAcc?.accountRef ?? "");
  const [note, setNote] = useState(editAcc?.note ?? "");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Touched state for validation
  const [touchedName, setTouchedName] = useState(false);

  // Re-init when editing
  useEffect(() => {
    if (editAcc) {
      setName(editAcc.name);
      setAccountType(editAcc.type);
      setCurrency(editAcc.currency);
      setBalanceRaw(String(Math.abs(editAcc.balance) / 100));
      setIsLiability(editAcc.isLiability);
      setColor(editAcc.color);
      setIcon(editAcc.icon);
      setAccountRef(editAcc.accountRef ?? "");
      setNote(editAcc.note ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editAcc?.id]);

  // Auto-set defaults when type changes
  const handleTypeChange = (type: AccountType) => {
    const meta = ACCOUNT_TYPE_META.find((m) => m.value === type)!;
    setAccountType(type);
    if (!editAcc) {
      setColor(meta.defaultColor);
      setIcon(meta.icon);
      setIsLiability(meta.isLiability);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const nameError = !name.trim() ? "Account name is required" : null;
  const canSave = !nameError;

  const balanceMinorUnits = (() => {
    const n = parseFloat(balanceRaw) || 0;
    const minor = Math.round(Math.abs(n) * 100);
    return isLiability ? -minor : minor;
  })();

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
      isLiability,
      isArchived: editAcc?.isArchived ?? false,
      icon,
      color,
      accountRef: accountRef.trim() || undefined,
      note: note.trim() || undefined,
    };

    try {
      if (isEdit && editAcc) {
        await updateAccount({ ...data, id: editAcc.id });
        showToast("Account updated", true);
      } else {
        await addAccount(data);
        showToast("Account created", true);
      }
      setTimeout(() => router.back(), 700);
    } catch {
      showToast("Failed to save account", false);
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    saving,
    isEdit,
    editAcc,
    name,
    accountType,
    currency,
    balanceMinorUnits,
    isLiability,
    icon,
    color,
    accountRef,
    note,
    addAccount,
    updateAccount,
    showToast,
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
              style={[styles.previewIconWrap, { backgroundColor: `${color}22` }]}
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
                {isLiability ? " · Liability" : ""}
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
                        color={active ? meta.defaultColor : theme.foreground.gray}
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

          {/* ── Balance ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {isEdit ? "Current Balance" : "Initial Balance"}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceSymbol}>
                <Text style={styles.balanceSymbolText}>
                  {getCurrencySymbol(currency)}
                </Text>
              </View>
              <TextInput
                style={styles.balanceInput}
                value={balanceRaw}
                onChangeText={(v) =>
                  setBalanceRaw(v.replace(/[^0-9.]/g, ""))
                }
                placeholder="0"
                placeholderTextColor={theme.foreground.gray}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
            {/* Liability toggle */}
            <Pressable
              style={styles.liabilityRow}
              onPress={() => setIsLiability((v) => !v)}
            >
              <View
                style={[
                  styles.checkbox,
                  isLiability && {
                    backgroundColor: "#F14A6E",
                    borderColor: "#F14A6E",
                  },
                ]}
              >
                {isLiability && (
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                )}
              </View>
              <View>
                <Text style={styles.liabilityLabel}>
                  This is money I owe (liability)
                </Text>
                <Text style={styles.liabilityHint}>
                  Balance will be stored as negative and excluded from net worth
                  totals
                </Text>
              </View>
            </Pressable>
          </View>

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

      {/* ── Currency modal ── */}
      <CurrencyPickerModal
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
          <Text
            style={[styles.toastText, !toast.ok && { color: "#fff" }]}
          >
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
    liabilityRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginTop: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    liabilityLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.white,
      flex: 1,
    },
    liabilityHint: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 3,
      flex: 1,
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
