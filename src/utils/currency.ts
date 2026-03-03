/**
 * Currency formatting utilities.
 * All amounts are stored in minor units (cents). Divide by 100 for display.
 */

const MINOR_UNIT_DIVISOR = 100;

/** Symbol map for common currencies */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "Fr",
  CNY: "¥",
  INR: "₹",
  MXN: "MX$",
  BRL: "R$",
  SAR: "SR",
  AED: "AED",
  TRY: "₺",
  NGN: "₦",
  ZAR: "R",
  EGP: "E£",
  MAD: "MAD",
  DZD: "DA",
  USDT: "₮",
};

/** Currencies whose symbol goes AFTER the number (e.g. "1,234 DA") */
const SUFFIX_CURRENCIES = new Set([
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "INR",
  "MXN",
  "BRL",
  "SAR",
  "AED",
  "TRY",
  "NGN",
  "ZAR",
  "EGP",
  "MAD",
  "DZD",
  "USDT",
]);

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

export function isSuffixCurrency(currency: string): boolean {
  return SUFFIX_CURRENCIES.has(currency.toUpperCase());
}

/**
 * Format minor units to a human-readable string.
 * e.g. 123450 (USD) → "$1,234.50"
 */
export function formatAmount(
  minorUnits: number,
  currency: string,
  options: { showSign?: boolean; compact?: boolean } = {},
): string {
  const { showSign = false, compact = false } = options;
  const symbol = getCurrencySymbol(currency);
  // Currencies stored without sub-units (minor unit = 1, no ×100 storage)
  const isNoSubUnit = ["JPY", "KRW", "VND"].includes(currency.toUpperCase());
  // Currencies that should display as whole numbers (no ".00") even if stored ×100
  const isNoCents =
    isNoSubUnit || ["DZD", "MAD"].includes(currency.toUpperCase());
  const divisor = isNoSubUnit ? 1 : MINOR_UNIT_DIVISOR;
  const value = Math.abs(minorUnits) / divisor;
  const sign = minorUnits < 0 ? "-" : showSign && minorUnits > 0 ? "+" : "";

  let formatted: string;
  if (compact) {
    if (value >= 1_000_000) {
      formatted = `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      formatted = `${(value / 1_000).toFixed(1)}K`;
    } else {
      formatted = isNoCents ? value.toFixed(0) : value.toFixed(2);
    }
  } else {
    formatted = isNoCents
      ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }

  return isSuffixCurrency(currency)
    ? `${sign}${formatted} ${symbol}`
    : `${sign}${symbol}${formatted}`;
}

/**
 * Format as "+$1,234.50" / "-$1,234.50" with explicit sign.
 */
export function formatAmountSigned(
  minorUnits: number,
  currency: string,
): string {
  return formatAmount(minorUnits, currency, { showSign: true });
}

/**
 * Convert from one currency to another using the rate map.
 * rateMap: { "EUR": 1.08 } means 1 EUR = 1.08 USD (when base is USD).
 */
export function convertToBase(
  minorUnits: number,
  fromCurrency: string,
  baseCurrency: string,
  rates: Record<string, number>,
): number {
  if (fromCurrency === baseCurrency) return minorUnits;
  const rate = rates[fromCurrency] ?? 1;
  return Math.round(minorUnits * rate);
}

/**
 * Convert from baseCurrency to a target currency.
 * rateMap: { "EUR": 1.08 } means 1 EUR = 1.08 USD (when base is USD),
 * so to convert to EUR: divide by the EUR rate.
 */
export function convertFromBase(
  minorUnits: number,
  targetCurrency: string,
  baseCurrency: string,
  rates: Record<string, number>,
): number {
  if (targetCurrency === baseCurrency) return minorUnits;
  const rate = rates[targetCurrency] ?? 1;
  return Math.round(minorUnits / rate);
}

/** Parse "YYYY-MM-DD" to a Date object. */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Return "YYYY-MM-DD" for a Date object. */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Human-readable date label: "Today", "Yesterday", or "Mon, Feb 24" */
export function formatDateLabel(dateStr: string): string {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86_400_000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** e.g. "February 2026" */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
