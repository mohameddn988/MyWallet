import { Account, AccountType, TransactionType } from "./finance";
import { toMinorUnits } from "../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Draft types
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountDraft {
  key: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
}

export interface TxDraft {
  type: TransactionType;
  amount: string;
  accountKey: string;
  note: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Account type maps
// ─────────────────────────────────────────────────────────────────────────────

export const TYPE_ICON: Record<AccountType, string> = {
  cash: "cash",
  bank: "bank",
  savings: "piggy-bank",
  credit: "credit-card",
  loan: "handshake",
  charity: "hand-heart",
  crypto: "bitcoin",
  gold: "gold",
  other: "help-circle-outline",
};

export const TYPE_COLOR: Record<AccountType, string> = {
  cash: "#4CAF50",
  bank: "#2196F3",
  savings: "#9C27B0",
  credit: "#F44336",
  loan: "#FF9800",
  charity: "#E91E63",
  crypto: "#F7931A",
  gold: "#FFC107",
  other: "#607D8B",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function makeAccountDraft(currency: string): AccountDraft {
  return {
    key: `draft_${Date.now()}_${Math.random()}`,
    name: "",
    type: "bank",
    currency,
    balance: "",
  };
}

export function draftToAccount(draft: AccountDraft, index: number): Account {
  const raw = parseFloat(draft.balance.replace(/,/g, "") || "0");
  return {
    id: `acc_user_${index}_${Date.now()}`,
    name: draft.name.trim() || "My Account",
    type: draft.type,
    currency: draft.currency,
    balance: toMinorUnits(raw, draft.currency),
    isArchived: false,
    icon: TYPE_ICON[draft.type],
    color: TYPE_COLOR[draft.type],
  };
}
