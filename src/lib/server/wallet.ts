import { Collection, WithId } from "mongodb";
import { connectDB } from "../db";
import { WalletDocument, WalletStatePayload } from "../models/Wallet";

export const DEFAULT_BASE_CURRENCY = "DZD";

function getDefaultWalletState(): WalletStatePayload {
  return {
    hasCompleted: false,
    baseCurrency: DEFAULT_BASE_CURRENCY,
    accounts: [],
    exchangeRates: [],
    transactions: [],
  };
}

async function walletsCollection(): Promise<Collection<WalletDocument>> {
  const db = await connectDB();
  return db.collection<WalletDocument>("wallets");
}

export async function ensureWallet(userId: string): Promise<WithId<WalletDocument>> {
  const wallets = await walletsCollection();
  const now = new Date();

  await wallets.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        ...getDefaultWalletState(),
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  const wallet = await wallets.findOne({ userId });
  if (!wallet) {
    throw new Error("Failed to load wallet");
  }

  return wallet;
}

export async function saveWalletState(
  userId: string,
  nextState: WalletStatePayload,
): Promise<WithId<WalletDocument>> {
  const wallets = await walletsCollection();
  const now = new Date();

  const updated = await wallets.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...nextState,
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (!updated) {
    throw new Error("Failed to save wallet");
  }

  return updated;
}

export function toWalletStatePayload(
  wallet: WalletDocument,
): WalletStatePayload {
  const accounts = Array.isArray(wallet.accounts) ? wallet.accounts : [];
  const transactions = Array.isArray(wallet.transactions)
    ? wallet.transactions
    : [];
  const exchangeRates = Array.isArray(wallet.exchangeRates)
    ? wallet.exchangeRates
    : [];

  // Backward-compatibility: if old records missed hasCompleted, infer it.
  const inferredCompleted =
    accounts.length > 0 || transactions.length > 0 || exchangeRates.length > 0;

  return {
    hasCompleted: Boolean(wallet.hasCompleted) || inferredCompleted,
    baseCurrency: wallet.baseCurrency || DEFAULT_BASE_CURRENCY,
    accounts,
    exchangeRates,
    transactions,
    settings: wallet.settings,
  };
}
