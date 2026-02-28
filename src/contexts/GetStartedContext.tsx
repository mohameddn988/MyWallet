import React, { createContext, useContext, useMemo, useState } from "react";
import { TransactionType } from "../types/finance";
import {
  AccountDraft,
  TxDraft,
  makeAccountDraft,
} from "../types/getStarted";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GetStartedContextType {
  baseCurrency: string;
  setBaseCurrency: (c: string) => void;
  accountDrafts: AccountDraft[];
  addAccount: () => void;
  removeAccount: (key: string) => void;
  updateAccount: (key: string, patch: Partial<AccountDraft>) => void;
  rates: Record<string, string>;
  setRate: (cur: string, value: string) => void;
  txDraft: TxDraft;
  updateTxDraft: (patch: Partial<TxDraft>) => void;
  nonBaseCurrencies: string[];
  hasRatesStep: boolean;
  /** Number of steps after welcome (currency, accounts, [exchange-rates], first-tx, done) */
  totalSteps: number;
}

const GetStartedContext = createContext<GetStartedContextType | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function GetStartedProvider({ children }: { children: React.ReactNode }) {
  const [baseCurrency, setBaseCurrency] = useState("DZD");
  const [accountDrafts, setAccountDrafts] = useState<AccountDraft[]>([
    makeAccountDraft("DZD"),
  ]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [txDraft, setTxDraft] = useState<TxDraft>({
    type: "expense",
    amount: "",
    accountKey: "",
    note: "",
  });

  const nonBaseCurrencies = useMemo(
    () => [
      ...new Set(
        accountDrafts.map((a) => a.currency).filter((c) => c !== baseCurrency),
      ),
    ],
    [accountDrafts, baseCurrency],
  );

  const hasRatesStep = nonBaseCurrencies.length > 0;
  // Steps after welcome: currency(1) + accounts(2) + [exchange-rates(3)] + first-tx + done
  const totalSteps = hasRatesStep ? 5 : 4;

  const addAccount = () =>
    setAccountDrafts((prev) => [...prev, makeAccountDraft(baseCurrency)]);

  const removeAccount = (key: string) =>
    setAccountDrafts((prev) => prev.filter((a) => a.key !== key));

  const updateAccount = (key: string, patch: Partial<AccountDraft>) =>
    setAccountDrafts((prev) =>
      prev.map((a) => (a.key === key ? { ...a, ...patch } : a)),
    );

  const setRate = (cur: string, value: string) =>
    setRates((prev) => ({ ...prev, [cur]: value }));

  const updateTxDraft = (patch: Partial<TxDraft>) =>
    setTxDraft((prev) => ({ ...prev, ...patch }));

  return (
    <GetStartedContext.Provider
      value={{
        baseCurrency,
        setBaseCurrency,
        accountDrafts,
        addAccount,
        removeAccount,
        updateAccount,
        rates,
        setRate,
        txDraft,
        updateTxDraft,
        nonBaseCurrencies,
        hasRatesStep,
        totalSteps,
      }}
    >
      {children}
    </GetStartedContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGetStarted() {
  const ctx = useContext(GetStartedContext);
  if (!ctx) throw new Error("useGetStarted must be used within GetStartedProvider");
  return ctx;
}
