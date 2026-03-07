import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { parseDate, toDateStr } from "../utils/currency";

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
    case "MM/DD/YYYY": return `${mm}/${dd}/${yyyy}`;
    case "DD/MM/YYYY": return `${dd}/${mm}/${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
    case "D MMM YYYY": return `${d.getDate()} ${monthShort} ${yyyy}`;
  }
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { id: "MM/DD/YYYY", label: "MM/DD/YYYY", example: buildDateExample("MM/DD/YYYY") },
  { id: "DD/MM/YYYY", label: "DD/MM/YYYY", example: buildDateExample("DD/MM/YYYY") },
  { id: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)", example: buildDateExample("YYYY-MM-DD") },
  { id: "D MMM YYYY", label: "D MMM YYYY", example: buildDateExample("D MMM YYYY") },
];

export const NUMBER_FORMAT_OPTIONS: NumberFormatOption[] = [
  { id: "en-US", label: "1,234.56", example: "English — 1,234.56" },
  { id: "de-DE", label: "1.234,56", example: "European — 1.234,56" },
  { id: "fr-FR", label: "1 234,56", example: "French — 1 234,56" },
];

export const FIRST_DAY_OPTIONS: FirstDayOption[] = [
  { id: "sunday",    label: "Sunday" },
  { id: "monday",    label: "Monday" },
  { id: "tuesday",   label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday",  label: "Thursday" },
  { id: "friday",    label: "Friday" },
  { id: "saturday",  label: "Saturday" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface LocaleContextType {
  dateFormat: DateFormatId;
  firstDayOfWeek: FirstDayOfWeek;
  numberFormat: NumberFormatId;
  setDateFormat: (id: DateFormatId) => Promise<void>;
  setFirstDayOfWeek: (id: FirstDayOfWeek) => Promise<void>;
  setNumberFormat: (id: NumberFormatId) => Promise<void>;
  /** Format a "YYYY-MM-DD" string to the user's chosen date format. */
  formatDate: (dateStr: string) => string;
  /** Format a plain number (not minor-units) to the user's chosen number format. */
  formatNumber: (value: number, decimals?: number) => string;
}

const STORAGE_DATE_FORMAT = "@mywallet_locale_date_format";
const STORAGE_FIRST_DAY = "@mywallet_locale_first_day";
const STORAGE_NUMBER_FORMAT = "@mywallet_locale_number_format";

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormatId>("DD/MM/YYYY");
  const [firstDayOfWeek, setFirstDayState] = useState<FirstDayOfWeek>("sunday");
  const [numberFormat, setNumberFormatState] = useState<NumberFormatId>("en-US");

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const [df, fd, nf] = await Promise.all([
          AsyncStorage.getItem(STORAGE_DATE_FORMAT),
          AsyncStorage.getItem(STORAGE_FIRST_DAY),
          AsyncStorage.getItem(STORAGE_NUMBER_FORMAT),
        ]);
        if (df && DATE_FORMAT_OPTIONS.find((o) => o.id === df))
          setDateFormatState(df as DateFormatId);
        if (fd && FIRST_DAY_OPTIONS.find((o) => o.id === fd))
          setFirstDayState(fd as FirstDayOfWeek);
        if (nf && NUMBER_FORMAT_OPTIONS.find((o) => o.id === nf))
          setNumberFormatState(nf as NumberFormatId);
      } catch {}
    })();
  }, []);

  const setDateFormat = useCallback(async (id: DateFormatId) => {
    setDateFormatState(id);
    try { await AsyncStorage.setItem(STORAGE_DATE_FORMAT, id); } catch {}
  }, []);

  const setFirstDayOfWeek = useCallback(async (id: FirstDayOfWeek) => {
    setFirstDayState(id);
    try { await AsyncStorage.setItem(STORAGE_FIRST_DAY, id); } catch {}
  }, []);

  const setNumberFormat = useCallback(async (id: NumberFormatId) => {
    setNumberFormatState(id);
    try { await AsyncStorage.setItem(STORAGE_NUMBER_FORMAT, id); } catch {}
  }, []);

  const formatDate = useCallback((dateStr: string): string => {
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
      case "MM/DD/YYYY": return `${weekday}, ${mm}/${dd}/${yyyy}`;
      case "DD/MM/YYYY": return `${weekday}, ${dd}/${mm}/${yyyy}`;
      case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
      case "D MMM YYYY": return `${weekday}, ${d.getDate()} ${monthShort} ${yyyy}`;
    }
  }, [dateFormat]);

  const formatNumber = useCallback((value: number, decimals = 2): string => {
    try {
      return value.toLocaleString(numberFormat, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    } catch {
      return value.toFixed(decimals);
    }
  }, [numberFormat]);

  return (
    <LocaleContext.Provider
      value={{
        dateFormat,
        firstDayOfWeek,
        numberFormat,
        setDateFormat,
        setFirstDayOfWeek,
        setNumberFormat,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
