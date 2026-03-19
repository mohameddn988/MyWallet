import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getRealm, readAppPrefs, writeAppPref } from "../lib/realm";
import {
  formatAmount as _formatAmount,
  formatAmountSigned as _formatAmountSigned,
  formatDateLabel as _formatDateLabel,
  parseDate,
  toDateStr,
} from "../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DateFormatId =
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "YYYY-MM-DD"
  | "D MMM YYYY";

export type FirstDayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type NumberFormatId = "en-US" | "de-DE" | "fr-FR";

export interface DateFormatOption {
  id: DateFormatId;
  label: string;
  example: string; // formatted from a fixed sample date
}

export interface NumberFormatOption {
  id: NumberFormatId;
  label: string;
  example: string;
}

export interface FirstDayOption {
  id: FirstDayOfWeek;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Options catalogue
// ─────────────────────────────────────────────────────────────────────────────

/** Sample date used for all preview examples: 2026-03-05 */
const SAMPLE_DATE = "2026-03-05";

function buildDateExample(id: DateFormatId): string {
  const d = parseDate(SAMPLE_DATE);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  const monthShort = d.toLocaleDateString("en-US", { month: "short" });
  switch (id) {
    case "MM/DD/YYYY":
      return `${mm}/${dd}/${yyyy}`;
    case "DD/MM/YYYY":
      return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD":
      return `${yyyy}-${mm}-${dd}`;
    case "D MMM YYYY":
      return `${d.getDate()} ${monthShort} ${yyyy}`;
  }
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  {
    id: "MM/DD/YYYY",
    label: "MM/DD/YYYY",
    example: buildDateExample("MM/DD/YYYY"),
  },
  {
    id: "DD/MM/YYYY",
    label: "DD/MM/YYYY",
    example: buildDateExample("DD/MM/YYYY"),
  },
  {
    id: "YYYY-MM-DD",
    label: "YYYY-MM-DD (ISO)",
    example: buildDateExample("YYYY-MM-DD"),
  },
  {
    id: "D MMM YYYY",
    label: "D MMM YYYY",
    example: buildDateExample("D MMM YYYY"),
  },
];

export const NUMBER_FORMAT_OPTIONS: NumberFormatOption[] = [
  { id: "en-US", label: "1,234.56", example: "English — 1,234.56" },
  { id: "de-DE", label: "1.234,56", example: "European — 1.234,56" },
  { id: "fr-FR", label: "1 234,56", example: "French — 1 234,56" },
];

export const FIRST_DAY_OPTIONS: FirstDayOption[] = [
  { id: "sunday", label: "Sunday" },
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
];

export type MonthLengthId = "calendar" | "30" | "28";

export interface MonthLengthOption {
  id: MonthLengthId;
  label: string;
  desc: string;
}

export const MONTH_LENGTH_OPTIONS: MonthLengthOption[] = [
  { id: "calendar", label: "Calendar", desc: "Follow real calendar months (28–31 days)" },
  { id: "30", label: "30 days", desc: "Every month is exactly 30 days" },
  { id: "28", label: "28 days", desc: "Every month is exactly 28 days (4 weeks)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface LocaleContextType {
  dateFormat: DateFormatId;
  firstDayOfWeek: FirstDayOfWeek;
  numberFormat: NumberFormatId;
  setDateFormat: (id: DateFormatId) => Promise<void>;
  setNumberFormat: (id: NumberFormatId) => Promise<void>;
  /** Format a "YYYY-MM-DD" string to the user's chosen date format. */
  formatDate: (dateStr: string) => string;
  /** Format a plain number (not minor-units) to the user's chosen number format. */
  formatNumber: (value: number, decimals?: number) => string;
  /** Locale-aware formatAmount (minor units → display string). */
  formatAmount: (
    minorUnits: number,
    currency: string,
    options?: { showSign?: boolean; compact?: boolean },
  ) => string;
  /** Locale-aware formatAmountSigned. */
  formatAmountSigned: (minorUnits: number, currency: string) => string;
  /** Locale-aware formatDateLabel ("Today" / "Yesterday" / formatted). */
  formatDateLabel: (dateStr: string) => string;
  /** Budget month length mode */
  monthLength: MonthLengthId;
  /** Day of month the budget cycle starts (1-31) */
  monthStartDay: number;
  setMonthLength: (id: MonthLengthId) => Promise<void>;
  setMonthStartDay: (day: number) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES: FirstDayOfWeek[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormatId>("DD/MM/YYYY");
  const [numberFormat, setNumberFormatState] =
    useState<NumberFormatId>("en-US");
  const [monthLength, setMonthLengthState] = useState<MonthLengthId>("calendar");
  const [monthStartDay, setMonthStartDayState] = useState(1);

  // Compute firstDayOfWeek from monthStartDay
  const firstDayOfWeek = useMemo(() => {
    const now = new Date();
    const clamp = (y: number, m: number, day: number) => {
      const max = new Date(y, m + 1, 0).getDate();
      return new Date(y, m, Math.min(day, max));
    };
    let d = clamp(now.getFullYear(), now.getMonth(), monthStartDay);
    if (d > now) d = clamp(now.getFullYear(), now.getMonth() - 1, monthStartDay);
    return DAY_NAMES[d.getDay()];
  }, [monthStartDay]);

  // Load locale preferences from Realm on mount
  useEffect(() => {
    (async () => {
      try {
        const realm = await getRealm();
        const prefs = readAppPrefs(realm);
        if (!prefs) return;
        if (
          prefs.dateFormat &&
          DATE_FORMAT_OPTIONS.find((o) => o.id === prefs.dateFormat)
        )
          setDateFormatState(prefs.dateFormat as DateFormatId);
        if (
          prefs.numberFormat &&
          NUMBER_FORMAT_OPTIONS.find((o) => o.id === prefs.numberFormat)
        )
          setNumberFormatState(prefs.numberFormat as NumberFormatId);
        if (
          prefs.monthLength &&
          MONTH_LENGTH_OPTIONS.find((o) => o.id === prefs.monthLength)
        )
          setMonthLengthState(prefs.monthLength as MonthLengthId);
        if (prefs.monthStartDay != null)
          setMonthStartDayState(prefs.monthStartDay);
      } catch {}
    })();
  }, []);

  const setDateFormat = useCallback(async (id: DateFormatId) => {
    setDateFormatState(id);
    try {
      const realm = await getRealm();
      writeAppPref(realm, { dateFormat: id });
    } catch {}
  }, []);

  const setNumberFormat = useCallback(async (id: NumberFormatId) => {
    setNumberFormatState(id);
    try {
      const realm = await getRealm();
      writeAppPref(realm, { numberFormat: id });
    } catch {}
  }, []);

  const setMonthLength = useCallback(async (id: MonthLengthId) => {
    setMonthLengthState(id);
    try {
      const realm = await getRealm();
      writeAppPref(realm, { monthLength: id });
    } catch {}
  }, []);

  const setMonthStartDay = useCallback(async (day: number) => {
    setMonthStartDayState(day);
    try {
      const realm = await getRealm();
      writeAppPref(realm, { monthStartDay: day });
    } catch {}
  }, []);

  const formatDate = useCallback(
    (dateStr: string): string => {
      const today = toDateStr(new Date());
      const yesterday = toDateStr(new Date(Date.now() - 86_400_000));
      if (dateStr === today) return "Today";
      if (dateStr === yesterday) return "Yesterday";

      const d = parseDate(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });

      switch (dateFormat) {
        case "MM/DD/YYYY":
          return `${weekday}, ${mm}/${dd}/${yyyy}`;
        case "DD/MM/YYYY":
          return `${weekday}, ${dd}/${mm}/${yyyy}`;
        case "YYYY-MM-DD":
          return `${yyyy}-${mm}-${dd}`;
        case "D MMM YYYY":
          return `${weekday}, ${d.getDate()} ${monthShort} ${yyyy}`;
      }
    },
    [dateFormat],
  );

  const formatNumber = useCallback(
    (value: number, decimals = 2): string => {
      try {
        return value.toLocaleString(numberFormat, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      } catch {
        return value.toFixed(decimals);
      }
    },
    [numberFormat],
  );

  // Locale-aware wrappers around utility functions
  const formatAmount = useCallback(
    (
      minorUnits: number,
      currency: string,
      options?: { showSign?: boolean; compact?: boolean },
    ) => _formatAmount(minorUnits, currency, { ...options, locale: numberFormat }),
    [numberFormat],
  );

  const formatAmountSigned = useCallback(
    (minorUnits: number, currency: string) =>
      _formatAmountSigned(minorUnits, currency, numberFormat),
    [numberFormat],
  );

  const formatDateLabel = useCallback(
    (dateStr: string) => _formatDateLabel(dateStr, dateFormat),
    [dateFormat],
  );

  const value = useMemo(
    () => ({
      dateFormat,
      firstDayOfWeek,
      numberFormat,
      monthLength,
      monthStartDay,
      setDateFormat,
      setNumberFormat,
      setMonthLength,
      setMonthStartDay,
      formatDate,
      formatNumber,
      formatAmount,
      formatAmountSigned,
      formatDateLabel,
    }),
    [
      dateFormat,
      firstDayOfWeek,
      numberFormat,
      monthLength,
      monthStartDay,
      setDateFormat,
      setNumberFormat,
      setMonthLength,
      setMonthStartDay,
      formatDate,
      formatNumber,
      formatAmount,
      formatAmountSigned,
      formatDateLabel,
    ],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
