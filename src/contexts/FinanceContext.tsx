import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  PeriodSummary,
  QuickStats,
  Transaction,
} from "../types/finance";
import { convertToBase, toDateStr } from "../utils/currency";

const FINANCE_SETUP_KEY = "@mywallet_finance_setup";
const ONBOARDING_KEY = "@mywallet_onboarding_complete";

// ─────────────────────────────────────────────────────────────────────────────
// Setup type
// ─────────────────────────────────────────────────────────────────────────────

export interface FinanceSetup {
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
  useSampleData: boolean;
}

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
  /** All transactions sorted newest-first */
  allTransactions: Transaction[];
  isRefreshing: boolean;
  refresh: () => void;
  /** True while the initial AsyncStorage read is in progress */
  isLoading: boolean;
  /** True once the user has completed onboarding */
  hasCompleted: boolean;
  completeOnboarding: (setup: FinanceSetup) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (id: string) => Promise<Transaction>;
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

function makePeriod(): PeriodSummary {
  return { income: 0, expense: 0, net: 0 };
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

  const today = makePeriod();
  const week = makePeriod();
  const month_ = makePeriod();

  for (const tx of transactions) {
    if (tx.type === "transfer") continue;
    const d = getStartOfDay(tx.date);
    const inBase = convertToBase(tx.amount, tx.currency, base, rateMap);
    const isIncome = tx.type === "income";

    const addTo = (p: PeriodSummary) => {
      if (isIncome) p.income += inBase;
      else p.expense += inBase;
    };

    if (tx.date === todayStr) addTo(today);
    if (d >= weekAgo && d <= now) addTo(week);
    if (d.getFullYear() === year && d.getMonth() === month) addTo(month_);
  }

  today.net = today.income - today.expense;
  week.net = week.income - week.expense;
  month_.net = month_.income - month_.expense;

  return { today, week, month: month_ };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Raw data — loaded from AsyncStorage (onboarding setup) or falls back to seed data
  const [rawBase, setRawBase] = useState<string>(BASE_CURRENCY);
  const [rawAccounts, setRawAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [rawRates, setRawRates] = useState<ExchangeRate[]>(
    INITIAL_EXCHANGE_RATES,
  );
  const [rawTransactions, setRawTransactions] =
    useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Load persisted finance setup + onboarding flag on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [stored, flag] = await Promise.all([
          AsyncStorage.getItem(FINANCE_SETUP_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);
        if (stored) {
          const setup: FinanceSetup = JSON.parse(stored);
          if (setup.baseCurrency) setRawBase(setup.baseCurrency);
          if (Array.isArray(setup.accounts) && setup.accounts.length > 0)
            setRawAccounts(setup.accounts);
          if (Array.isArray(setup.exchangeRates))
            setRawRates(setup.exchangeRates);
          if (Array.isArray(setup.transactions))
            setRawTransactions(setup.transactions);
        }
        setHasCompleted(flag === "true");
      } catch {
        // ignore storage errors
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const completeOnboarding = useCallback(async (setup: FinanceSetup) => {
    await AsyncStorage.setItem(FINANCE_SETUP_KEY, JSON.stringify(setup));
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    if (setup.baseCurrency) setRawBase(setup.baseCurrency);
    if (Array.isArray(setup.accounts) && setup.accounts.length > 0)
      setRawAccounts(setup.accounts);
    if (Array.isArray(setup.exchangeRates)) setRawRates(setup.exchangeRates);
    if (Array.isArray(setup.transactions))
      setRawTransactions(setup.transactions);
    setHasCompleted(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Persistence helper
  // ─────────────────────────────────────────────────────────────────────────

  const persist = useCallback(
    async (accounts: Account[], transactions: Transaction[]) => {
      const setup: FinanceSetup = {
        baseCurrency: rawBase,
        accounts,
        exchangeRates: rawRates,
        transactions,
        useSampleData: false,
      };
      await AsyncStorage.setItem(FINANCE_SETUP_KEY, JSON.stringify(setup));
    },
    [rawBase, rawRates],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Balance helpers
  // ─────────────────────────────────────────────────────────────────────────

  function applyTx(
    accs: Account[],
    tx: Transaction,
    dir: 1 | -1,
  ): Account[] {
    return accs.map((acc) => {
      if (tx.type === "expense" && acc.id === tx.accountId)
        return { ...acc, balance: acc.balance - dir * tx.amount };
      if (tx.type === "income" && acc.id === tx.accountId)
        return { ...acc, balance: acc.balance + dir * tx.amount };
      if (tx.type === "transfer") {
        if (acc.id === tx.accountId)
          return { ...acc, balance: acc.balance - dir * tx.amount };
        if (acc.id === tx.toAccountId)
          return { ...acc, balance: acc.balance + dir * tx.amount };
      }
      return acc;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, "id">): Promise<Transaction> => {
      const tx: Transaction = { ...txData, id: `tx_${Date.now()}` };
      const newAccounts = applyTx(rawAccounts, tx, 1);
      const newTransactions = [...rawTransactions, tx];
      setRawAccounts(newAccounts);
      setRawTransactions(newTransactions);
      await persist(newAccounts, newTransactions);
      return tx;
    },
    [rawAccounts, rawTransactions, persist],
  );

  const updateTransaction = useCallback(
    async (tx: Transaction): Promise<void> => {
      const old = rawTransactions.find((t) => t.id === tx.id);
      let newAccounts = rawAccounts;
      if (old) newAccounts = applyTx(newAccounts, old, -1); // undo old
      newAccounts = applyTx(newAccounts, tx, 1); // apply new
      const newTransactions = rawTransactions.map((t) =>
        t.id === tx.id ? tx : t,
      );
      setRawAccounts(newAccounts);
      setRawTransactions(newTransactions);
      await persist(newAccounts, newTransactions);
    },
    [rawAccounts, rawTransactions, persist],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      const tx = rawTransactions.find((t) => t.id === id);
      let newAccounts = rawAccounts;
      if (tx) newAccounts = applyTx(newAccounts, tx, -1); // undo
      const newTransactions = rawTransactions.filter((t) => t.id !== id);
      setRawAccounts(newAccounts);
      setRawTransactions(newTransactions);
      await persist(newAccounts, newTransactions);
    },
    [rawAccounts, rawTransactions, persist],
  );

  const duplicateTransaction = useCallback(
    async (id: string): Promise<Transaction> => {
      const src = rawTransactions.find((t) => t.id === id);
      if (!src) throw new Error("Transaction not found");
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      const dup: Transaction = { ...src, id: `tx_${Date.now()}`, date: todayStr };
      const newAccounts = applyTx(rawAccounts, dup, 1);
      const newTransactions = [...rawTransactions, dup];
      setRawAccounts(newAccounts);
      setRawTransactions(newTransactions);
      await persist(newAccounts, newTransactions);
      return dup;
    },
    [rawAccounts, rawTransactions, persist],
  );

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, FINANCE_SETUP_KEY]);
    setHasCompleted(false);
    setRawBase(BASE_CURRENCY);
    setRawAccounts(INITIAL_ACCOUNTS);
    setRawRates(INITIAL_EXCHANGE_RATES);
    setRawTransactions(INITIAL_TRANSACTIONS);
  }, []);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsRefreshing(false);
    }, 1200);
  }, []);

  const value = useMemo(() => {
    void refreshKey;

    const base = rawBase;
    const rateMap = buildRateMap(rawRates);
    const accounts = computeAccounts(rawAccounts, rateMap, base);
    const netWorth = computeNetWorth(accounts);
    const perCurrencySubtotals = computePerCurrencySubtotals(
      accounts,
      rateMap,
      base,
    );
    const now = new Date();
    const monthSummary = computeMonthSummary(
      rawTransactions,
      rateMap,
      base,
      now,
    );
    const quickStats = computeQuickStats(rawTransactions, rateMap, base, now);
    const sorted = [...rawTransactions].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    const recentTransactions = sorted.slice(0, 12);
    const allTransactions = sorted;

    return {
      baseCurrency: base,
      exchangeRates: rawRates,
      accounts,
      perCurrencySubtotals,
      netWorth,
      monthSummary,
      quickStats,
      recentTransactions,
      allTransactions,
      isRefreshing,
      refresh,
    };
  }, [
    refreshKey,
    isRefreshing,
    refresh,
    rawBase,
    rawAccounts,
    rawRates,
    rawTransactions,
  ]);

  return (
    <FinanceContext.Provider
      value={{
        ...value,
        isLoading,
        hasCompleted,
        completeOnboarding,
        resetOnboarding,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        duplicateTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
