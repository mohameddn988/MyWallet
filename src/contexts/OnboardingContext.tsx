import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Account, ExchangeRate, Transaction } from "../types/finance";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FinanceSetup {
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
  useSampleData: boolean;
}

interface OnboardingContextType {
  isLoading: boolean;
  hasCompleted: boolean;
  completeOnboarding: (setup: FinanceSetup) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = "@mywallet_onboarding_complete";
export const FINANCE_SETUP_KEY = "@mywallet_finance_setup";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => setHasCompleted(val === "true"))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const completeOnboarding = async (setup: FinanceSetup) => {
    await AsyncStorage.setItem(FINANCE_SETUP_KEY, JSON.stringify(setup));
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setHasCompleted(true);
  };

  const resetOnboarding = async () => {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, FINANCE_SETUP_KEY]);
    setHasCompleted(false);
  };

  return (
    <OnboardingContext.Provider
      value={{ isLoading, hasCompleted, completeOnboarding, resetOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
