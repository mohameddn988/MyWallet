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

export interface SubAccount {
  name: string;
  balance: number;
}

export type LoanDirection = "owe" | "owed";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  isLiability: boolean;
  isArchived: boolean;
  icon: string;
  color: string;
  accountRef?: string;
  note?: string;
  subAccounts?: SubAccount[];
  loanDirection?: LoanDirection;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  accountId: string;
  toAccountId?: string;
  secondaryAccountId?: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  date: string;
  note?: string;
  merchant?: string;
  tags?: string[];
  paymentMethod?: string;
  subAccountName?: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
  isUserDefined: boolean;
}
