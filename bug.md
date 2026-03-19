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

---

## 8. Leading Zero Stripping Breaks Decimal Input

**Severity:** Medium (wrong amount entered)

**Location:** `src/app/transaction/add.tsx:66`

**Description:**
`sanitizeAmount()` uses `s.replace(/^0+(\d)/, "$1")` to strip leading zeros. This incorrectly converts `"0.50"` to `".50"` by removing the single leading zero before the decimal point.

**Example:** User types `0.50` → becomes `.50` → may confuse the user or cause parsing issues.

**Fix:** Update the regex to preserve a zero before a decimal: `s.replace(/^0+(?=\d(?!\.))/, "")` or `s.replace(/^0{2,}/, "0")`.

---

## 9. Budget Period Overflows for monthStartDay > Days in Month

**Severity:** Medium (wrong budget calculations)

**Location:** `src/contexts/FinanceContext.tsx` — `getBudgetPeriod()`

**Description:**
When `monthStartDay` is 31 and the current month has fewer days (e.g. February with 28), `new Date(year, 1, 31)` overflows to March 3. This means the budget period start is wrong — it jumps forward instead of clamping to the last day of the month.

**Example:** Feb 15 with `monthStartDay=31` → start becomes March 3 instead of Jan 31. The entire budget period is shifted.

**Fix:** Clamp `monthStartDay` to the number of days in the target month:
```js
const daysInMonth = new Date(year, month + 1, 0).getDate();
const clampedDay = Math.min(monthStartDay, daysInMonth);
```

---

## 10. Analytics Date Filtering Uses UTC Parsing in Multiple Places

**Severity:** Medium (wrong data in analytics)

**Location:** `src/app/analytics/index.tsx:175, 194, 204-205, 466, 475`

**Description:**
Beyond the main filtering (bug #6), the sparkline calculations for year/quarter views also use `new Date(tx.date)` (UTC) to extract month/year, then compare against local-time period boundaries. This affects monthly bar charts and daily sparklines.

**Fix:** Replace all `new Date(tx.date)` with `parseDate(tx.date)` from `src/utils/currency.ts` throughout the analytics file.

---

## 11. Analytics Average Daily Expense Uses Hardcoded 30-Day Month

**Severity:** Low (inaccurate stat)

**Location:** `src/app/analytics/index.tsx:507-516`

**Description:**
The "Avg/day" stat card divides total expenses by a fixed `daysMap = { month: 30 }`. February shows a lower average than reality (divides by 30 instead of 28), and 31-day months show a higher average.

**Fix:** Calculate actual days in the period dynamically:
```js
const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
```

---

## 12. Transfer buildRateMap Called Inside map() Loop

**Severity:** Low (performance)

**Location:** `src/contexts/FinanceContext.tsx` — `applyTx()`, transfer branch

**Description:**
When processing a transfer to a different currency, `buildRateMap(rawRates)` is called inside the `.map()` callback for every account on every transfer. This rebuilds the rate map `O(accounts)` times per transfer instead of once.

**Fix:** Move `buildRateMap` call outside the `.map()` loop, or pass the pre-built `rateMap` as a parameter to `applyTx`.

---

## 13. Duplicate Transaction on Rapid Save Button Presses

**Severity:** Medium (duplicate data)

**Location:** `src/app/transaction/add.tsx:324-346`

**Description:**
`handleSave` checks `saving` state to prevent duplicates, but `setSaving(true)` is async (React batching). If the user taps "Save" rapidly before the state update renders, `saving` may still be `false` on the second call, creating duplicate transactions.

**Fix:** Use a ref (`const savingRef = useRef(false)`) for immediate synchronous guard instead of relying on state:
```js
if (savingRef.current) return;
savingRef.current = true;
```
