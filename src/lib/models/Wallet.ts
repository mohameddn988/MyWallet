import { ObjectId } from "mongodb";
import { Account, ExchangeRate, Transaction } from "../../types/finance";

export interface WalletDocument {
  _id?: ObjectId;
  userId: string;
  hasCompleted: boolean;
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletStatePayload {
  hasCompleted: boolean;
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
}
