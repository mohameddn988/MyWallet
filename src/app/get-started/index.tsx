import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  BASE_CURRENCY,
  INITIAL_ACCOUNTS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_TRANSACTIONS,
} from "../../data/financeData";
import { Account, AccountType, Transaction, TransactionType } from "../../types/finance";
import { getCurrencySymbol } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COMMON_CURRENCIES: { code: string; name: string }[] = [
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

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
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

const TYPE_ICON: Record<AccountType, string> = {
  cash: "cash",
  bank: "bank",
  savings: "piggy-bank",
  credit: "credit-card",
  loan: "handshake",
  charity: "hand-heart",
  crypto: "bitcoin",
  gold: "gold",
  other: "help-circle-outline",
};

const TYPE_COLOR: Record<AccountType, string> = {
  cash: "#4CAF50",
  bank: "#2196F3",
  savings: "#9C27B0",
  credit: "#F44336",
  loan: "#FF9800",
  charity: "#E91E63",
  crypto: "#F7931A",
  gold: "#FFC107",
  other: "#607D8B",
};

// ─────────────────────────────────────────────────────────────────────────────
// Draft types
// ─────────────────────────────────────────────────────────────────────────────

interface AccountDraft {
  key: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
}

interface TxDraft {
  type: TransactionType;
  amount: string;
  accountKey: string;
  note: string;
}

function makeAccountDraft(currency: string): AccountDraft {
  return {
    key: `draft_${Date.now()}_${Math.random()}`,
    name: "",
    type: "bank",
    currency,
    balance: "",
  };
}

function draftToAccount(draft: AccountDraft, index: number): Account {
  const raw = parseFloat(draft.balance.replace(/,/g, "") || "0");
  return {
    id: `acc_user_${index}_${Date.now()}`,
    name: draft.name.trim() || "My Account",
    type: draft.type,
    currency: draft.currency,
    balance: Math.round(raw * 100),
    isLiability: draft.type === "credit" || draft.type === "loan",
    isArchived: false,
    icon: TYPE_ICON[draft.type],
    color: TYPE_COLOR[draft.type],
  };
}

// Steps: 0=Welcome, 1=Currency, 2=Accounts, 3=Rates, 4=FirstTx, 5=Done
const STEP_TITLES = ["Welcome", "Base Currency", "Your Accounts", "Exchange Rates", "First Transaction", "All Set!"];

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function GetStartedScreen() {
  const { theme } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const router = useRouter();
  const styles = makeStyles(theme);

  // ── Wizard state ────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [useSampleData, setUseSampleData] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("DZD");
  const [accountDrafts, setAccountDrafts] = useState<AccountDraft[]>([makeAccountDraft("DZD")]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [txDraft, setTxDraft] = useState<TxDraft>({
    type: "expense",
    amount: "",
    accountKey: "",
    note: "",
  });

  // ── Computed ─────────────────────────────────────────────────────────────
  const nonBaseCurrencies = useMemo(
    () => [...new Set(accountDrafts.map((a) => a.currency).filter((c) => c !== baseCurrency))],
    [accountDrafts, baseCurrency],
  );

  const hasRatesStep = nonBaseCurrencies.length > 0;

  // Build visible step sequence (skip step 3 if no non-base currencies)
  const stepSequence = useMemo(() => {
    const seq = [0, 1, 2];
    if (hasRatesStep) seq.push(3);
    seq.push(4, 5);
    return seq;
  }, [hasRatesStep]);

  const visibleIndex = stepSequence.indexOf(step);
  const totalVisible = stepSequence.length;

  // ── Navigation ───────────────────────────────────────────────────────────
  const goNext = () => {
    const idx = stepSequence.indexOf(step);
    if (idx < stepSequence.length - 1) {
      setStep(stepSequence[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = stepSequence.indexOf(step);
    if (idx > 0) {
      setStep(stepSequence[idx - 1]);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      const invalid = accountDrafts.some((d) => !d.name.trim());
      if (invalid) {
        Alert.alert("Missing name", "Please give each account a name.");
        return;
      }
    }
    goNext();
  };

  // ── Finish ───────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (useSampleData) {
      await completeOnboarding({
        baseCurrency: BASE_CURRENCY,
        accounts: INITIAL_ACCOUNTS,
        exchangeRates: INITIAL_EXCHANGE_RATES,
        transactions: INITIAL_TRANSACTIONS,
        useSampleData: true,
      });
    } else {
      const accounts: Account[] = accountDrafts.map(draftToAccount);
      const exchangeRates = nonBaseCurrencies.map((cur) => ({
        from: cur,
        to: baseCurrency,
        rate: parseFloat(rates[cur] || "1") || 1,
        lastUpdated: new Date().toISOString().split("T")[0],
        isUserDefined: true,
      }));

      const transactions: Transaction[] = [];
      if (txDraft.amount) {
        const accountIdx = accountDrafts.findIndex(
          (a) => a.key === txDraft.accountKey,
        );
        const acc = accounts[accountIdx >= 0 ? accountIdx : 0];
        if (acc) {
          const raw = parseFloat(txDraft.amount.replace(/,/g, "") || "0");
          transactions.push({
            id: `tx_onb_${Date.now()}`,
            type: txDraft.type,
            amount: Math.round(raw * 100),
            currency: acc.currency,
            accountId: acc.id,
            date: new Date().toISOString().split("T")[0],
            note: txDraft.note.trim() || undefined,
          });
        }
      }

      await completeOnboarding({
        baseCurrency,
        accounts,
        exchangeRates,
        transactions,
        useSampleData: false,
      });
    }
    router.replace("/(tabs)/home" as any);
  };

  // ── Sample-data shortcut ────────────────────────────────────────────────
  const handleSampleData = async () => {
    setUseSampleData(true);
    await completeOnboarding({
      baseCurrency: BASE_CURRENCY,
      accounts: INITIAL_ACCOUNTS,
      exchangeRates: INITIAL_EXCHANGE_RATES,
      transactions: INITIAL_TRANSACTIONS,
      useSampleData: true,
    });
    router.replace("/(tabs)/home" as any);
  };

  // ── Account draft helpers ────────────────────────────────────────────────
  const addAccount = () =>
    setAccountDrafts((prev) => [...prev, makeAccountDraft(baseCurrency)]);

  const removeAccount = (key: string) =>
    setAccountDrafts((prev) => prev.filter((a) => a.key !== key));

  const updateAccount = (key: string, patch: Partial<AccountDraft>) =>
    setAccountDrafts((prev) =>
      prev.map((a) => (a.key === key ? { ...a, ...patch } : a)),
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Step renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <MaterialCommunityIcons name="wallet" size={64} color={theme.primary.main} style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Welcome to MyWallet</Text>
      <Text style={styles.stepSubtitle}>
        Let's take a moment to set up your wallet. It only takes a minute.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        onPress={goNext}
      >
        <Text style={styles.primaryButtonText}>Let's set it up</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
        onPress={handleSampleData}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.primary.main} style={{ marginRight: 6 }} />
        <Text style={styles.ghostButtonText}>Load sample data instead</Text>
      </Pressable>
    </View>
  );

  const renderCurrency = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Base Currency</Text>
      <Text style={styles.stepSubtitle}>
        All totals and net worth will be converted to this currency.
      </Text>
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {COMMON_CURRENCIES.map((cur) => {
          const selected = baseCurrency === cur.code;
          return (
            <Pressable
              key={cur.code}
              style={({ pressed }) => [
                styles.currencyRow,
                selected && styles.currencyRowSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => setBaseCurrency(cur.code)}
            >
              <View style={styles.currencyLeft}>
                <Text style={[styles.currencyCode, selected && styles.currencyCodeSelected]}>
                  {cur.code}
                </Text>
                <Text style={styles.currencyName}>{cur.name}</Text>
              </View>
              <Text style={styles.currencySymbol}>{getCurrencySymbol(cur.code)}</Text>
              {selected && (
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary.main} style={{ marginLeft: 8 }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderAccounts = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Your Accounts</Text>
      <Text style={styles.stepSubtitle}>Add at least one account to track your finances.</Text>
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {accountDrafts.map((draft, i) => (
          <View key={draft.key} style={styles.accountCard}>
            <View style={styles.accountCardHeader}>
              <Text style={styles.accountCardLabel}>Account {i + 1}</Text>
              {accountDrafts.length > 1 && (
                <Pressable
                  onPress={() => removeAccount(draft.key)}
                  style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="close" size={16} color={theme.foreground.gray} />
                </Pressable>
              )}
            </View>

            {/* Name */}
            <TextInput
              style={styles.input}
              placeholder="Account name"
              placeholderTextColor={theme.foreground.gray}
              value={draft.name}
              onChangeText={(v) => updateAccount(draft.key, { name: v })}
            />

            {/* Type */}
            <Text style={styles.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {ACCOUNT_TYPES.map((t) => {
                const sel = draft.type === t.value;
                return (
                  <Pressable
                    key={t.value}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() => updateAccount(draft.key, { type: t.value })}
                  >
                    <MaterialCommunityIcons
                      name={t.icon as any}
                      size={13}
                      color={sel ? theme.background.dark : theme.foreground.gray}
                    />
                    <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Currency */}
            <Text style={styles.fieldLabel}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {COMMON_CURRENCIES.map((cur) => {
                const sel = draft.currency === cur.code;
                return (
                  <Pressable
                    key={cur.code}
                    style={[styles.chip, sel && styles.chipSelected]}
                    onPress={() => updateAccount(draft.key, { currency: cur.code })}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{cur.code}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Balance */}
            <Text style={styles.fieldLabel}>Initial balance ({getCurrencySymbol(draft.currency)})</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.foreground.gray}
              keyboardType="decimal-pad"
              value={draft.balance}
              onChangeText={(v) => updateAccount(draft.key, { balance: v })}
            />
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [styles.addAccountBtn, pressed && styles.pressed]}
          onPress={addAccount}
        >
          <MaterialCommunityIcons name="plus" size={18} color={theme.primary.main} />
          <Text style={styles.addAccountText}>Add another account</Text>
        </Pressable>
      </ScrollView>
    </View>
  );

  const renderRates = () => (
    <View style={styles.stepContent}>
      <MaterialCommunityIcons name="swap-horizontal" size={48} color={theme.primary.main} style={styles.stepIcon} />
      <Text style={styles.stepTitle}>Exchange Rates</Text>
      <Text style={styles.stepSubtitle}>
        Set the conversion rate from each foreign currency to {baseCurrency}.
      </Text>
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {nonBaseCurrencies.map((cur) => (
          <View key={cur} style={styles.rateRow}>
            <Text style={styles.rateLabel}>
              1 {cur} ={" "}
            </Text>
            <TextInput
              style={[styles.input, styles.rateInput]}
              placeholder="1"
              placeholderTextColor={theme.foreground.gray}
              keyboardType="decimal-pad"
              value={rates[cur] ?? ""}
              onChangeText={(v) => setRates((prev) => ({ ...prev, [cur]: v }))}
            />
            <Text style={styles.rateLabel}> {baseCurrency}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderFirstTx = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>First Transaction</Text>
      <Text style={styles.stepSubtitle}>
        Record your first entry — or skip this step.
      </Text>

      {/* Type toggle */}
      <View style={styles.txTypeRow}>
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.txTypeBtn, txDraft.type === t && styles.txTypeBtnActive]}
            onPress={() => setTxDraft((p) => ({ ...p, type: t }))}
          >
            <Text style={[styles.txTypeBtnText, txDraft.type === t && styles.txTypeBtnTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Amount */}
      <Text style={styles.fieldLabel}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={theme.foreground.gray}
        keyboardType="decimal-pad"
        value={txDraft.amount}
        onChangeText={(v) => setTxDraft((p) => ({ ...p, amount: v }))}
      />

      {/* Account */}
      <Text style={styles.fieldLabel}>Account</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {accountDrafts.map((draft) => {
          const sel = txDraft.accountKey === draft.key || (!txDraft.accountKey && accountDrafts[0].key === draft.key);
          return (
            <Pressable
              key={draft.key}
              style={[styles.chip, sel && styles.chipSelected]}
              onPress={() => setTxDraft((p) => ({ ...p, accountKey: draft.key }))}
            >
              <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                {draft.name || `Account`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Note */}
      <Text style={styles.fieldLabel}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What was this for?"
        placeholderTextColor={theme.foreground.gray}
        value={txDraft.note}
        onChangeText={(v) => setTxDraft((p) => ({ ...p, note: v }))}
      />
    </View>
  );

  const renderDone = () => (
    <View style={styles.stepContent}>
      <MaterialCommunityIcons name="check-circle" size={72} color={theme.primary.main} style={styles.stepIcon} />
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.stepSubtitle}>
        {useSampleData
          ? "Sample data loaded. Explore your finances right away."
          : `${accountDrafts.length} account${accountDrafts.length > 1 ? "s" : ""} created in ${baseCurrency}. Your wallet is ready.`}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        onPress={handleFinish}
      >
        <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
      </Pressable>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 0: return renderWelcome();
      case 1: return renderCurrency();
      case 2: return renderAccounts();
      case 3: return renderRates();
      case 4: return renderFirstTx();
      case 5: return renderDone();
      default: return null;
    }
  };

  const isLastStep = step === 5;
  const showNavButtons = step !== 0 && step !== 5;
  const isDoneStep = step === 5;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Progress bar ── */}
      {step > 0 && (
        <View style={styles.progressWrapper}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((visibleIndex) / (totalVisible - 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {STEP_TITLES[step]}
          </Text>
        </View>
      )}

      {/* ── Step content ── */}
      <View style={styles.contentWrapper}>
        {renderStep()}
      </View>

      {/* ── Navigation buttons ── */}
      {showNavButtons && !isDoneStep && (
        <View style={styles.navRow}>
          <Pressable
            style={({ pressed }) => [styles.navBackBtn, pressed && styles.pressed]}
            onPress={goBack}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color={theme.foreground.gray} />
            <Text style={styles.navBackText}>Back</Text>
          </Pressable>

          <View style={styles.navRight}>
            {step === 4 && (
              <Pressable
                style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
                onPress={goNext}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
              onPress={step === 4 ? goNext : handleNext}
            >
              <Text style={styles.nextBtnText}>
                {step === 4 ? "Done" : "Next"}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.background.dark} />
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },

    // Progress
    progressWrapper: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 6,
    },
    progressTrack: {
      height: 3,
      backgroundColor: theme.background.accent,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.primary.main,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 11,
      color: theme.foreground.gray,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },

    // Content wrapper
    contentWrapper: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 8,
    },

    stepContent: {
      flex: 1,
    },

    stepIcon: {
      marginTop: 24,
      marginBottom: 16,
      alignSelf: "center",
    },

    stepTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 8,
      textAlign: "center",
    },

    stepSubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 28,
    },

    // List scroll (currency & accounts)
    listScroll: {
      flex: 1,
    },

    // Currency rows
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 6,
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "transparent",
    },
    currencyRowSelected: {
      borderColor: theme.primary.main,
      backgroundColor: `${theme.primary.main}14`,
    },
    currencyLeft: {
      flex: 1,
    },
    currencyCode: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    currencyCodeSelected: {
      color: theme.primary.main,
    },
    currencyName: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 1,
    },
    currencySymbol: {
      fontSize: 15,
      color: theme.foreground.gray,
      marginHorizontal: 8,
    },

    // Account cards
    accountCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    accountCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    accountCardLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    removeBtn: {
      padding: 4,
    },

    // Add account
    addAccountBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.primary.main,
      marginBottom: 16,
      gap: 6,
    },
    addAccountText: {
      color: theme.primary.main,
      fontSize: 14,
      fontWeight: "600",
    },

    // Chips
    chipScroll: {
      marginBottom: 10,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: "#2C3139",
      marginRight: 8,
      gap: 5,
    },
    chipSelected: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    chipText: {
      fontSize: 13,
      color: theme.foreground.gray,
    },
    chipTextSelected: {
      color: theme.background.dark,
      fontWeight: "600",
    },

    // Input
    input: {
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: "#2C3139",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: theme.foreground.white,
      fontSize: 15,
      marginBottom: 10,
    },
    fieldLabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 6,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    // Exchange rate row
    rateRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    rateLabel: {
      color: theme.foreground.white,
      fontSize: 15,
      fontWeight: "500",
    },
    rateInput: {
      flex: 1,
      marginBottom: 0,
      marginHorizontal: 8,
    },

    // Transaction type toggle
    txTypeRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    txTypeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      alignItems: "center",
      backgroundColor: theme.background.accent,
    },
    txTypeBtnActive: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    txTypeBtnText: {
      color: theme.foreground.gray,
      fontWeight: "600",
      fontSize: 14,
    },
    txTypeBtnTextActive: {
      color: theme.background.dark,
    },

    // Buttons
    primaryButton: {
      backgroundColor: theme.primary.main,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    primaryButtonText: {
      color: theme.background.dark,
      fontSize: 16,
      fontWeight: "700",
    },
    ghostButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
      paddingVertical: 10,
    },
    ghostButtonText: {
      color: theme.primary.main,
      fontSize: 14,
      fontWeight: "600",
    },

    // Nav row
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: "#2C3139",
    },
    navBackBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    navBackText: {
      color: theme.foreground.gray,
      fontSize: 15,
    },
    navRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    skipBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    skipText: {
      color: theme.foreground.gray,
      fontSize: 14,
    },
    nextBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primary.main,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 4,
    },
    nextBtnText: {
      color: theme.background.dark,
      fontSize: 15,
      fontWeight: "700",
    },

    // Interaction
    pressed: {
      opacity: 0.7,
    },
  });
}
