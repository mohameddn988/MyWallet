# Bug Report

## 1. JPY/KRW/VND 100x Amount Inflation

**Severity:** High (data corruption)

**Location:** `src/app/transaction/add.tsx:71-75`, `src/utils/currency.ts:76-80`

**Description:**
`toMinorUnits()` always multiplies by 100, but `formatAmount()` divides by 1 for no-sub-unit currencies (JPY, KRW, VND). This causes a 100x inflation when storing and displaying amounts.

**Example:** User enters ¥1,000 → stored as 100,000 → displayed as ¥100,000.

**Additionally:** The edit screen initialization at `src/app/transaction/add.tsx:186` always divides by 100 (`editTx.amount / 100`), which is wrong for these currencies.

**Fix:** `toMinorUnits` should accept a currency parameter and skip the ×100 for no-sub-unit currencies. The edit screen should also check currency before dividing.

---

## 2. All Currency Symbols Displayed as Suffix

**Severity:** Low (cosmetic — DZD default works fine)

**Location:** `src/utils/currency.ts:33-54`

**Description:**
Every currency is in the `SUFFIX_CURRENCIES` set, including USD, EUR, GBP. This means USD displays as `1,234.50 $` instead of `$1,234.50`, EUR as `1,234.50 €` instead of `€1,234.50`.

**Fix:** Only keep actual suffix currencies (DZD, MAD, TRY, SAR, AED, etc.) in the set. Move prefix currencies (USD, EUR, GBP, JPY, CHF, CNY, INR, etc.) out.

---

## 3. Loan "People Owe Me" Balance Direction Inverted

**Severity:** High (wrong balances)

**Location:** `src/contexts/FinanceContext.tsx:719-738`

**Description:**
When a secondary account is a loan, both income and expense apply the same direction to both primary and secondary accounts. This is correct for "I Owe People" but **inverted** for "People Owe Me":

- Lending money (expense): bank -, loan - → loan should go **+** (they owe more)
- Getting paid back (income): bank +, loan + → loan should go **-** (they owe less)

**Fix:** Check `loanDirection` on the secondary account. If it's `"owed"`, invert the balance operation on the secondary account.

---

## 4. Sub-Account Tracking Doesn't Fire for Secondary Loan Accounts

**Severity:** High (feature broken)

**Location:** `src/contexts/FinanceContext.tsx:756-757`

**Description:**
`applySubAccountTx` only checks `tx.accountId` (primary account) for loan type. When the loan is used as `secondaryAccountId` (the typical flow — bank as primary, loan as secondary), per-person sub-account balances are **never updated**.

**Fix:** Also check `tx.secondaryAccountId` in `applySubAccountTx`, and update sub-accounts on the secondary loan account when `subAccountName` is set.

---

## 5. Account Deletion Doesn't Reverse Balances on Other Accounts

**Severity:** Medium (phantom money)

**Location:** `src/contexts/FinanceContext.tsx:886-891`

**Description:**
When deleting an account, its transactions are removed but balance impacts on **other accounts** are not reversed. Example: if Account A transferred $100 to Account B, deleting Account A removes the transfer but Account B keeps the extra $100, creating phantom money.

**Fix:** Before removing transactions, iterate through them and call `applyTx(accounts, tx, -1)` for each one to reverse balance impacts on surviving accounts.

---

## 6. Timezone Inconsistency Between Context and Analytics

**Severity:** Medium (edge-case wrong data at month/day boundaries)

**Location:** `src/contexts/FinanceContext.tsx:182-185` vs `src/app/analytics/index.tsx:461-463`

**Description:**
FinanceContext parses transaction dates in **local time** via `new Date(y, m - 1, d)`, but the analytics screen uses `new Date(tx.date)` which parses `YYYY-MM-DD` strings as **UTC midnight**. The period boundaries (`start`, `end`) are local time.

For users in negative UTC offsets, `new Date("2026-01-01").getMonth()` returns 11 (December) locally, causing transactions at month boundaries to land in wrong periods.

**Fix:** Use the same local-time parsing everywhere. Replace `new Date(tx.date)` in analytics with the manual `parseDate()` from `src/utils/currency.ts` which correctly creates local-time dates.

---

## 7. Analytics Hero Card Shows Income Instead of Expenses

**Severity:** Low (UX confusion)

**Location:** `src/app/analytics/index.tsx:662-671`

**Description:**
The large hero amount displays `totals.income` while expenses appear in small text below as "Spent {expense}". For a spending analytics screen, users likely expect the prominent number to be their spending, not income.

**Fix:** Swap — show `totals.expense` as the hero amount and income as the subtitle, or label the hero clearly as "Income".
