import { ObjectId } from "mongodb";
import { Account, ExchangeRate, Transaction } from "../../types/finance";

export interface AppSettings {
  themeMode?: string;
  themeVariant?: string;
  dateFormat?: string;
  firstDayOfWeek?: string;
  numberFormat?: string;
}

export interface WalletDocument {
  _id?: ObjectId;
  userId: string;
  hasCompleted: boolean;
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
  settings?: AppSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletStatePayload {
  hasCompleted: boolean;
  baseCurrency: string;
  accounts: Account[];
  exchangeRates: ExchangeRate[];
  transactions: Transaction[];
  settings?: AppSettings;
}
