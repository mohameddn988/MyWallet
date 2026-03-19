import { Router } from "express";
import { getApiAuthUser } from "../../lib/auth";
import {
  DEFAULT_BASE_CURRENCY,
  ensureWallet,
  saveWalletState,
  toWalletStatePayload,
} from "../../lib/wallet";
import type { WalletStatePayload } from "../../models/Wallet";
import type { Account, ExchangeRate, Transaction } from "../../types/finance";
import { sanitize } from "../../lib/sanitize";

const VALID_ACCOUNT_TYPES = new Set([
  "cash", "bank", "savings", "credit", "loan", "charity", "crypto", "gold", "other",
]);
const VALID_TRANSACTION_TYPES = new Set(["expense", "income", "transfer"]);
const VALID_LOAN_DIRECTIONS = new Set(["owe", "owed"]);
const VALID_DATE_FORMATS = new Set(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]);
const VALID_NUMBER_FORMATS = new Set(["1,234.56", "1.234,56", "1 234,56", "1 234.56"]);
const VALID_FIRST_DAY = new Set(["sunday", "monday", "saturday"]);

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function sanitizeAccount(raw: unknown): Account | null {
  if (!raw || typeof raw !== "object") return null;
  const o = sanitize(raw) as Record<string, unknown>;

  if (!isString(o.id) || !isString(o.name) || !isString(o.type)) return null;
  if (!VALID_ACCOUNT_TYPES.has(o.type)) return null;
  if (!isString(o.currency) || !isNumber(o.balance)) return null;
  if (!isString(o.icon) || !isString(o.color)) return null;

  const account: Account = {
    id: o.id,
    name: o.name,
    type: o.type as Account["type"],
    currency: o.currency,
    balance: o.balance,
    isLiability: Boolean(o.isLiability),
    isArchived: Boolean(o.isArchived),
    icon: o.icon,
    color: o.color,
  };

  if (isString(o.accountRef)) account.accountRef = o.accountRef;
  if (isString(o.note)) account.note = o.note;
  if (isString(o.loanDirection) && VALID_LOAN_DIRECTIONS.has(o.loanDirection)) {
    account.loanDirection = o.loanDirection as Account["loanDirection"];
  }
  if (Array.isArray(o.subAccounts)) {
    account.subAccounts = o.subAccounts
      .filter((s: unknown) => s && typeof s === "object" && isString((s as any).name) && isNumber((s as any).balance))
      .map((s: any) => ({ name: String(s.name), balance: Number(s.balance) }));
  }

  return account;
}

function sanitizeTransaction(raw: unknown): Transaction | null {
  if (!raw || typeof raw !== "object") return null;
  const o = sanitize(raw) as Record<string, unknown>;

  if (!isString(o.id) || !isString(o.type) || !isNumber(o.amount)) return null;
  if (!VALID_TRANSACTION_TYPES.has(o.type)) return null;
  if (!isString(o.currency) || !isString(o.accountId) || !isString(o.date)) return null;

  const tx: Transaction = {
    id: o.id,
    type: o.type as Transaction["type"],
    amount: o.amount,
    currency: o.currency,
    accountId: o.accountId,
    date: o.date,
  };

  if (isString(o.toAccountId)) tx.toAccountId = o.toAccountId;
  if (isString(o.secondaryAccountId)) tx.secondaryAccountId = o.secondaryAccountId;
  if (isString(o.categoryId)) tx.categoryId = o.categoryId;
  if (isString(o.categoryName)) tx.categoryName = o.categoryName;
  if (isString(o.categoryIcon)) tx.categoryIcon = o.categoryIcon;
  if (isString(o.categoryColor)) tx.categoryColor = o.categoryColor;
  if (isString(o.note)) tx.note = o.note;
  if (isString(o.merchant)) tx.merchant = o.merchant;
  if (isString(o.paymentMethod)) tx.paymentMethod = o.paymentMethod;
  if (isString(o.subAccountName)) tx.subAccountName = o.subAccountName;
  if (Array.isArray(o.tags)) {
    tx.tags = o.tags.filter((t: unknown) => isString(t)) as string[];
  }

  return tx;
}

function sanitizeExchangeRate(raw: unknown): ExchangeRate | null {
  if (!raw || typeof raw !== "object") return null;
  const o = sanitize(raw) as Record<string, unknown>;

  if (!isString(o.from) || !isString(o.to) || !isNumber(o.rate)) return null;
  if (!isString(o.lastUpdated)) return null;

  return {
    from: o.from,
    to: o.to,
    rate: o.rate,
    lastUpdated: o.lastUpdated,
    isUserDefined: Boolean(o.isUserDefined),
  };
}

