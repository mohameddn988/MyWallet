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
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "../../data/categories";
import { Transaction, TransactionType } from "../../types/finance";
import {
  formatAmount,
  getCurrencySymbol,
  parseDate,
  toDateStr,
} from "../../utils/currency";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Currencies that don't use decimal sub-units */
const NO_CENTS_CURRENCIES = ["DZD", "MAD", "JPY", "KRW", "VND"];

function isNoCentsCurrency(currency: string): boolean {
  return NO_CENTS_CURRENCIES.includes(currency.toUpperCase());
}

/** Sanitize raw amount string based on currency rules */
function sanitizeAmount(raw: string, noCents: boolean): string {
  let s = raw.replace(/[^0-9.]/g, "");
  if (noCents) {
    s = s.replace(/\./g, "");
  } else {
    // Only one decimal point
    const idx = s.indexOf(".");
    if (idx !== -1) {
      s = s.slice(0, idx + 1) + s.slice(idx + 1).replace(/\./g, "");
    }
    // Max 2 decimal places
    const parts = s.split(".");
    if (parts[1]?.length > 2) s = parts[0] + "." + parts[1].slice(0, 2);
  }
  // Strip leading zeros (but keep "0.xx")
  s = s.replace(/^0+(\d)/, "$1");
  return s;
}

/** Parse amount string â†’ minor units */
function toMinorUnits(raw: string): number {
  const n = parseFloat(raw);
  if (isNaN(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

/** Format amount string as live display preview */
function formatLiveAmount(raw: string, currency: string): string | null {
  const minor = toMinorUnits(raw);
  if (!minor) return null;
  return formatAmount(minor, currency);
}

function shiftDate(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Build day grid for a month (Sunday-first) */
function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEK_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Toast
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error";
}

function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });
  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ visible: true, message, type });
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 200,
      }).start();
      timerRef.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setToast((t) => ({ ...t, visible: false })));
      }, 2200);
    },
    [anim],
  );

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return { toast, show, translateY };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Date Picker Modal
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DatePickerModalProps {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onConfirm: (date: string) => void;
  onClose: () => void;
  theme: Theme;
}

