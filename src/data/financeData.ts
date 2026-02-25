/**
 * financeData.ts — Personal finance seed data
 *
 * Parsed from Obsidian vault notation:
 *   [AccountName = ref] = [balance_DZD]
 *
 * Base currency : DZD (Algerian Dinar)
 * Minor units   : all amounts are stored ×100  (e.g. 6,000 DZD = 600,000)
 * Rates         : 1 <from> = <rate> DZD
 *
 * Stated overall net worth: ~386,000 DZD (per Obsidian note, approximate).
 * Note: excludes USDT conversion until rate is confirmed.
 */

import { Account, ExchangeRate, Transaction } from "../types/finance";

// ─────────────────────────────────────────────────────────────────────────────
// Base currency
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_CURRENCY = "DZD";

// ─────────────────────────────────────────────────────────────────────────────
// Exchange rates  (1 unit of `from` = `rate` DZD)
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_EXCHANGE_RATES: ExchangeRate[] = [
  {
    // Source: Obsidian note [Euro = 1283.00] — corrected to 1 EUR = 280 DZD
    from: "EUR",
    to: "DZD",
    rate: 280.0,
    lastUpdated: "2026-02-25",
    isUserDefined: true,
  },
  // Note: USDT is stored as its DZD-equivalent value directly in the account.
  // Add a USDT → DZD rate here once the user confirms the actual USDT amount.
];

// ─────────────────────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────────────────────
//
// Source lines:
//   [2000  = 03]  = [6,000]
//   [1000  = 01]  = [1,000]
//   [USDT  = 08]  = [2,000]     ← DZD-equivalent value (actual USDT amount TBD)
//   [Euro  = 1283.00] = [372,000 DZD] → ~290 EUR
//   [CCP   = Me]  = [5,200]
//   [Gold]        = [0]
//   [loan  = [Chikoo=6k]+[Ramzi=8k]+[Pinina=3k]] = [17,000]
//   [Charity]     = [4,500]

