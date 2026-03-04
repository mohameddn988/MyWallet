# TODO

## 1. AUTHENTICATION

- [x] Auth screen with Google and Local options
- [ ] Google OAuth integration for login (placeholder console.log)
- [x] User session management (login state persistence)
- [x] Logout functionality
- [x] Auth state guards for protected screens

---

## 2. GET STARTED (POST-AUTH)

- [x] Show Get Started flow after user authenticates (Google or Local)
- [x] Step 1 — Welcome: choose Online (Google) vs Offline (local-only)
- [x] Step 2 — Base currency: set default currency (default: DZD)
- [x] Step 3 — Create first accounts: add at least 1 account (name, type, currency, initial balance)
- [x] Step 4 — Exchange rates (conditional): only show if any non-base currency accounts exist
- [x] Step 5 — Add first transaction (optional): Expense / Income / Transfer (skip allowed)
- [x] Step 6 — Done: go to dashboard/home
- [x] Option: add sample/demo data (one-tap fill) during onboarding
- [x] Persist completion state so onboarding doesn't show again

---

## 3. Home

- [x] Show current month summary (income, expenses, net)
- [x] Show today/week/month spending quick stats
- [x] Show account balances (per account + total)
- [x] Show overall net worth across all accounts (converted to base currency)
- [x] Show per-currency subtotals (optional)
- [x] Clearly label conversion rate used + last updated time (if rates are user-defined)
- [x] Show recent transactions list
- [x] Quick add buttons (expense / income / transfer)
- [x] Tap summary cards to open filtered transaction list (placeholder handlers)
- [x] Pull to refresh (recompute totals)
- [x] New flat vertical dashboard layout implemented

---

## 4. TRANSACTIONS

- [x] Transactions list grouped by date
- [x] Infinite/virtualized list for large histories
- [x] Transaction detail screen
- [x] Add transaction (expense)
- [x] Add transaction (income)
- [x] Add transaction (transfer between accounts)
- [x] Edit transaction
- [x] Delete transaction with confirmation
- [x] Duplicate transaction (quick copy)
- [x] Attach optional note to a transaction
- [x] Optional tags on transactions
- [x] Optional payment method field
- [x] Optional merchant field
- [ ] Support negative/adjustment entries (define rule)

---

## 5. ADD / EDIT TRANSACTION FORM

- [x] Money input with proper currency formatting
- [x] Store money safely (minor units strategy)
- [x] Category picker (filtered by expense/income)
- [x] Account picker
- [x] Date picker (default to today)
- [x] Optional time picker
- [x] Validation (amount required, account required, category required for non-transfer)
- [x] Inline error messages + disable save when invalid
- [x] Save feedback (toast/snackbar)
- [x] Keyboard-safe layout for small screens
- [x] Loan account person picker (for debts owed / receivables)
- [x] Secondary account picker (charity paid-from, debt/loan transfers)

---

## 6. CATEGORIES

- [x] Display categories (expense + income tabs) with collapsible expansion
- [x] Expanded category set (18+ categories for expense, 13+ for income)
- [ ] Edit category
- [ ] Reorder categories
- [ ] Archive/unarchive categories
- [ ] Delete category with reassignment to another category
- [ ] Category spending breakdown for selected period

---

## 7. ACCOUNTS / WALLETS

- [x] Display accounts list
- [x] Create account (name, initial balance)
- [x] Account type/category (e.g., Cash, Bank, Savings, Charity, Loan, Other)
- [x] Account currency selection (e.g., USD/EUR/etc)
- [x] Base currency concept for the app (chosen once, editable later)
- [x] Conversion rate per currency → base currency (manual entry to start)
- [x] Display balances in both native currency and converted base currency
- [x] Edit account
- [x] Archive/unarchive account
- [x] Prevent deleting accounts with transactions (or provide migration flow)
- [x] Show account detail (balance trend + transactions filtered to account)
- [x] Multi-currency support (required): overall totals computed in base currency
- [x] Loans: support liability accounts (negative balances) and include in overall net worth
- [x] Loans: person-level tracking with sub-accounts (debts owed / receivables)
- [x] Charity: support earmarked/goal accounts (tracked separately but included in overall)
- [x] Charity & Debt: secondary account picker (track source/destination account)



