import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useGetStarted } from "../../contexts/GetStartedContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Account, Transaction } from "../../types/finance";
import { draftToAccount } from "../../types/getStarted";

export default function DoneScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { completeOnboarding } = useFinance();
  const {
    baseCurrency,
    accountDrafts,
    nonBaseCurrencies,
    rates,
    txDraft,
  } = useGetStarted();
  const styles = makeStyles(theme);

  const handleFinish = async () => {
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
      const accountIdx = accountDrafts.findIndex((a) => a.key === txDraft.accountKey);
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

    router.navigate("/(tabs)/home" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="check-circle"
          size={80}
          color={theme.primary.main}
          style={styles.icon}
        />
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          {accountDrafts.length} account{accountDrafts.length > 1 ? "s" : ""} created in{" "}
          {baseCurrency}. Your wallet is ready.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={handleFinish}
        >
          <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 24,
      paddingBottom: 20,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      marginBottom: 24,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 40,
    },
    primaryButton: {
      width: "100%",
      backgroundColor: theme.primary.main,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: theme.background.dark,
      fontSize: 16,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
