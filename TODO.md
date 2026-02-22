# TODO

## 1. AUTHENTICATION & ONBOARDING

- [ ] Login screen with email/password local auth
- [ ] Google OAuth integration for login
- [ ] Sign up screen for new users
- [ ] Password reset/forgot password flow
- [ ] User session management (login state persistence)
- [ ] Logout functionality
- [ ] Getting started screens (welcome, app intro)
- [ ] Onboarding flow (set currency, create first account, add sample data)
- [ ] Skip onboarding option
- [ ] Auth state guards for protected screens

---

## 2. DASHBOARD

- [ ] Show current month summary (income, expenses, net)
- [ ] Show today/week/month spending quick stats
- [ ] Show account balances (per account + total)
- [ ] Show recent transactions list
- [ ] Quick add buttons (expense / income / transfer)
- [ ] Tap summary cards to open filtered transaction list
- [ ] Pull to refresh (recompute totals)

---

## 3. TRANSACTIONS

- [ ] Transactions list grouped by date
- [ ] Infinite/virtualized list for large histories
- [ ] Transaction detail screen
- [ ] Add transaction (expense)
- [ ] Add transaction (income)
- [ ] Add transaction (transfer between accounts)
- [ ] Edit transaction
- [ ] Delete transaction with confirmation
- [ ] Duplicate transaction (quick copy)
- [ ] Attach optional note to a transaction
- [ ] Optional tags on transactions
- [ ] Optional payment method field
- [ ] Optional merchant field
- [ ] Support negative/adjustment entries (define rule)

---

## 4. ADD / EDIT TRANSACTION FORM

- [ ] Money input with proper currency formatting
- [ ] Store money safely (minor units strategy)
- [ ] Category picker (filtered by expense/income)
- [ ] Account picker
- [ ] Date picker (default to today)
- [ ] Optional time picker
- [ ] Validation (amount required, account required, category required for non-transfer)
- [ ] Inline error messages + disable save when invalid
- [ ] Save feedback (toast/snackbar)
- [ ] Keyboard-safe layout for small screens

---

## 5. CATEGORIES

- [ ] Display categories (expense + income tabs)
- [ ] Create category (name + icon)
- [ ] Edit category
- [ ] Reorder categories
- [ ] Archive/unarchive categories
- [ ] Delete category with reassignment to another category
- [ ] Category spending breakdown for selected period

---

## 6. ACCOUNTS / WALLETS

- [ ] Display accounts list
- [ ] Create account (name, initial balance)
- [ ] Edit account
- [ ] Archive/unarchive account
- [ ] Prevent deleting accounts with transactions (or provide migration flow)
- [ ] Show account detail (balance trend + transactions filtered to account)
- [ ] Support multiple currencies per account (optional)

---

## 7. BUDGETS

- [ ] Create monthly budget per category
- [ ] Create overall monthly budget (optional)
- [ ] Budget progress view (spent vs limit)
- [ ] Budget remaining amount
- [ ] Budget carryover rules (optional)
- [ ] Exclude specific categories from budgets (optional)
- [ ] Budget overspend indicators

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
- [ ] Default currency
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
- [ ] Empty-state onboarding (CTA to add first transaction)
- [ ] Haptics for key actions (optional)
- [ ] App icon/splash polish
