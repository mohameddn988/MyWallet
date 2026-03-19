# Bug Report








## 15. Account Detail Page Misses `secondaryAccountId` Transactions

**Severity:** Medium (incomplete data)

**Location:** `src/app/account/[id].tsx:258`

**Description:**
`accountTxs` only filters transactions by `accountId` or `toAccountId`. If a bank account is used as a `secondaryAccountId` (e.g., the bank receiving money in a loan repayment), those transactions don't appear on the bank's account detail page. The stats (totalIn/totalOut), sparkline, and transaction list are all incomplete for that account.

**Fix:** Include `secondaryAccountId` in the filter: `t.accountId === id || t.toAccountId === id || t.secondaryAccountId === id`

---

## 16. Loan Account Stats Show Misleading totalIn/totalOut

**Severity:** Low (UX confusion)

**Location:** `src/app/account/[id].tsx:279`

**Description:**
For "People Owe Me" loan accounts, income transactions (getting paid back) reduce the balance, but the stats count them as `totalIn` (positive). The user sees "Total In: +1500" when the receivable actually decreased by 1500. The stats don't account for the inverted loan logic.

**Fix:** Check the account's `loanDirection` and invert the totalIn/totalOut classification for "owed" loans.

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