---

## 8. REPORTS / ANALYTICS

- [ ] Spending by category (pie/bar)
- [ ] Income vs expenses chart
- [ ] Trend over time (daily/weekly/monthly)
- [ ] Period selector (week / month / year / custom)
- [ ] Top merchants (if merchant field enabled)
- [ ] Top categories and largest transactions
- [ ] Export a report snapshot (image/PDF optional)

---

## 9. SEARCH / FILTER / SORT

- [ ] Search transactions by note/merchant
- [ ] Filter by date range
- [ ] Filter by category
- [ ] Filter by account
- [ ] Filter by type (expense/income/transfer)
- [ ] Sort by date (newest/oldest)
- [ ] Sort by amount (high/low)
- [ ] Save filter presets (optional)

---

## 10. RECURRING TRANSACTIONS

- [ ] Create recurring transaction (expense/income)
- [ ] Frequencies: daily / weekly / monthly / yearly
- [ ] Custom interval (every N days/weeks/months)
- [ ] Generate next occurrences
- [ ] Mark generated occurrences as paid/confirmed (optional)
- [ ] Skip a single occurrence
- [ ] Edit series (apply to future vs all)
- [ ] Prevent duplicate generation (idempotency)

---

## 11. DATA STORAGE & MIGRATIONS

- [ ] Persist data locally (transactions, categories, accounts, budgets, settings)
- [ ] Data versioning and migrations
- [ ] Full recalculation utilities (rebuild balances/totals from transactions)
- [ ] Safe delete rules + referential integrity (category/account references)
- [ ] Store base currency + currency conversion rates (with updatedAt)
- [ ] Recompute derived totals using conversion rates (deterministic rules)

---

## 12. EXPORT / IMPORT / BACKUP

- [ ] Export full backup to JSON
- [ ] Import backup from JSON
- [ ] Validate imports + show summary before applying
- [ ] Export transactions to CSV
- [ ] Import transactions from CSV template (optional)
- [ ] Share backup/export via system share sheet
- [ ] Automatic scheduled backups (optional)

---

## 13. SECURITY & PRIVACY

- [ ] App lock with PIN/biometric (optional)
- [ ] Hide sensitive screen in app switcher (privacy blur) (optional)
- [ ] Local encryption for stored data (optional)
- [ ] Clear local data (danger action)

---

## 14. NOTIFICATIONS

- [ ] Budget alerts (near limit / over limit)
- [ ] Recurring transaction reminders
- [ ] Notification settings per type (enable/disable)

---

## 15. SETTINGS

- [ ] Theme: light/dark/system (wired to existing ThemeContext)
- [ ] Base currency (default currency) used for totals
- [ ] Manage currencies + conversion rates (manual entry MVP)
- [ ] Locale and number/date formatting
- [ ] First day of week
- [ ] Manage categories shortcut
- [ ] Manage accounts shortcut
- [ ] Data management (export/import/reset)
- [ ] About screen (version, build)

---

## 16. ACCESSIBILITY & LOCALIZATION

- [ ] Accessible labels for all interactive elements
- [ ] Dynamic type / font scaling support
- [ ] High-contrast checks
- [ ] RTL support check
- [ ] Translation/i18n support for all strings

---

## 17. PERFORMANCE & RELIABILITY

- [ ] Fast list rendering for transactions (virtualization)
- [ ] Memoize derived totals and charts
- [ ] Error boundary for screens
- [ ] Robust empty states (no transactions/categories/accounts)
- [ ] Offline-first behavior (no network dependency)

---

## 18. TESTING

- [ ] Unit tests for money math (minor units), totals, budgets
- [ ] Tests for transfer logic and balance calculations
- [ ] Storage adapter tests (CRUD + migrations)
- [ ] Component tests for add/edit transaction form

---

## 19. POLISH

- [ ] First-launch setup (pick currency, create first account)
- [ ] Sample/demo data toggle (optional)
- [ ] Empty-state get started (CTA to add first transaction)
- [ ] Haptics for key actions (optional)
- [ ] App icon/splash polish
