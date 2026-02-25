import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  BASE_CURRENCY,
  INITIAL_ACCOUNTS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_TRANSACTIONS,
} from "../data/financeData";
import {
  Account,
  AccountWithBalance,
  CurrencySubtotal,
  ExchangeRate,
  MonthSummary,
  QuickStats,
  Transaction,
} from "../types/finance";
import { convertToBase, toDateStr } from "../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Context types
// ─────────────────────────────────────────────────────────────────────────────

interface FinanceContextType {
  baseCurrency: string;
  exchangeRates: ExchangeRate[];
  accounts: AccountWithBalance[];
  perCurrencySubtotals: CurrencySubtotal[];
  /** Net worth in base currency minor units */
  netWorth: number;
  monthSummary: MonthSummary;
  quickStats: QuickStats;
  recentTransactions: Transaction[];
  isRefreshing: boolean;
  refresh: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildRateMap(rates: ExchangeRate[]): Record<string, number> {
  return Object.fromEntries(rates.map((r) => [r.from, r.rate]));
}

function computeAccounts(
  accounts: Account[],
  rateMap: Record<string, number>,
  base: string,
): AccountWithBalance[] {
  return accounts
    .filter((a) => !a.isArchived)
    .map((a) => ({
      account: a,
      balance: a.balance,
      balanceInBase: convertToBase(a.balance, a.currency, base, rateMap),
    }));
}

function computeNetWorth(accounts: AccountWithBalance[]): number {
  // Only count liquid assets — exclude loans (receivables) and charity (earmarked)
  return accounts
    .filter((aw) => aw.account.type !== "loan" && aw.account.type !== "charity")
    .reduce((sum, a) => sum + a.balanceInBase, 0);
}

function computePerCurrencySubtotals(
  accounts: AccountWithBalance[],
  rateMap: Record<string, number>,
  base: string,
): CurrencySubtotal[] {
  // Only include liquid assets in subtotals
  const liquidAccounts = accounts.filter(
    (aw) => aw.account.type !== "loan" && aw.account.type !== "charity",
  );
  const map = new Map<string, CurrencySubtotal>();
  for (const aw of liquidAccounts) {
    const cur = aw.account.currency;
    const existing = map.get(cur) ?? {
      currency: cur,
      totalNative: 0,
      totalInBase: 0,
    };
    existing.totalNative += aw.balance;
    existing.totalInBase += aw.balanceInBase;
    map.set(cur, existing);
  }
  return [...map.values()];
}

function getStartOfDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function computeMonthSummary(
  transactions: Transaction[],
  rateMap: Record<string, number>,
  base: string,
  now: Date,
): MonthSummary {
  const month = now.getMonth();
  const year = now.getFullYear();
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    const d = getStartOfDay(tx.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    if (tx.type === "transfer") continue;
    const inBase = convertToBase(tx.amount, tx.currency, base, rateMap);
    if (tx.type === "income") income += inBase;
    else expense += inBase;
  }
  return { income, expense, net: income - expense };
}

function computeQuickStats(
  transactions: Transaction[],
  rateMap: Record<string, number>,
  base: string,
  now: Date,
): QuickStats {
  const todayStr = toDateStr(now);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);

  const month = now.getMonth();
  const year = now.getFullYear();

  let today = 0;
  let week = 0;
  let month_ = 0;

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const d = getStartOfDay(tx.date);
    const inBase = convertToBase(tx.amount, tx.currency, base, rateMap);

    if (tx.date === todayStr) today += inBase;
    if (d >= weekAgo && d <= now) week += inBase;
    if (d.getFullYear() === year && d.getMonth() === month) month_ += inBase;
  }
  return { today, week, month: month_ };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsRefreshing(false);
    }, 1200);
  }, []);

  const value = useMemo(() => {
    // Suppress unused variable warning for refreshKey
    void refreshKey;

    const base = BASE_CURRENCY;
    const rateMap = buildRateMap(INITIAL_EXCHANGE_RATES);
    const accounts = computeAccounts(INITIAL_ACCOUNTS, rateMap, base);
    const netWorth = computeNetWorth(accounts);
    const perCurrencySubtotals = computePerCurrencySubtotals(
      accounts,
      rateMap,
      base,
    );
    const now = new Date();
    const monthSummary = computeMonthSummary(
      INITIAL_TRANSACTIONS,
      rateMap,
      base,
      now,
    );
    const quickStats = computeQuickStats(
      INITIAL_TRANSACTIONS,
      rateMap,
      base,
      now,
    );
    const recentTransactions = [...INITIAL_TRANSACTIONS]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);

    return {
      baseCurrency: base,
      exchangeRates: INITIAL_EXCHANGE_RATES,
      accounts,
      perCurrencySubtotals,
      netWorth,
      monthSummary,
      quickStats,
      recentTransactions,
      isRefreshing,
      refresh,
    };
  }, [refreshKey, isRefreshing, refresh]);

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
