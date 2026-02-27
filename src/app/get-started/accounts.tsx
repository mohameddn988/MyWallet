import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ACCOUNT_TYPES, COMMON_CURRENCIES } from "../../constants/getStarted";
import { Theme } from "../../constants/themes";
import { useGetStarted } from "../../contexts/GetStartedContext";
import { useTheme } from "../../contexts/ThemeContext";
import { AccountDraft } from "../../types/getStarted";
import { getCurrencySymbol } from "../../utils/currency";

export default function AccountsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    accountDrafts,
    addAccount,
    removeAccount,
    updateAccount,
    totalSteps,
  } = useGetStarted();
  const styles = makeStyles(theme);

  const handleNext = () => {
    const invalid = accountDrafts.some((d) => !d.name.trim());
    if (invalid) {
      Alert.alert("Missing name", "Please give each account a name.");
      return;
    }
    router.push("/get-started/first-transaction");
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepRow}>
        <Text style={[styles.stepText, { color: theme.primary.main }]}>
          STEP 2 OF {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary.main, width: `${(2 / totalSteps) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      <Text style={styles.title}>Your Accounts</Text>
      <Text style={styles.subtitle}>Add at least one account to track your finances.</Text>

      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {accountDrafts.map((draft, i) => (
          <AccountCard
            key={draft.key}
            draft={draft}
            index={i}
            showRemove={accountDrafts.length > 1}
            onRemove={() => removeAccount(draft.key)}
            onUpdate={(patch) => updateAccount(draft.key, patch)}
          />
        ))}

        <Pressable
          style={({ pressed }) => [styles.addAccountBtn, pressed && styles.pressed]}
          onPress={addAccount}
        >
          <MaterialCommunityIcons name="plus" size={18} color={theme.primary.main} />
          <Text style={styles.addAccountText}>Add another account</Text>
        </Pressable>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.8 }]}
        onPress={handleNext}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountCard sub-component
// ─────────────────────────────────────────────────────────────────────────────

interface AccountCardProps {
  draft: AccountDraft;
  index: number;
  showRemove: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<AccountDraft>) => void;
}

function AccountCard({ draft, index, showRemove, onRemove, onUpdate }: AccountCardProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.accountCard}>
      <View style={styles.accountCardHeader}>
        <Text style={styles.accountCardLabel}>Account {index + 1}</Text>
        {showRemove && (
          <Pressable
            onPress={onRemove}
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
        onChangeText={(v) => onUpdate({ name: v })}
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
              onPress={() => onUpdate({ type: t.value })}
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
              onPress={() => onUpdate({ currency: cur.code })}
            >
              <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{cur.code}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Balance */}
      <Text style={styles.fieldLabel}>
        Initial balance ({getCurrencySymbol(draft.currency)})
      </Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor={theme.foreground.gray}
        keyboardType="decimal-pad"
        value={draft.balance}
        onChangeText={(v) => onUpdate({ balance: v })}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

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
      marginBottom: 20,
    },
    listScroll: {
      flex: 1,
    },
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
    continueButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
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
    pressed: {
      opacity: 0.7,
    },
  });
}
