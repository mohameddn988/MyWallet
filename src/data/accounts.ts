import { AccountType } from "../types/finance";

// ─────────────────────────────────────────────────────────────────────────────
// Account type metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountTypeMeta {
  value: AccountType;
  label: string;
  /** MaterialCommunityIcons icon name */
  icon: string;
  defaultColor: string;
  /** Whether this type normally carries a negative balance (credit, loan) */
  isLiability: boolean;
  description: string;
}

export const ACCOUNT_TYPE_META: AccountTypeMeta[] = [
  {
    value: "cash",
    label: "Cash",
    icon: "cash",
    defaultColor: "#26A17B",
    isLiability: false,
    description: "Physical cash on hand",
  },
  {
    value: "bank",
    label: "Bank",
    icon: "bank",
    defaultColor: "#4A9FF1",
    isLiability: false,
    description: "Checking or current account",
  },
  {
    value: "savings",
    label: "Savings",
    icon: "piggy-bank-outline",
    defaultColor: "#C8F14A",
    isLiability: false,
    description: "Savings or deposit account",
  },
  {
    value: "credit",
    label: "Credit Card",
    icon: "credit-card-outline",
    defaultColor: "#F14A6E",
    isLiability: true,
    description: "Credit card — balance is what you owe",
  },
  {
    value: "loan",
    label: "Loan",
    icon: "hand-coin-outline",
    defaultColor: "#FF9500",
    isLiability: true,
    description: "Money lent out (receivable) or borrowed",
  },
  {
    value: "charity",
    label: "Charity",
    icon: "hand-heart-outline",
    defaultColor: "#A44AF1",
    isLiability: false,
    description: "Earmarked funds — tracked separately",
  },
  {
    value: "crypto",
    label: "Crypto",
    icon: "currency-btc",
    defaultColor: "#F7931A",
    isLiability: false,
    description: "Cryptocurrency wallet",
  },
  {
    value: "gold",
    label: "Gold",
    icon: "gold",
    defaultColor: "#FFD700",
    isLiability: false,
    description: "Physical gold or precious metals",
  },
  {
    value: "other",
    label: "Other",
    icon: "dots-horizontal-circle-outline",
    defaultColor: "#BFC3C7",
    isLiability: false,
    description: "Other asset or wallet",
  },
];

export function getAccountTypeMeta(type: AccountType): AccountTypeMeta {
  return (
    ACCOUNT_TYPE_META.find((m) => m.value === type) ??
    ACCOUNT_TYPE_META[ACCOUNT_TYPE_META.length - 1]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Color palette
// ─────────────────────────────────────────────────────────────────────────────

export const ACCOUNT_COLOR_PALETTE = [
  "#C8F14A",
  "#4A9FF1",
  "#F14A6E",
  "#FF9500",
  "#A44AF1",
  "#26A17B",
  "#F1C44A",
  "#88C0D0",
  "#F7931A",
  "#FF6B6B",
  "#5E81AC",
  "#BFC3C7",
  "#FFD700",
  "#26C6DA",
  "#69F0AE",
  "#FF5252",
];

// ─────────────────────────────────────────────────────────────────────────────
// Icon presets
// ─────────────────────────────────────────────────────────────────────────────

export const ACCOUNT_ICON_PRESETS = [
  "cash",
  "bank",
  "piggy-bank-outline",
  "credit-card-outline",
  "wallet-outline",
  "hand-coin-outline",
  "hand-heart-outline",
  "currency-btc",
  "gold",
  "safe-square-outline",
  "briefcase-outline",
  "home-outline",
  "car-outline",
  "school-outline",
  "cellphone",
  "dots-horizontal-circle-outline",
];
