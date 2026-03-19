import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Account,
  AccountWithBalance,
  CurrencySubtotal,
  ExchangeRate,
  LoanDirection,
  MonthSummary,
  PeriodSummary,
  QuickStats,
  SubAccount,
  Transaction,
} from "../types/finance";
import { apiUrl } from "../lib/apiUrl";
import { auth } from "../utils/auth";
import {
  deleteLocalWallet,
  getRealm,
  readLocalWallet,
  writeLocalWallet,
  type LocalWalletState,
} from "../lib/realm";
import { useAuth } from "./AuthContext";
import { useLocale } from "./LocaleContext";
import { DataConflictModal } from "../components/ui/DataConflictModal";
import { convertFromBase, convertToBase, toDateStr } from "../utils/currency";

const DEFAULT_BASE_CURRENCY = "DZD";

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

interface WalletStatePayload {
  hasCompleted: boolean;
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
  settings?: {
    dateFormat?: string;
    firstDayOfWeek?: string;
    numberFormat?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Context types
// ─────────────────────────────────────────────────────────────────────────────

interface FinanceContextType {
  baseCurrency: string;
  /** The currency currently shown in the UI (can differ from baseCurrency) */
  displayCurrency: string;
  /** List of unique currencies from all active accounts */
  availableCurrencies: string[];
  setDisplayCurrency: (currency: string) => void;
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
  lastDeletedTransaction: Transaction | null;
  restoreLastDeleted: () => Promise<void>;
  clearLastDeleted: () => void;
  duplicateTransaction: (id: string) => Promise<Transaction>;
  // ── Account CRUD ──
  addAccount: (data: Omit<Account, "id">) => Promise<Account>;
  updateAccount: (account: Account) => Promise<void>;
  /** Throws if transactions reference this account */
  deleteAccount: (id: string) => Promise<void>;
  // ── Sub-account CRUD (for loans) ──
  addSubAccount: (accountId: string, sub: SubAccount) => Promise<void>;
  updateSubAccount: (
    accountId: string,
    index: number,
    sub: SubAccount,
  ) => Promise<void>;
  removeSubAccount: (accountId: string, index: number) => Promise<void>;
  /** Check if a loan account with the given direction already exists */
  hasLoanDirection: (direction: LoanDirection) => boolean;
  /** Upsert an exchange rate */
  updateExchangeRate: (rate: ExchangeRate) => Promise<void>;
  /** Change the base currency, recalculating all exchange rates */
  updateBaseCurrency: (newBase: string) => Promise<void>;
  /** Prank mode: everything shows 0 until reload */
  eggZeroMode: boolean;
  triggerEggZero: () => void;
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
  const {
    authMode,
    user,
    getAccessToken,
    commitPendingGoogleSignIn,
    cancelPendingGoogleSignIn,
  } = useAuth();
  const {
    dateFormat,
    firstDayOfWeek,
    numberFormat,
    setDateFormat,
    setFirstDayOfWeek,
    setNumberFormat,
  } = useLocale();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Raw data — populated via completeOnboarding() after the user finishes setup
  const [rawBase, setRawBase] = useState<string>(DEFAULT_BASE_CURRENCY);
  const [rawAccounts, setRawAccounts] = useState<Account[]>([]);
  const [rawRates, setRawRates] = useState<ExchangeRate[]>([]);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [lastDeletedTransaction, setLastDeletedTransaction] =
    useState<Transaction | null>(null);
  const [eggZeroMode, setEggZeroMode] = useState(false);
  const triggerEggZero = useCallback(() => setEggZeroMode(true), []);
  const hasBootstrappedCloud = useRef(false);
  const isBootstrapping = useRef(true);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realmRef = useRef<Awaited<ReturnType<typeof getRealm>> | null>(null);

  // Migration conflict state
  const [migrationConflict, setMigrationConflict] = useState<{
    localData: LocalWalletState;
    cloudData: WalletStatePayload;
  } | null>(null);

  /** The currency the user has chosen to view amounts in */
  const [displayCurrency, setDisplayCurrency] = useState<string>(
    DEFAULT_BASE_CURRENCY,
  );

  const authedFetchJSON = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing auth token");
      }

      const headers = new Headers(init.headers ?? {});
      headers.set("Authorization", `Bearer ${token}`);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(apiUrl(path), {
        ...init,
        headers,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          data && typeof data.error === "string"
            ? data.error
            : `Request failed (${response.status})`;
        throw new Error(message);
      }

      return data as T;
    },
    [getAccessToken],
  );