const router = Router();

router.get("/api/finance/state", async (req, res) => {
  try {
    const authUser = await getApiAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const wallet = await ensureWallet(authUser.userId);
    res.json(toWalletStatePayload(wallet));
  } catch (error) {
    console.error("[API /finance/state GET]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/finance/state", async (req, res) => {
  try {
    const authUser = await getApiAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.body as Partial<WalletStatePayload>;

    const accounts = Array.isArray(body.accounts)
      ? body.accounts.map(sanitizeAccount).filter((a): a is Account => a !== null)
      : [];
    const exchangeRates = Array.isArray(body.exchangeRates)
      ? body.exchangeRates.map(sanitizeExchangeRate).filter((r): r is ExchangeRate => r !== null)
      : [];
    const transactions = Array.isArray(body.transactions)
      ? body.transactions.map(sanitizeTransaction).filter((t): t is Transaction => t !== null)
      : [];

    // Validate: no duplicate account IDs
    const accountIds = new Set(accounts.map((a) => a.id));
    if (accountIds.size !== accounts.length) {
      res.status(400).json({ error: "Duplicate account IDs" });
      return;
    }

    // Validate: every transaction references existing accounts
    for (const tx of transactions) {
      if (!accountIds.has(tx.accountId)) {
        res.status(400).json({
          error: `Transaction "${tx.id}" references non-existent account "${tx.accountId}"`,
        });
        return;
      }
      if (tx.toAccountId && !accountIds.has(tx.toAccountId)) {
        res.status(400).json({
          error: `Transaction "${tx.id}" references non-existent destination account "${tx.toAccountId}"`,
        });
        return;
      }
      if (tx.secondaryAccountId && !accountIds.has(tx.secondaryAccountId)) {
        res.status(400).json({
          error: `Transaction "${tx.id}" references non-existent secondary account "${tx.secondaryAccountId}"`,
        });
        return;
      }
      // Transfers must have a destination account
      if (tx.type === "transfer" && !tx.toAccountId) {
        res.status(400).json({
          error: `Transfer "${tx.id}" is missing a destination account`,
        });
        return;
      }
      // Cannot transfer to the same account
      if (tx.type === "transfer" && tx.toAccountId === tx.accountId) {
        res.status(400).json({
          error: `Transfer "${tx.id}" cannot transfer to the same account`,
        });
        return;
      }
      // Amount must be positive
      if (tx.amount <= 0) {
        res.status(400).json({
          error: `Transaction "${tx.id}" must have a positive amount`,
        });
        return;
      }
    }

    // Validate: exchange rate pairs reference known currencies from accounts
    const accountCurrencies = new Set(accounts.map((a) => a.currency));
    for (const rate of exchangeRates) {
      if (!accountCurrencies.has(rate.from) && !accountCurrencies.has(rate.to)) {
        res.status(400).json({
          error: `Exchange rate ${rate.from}/${rate.to} does not match any account currency`,
        });
        return;
      }
      if (rate.rate <= 0) {
        res.status(400).json({
          error: `Exchange rate ${rate.from}/${rate.to} must be positive`,
        });
        return;
      }
    }

    const settings = body.settings && typeof body.settings === "object"
      ? {
          ...(isString(body.settings.dateFormat) && VALID_DATE_FORMATS.has(body.settings.dateFormat)
            ? { dateFormat: body.settings.dateFormat } : {}),
          ...(isString(body.settings.firstDayOfWeek) && VALID_FIRST_DAY.has(body.settings.firstDayOfWeek)
            ? { firstDayOfWeek: body.settings.firstDayOfWeek } : {}),
          ...(isString(body.settings.numberFormat) && VALID_NUMBER_FORMATS.has(body.settings.numberFormat)
            ? { numberFormat: body.settings.numberFormat } : {}),
        }
      : undefined;

    const nextState: WalletStatePayload = {
      hasCompleted: Boolean(body.hasCompleted),
      baseCurrency:
        typeof body.baseCurrency === "string" && body.baseCurrency.trim()
          ? body.baseCurrency.trim().toUpperCase()
          : DEFAULT_BASE_CURRENCY,
      accounts,
      exchangeRates,
      transactions,
      settings,
    };

    const updated = await saveWalletState(authUser.userId, nextState);
    res.json(toWalletStatePayload(updated));
  } catch (error) {
    console.error("[API /finance/state PUT]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
