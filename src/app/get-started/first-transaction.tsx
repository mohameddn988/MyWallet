import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useGetStarted } from "../../contexts/GetStartedContext";
import { useTheme } from "../../contexts/ThemeContext";
import { TransactionType } from "../../types/finance";

export default function FirstTransactionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { accountDrafts, txDraft, updateTxDraft, hasRatesStep, totalSteps } = useGetStarted();
  const styles = makeStyles(theme);

  const step = hasRatesStep ? 4 : 3;

  return (
    <View style={styles.container}>
      <View style={styles.stepRow}>
        <Text style={[styles.stepText, { color: theme.primary.main }]}>
          STEP {step} OF {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary.main, width: `${(step / totalSteps) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      <Text style={styles.title}>First Transaction</Text>
      <Text style={styles.subtitle}>Record your first entry — or skip this step.</Text>

      <View style={styles.txTypeRow}>
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.txTypeBtn, txDraft.type === t && styles.txTypeBtnActive]}
            onPress={() => updateTxDraft({ type: t })}
          >
            <Text
              style={[styles.txTypeBtnText, txDraft.type === t && styles.txTypeBtnTextActive]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={theme.foreground.gray}
        keyboardType="decimal-pad"
        value={txDraft.amount}
        onChangeText={(v) => updateTxDraft({ amount: v })}
      />

      <Text style={styles.fieldLabel}>Account</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
      >
        {accountDrafts.map((draft) => {
          const sel =
            txDraft.accountKey === draft.key ||
            (!txDraft.accountKey && accountDrafts[0].key === draft.key);
          return (
            <Pressable
              key={draft.key}
              style={[styles.chip, sel && styles.chipSelected]}
              onPress={() => updateTxDraft({ accountKey: draft.key })}
            >
              <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                {draft.name || "Account"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.fieldLabel}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What was this for?"
        placeholderTextColor={theme.foreground.gray}
        value={txDraft.note}
        onChangeText={(v) => updateTxDraft({ note: v })}
      />

      <View style={styles.buttonsRow}>
        <Pressable
          style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.navigate("/get-started/done" as any)}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.navigate("/get-started/done" as any)}
        >
          <Text style={styles.continueButtonText}>Done</Text>
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
    stepRow: {
      marginBottom: 20,
      marginTop: 8,
    },
    stepText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.background.accent,
    },
    progressFill: {
      height: "100%" as any,
      borderRadius: 2,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.foreground.white,
      marginVertical: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
      marginBottom: 20,
    },
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
    fieldLabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginBottom: 6,
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
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
    buttonsRow: {
      flexDirection: "row",
      gap: 12,
    },
    skipButton: {
      flex: 1,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.foreground.gray,
    },
    skipButtonText: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "600",
    },
    continueButton: {
      flex: 2,
      backgroundColor: theme.primary.main,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    continueButtonText: {
      color: theme.background.dark,
      fontSize: 18,
      fontWeight: "bold",
    },
  });
}