  const syncCloudState = useCallback(
    async (payload: WalletStatePayload) => {
      await authedFetchJSON<WalletStatePayload>("/api/finance/state", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    [authedFetchJSON],
  );

  const loadCloudState = useCallback(async () => {
    const cloudState = await authedFetchJSON<WalletStatePayload>(
      "/api/finance/state",
      { method: "GET" },
    );
    return cloudState;
  }, [authedFetchJSON]);

  /** Apply a WalletStatePayload to all local React state + locale settings. */
  const applyCloudState = useCallback(
    async (cloudState: WalletStatePayload) => {
      setRawBase(cloudState.baseCurrency || DEFAULT_BASE_CURRENCY);
      setDisplayCurrency(cloudState.baseCurrency || DEFAULT_BASE_CURRENCY);
      setRawAccounts(
        Array.isArray(cloudState.accounts) ? cloudState.accounts : [],
      );
      setRawRates(
        Array.isArray(cloudState.exchangeRates) ? cloudState.exchangeRates : [],
      );
      setRawTransactions(
        Array.isArray(cloudState.transactions) ? cloudState.transactions : [],
      );
      setHasCompleted(Boolean(cloudState.hasCompleted));

      if (cloudState.settings) {
        const s = cloudState.settings;
        if (s.dateFormat) void setDateFormat(s.dateFormat as any);
        if (s.firstDayOfWeek) void setFirstDayOfWeek(s.firstDayOfWeek as any);
        if (s.numberFormat) void setNumberFormat(s.numberFormat as any);
      }

      if (cloudState.hasCompleted) {
        await auth.setSetupCompleted();
      } else {
        await auth.resetSetup();
      }
    },
    [setDateFormat, setFirstDayOfWeek, setNumberFormat],
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // Block the persist effect until bootstrap finishes reading from Realm
      isBootstrapping.current = true;

      // Always open Realm first so we have local data available
      const realm = await getRealm();
      if (cancelled) return;
      realmRef.current = realm;

      if (authMode === "online" && user) {
        setIsLoading(true);
        hasBootstrappedCloud.current = false;

        // Load cached Realm data for this cloud user (instant startup)
        const cachedCloud = readLocalWallet(realm, user.id);
        if (cachedCloud && !cancelled) {
          setRawBase(cachedCloud.baseCurrency);
          setDisplayCurrency(cachedCloud.baseCurrency);
          setRawAccounts(cachedCloud.accounts);
          setRawRates(cachedCloud.exchangeRates);
          setRawTransactions(cachedCloud.transactions);
          setHasCompleted(cachedCloud.hasCompleted);
        }

        try {
          const cloudState = await loadCloudState();
          if (cancelled) return;

          await applyCloudState(cloudState);

          if (!cancelled) {
            hasBootstrappedCloud.current = true;
          }
        } catch (error) {
          console.error("[Finance] Failed to bootstrap cloud state:", error);
        } finally {
          if (!cancelled) {
            isBootstrapping.current = false;
            setIsLoading(false);
          }
        }
        return;
      }

      if (authMode === "pending-online" && user) {
        setIsLoading(true);
        hasBootstrappedCloud.current = false;

        // Check if there is local offline data that could be migrated
        const localOffline = readLocalWallet(realm, "local");
        const localHasData =
          localOffline &&
          (localOffline.accounts.length > 0 ||
            localOffline.transactions.length > 0);

        try {
          const cloudState = await loadCloudState();
          if (cancelled) return;

          const cloudHasData =
            (Array.isArray(cloudState.accounts) &&
              cloudState.accounts.length > 0) ||
            (Array.isArray(cloudState.transactions) &&
              cloudState.transactions.length > 0);

          if (localHasData && !cloudHasData) {
            // Local has data, cloud is empty → push local to cloud
            const payload: WalletStatePayload = {
              hasCompleted: true,
              baseCurrency: localOffline!.baseCurrency,
              accounts: localOffline!.accounts,
              exchangeRates: localOffline!.exchangeRates,
              transactions: localOffline!.transactions,
              settings: localOffline!.settings,
            };
            await applyCloudState(payload);
            await syncCloudState(payload);
            await commitPendingGoogleSignIn();
            // Clean up local offline entry
            deleteLocalWallet(realm, "local");
          } else if (!localHasData && cloudHasData) {
            // Cloud has data, local is empty → use cloud (normal)
            await applyCloudState(cloudState);
            await commitPendingGoogleSignIn();
          } else if (localHasData && cloudHasData) {
            // Both have data → wait for explicit user confirmation before connecting
            setMigrationConflict({
              localData: localOffline!,
              cloudData: cloudState,
            });
          } else {
            // Neither has data → apply cloud defaults
            await applyCloudState(cloudState);
            await commitPendingGoogleSignIn();
          }

          if (!cancelled) {
            hasBootstrappedCloud.current = true;
          }
        } catch (error) {
          console.error("[Finance] Failed to bootstrap cloud state:", error);
        } finally {
          if (!cancelled) {
            isBootstrapping.current = false;
            setIsLoading(false);
          }
        }
        return;
      }

      hasBootstrappedCloud.current = false;

      if (authMode === "offline") {
        // Load from Realm for full offline persistence
        const local = readLocalWallet(realm, "local");
        console.log("[Realm]", JSON.stringify(local, null, 2));
        if (local && !cancelled) {
          setRawBase(local.baseCurrency);
          setDisplayCurrency(local.baseCurrency);
          setRawAccounts(local.accounts);
          setRawRates(local.exchangeRates);
          setRawTransactions(local.transactions);
          setHasCompleted(local.hasCompleted);
          if (local.settings) {
            const s = local.settings;
            if (s.dateFormat) void setDateFormat(s.dateFormat as any);
            if (s.firstDayOfWeek)
              void setFirstDayOfWeek(s.firstDayOfWeek as any);
            if (s.numberFormat) void setNumberFormat(s.numberFormat as any);
          }
          if (local.hasCompleted) {
            await auth.setSetupCompleted();
          }
        }
        if (!cancelled) {
          isBootstrapping.current = false;
          setIsLoading(false);
        }
        return;
      }

      setRawBase(DEFAULT_BASE_CURRENCY);
      setDisplayCurrency(DEFAULT_BASE_CURRENCY);
      setRawAccounts([]);
      setRawRates([]);
      setRawTransactions([]);
      setHasCompleted(false);
      isBootstrapping.current = false;
      setIsLoading(false);
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    authMode,
    user,
    user?.id,
    loadCloudState,
    applyCloudState,
    syncCloudState,
    commitPendingGoogleSignIn,
    setDateFormat,
    setFirstDayOfWeek,
    setNumberFormat,
  ]);

  /** Resolve a migration conflict by choosing local or cloud data. */
  const resolveMigrationConflict = useCallback(
    async (choice: "local" | "cloud") => {
      if (!migrationConflict) return;
      const { localData, cloudData } = migrationConflict;

      if (choice === "local") {
        // Push local offline data to cloud, replacing cloud data
        const payload: WalletStatePayload = {
          hasCompleted: true,
          baseCurrency: localData.baseCurrency,
          accounts: localData.accounts,
          exchangeRates: localData.exchangeRates,
          transactions: localData.transactions,
          settings: localData.settings,
        };
        await applyCloudState(payload);
        await syncCloudState(payload);
      } else {
        // Keep cloud data after the user explicitly confirms it
        await applyCloudState(cloudData);
      }

      await commitPendingGoogleSignIn();

      // Clean up local offline entry
      if (realmRef.current) {
        deleteLocalWallet(realmRef.current, "local");
      }

      setMigrationConflict(null);
    },
    [migrationConflict, applyCloudState, syncCloudState, commitPendingGoogleSignIn],
  );

  // Persist all state to Realm whenever it changes (after initial load)
  useEffect(() => {
    if (isLoading || isBootstrapping.current || !realmRef.current || authMode === null) return;
    const userId = authMode === "offline"
      ? "local"
      : authMode === "online"
        ? (user?.id ?? null)
        : null;
    if (!userId) return;

    const state: LocalWalletState = {
      hasCompleted,
      baseCurrency: rawBase,
      accounts: rawAccounts,
      exchangeRates: rawRates,
      transactions: rawTransactions,
      settings: { dateFormat, firstDayOfWeek, numberFormat },
    };

    writeLocalWallet(realmRef.current, userId, state);
  }, [
    isLoading,
    authMode,
    user,
    user?.id,
    hasCompleted,
    rawBase,
    rawAccounts,
    rawRates,
    rawTransactions,
    dateFormat,
    firstDayOfWeek,
    numberFormat,
  ]);

  useEffect(() => {
    if (authMode !== "online" || !user || !hasBootstrappedCloud.current) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    const payload: WalletStatePayload = {
      hasCompleted,
      baseCurrency: rawBase,
      accounts: rawAccounts,
      exchangeRates: rawRates,
      transactions: rawTransactions,
      settings: { dateFormat, firstDayOfWeek, numberFormat },
    };

    syncTimerRef.current = setTimeout(() => {
      void syncCloudState(payload).catch((error) => {
        console.error("[Finance] Failed to sync cloud state:", error);
      });
    }, 350);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [
    authMode,
    user,
    user?.id,
    hasCompleted,
    rawBase,
    rawAccounts,
    rawRates,
    rawTransactions,
    dateFormat,
    firstDayOfWeek,
    numberFormat,
    syncCloudState,
  ]);

  const completeOnboarding = useCallback(
    async (setup: FinanceSetup) => {
      const payload: WalletStatePayload = {
        hasCompleted: true,
        baseCurrency: setup.baseCurrency || DEFAULT_BASE_CURRENCY,
        accounts: Array.isArray(setup.accounts) ? setup.accounts : [],
        exchangeRates: Array.isArray(setup.exchangeRates)
          ? setup.exchangeRates
          : [],
        transactions: Array.isArray(setup.transactions)
          ? setup.transactions
          : [],
      };

      setRawBase(payload.baseCurrency);
      setDisplayCurrency(payload.baseCurrency);
      setRawAccounts(payload.accounts);
      setRawRates(payload.exchangeRates);
      setRawTransactions(payload.transactions);
      setHasCompleted(true);
      await auth.setSetupCompleted();

      if (authMode === "online" && user?.id) {
        try {
          await syncCloudState(payload);
        } catch (error) {
          console.error("[Finance] Failed to save onboarding to cloud:", error);
        }
      }
    },
    [authMode, user?.id, syncCloudState],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Balance helpers
  // ─────────────────────────────────────────────────────────────────────────

  function applyTx(accs: Account[], tx: Transaction, dir: 1 | -1): Account[] {
    return accs.map((acc) => {
      if (tx.type === "expense" && acc.id === tx.accountId) {
        const newBalance = acc.balance - dir * tx.amount;
        // Charity accounts cannot go below 0
        return {
          ...acc,
          balance: acc.type === "charity" ? Math.max(0, newBalance) : newBalance,
        };
      }
      if (
        tx.type === "expense" &&
        tx.secondaryAccountId &&
        acc.id === tx.secondaryAccountId
      ) {
        const newBalance = acc.balance - dir * tx.amount;
        // Charity accounts cannot go below 0
        return {
          ...acc,
          balance: acc.type === "charity" ? Math.max(0, newBalance) : newBalance,
        };
      }
      if (tx.type === "income" && acc.id === tx.accountId)
        return { ...acc, balance: acc.balance + dir * tx.amount };
      if (
        tx.type === "income" &&
        tx.secondaryAccountId &&
        acc.id === tx.secondaryAccountId
      )
        return { ...acc, balance: acc.balance + dir * tx.amount };
      if (tx.type === "transfer") {
        if (acc.id === tx.accountId)
          return { ...acc, balance: acc.balance - dir * tx.amount };
        if (acc.id === tx.toAccountId) {
          const rateMap = buildRateMap(rawRates);
          // Convert: source currency → base → destination currency
          const inBase = convertToBase(tx.amount, tx.currency, rawBase, rateMap);
          const converted = convertFromBase(inBase, acc.currency, rawBase, rateMap);
          return { ...acc, balance: acc.balance + dir * converted };
        }
      }
      return acc;
    });
  }

  /** Sync sub-account balance when a loan transaction has a subAccountName */
  function applySubAccountTx(
    accs: Account[],
    tx: Transaction,
    dir: 1 | -1,
  ): Account[] {
    if (!tx.subAccountName || tx.type === "transfer") return accs;
    return accs.map((acc) => {
      if (acc.id !== tx.accountId || acc.type !== "loan") return acc;
      const subs = [...(acc.subAccounts ?? [])];
      const idx = subs.findIndex(
        (s) => s.name.toLowerCase() === tx.subAccountName!.toLowerCase(),
      );
      if (idx >= 0) {
        subs[idx] = {
          ...subs[idx],
          balance: Math.max(0, subs[idx].balance + dir * tx.amount),
        };
      } else if (dir === 1) {
        // Only create on add, not on undo/delete
        subs.push({ name: tx.subAccountName!, balance: tx.amount });
      }
      return { ...acc, subAccounts: subs };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, "id">): Promise<Transaction> => {
      const tx: Transaction = { ...txData, id: `tx_${Date.now()}` };
      setRawAccounts((prev) => applySubAccountTx(applyTx(prev, tx, 1), tx, 1));
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
        if (old) {
          updated = applyTx(updated, old, -1);
          updated = applySubAccountTx(updated, old, -1);
        }
        updated = applyTx(updated, tx, 1);
        updated = applySubAccountTx(updated, tx, 1);
        return updated;
      });
      setRawTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    },
    [rawTransactions],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<void> => {
      const tx = rawTransactions.find((t) => t.id === id);
      if (tx) {
        setLastDeletedTransaction(tx);
        setRawAccounts((prev) =>
          applySubAccountTx(applyTx(prev, tx, -1), tx, -1),
        );
      }
      setRawTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [rawTransactions],
  );

  const restoreLastDeleted = useCallback(async (): Promise<void> => {
    if (!lastDeletedTransaction) return;
    const tx = lastDeletedTransaction;
    setRawAccounts((prev) => applySubAccountTx(applyTx(prev, tx, 1), tx, 1));
    setRawTransactions((prev) => [...prev, tx]);
    setLastDeletedTransaction(null);
  }, [lastDeletedTransaction]);

  const clearLastDeleted = useCallback(() => {
    setLastDeletedTransaction(null);
  }, []);

  const duplicateTransaction = useCallback(
    async (id: string): Promise<Transaction> => {
      const src = rawTransactions.find((t) => t.id === id);
      if (!src) throw new Error("Transaction not found");
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      const dup: Transaction = {
        ...src,
        id: `tx_${Date.now()}`,
        date: todayStr,
      };
      setRawAccounts((prev) =>
        applySubAccountTx(applyTx(prev, dup, 1), dup, 1),
      );
      setRawTransactions((prev) => [...prev, dup]);
      return dup;
    },
    [rawTransactions],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Account CRUD
  // ─────────────────────────────────────────────────────────────────────────

  const addAccount = useCallback(
    async (data: Omit<Account, "id">): Promise<Account> => {
      // Singleton enforcement for loan accounts
      if (data.type === "loan" && data.loanDirection) {
        const exists = rawAccounts.some(
          (a) => a.type === "loan" && a.loanDirection === data.loanDirection,
        );
        if (exists) {
          const label =
            data.loanDirection === "owe" ? "I Owe People" : "People Owe Me";
          throw new Error(
            `A "${label}" loan account already exists. You can only have one of each.`,
          );
        }
      }
      const account: Account = { ...data, id: `acc_${Date.now()}` };
      setRawAccounts((prev) => [...prev, account]);
      return account;
    },
    [rawAccounts],
  );

  const updateAccount = useCallback(async (account: Account): Promise<void> => {
    setRawAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? account : a)),
    );
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<void> => {
    setRawTransactions((prev) =>
      prev.filter((t) => t.accountId !== id && t.toAccountId !== id),
    );
    setRawAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Sub-account CRUD (for loan person entries) ──

  const addSubAccount = useCallback(
    async (accountId: string, sub: SubAccount): Promise<void> => {
      setRawAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== accountId) return a;
          const subs = [...(a.subAccounts ?? []), sub];
          const total = subs.reduce((s, e) => s + e.balance, 0);
          return { ...a, subAccounts: subs, balance: total };
        }),
      );
    },
    [],
  );

