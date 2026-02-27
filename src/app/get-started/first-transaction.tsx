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
      <Text style={styles.subtitle}>
        Add your first transaction or skip to complete setup.
      </Text>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type</Text>
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
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={theme.foreground.gray}
            keyboardType="decimal-pad"
            value={txDraft.amount}
            onChangeText={(v) => updateTxDraft({ amount: v })}
          />
        </View>

        {/* Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountChipsContainer}
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
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            placeholder="What was this for?"
            placeholderTextColor={theme.foreground.gray}
            value={txDraft.note}
            onChangeText={(v) => updateTxDraft({ note: v })}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonsRow}>
        <Pressable
          style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/get-started/done")}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.push("/get-started/done")}
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
      marginBottom: 12,
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
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
      marginBottom: 24,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      paddingBottom: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 10,
    },
    txTypeRow: {
      flexDirection: "row",
      gap: 12,
    },
    txTypeBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
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
      fontSize: 15,
    },
    txTypeBtnTextActive: {
      color: theme.background.dark,
    },
    input: {
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "#2C3139",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.foreground.white,
      fontSize: 16,
    },
    noteInput: {
      minHeight: 80,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    accountChipsContainer: {
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    chipSelected: {
      backgroundColor: theme.primary.main,
      borderColor: theme.primary.main,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    chipTextSelected: {
      color: theme.background.dark,
      fontWeight: "600",
    },
    buttonsRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
    },
    skipButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    skipButtonText: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "600",
    },
    continueButton: {
      flex: 2,
      backgroundColor: theme.primary.main,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    continueButtonText: {
      color: theme.background.dark,
      fontSize: 18,
      fontWeight: "bold",
    },
  });
}
