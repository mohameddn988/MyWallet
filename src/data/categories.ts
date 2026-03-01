export interface Category {
  id: string;
  name: string;
  /** MaterialCommunityIcons icon name */
  icon: string;
  color: string;
  type: "expense" | "income";
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "cat_groceries", name: "Groceries", icon: "cart-outline", color: "#FF9500", type: "expense" },
  { id: "cat_food", name: "Restaurant", icon: "silverware-fork-knife", color: "#F14A6E", type: "expense" },
  { id: "cat_transport", name: "Transport", icon: "bus", color: "#4A9FF1", type: "expense" },
  { id: "cat_bills", name: "Bills", icon: "file-document-outline", color: "#A44AF1", type: "expense" },
  { id: "cat_health", name: "Health", icon: "medical-bag", color: "#FF6B6B", type: "expense" },
  { id: "cat_shopping", name: "Shopping", icon: "shopping-outline", color: "#F1C44A", type: "expense" },
  { id: "cat_personal", name: "Personal", icon: "emoticon-outline", color: "#26A17B", type: "expense" },
  { id: "cat_entertainment", name: "Entertainment", icon: "gamepad-variant-outline", color: "#C8F14A", type: "expense" },
  { id: "cat_education", name: "Education", icon: "school-outline", color: "#88C0D0", type: "expense" },
  { id: "cat_home", name: "Home", icon: "home-outline", color: "#5E81AC", type: "expense" },
  { id: "cat_travel", name: "Travel", icon: "airplane", color: "#FF9500", type: "expense" },
  { id: "cat_subscriptions", name: "Subscriptions", icon: "refresh-circle-outline", color: "#A44AF1", type: "expense" },
  { id: "cat_charity_exp", name: "Charity", icon: "hand-heart-outline", color: "#FF6B6B", type: "expense" },
  { id: "cat_other_exp", name: "Other", icon: "dots-horizontal-circle-outline", color: "#BFC3C7", type: "expense" },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: "cat_salary", name: "Salary", icon: "briefcase-outline", color: "#C8F14A", type: "income" },
  { id: "cat_freelance", name: "Freelance", icon: "laptop", color: "#C8F14A", type: "income" },
  { id: "cat_investment", name: "Investment", icon: "trending-up", color: "#4A9FF1", type: "income" },
  { id: "cat_business", name: "Business", icon: "store-outline", color: "#F1C44A", type: "income" },
  { id: "cat_gift", name: "Gift", icon: "gift-outline", color: "#F14A6E", type: "income" },
  { id: "cat_refund", name: "Refund", icon: "cash-refund", color: "#26A17B", type: "income" },
  { id: "cat_other_inc", name: "Other", icon: "dots-horizontal-circle-outline", color: "#BFC3C7", type: "income" },
];

export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bank_transfer", label: "Transfer" },
  { id: "mobile_pay", label: "Mobile Pay" },
  { id: "cheque", label: "Cheque" },
];

export function getCategoryById(id: string): Category | undefined {
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.id === id);
}