export const INITIAL_ACCOUNTS: Account[] = [
  // ── Cash / Bank accounts ────────────────────────────────────────────────

  {
    id: "acc_2000",
    name: "2000",
    type: "bank",
    currency: "DZD",
    balance: 600_000,     // 6,000 DZD
    isLiability: false,
    isArchived: false,
    icon: "bank-outline",
    color: "#4A9FF1",
    accountRef: "03",
    note: "Account ref: 03",
  },
  {
    id: "acc_1000",
    name: "1000",
    type: "bank",
    currency: "DZD",
    balance: 100_000,     // 1,000 DZD
    isLiability: false,
    isArchived: false,
    icon: "bank-outline",
    color: "#A44AF1",
    accountRef: "01",
    note: "Account ref: 01",
  },

  // ── CCP (Algérie Poste) ──────────────────────────────────────────────────

  {
    id: "acc_ccp",
    name: "CCP",
    type: "savings",
    currency: "DZD",
    balance: 520_000,     // 5,200 DZD
    isLiability: false,
    isArchived: false,
    icon: "mailbox-outline",
    color: "#FF9500",
    note: "Algérie Poste — CCP",
  },

  // ── Foreign currency ─────────────────────────────────────────────────────

  {
    // 372,000 DZD ÷ 280 DZD/EUR = 1,328.57 EUR
    id: "acc_euro",
    name: "Euro",
    type: "bank",
    currency: "EUR",
    balance: 132_857,     // 1,328.57 EUR  →  ≈ 372,000 DZD at rate 280
    isLiability: false,
    isArchived: false,
    icon: "currency-eur",
    color: "#F1C44A",
    note: "Rate: 1 EUR = 280 DZD (user-defined)",
  },
  {
    // Obsidian note shows [USDT = 08] = [2000].
    // The balance [2000] is the DZD-equivalent value at time of note.
    // Update to a proper USDT-currency account once you know exact USDT amount + rate.
    id: "acc_usdt",
    name: "USDT",
    type: "crypto",
    currency: "DZD",      // Stored as DZD snapshot; switch to "USDT" once rate confirmed
    balance: 200_000,     // 2,000 DZD equivalent
    isLiability: false,
    isArchived: false,
    icon: "bitcoin",
    color: "#26A17B",
    accountRef: "08",
    note: "USDT wallet — stored as 2,000 DZD equivalent (actual USDT amount TBD)",
  },

  // ── Gold ─────────────────────────────────────────────────────────────────

  {
    id: "acc_gold",
    name: "Gold",
    type: "gold",
    currency: "DZD",
    balance: 0,           // 0 — to be updated
    isLiability: false,
    isArchived: false,
    icon: "gold",
    color: "#FFD700",
    note: "Physical gold — value in DZD to be set",
  },

  // ── Loans given (receivables — money owed TO you) ─────────────────────────
  // One combined account; per-person breakdown stored in subAccounts.

  {
    id: "acc_loans",
    name: "Loans",
    type: "loan",
    currency: "DZD",
    balance: 1_700_000,   // 17,000 DZD  (6k + 8k + 3k)
    isLiability: false,   // asset — money owed to you
    isArchived: false,
    icon: "account-arrow-right-outline",
    color: "#F14A6E",
    note: "Total receivable from Chikoo, Ramzi, Pinina",
    subAccounts: [
      { name: "Chikoo", balance: 600_000 },  // 6,000 DZD
      { name: "Ramzi",  balance: 800_000 },  // 8,000 DZD
      { name: "Pinina", balance: 300_000 },  // 3,000 DZD
    ],
  },


  // ── Charity (earmarked fund) ─────────────────────────────────────────────

  {
    id: "acc_charity",
    name: "Charity",
    type: "charity",
    currency: "DZD",
    balance: 450_000,     // 4,500 DZD — earmarked; included in net worth
    isLiability: false,
    isArchived: false,
    icon: "hand-heart-outline",
    color: "#FF6B6B",
    note: "Earmarked charity fund",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Transactions — February 2026 mock data
// ─────────────────────────────────────────────────────────────────────────────
// All amounts in minor units (×100). e.g. 2,500,000 = 25,000 DZD
//
// Monthly totals (Feb 2026):
//   Income  : 25,000 + 12,000 = 37,000 DZD
//   Expenses: ~23,600 DZD
//   Net     : ~+13,400 DZD

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // ── Income ────────────────────────────────────────────────────────────────

  {
    id: "tx_income_salary",
    type: "income",
    amount: 2_500_000,        // 25,000 DZD — monthly salary
    currency: "DZD",
    accountId: "acc_1000",
    categoryId: "cat_salary",
    categoryName: "Salary",
    categoryIcon: "briefcase-outline",
    categoryColor: "#C8F14A",
    date: "2026-02-01",
    merchant: "Employer",
  },
  {
    id: "tx_income_freelance",
    type: "income",
    amount: 1_200_000,        // 12,000 DZD — freelance payment
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_freelance",
    categoryName: "Freelance",
    categoryIcon: "laptop",
    categoryColor: "#C8F14A",
    date: "2026-02-15",
    merchant: "Client",
    note: "Web project payment",
  },

  // ── Expenses ──────────────────────────────────────────────────────────────

  {
    id: "tx_exp_supermarket_1",
    type: "expense",
    amount: 320_000,          // 3,200 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_groceries",
    categoryName: "Groceries",
    categoryIcon: "cart-outline",
    categoryColor: "#FF9500",
    date: "2026-02-01",
    merchant: "Marché Centrale",
  },
  {
    id: "tx_exp_transport_1",
    type: "expense",
    amount: 50_000,           // 500 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_transport",
    categoryName: "Transport",
    categoryIcon: "bus",
    categoryColor: "#4A9FF1",
    date: "2026-02-03",
    merchant: "ETUSA",
  },
  {
    id: "tx_exp_restaurant_1",
    type: "expense",
    amount: 180_000,          // 1,800 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_food",
    categoryName: "Restaurant",
    categoryIcon: "silverware-fork-knife",
    categoryColor: "#F14A6E",
    date: "2026-02-05",
    merchant: "Le Boulanger",
  },
  {
    id: "tx_exp_phone",
    type: "expense",
    amount: 150_000,          // 1,500 DZD
    currency: "DZD",
    accountId: "acc_ccp",
    categoryId: "cat_bills",
    categoryName: "Phone Bill",
    categoryIcon: "cellphone",
    categoryColor: "#A44AF1",
    date: "2026-02-07",
    merchant: "Djezzy",
  },
  {
    id: "tx_exp_internet",
    type: "expense",
    amount: 300_000,          // 3,000 DZD
    currency: "DZD",
    accountId: "acc_ccp",
    categoryId: "cat_bills",
    categoryName: "Internet",
    categoryIcon: "wifi",
    categoryColor: "#A44AF1",
    date: "2026-02-09",
    merchant: "Algérie Télécom",
  },
  {
    id: "tx_exp_pharmacy",
    type: "expense",
    amount: 85_000,           // 850 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_health",
    categoryName: "Health",
    categoryIcon: "medical-bag",
    categoryColor: "#FF6B6B",
    date: "2026-02-11",
    merchant: "Pharmacie Centrale",
  },
  {
    id: "tx_exp_clothes",
    type: "expense",
    amount: 450_000,          // 4,500 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_shopping",
    categoryName: "Shopping",
    categoryIcon: "shopping-outline",
    categoryColor: "#F1C44A",
    date: "2026-02-13",
    merchant: "Zara Algiers",
  },
  {
    id: "tx_exp_supermarket_2",
    type: "expense",
    amount: 270_000,          // 2,700 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_groceries",
    categoryName: "Groceries",
    categoryIcon: "cart-outline",
    categoryColor: "#FF9500",
    date: "2026-02-16",
    merchant: "BIM Market",
  },
  {
    id: "tx_exp_cafe",
    type: "expense",
    amount: 45_000,           // 450 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_food",
    categoryName: "Café",
    categoryIcon: "coffee",
    categoryColor: "#F14A6E",
    date: "2026-02-18",
    merchant: "Café de la Paix",
  },

  // ── This week (Feb 20–26) ─────────────────────────────────────────────────

  {
    id: "tx_exp_transport_2",
    type: "expense",
    amount: 60_000,           // 600 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_transport",
    categoryName: "Transport",
    categoryIcon: "bus",
    categoryColor: "#4A9FF1",
    date: "2026-02-20",
    merchant: "Taxi",
  },
  {
    id: "tx_exp_haircut",
    type: "expense",
    amount: 50_000,           // 500 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_personal",
    categoryName: "Personal Care",
    categoryIcon: "scissors-cutting",
    categoryColor: "#26A17B",
    date: "2026-02-22",
    merchant: "Salon Coiffeur",
  },
  {
    id: "tx_exp_restaurant_2",
    type: "expense",
    amount: 220_000,          // 2,200 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_food",
    categoryName: "Restaurant",
    categoryIcon: "silverware-fork-knife",
    categoryColor: "#F14A6E",
    date: "2026-02-24",
    merchant: "Pizza Roma",
  },

  // ── Today (Feb 26) ────────────────────────────────────────────────────────

  {
    id: "tx_exp_groceries_today",
    type: "expense",
    amount: 180_000,          // 1,800 DZD
    currency: "DZD",
    accountId: "acc_2000",
    categoryId: "cat_groceries",
    categoryName: "Groceries",
    categoryIcon: "cart-outline",
    categoryColor: "#FF9500",
    date: "2026-02-26",
    merchant: "Casino Supermarché",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Quick reference — stated net worth breakdown (from Obsidian note)
// ─────────────────────────────────────────────────────────────────────────────
//
//  2000  (acc_2000)           6,000 DZD
//  1000  (acc_1000)           1,000 DZD
//  USDT  (acc_usdt)           2,000 DZD   ← DZD-equivalent snapshot (actual USDT TBD)
//  Euro  (acc_euro)         372,000 DZD   ← at rate 1 EUR = 280 DZD (1,328.57 EUR)
//  CCP   (acc_ccp)            5,200 DZD
//  Gold  (acc_gold)               0 DZD
//  ─────────────────────────────────────
//  Total liquid net worth    386,200 DZD
//
//  Additional (not in overall):
//  Loans (acc_loans)         17,000 DZD   ← Chikoo 6k + Ramzi 8k + Pinina 3k (receivables)
//  Charity (acc_charity)      4,500 DZD   ← earmarked fund