function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
  theme,
}: DatePickerModalProps) {
  const parsed = parseDate(value);
  const [calYear, setCalYear] = useState(parsed.getFullYear());
  const [calMonth, setCalMonth] = useState(parsed.getMonth());
  const [selectedDay, setSelectedDay] = useState(parsed.getDate());

  // Sync when value changes from outside
  useEffect(() => {
    const d = parseDate(value);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSelectedDay(d.getDate());
  }, [value, visible]);

  const grid = useMemo(
    () => buildCalendarGrid(calYear, calMonth),
    [calYear, calMonth],
  );

  const today = new Date();
  const todayStr = toDateStr(today);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(selectedDay).padStart(2, "0");
    onConfirm(`${calYear}-${mm}-${dd}`);
  };

  const s = dpStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={s.sheet}>
        {/* Month/Year header */}
        <View style={s.calHeader}>
          <Pressable style={s.calNavBtn} onPress={prevMonth}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={22}
              color={theme.foreground.white}
            />
          </Pressable>
          <Text style={s.calTitle}>
            {MONTH_NAMES[calMonth]} {calYear}
          </Text>
          <Pressable style={s.calNavBtn} onPress={nextMonth}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.foreground.white}
            />
          </Pressable>
        </View>

        {/* Weekday labels */}
        <View style={s.weekRow}>
          {WEEK_DAYS.map((d) => (
            <Text key={d} style={s.weekDay}>
              {d}
            </Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={s.grid}>
          {grid.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={s.dayCell} />;
            const mm = String(calMonth + 1).padStart(2, "0");
            const dd = String(day).padStart(2, "0");
            const dateStr = `${calYear}-${mm}-${dd}`;
            const isSelected = day === selectedDay;
            const isToday = dateStr === todayStr;

            return (
              <Pressable
                key={dateStr}
                style={[
                  s.dayCell,
                  isSelected && {
                    backgroundColor: theme.primary.main,
                    borderRadius: 10,
                  },
                  !isSelected && isToday && s.dayCellToday,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    s.dayText,
                    isSelected && { color: theme.background.dark, fontWeight: "700" },
                    !isSelected && isToday && { color: theme.primary.main, fontWeight: "700" },
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Actions */}
        <View style={s.dpActions}>
          <Pressable
            style={({ pressed }) => [s.dpCancelBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={s.dpCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.dpConfirmBtn, pressed && { opacity: 0.8 }]}
            onPress={handleConfirm}
          >
            <Text style={s.dpConfirmText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function dpStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    sheet: {
      backgroundColor: theme.background.darker,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === "ios" ? 36 : 20,
    },
    calHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    calNavBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    calTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    weekRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.5,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: theme.primary.main,
      borderRadius: 10,
    },
    dayText: {
      fontSize: 14,
      color: theme.foreground.white,
    },
    dpActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    dpCancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      alignItems: "center",
    },
    dpCancelText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    dpConfirmBtn: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
      alignItems: "center",
    },
    dpConfirmText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.background.dark,
    },
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Screen
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TouchedFields {
  amount: boolean;
  account: boolean;
  toAccount: boolean;
  category: boolean;
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

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const params = useLocalSearchParams<{ type?: string; editId?: string }>();
  const isEdit = Boolean(params.editId);
  const { toast, show: showToast, translateY: toastY } = useToast();

  const { accounts, allTransactions, addTransaction, updateTransaction } =
    useFinance();

  // â”€â”€ Edit target â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const editTx = useMemo(
    () =>
      params.editId
        ? allTransactions.find((t) => t.id === params.editId)
        : undefined,
    [params.editId, allTransactions],
  );

  // â”€â”€ Form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [txType, setTxType] = useState<TransactionType>(
    (editTx?.type ?? params.type ?? "expense") as TransactionType,
  );
  const [amountRaw, setAmountRaw] = useState<string>(
    editTx ? String(editTx.amount / 100) : "",
  );
  const [accountId, setAccountId] = useState(
    editTx?.accountId ?? accounts[0]?.account.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(editTx?.toAccountId ?? "");
  const [categoryId, setCategoryId] = useState(editTx?.categoryId ?? "");
  const [date, setDate] = useState(editTx?.date ?? toDateStr(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [timeHour, setTimeHour] = useState("12");
  const [timeMin, setTimeMin] = useState("00");
  const [note, setNote] = useState(editTx?.note ?? "");
  const [merchant, setMerchant] = useState(editTx?.merchant ?? "");
  const [tagsStr, setTagsStr] = useState(editTx?.tags?.join(", ") ?? "");
  const [paymentMethod, setPaymentMethod] = useState(
    editTx?.paymentMethod ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    amount: false,
    account: false,
    toAccount: false,
    category: false,
  });

  const amountRef = useRef<TextInput>(null);

  // Re-init when editing and editTx loads
  useEffect(() => {
    if (editTx) {
      setTxType(editTx.type);
      setAmountRaw(String(editTx.amount / 100));
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

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const selectedAccount = accounts.find((a) => a.account.id === accountId);
  const currency = selectedAccount?.account.currency ?? "DZD";
  const noCents = isNoCentsCurrency(currency);
  const symbol = getCurrencySymbol(currency);

  const categories =
    txType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedCategory = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(
    (c) => c.id === categoryId,
  );

  const amountNum = parseFloat(amountRaw);
  const amountMinorUnits = toMinorUnits(amountRaw);
  const liveFormatted = amountMinorUnits > 0 ? formatLiveAmount(amountRaw, currency) : null;

  // â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const errors = {
    amount:
      !amountRaw || isNaN(amountNum) || amountNum <= 0
        ? "Amount is required"
        : null,
    account: !accountId ? "Please select an account" : null,
    toAccount:
      txType === "transfer"
        ? !toAccountId
          ? "Please select a destination account"
          : toAccountId === accountId
            ? "Source and destination must differ"
            : null
        : null,
    category:
      txType !== "transfer" && !categoryId ? "Please select a category" : null,
  };

  const canSave =
    !errors.amount &&
    !errors.account &&
    !errors.toAccount &&
    !errors.category;

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAmountChange = (raw: string) => {
    setAmountRaw(sanitizeAmount(raw, noCents));
  };

  const touchAll = () =>
    setTouched({ amount: true, account: true, toAccount: true, category: true });

  const handleSave = useCallback(async () => {
    touchAll();
    if (!canSave || saving) return;
    setSaving(true);

    const txData: Omit<Transaction, "id"> = {
      type: txType,
      amount: amountMinorUnits,
      currency,
      accountId,
      toAccountId: txType === "transfer" ? toAccountId : undefined,
      categoryId: txType !== "transfer" ? categoryId : undefined,
      categoryName:
        txType !== "transfer" ? selectedCategory?.name : "Transfer",
      categoryIcon:
        txType !== "transfer" ? selectedCategory?.icon : "swap-horizontal",
      categoryColor:
        txType !== "transfer" ? selectedCategory?.color : "#4A9FF1",
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
        showToast("Transaction updated", "success");
      } else {
        await addTransaction(txData);
        showToast("Transaction saved", "success");
      }
      // Small delay so toast is visible before screen closes
      setTimeout(() => router.back(), 700);
    } catch {
      showToast("Failed to save transaction", "error");
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    saving,
    isEdit,
    editTx,
    txType,
    amountMinorUnits,
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
    showToast,
  ]);

  // â”€â”€ Type color â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const typeColor =
    txType === "income"
      ? theme.primary.main
      : txType === "transfer"
        ? "#4A9FF1"
        : "#F14A6E";

  // â”€â”€ Time formatting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const clampHour = (s: string) => {
    const n = parseInt(s, 10);
    if (isNaN(n)) return "00";
    return String(Math.min(23, Math.max(0, n))).padStart(2, "0");
  };
  const clampMin = (s: string) => {
    const n = parseInt(s, 10);
    if (isNaN(n)) return "00";
    return String(Math.min(59, Math.max(0, n))).padStart(2, "0");
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* â”€â”€ Header â”€â”€ */}
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
            {isEdit ? "Edit Transaction" : "Add Transaction"}
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
              {saving ? "Savingâ€¦" : "Save"}
            </Text>
          </Pressable>
        </View>

        {/* â”€â”€ Type tabs â”€â”€ */}
        <View style={styles.typeRow}>
          {(["expense", "income", "transfer"] as TransactionType[]).map((t) => {
            const tColor =
              t === "income"
                ? theme.primary.main
                : t === "transfer"
                  ? "#4A9FF1"
                  : "#F14A6E";
            const active = txType === t;
            return (
              <Pressable
                key={t}
                style={[
                  styles.typeTab,
                  active && {
                    backgroundColor: `${tColor}22`,
                    borderColor: tColor,
                  },
                ]}
                onPress={() => {
                  setTxType(t);
                  setCategoryId("");
                  setTouched((prev) => ({ ...prev, category: false }));
                }}
              >
                <Text
                  style={[
                    styles.typeTabText,
                    active && { color: tColor, fontWeight: "700" },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Amount input â”€â”€ */}
          <Pressable
            style={styles.amountSection}
            onPress={() => amountRef.current?.focus()}
          >
            <Text style={[styles.currencySymbol, { color: typeColor }]}>
              {symbol}
            </Text>
            <TextInput
              ref={amountRef}
              style={[styles.amountInput, { color: typeColor }]}
              value={amountRaw}
              onChangeText={handleAmountChange}
              onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
              placeholder={noCents ? "0" : "0.00"}
              placeholderTextColor={`${typeColor}44`}
              keyboardType="decimal-pad"
              returnKeyType="done"
              selectTextOnFocus
            />
          </Pressable>

          {/* Amount preview & error */}
          {liveFormatted ? (
            <Text style={[styles.amountPreview, { color: typeColor }]}>
              = {liveFormatted}
            </Text>
          ) : touched.amount && errors.amount ? (
            <Text style={styles.errorText}>{errors.amount}</Text>
          ) : null}

          <View style={styles.amountHints}>
            <Text style={styles.amountHint}>
              {noCents
                ? `Stored as whole units (${currency})`
                : `Stored as minor units â€” e.g. 12.50 = 1250 cents`}
            </Text>
          </View>

          {/* â”€â”€ Account picker â”€â”€ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {txType === "transfer" ? "From Account" : "Account"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
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
                  onPress={() => {
                    setAccountId(acc.id);
                    setTouched((t) => ({ ...t, account: true }));
                  }}
                >
                  <MaterialCommunityIcons
                    name={acc.icon as any}
                    size={14}
                    color={
                      accountId === acc.id ? acc.color : theme.foreground.gray
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      accountId === acc.id && {
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
            {touched.account && errors.account && (
              <Text style={styles.errorText}>{errors.account}</Text>
            )}
          </View>

          {/* â”€â”€ To Account (transfer only) â”€â”€ */}
          {txType === "transfer" && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>To Account</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
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
                      onPress={() => {
                        setToAccountId(acc.id);
                        setTouched((t) => ({ ...t, toAccount: true }));
                      }}
                    >
                      <MaterialCommunityIcons
                        name={acc.icon as any}
                        size={14}
                        color={
                          toAccountId === acc.id
                            ? acc.color
                            : theme.foreground.gray
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
                        {formatAmount(acc.balance, acc.currency, {
                          compact: true,
                        })}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
              {touched.toAccount && errors.toAccount && (
                <Text style={styles.errorText}>{errors.toAccount}</Text>
              )}
            </View>
          )}

          {/* â”€â”€ Category picker â”€â”€ */}
          {txType !== "transfer" && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const active = categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryItem,
                        active && {
                          backgroundColor: `${cat.color}22`,
                          borderColor: cat.color,
                        },
                      ]}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setTouched((t) => ({ ...t, category: true }));
                      }}
                    >
                      <View
                        style={[
                          styles.categoryIconWrap,
                          {
                            backgroundColor: active
                              ? `${cat.color}33`
                              : theme.background.darker,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon as any}
                          size={20}
                          color={active ? cat.color : theme.foreground.gray}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryName,
                          active && { color: cat.color },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {touched.category && errors.category && (
                <Text style={[styles.errorText, { marginTop: 8 }]}>
                  {errors.category}
                </Text>
              )}
            </View>
          )}

          {/* â”€â”€ Date picker â”€â”€ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <View style={styles.dateRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.dateArrow,
                  pressed && { opacity: 0.5 },
                ]}
                onPress={() => setDate((d) => shiftDate(d, -1))}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={22}
                  color={theme.foreground.white}
                />
              </Pressable>
              <Pressable
                style={styles.dateLabelBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={16}
                  color={theme.primary.main}
                />
                <Text style={styles.dateLabelText}>
                  {formatDateDisplay(date)}
                </Text>
                <Text style={styles.dateSub}>{date}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.dateArrow,
                  pressed && { opacity: 0.5 },
                ]}
                onPress={() => setDate((d) => shiftDate(d, 1))}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.foreground.white}
                />
              </Pressable>
            </View>
          </View>

          {/* â”€â”€ Time (optional) â”€â”€ */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Time (Optional)</Text>
              <Pressable
                style={[styles.toggleBtn, showTime && styles.toggleBtnActive]}
                onPress={() => setShowTime((v) => !v)}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    showTime && { color: theme.primary.main },
                  ]}
                >
                  {showTime ? "On" : "Off"}
                </Text>
              </Pressable>
            </View>
            {showTime && (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={timeHour}
                  onChangeText={(v) =>
                    setTimeHour(v.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  onBlur={() => setTimeHour(clampHour(timeHour))}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholderTextColor={theme.foreground.gray}
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={timeMin}
                  onChangeText={(v) =>
                    setTimeMin(v.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  onBlur={() => setTimeMin(clampMin(timeMin))}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  placeholderTextColor={theme.foreground.gray}
                />
                <Text style={styles.timeHint}>HH : MM (24h)</Text>
              </View>
            )}
          </View>

          {/* â”€â”€ Merchant â”€â”€ */}
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

          {/* â”€â”€ Note â”€â”€ */}
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
            />
          </View>

          {/* â”€â”€ Tags â”€â”€ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="work, urgent, familyâ€¦"
              placeholderTextColor={theme.foreground.gray}
              value={tagsStr}
              onChangeText={setTagsStr}
              returnKeyType="done"
            />
            <Text style={styles.inputHint}>Separate tags with commas</Text>
          </View>

          {/* â”€â”€ Payment method â”€â”€ */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Method (Optional)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {PAYMENT_METHODS.map((pm) => {
                const active = paymentMethod === pm.id;
                return (
                  <Pressable
                    key={pm.id}
                    style={[
                      styles.pmChip,
                      active && {
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
                        active && { color: theme.primary.main, fontWeight: "600" },
                      ]}
                    >
                      {pm.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* â”€â”€ Date picker modal â”€â”€ */}
      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onConfirm={(d) => {
          setDate(d);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
        theme={theme}
      />

      {/* â”€â”€ Toast â”€â”€ */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === "error" && styles.toastError,
            { transform: [{ translateY: toastY }] },
          ]}
          pointerEvents="none"
        >
          <MaterialCommunityIcons
            name={
              toast.type === "success" ? "check-circle-outline" : "alert-circle-outline"
            }
            size={18}
            color={
              toast.type === "success" ? theme.background.dark : "#fff"
            }
          />
          <Text
            style={[
              styles.toastText,
              toast.type === "error" && { color: "#fff" },
            ]}
          >
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Styles
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      paddingVertical: 12,
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
      paddingTop: 4,
    },
    // â”€â”€ Amount â”€â”€
    amountSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      gap: 4,
    },
    currencySymbol: {
      fontSize: 30,
      fontWeight: "300",
      marginTop: 8,
    },
    amountInput: {
      fontSize: 54,
      fontWeight: "700",
      minWidth: 80,
      textAlign: "center",
      padding: 0,
    },
    amountPreview: {
      textAlign: "center",
      fontSize: 14,
      fontWeight: "600",
      marginTop: -8,
      marginBottom: 4,
      opacity: 0.75,
    },
    amountHints: {
      alignItems: "center",
      marginBottom: 12,
    },
    amountHint: {
      fontSize: 10,
      color: theme.foreground.gray,
      opacity: 0.6,
    },
    // â”€â”€ Sections â”€â”€
    section: {
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
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
    // â”€â”€ Chips â”€â”€
    chipsRow: {
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
      opacity: 0.65,
    },
    // â”€â”€ Category â”€â”€
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
      gap: 5,
    },
    categoryIconWrap: {
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
    // â”€â”€ Date â”€â”€
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
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    dateLabelBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: 6,
    },
    dateLabelText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    dateSub: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    // â”€â”€ Time â”€â”€
    toggleBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
    },
    toggleBtnActive: {
      borderColor: theme.primary.main,
      backgroundColor: `${theme.primary.main}18`,
    },
    toggleBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    timeInput: {
      width: 58,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      backgroundColor: theme.background.accent,
      color: theme.foreground.white,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
    },
    timeColon: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    timeHint: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginLeft: 8,
    },
    // â”€â”€ Text inputs â”€â”€
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
    bottomPad: {
      height: 48,
    },
    // â”€â”€ Toast â”€â”€
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
    toastError: {
      backgroundColor: "#F14A6E",
    },
    toastText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.background.dark,
      flex: 1,
    },
  });
}