  const updateSubAccount = useCallback(
    async (
      accountId: string,
      index: number,
      sub: SubAccount,
    ): Promise<void> => {
      setRawAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== accountId) return a;
          const subs = [...(a.subAccounts ?? [])];
          if (index < 0 || index >= subs.length) return a;
          subs[index] = sub;
          const total = subs.reduce((s, e) => s + e.balance, 0);
          return { ...a, subAccounts: subs, balance: total };
        }),
      );
    },
    [],
  );

  const removeSubAccount = useCallback(
    async (accountId: string, index: number): Promise<void> => {
      setRawAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== accountId) return a;
          const subs = [...(a.subAccounts ?? [])];
          if (index < 0 || index >= subs.length) return a;
          subs.splice(index, 1);
          const total = subs.reduce((s, e) => s + e.balance, 0);
          return { ...a, subAccounts: subs, balance: total };
        }),
      );
    },
    [],
  );

  const hasLoanDirection = useCallback(
    (direction: LoanDirection): boolean => {
      return rawAccounts.some(
        (a) => a.type === "loan" && a.loanDirection === direction,
      );
    },
    [rawAccounts],
  );

  const updateExchangeRate = useCallback(
    async (rate: ExchangeRate): Promise<void> => {
      setRawRates((prev) => {
        const exists = prev.some((r) => r.from === rate.from);
        return exists
          ? prev.map((r) => (r.from === rate.from ? rate : r))
          : [...prev, rate];
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
    const payload: WalletStatePayload = {
      hasCompleted: false,
      baseCurrency: DEFAULT_BASE_CURRENCY,
      accounts: [],
      exchangeRates: [],
      transactions: [],
    };

    setHasCompleted(false);
    setRawBase(DEFAULT_BASE_CURRENCY);
    setDisplayCurrency(DEFAULT_BASE_CURRENCY);
    setRawAccounts([]);
    setRawRates([]);
    setRawTransactions([]);
    await auth.resetSetup();

    // Clear the local Realm wallet document
    if (realmRef.current) {
      const localId = authMode === "offline" ? "local" : (user?.id ?? null);
      if (localId) deleteLocalWallet(realmRef.current, localId);
    }

    if (authMode === "online" && user?.id) {
      try {
        await syncCloudState(payload);
      } catch (error) {
        console.error("[Finance] Failed to reset cloud state:", error);
      }
    }
  }, [authMode, user?.id, syncCloudState]);

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
    const sorted = [...rawTransactions].sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      if (cmp !== 0) return cmp;
      // Extract timestamp from id (tx_1234567890) — higher = newer
      const tsA = parseInt(a.id.replace("tx_", ""), 10) || 0;
      const tsB = parseInt(b.id.replace("tx_", ""), 10) || 0;
      return tsB - tsA;
    });
    const recentTransactions = sorted.slice(0, 12);
    const allTransactions = sorted;
    const allAccounts = rawAccounts;
    const availableCurrencies = [
      base,
      ...Array.from(new Set(accounts.map((a) => a.account.currency))).filter(
        (c) => c !== base,
      ),
    ];

    const ZERO_PERIOD = { income: 0, expense: 0, net: 0 };
    const ZERO_STATS = {
      today: ZERO_PERIOD,
      week: ZERO_PERIOD,
      month: ZERO_PERIOD,
    };

    return {
      baseCurrency: base,
      exchangeRates: rawRates,
      accounts: eggZeroMode ? [] : accounts,
      allAccounts: eggZeroMode ? [] : allAccounts,
      perCurrencySubtotals: eggZeroMode ? [] : perCurrencySubtotals,
      netWorth: eggZeroMode ? 0 : netWorth,
      monthSummary: eggZeroMode ? ZERO_PERIOD : monthSummary,
      quickStats: eggZeroMode ? ZERO_STATS : quickStats,
      recentTransactions: eggZeroMode ? [] : recentTransactions,
      allTransactions: eggZeroMode ? [] : allTransactions,
      isRefreshing,
      refresh,
      availableCurrencies,
    };
  }, [
    refreshKey,
    isRefreshing,
    refresh,
    rawBase,
    rawAccounts,
    rawRates,
    rawTransactions,
    eggZeroMode,
  ]);

  const fullValue = useMemo(
    () => ({
      ...value,
      displayCurrency,
      setDisplayCurrency,
      isLoading,
      hasCompleted,
      completeOnboarding,
      resetOnboarding,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      duplicateTransaction,
      lastDeletedTransaction,
      restoreLastDeleted,
      clearLastDeleted,
      addAccount,
      updateAccount,
      deleteAccount,
      addSubAccount,
      updateSubAccount,
      removeSubAccount,
      hasLoanDirection,
      updateExchangeRate,
      updateBaseCurrency,
      eggZeroMode,
      triggerEggZero,
    }),
    [
      value,
      displayCurrency,
      setDisplayCurrency,
      isLoading,
      hasCompleted,
      completeOnboarding,
      resetOnboarding,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      duplicateTransaction,
      lastDeletedTransaction,
      restoreLastDeleted,
      clearLastDeleted,
      addAccount,
      updateAccount,
      deleteAccount,
      addSubAccount,
      updateSubAccount,
      removeSubAccount,
      hasLoanDirection,
      updateExchangeRate,
      updateBaseCurrency,
      eggZeroMode,
      triggerEggZero,
    ],
  );

  return (
    <FinanceContext.Provider value={fullValue}>
      {children}
      <DataConflictModal
        visible={migrationConflict !== null}
        localAccountCount={migrationConflict?.localData.accounts.length ?? 0}
        localTransactionCount={
          migrationConflict?.localData.transactions.length ?? 0
        }
        cloudAccountCount={migrationConflict?.cloudData.accounts.length ?? 0}
        cloudTransactionCount={
          migrationConflict?.cloudData.transactions.length ?? 0
        }
        onChoose={resolveMigrationConflict}
        onCancel={async () => {
          setMigrationConflict(null);
          await cancelPendingGoogleSignIn();
        }}
      />
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
