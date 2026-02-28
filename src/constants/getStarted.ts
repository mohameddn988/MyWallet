import { AccountType } from "../types/finance";

export const COMMON_CURRENCIES: { code: string; name: string }[] = [
  { code: "DZD", name: "Algerian Dinar" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "AED", name: "UAE Dirham" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "USDT", name: "Tether" },
];

export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "cash" },
  { value: "bank", label: "Bank", icon: "bank" },
  { value: "savings", label: "Savings", icon: "piggy-bank" },
  { value: "credit", label: "Credit", icon: "credit-card" },
  { value: "loan", label: "Loan", icon: "handshake" },
  { value: "charity", label: "Charity", icon: "hand-heart" },
  { value: "crypto", label: "Crypto", icon: "bitcoin" },
  { value: "gold", label: "Gold", icon: "gold" },
  { value: "other", label: "Other", icon: "help-circle-outline" },
];
