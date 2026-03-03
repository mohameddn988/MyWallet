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
  /** Active (non-archived) accounts with computed balances */
  accounts: AccountWithBalance[];
  /** All accounts including archived (raw) */
  allAccounts: Account[];
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
  // ── Transaction CRUD ──
  addTransaction: (tx: Omit<Transaction, "id">) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (id: string) => Promise<Transaction>;
  getTransactionsByCategoryId: (categoryId: string) => Transaction[];
  reassignTransactionsCategory: (
    fromCategoryId: string,
    toCategoryId: string,
    toCategoryName: string,
    toCategoryIcon?: string,
    toCategoryColor?: string,
  ) => Promise<void>;
  // ── Account CRUD ──
  addAccount: (data: Omit<Account, "id">) => Promise<Account>;
  updateAccount: (account: Account) => Promise<void>;
  /** Throws if transactions reference this account */
  deleteAccount: (id: string) => Promise<void>;
  /** Upsert an exchange rate */
  updateExchangeRate: (rate: ExchangeRate) => Promise<void>;
  /** Change the base currency, recalculating all exchange rates */
  updateBaseCurrency: (newBase: string) => Promise<void>;
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
  const [isLoading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  // Raw data — loaded from AsyncStorage (onboarding setup) or falls back to seed data
  const [rawBase, setRawBase] = useState<string>(BASE_CURRENCY);
  const [rawAccounts, setRawAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [rawRates, setRawRates] = useState<ExchangeRate[]>(
    INITIAL_EXCHANGE_RATES,
  );
  const [rawTransactions, setRawTransactions] =
    useState<Transaction[]>(INITIAL_TRANSACTIONS);

  const completeOnboarding = useCallback(async (setup: FinanceSetup) => {
    if (setup.baseCurrency) setRawBase(setup.baseCurrency);
    if (Array.isArray(setup.accounts) && setup.accounts.length > 0)
      setRawAccounts(setup.accounts);
    if (Array.isArray(setup.exchangeRates)) setRawRates(setup.exchangeRates);
    if (Array.isArray(setup.transactions))
      setRawTransactions(setup.transactions);
    setHasCompleted(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Balance helpers
  // ─────────────────────────────────────────────────────────────────────────

  function applyTx(accs: Account[], tx: Transaction, dir: 1 | -1): Account[] {
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
      setRawAccounts((prev) => applyTx(prev, tx, 1));
      setRawTransactions((prev) => [...prev, tx]);
      return tx;
    },
    [],
  );

  const updateTransaction = useCallback(
    async (tx: Transaction): Promise<void> => {
      setRawAccounts((prevAccs) => {
        const old = rawTransactions.find((t) => t.id === tx.id);
        let updated = prevAccs;
        if (old) updated = applyTx(updated, old, -1);
        return applyTx(updated, tx, 1);
      });
      setRawTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    },
    [rawTransactions],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      const tx = rawTransactions.find((t) => t.id === id);
      if (tx) setRawAccounts((prev) => applyTx(prev, tx, -1));
      setRawTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [rawTransactions],
  );

  const duplicateTransaction = useCallback(
    async (id: string): Promise<Transaction> => {
      const src = rawTransactions.find((t) => t.id === id);
      if (!src) throw new Error("Transaction not found");
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      const dup: Transaction = { ...src, id: `tx_${Date.now()}`, date: todayStr };
      setRawAccounts((prev) => applyTx(prev, dup, 1));
      setRawTransactions((prev) => [...prev, dup]);
      return dup;
    },
    [rawTransactions],
  );

  const getTransactionsByCategoryId = useCallback(
    (categoryId: string): Transaction[] => {
      return rawTransactions.filter((t) => t.categoryId === categoryId);
    },
    [rawTransactions],
  );

  const reassignTransactionsCategory = useCallback(
    async (
      fromCategoryId: string,
      toCategoryId: string,
      toCategoryName: string,
      toCategoryIcon?: string,
      toCategoryColor?: string,
    ): Promise<void> => {
      setRawTransactions((prev) =>
        prev.map((t) =>
          t.categoryId === fromCategoryId
            ? {
                ...t,
                categoryId: toCategoryId,
                categoryName: toCategoryName,
                categoryIcon: toCategoryIcon,
                categoryColor: toCategoryColor,
              }
            : t,
        ),
      );
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Account CRUD
  // ─────────────────────────────────────────────────────────────────────────

  const addAccount = useCallback(
    async (data: Omit<Account, "id">): Promise<Account> => {
      const account: Account = { ...data, id: `acc_${Date.now()}` };
      setRawAccounts((prev) => [...prev, account]);
      return account;
    },
    [],
  );

  const updateAccount = useCallback(
    async (account: Account): Promise<void> => {
      setRawAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
    },
    [],
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<void> => {
      const hasTransactions = rawTransactions.some(
        (t) => t.accountId === id || t.toAccountId === id,
      );
      if (hasTransactions) {
        throw new Error(
          "Cannot delete an account that has transactions. Archive it instead.",
        );
      }
      setRawAccounts((prev) => prev.filter((a) => a.id !== id));
    },
    [rawTransactions],
  );

  const updateExchangeRate = useCallback(
    async (rate: ExchangeRate): Promise<void> => {
      setRawRates((prev) => {
        const exists = prev.some((r) => r.from === rate.from);
        return exists ? prev.map((r) => (r.from === rate.from ? rate : r)) : [...prev, rate];
      });
    },
    [],
  );

  const updateBaseCurrency = useCallback(
    async (newBase: string): Promise<void> => {
      if (newBase === rawBase) return;
      const rateMap = buildRateMap(rawRates);

      // Rate of the new base expressed in old base (e.g. EUR→DZD = 147)
      const newBaseInOldBase = rateMap[newBase] ?? 1;

      // Recalculate every existing rate so they point to the new base
      const recalculated: ExchangeRate[] = rawRates
        .filter((r) => r.from !== newBase) // drop the rate whose `from` is the new base
        .map((r) => ({
          ...r,
          to: newBase,
          rate: r.rate / newBaseInOldBase,
          lastUpdated: new Date().toISOString().slice(0, 10),
        }));

      // Add a rate for the old base → new base
      recalculated.push({
        from: rawBase,
        to: newBase,
        rate: 1 / newBaseInOldBase,
        lastUpdated: new Date().toISOString().slice(0, 10),
        isUserDefined: false,
      });

      setRawBase(newBase);
      setRawRates(recalculated);
    },
    [rawBase, rawRates],
  );

  const resetOnboarding = useCallback(async () => {
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
    const allAccounts = rawAccounts;

    return {
      baseCurrency: base,
      exchangeRates: rawRates,
      accounts,
      allAccounts,
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
        getTransactionsByCategoryId,
        reassignTransactionsCategory,
        addAccount,
        updateAccount,
        deleteAccount,
        updateExchangeRate,
        updateBaseCurrency,
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
