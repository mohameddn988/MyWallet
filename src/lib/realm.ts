import Realm from "realm";
import type { Account, ExchangeRate, Transaction } from "../types/finance";
import type { AppSettings } from "./models/Wallet";

// ─────────────────────────────────────────────────────────────────────────────
// Wallet schema
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single document per user/device that mirrors the WalletDocument structure.
 * Complex nested arrays (accounts, transactions, exchangeRates) are stored as
 * JSON strings so we can reuse existing TypeScript interfaces without defining
 * a full Realm embedded-object graph.
 */
export class WalletObject extends Realm.Object<WalletObject> {
  /** "local" for offline mode, the user's server ID for online mode */
  userId!: string;
  hasCompleted!: boolean;
  baseCurrency!: string;
  /** JSON.stringify(Account[]) */
  accountsJSON!: string;
  /** JSON.stringify(Transaction[]) */
  transactionsJSON!: string;
  /** JSON.stringify(ExchangeRate[]) */
  exchangeRatesJSON!: string;
  /** JSON.stringify(AppSettings) — optional */
  settingsJSON?: string;

  static schema: Realm.ObjectSchema = {
    name: "Wallet",
    primaryKey: "userId",
    properties: {
      userId: "string",
      hasCompleted: { type: "bool", default: false },
      baseCurrency: { type: "string", default: "DZD" },
      accountsJSON: { type: "string", default: "[]" },
      transactionsJSON: { type: "string", default: "[]" },
      exchangeRatesJSON: { type: "string", default: "[]" },
      settingsJSON: "string?",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthSession schema — mirrors the users/tokens collection in MongoDB
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Singleton row (id = "singleton") that stores the active auth session.
 * Replaces AsyncStorage for session persistence.
 */
export class AuthSessionObject extends Realm.Object<AuthSessionObject> {
  /** Always "singleton" — only one row ever exists per device */
  id!: string;
  mode?: string;
  /** JSON.stringify(AuthUser) */
  userJSON?: string;
  token?: string;
  setupCompleted!: boolean;

  static schema: Realm.ObjectSchema = {
    name: "AuthSession",
    primaryKey: "id",
    properties: {
      id: "string",
      mode: "string?",
      userJSON: "string?",
      token: "string?",
      setupCompleted: { type: "bool", default: false },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AppPrefs schema — device-level app preferences (locale, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Singleton row (id = "singleton") that stores persistent app preferences.
 * Replaces AsyncStorage for locale preference persistence.
 */
export class AppPrefsObject extends Realm.Object<AppPrefsObject> {
  /** Always "singleton" — one row per device */
  id!: string;
  dateFormat?: string;
  firstDayOfWeek?: string;
  numberFormat?: string;

  static schema: Realm.ObjectSchema = {
    name: "AppPrefs",
    primaryKey: "id",
    properties: {
      id: "string",
      dateFormat: "string?",
      firstDayOfWeek: "string?",
      numberFormat: "string?",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

let _realm: Realm | null = null;

export async function getRealm(): Promise<Realm> {
  if (_realm && !_realm.isClosed) return _realm;

  _realm = await Realm.open({
    schema: [WalletObject, AuthSessionObject, AppPrefsObject],
    schemaVersion: 2,
  });

  return _realm;
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalWalletState {
  hasCompleted: boolean;
  baseCurrency: string;
  accounts: Account[];
  transactions: Transaction[];
  exchangeRates: ExchangeRate[];
  settings?: AppSettings;
}

/** Read the wallet document for the given userId from Realm, or null if absent. */
export function readLocalWallet(
  realm: Realm,
  userId: string,
): LocalWalletState | null {
  const doc = realm.objectForPrimaryKey(WalletObject, userId);
  if (!doc) return null;

  return {
    hasCompleted: doc.hasCompleted,
    baseCurrency: doc.baseCurrency,
    accounts: safeParseJSON<Account[]>(doc.accountsJSON, []),
    transactions: safeParseJSON<Transaction[]>(doc.transactionsJSON, []),
    exchangeRates: safeParseJSON<ExchangeRate[]>(doc.exchangeRatesJSON, []),
    settings: doc.settingsJSON
      ? safeParseJSON<AppSettings | undefined>(doc.settingsJSON, undefined)
      : undefined,
  };
}

/** Upsert the wallet document for the given userId in Realm. */
export function writeLocalWallet(
  realm: Realm,
  userId: string,
  state: LocalWalletState,
): void {
  realm.write(() => {
    realm.create(
      WalletObject,
      {
        userId,
        hasCompleted: state.hasCompleted,
        baseCurrency: state.baseCurrency,
        accountsJSON: JSON.stringify(state.accounts),
        transactionsJSON: JSON.stringify(state.transactions),
        exchangeRatesJSON: JSON.stringify(state.exchangeRates),
        settingsJSON: state.settings
          ? JSON.stringify(state.settings)
          : undefined,
      },
      Realm.UpdateMode.Modified,
    );
  });
}

/** Delete the wallet document for the given userId from Realm. */
export function deleteLocalWallet(realm: Realm, userId: string): void {
  const doc = realm.objectForPrimaryKey(WalletObject, userId);
  if (!doc) return;
  realm.write(() => {
    realm.delete(doc);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthSession helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthSessionData {
  mode?: string;
  userJSON?: string;
  token?: string;
  setupCompleted: boolean;
}

/** Read the singleton auth session from Realm, or null if none exists. */
export function readAuthSession(realm: Realm): AuthSessionData | null {
  const doc = realm.objectForPrimaryKey(AuthSessionObject, "singleton");
  if (!doc) return null;
  return {
    mode: doc.mode ?? undefined,
    userJSON: doc.userJSON ?? undefined,
    token: doc.token ?? undefined,
    setupCompleted: doc.setupCompleted,
  };
}

/**
 * Partially update the singleton auth session.
 * Only keys present in `patch` are written — other fields are left untouched.
 */
export function writeAuthSession(
  realm: Realm,
  patch: Partial<AuthSessionData>,
): void {
  realm.write(() => {
    const existing = realm.objectForPrimaryKey(AuthSessionObject, "singleton");
    if (existing) {
      if ("mode" in patch) existing.mode = patch.mode;
      if ("userJSON" in patch) existing.userJSON = patch.userJSON;
      if ("token" in patch) existing.token = patch.token;
      if ("setupCompleted" in patch)
        existing.setupCompleted = patch.setupCompleted!;
    } else {
      realm.create(AuthSessionObject, {
        id: "singleton",
        mode: patch.mode,
        userJSON: patch.userJSON,
        token: patch.token,
        setupCompleted: patch.setupCompleted ?? false,
      });
    }
  });
}

/** Wipe auth session (mode, user, token) without touching setupCompleted. */
export function clearAuthSession(realm: Realm): void {
  realm.write(() => {
    const doc = realm.objectForPrimaryKey(AuthSessionObject, "singleton");
    if (doc) {
      doc.mode = undefined;
      doc.userJSON = undefined;
      doc.token = undefined;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AppPrefs helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface AppPrefsData {
  dateFormat?: string;
  firstDayOfWeek?: string;
  numberFormat?: string;
}

/** Read the singleton app preferences from Realm, or null if none exists. */
export function readAppPrefs(realm: Realm): AppPrefsData | null {
  const doc = realm.objectForPrimaryKey(AppPrefsObject, "singleton");
  if (!doc) return null;
  return {
    dateFormat: doc.dateFormat ?? undefined,
    firstDayOfWeek: doc.firstDayOfWeek ?? undefined,
    numberFormat: doc.numberFormat ?? undefined,
  };
}

/**
 * Partially update the singleton app preferences.
 * Only keys present in `patch` are written — other fields are left untouched.
 */
export function writeAppPref(realm: Realm, patch: Partial<AppPrefsData>): void {
  realm.write(() => {
    const existing = realm.objectForPrimaryKey(AppPrefsObject, "singleton");
    if (existing) {
      if ("dateFormat" in patch) existing.dateFormat = patch.dateFormat;
      if ("firstDayOfWeek" in patch)
        existing.firstDayOfWeek = patch.firstDayOfWeek;
      if ("numberFormat" in patch) existing.numberFormat = patch.numberFormat;
    } else {
      realm.create(AppPrefsObject, {
        id: "singleton",
        dateFormat: patch.dateFormat,
        firstDayOfWeek: patch.firstDayOfWeek,
        numberFormat: patch.numberFormat,
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
