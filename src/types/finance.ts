export type TransactionType = "expense" | "income" | "transfer";
export type AccountType =
  | "cash"
  | "bank"
  | "savings"
  | "credit"
  | "loan"
  | "charity"
  | "crypto"
  | "gold"
  | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Amount in minor units (cents/pence). Always positive. */
  amount: number;
  currency: string;
  accountId: string;
  /** Destination account — transfers only */
  toAccountId?: string;
  categoryId?: string;
  categoryName?: string;
  /** MaterialCommunityIcons icon name */
  categoryIcon?: string;
  categoryColor?: string;
  /** YYYY-MM-DD */
  date: string;
  note?: string;
  merchant?: string;
  tags?: string[];
  paymentMethod?: string;
}

export type LoanDirection = "owe" | "owed";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  /**
   * Current balance in minor units.
   * Negative for liabilities (credit cards, loans).
   */
  balance: number;
  isLiability: boolean;
  isArchived: boolean;
  /** MaterialCommunityIcons icon name */
  icon: string;
  color: string;
  /** Optional short reference, e.g. last 2 digits of account number */
  accountRef?: string;
  /** Optional free-form note */
  note?: string;
  /** Sub-accounts or breakdown items shown inside this account card */
  subAccounts?: SubAccount[];
  /**
   * For loan accounts only.
   * "owe"  = money I owe to other people (my debts)
   * "owed" = money other people owe me (receivables)
   */
  loanDirection?: LoanDirection;
}

/** A named breakdown entry shown inside a parent account card */
export interface SubAccount {
  name: string;
  balance: number; // minor units, same currency as parent
}

export interface ExchangeRate {
  /** ISO 4217 currency code */
  from: string;
  /** ISO 4217 currency code — always the base currency */
  to: string;
  rate: number;
  /** ISO date string */
  lastUpdated: string;
  /** Whether this was set manually by the user */
  isUserDefined: boolean;
}

export interface MonthSummary {
  /** In base currency minor units */
  income: number;
  expense: number;
  net: number;
}

export interface PeriodSummary {
  /** Total income in base currency minor units */
  income: number;
  /** Total expenses in base currency minor units */
  expense: number;
  /** income - expense */
  net: number;
}

export interface QuickStats {
  today: PeriodSummary;
  week: PeriodSummary;
  month: PeriodSummary;
}

export interface AccountWithBalance {
  account: Account;
  /** Recomputed balance in native currency minor units */
  balance: number;
  /** Balance converted to base currency minor units */
  balanceInBase: number;
}

export interface CurrencySubtotal {
  currency: string;
  /** Sum of account balances in this currency (minor units, native) */
  totalNative: number;
  /** Converted to base currency (minor units) */
  totalInBase: number;
}
