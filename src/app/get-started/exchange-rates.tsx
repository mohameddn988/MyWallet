import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useGetStarted } from "../../contexts/GetStartedContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function ExchangeRatesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { baseCurrency, nonBaseCurrencies, rates, setRate, totalSteps } = useGetStarted();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.stepRow}>
        <Text style={[styles.stepText, { color: theme.primary.main }]}>
          STEP 3 OF {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary.main, width: `${(3 / totalSteps) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      <MaterialCommunityIcons
        name="swap-horizontal"
        size={48}
        color={theme.primary.main}
        style={styles.icon}
      />
      <Text style={styles.title}>Exchange Rates</Text>
      <Text style={styles.subtitle}>
        Set the conversion rate from each foreign currency to {baseCurrency}.
      </Text>

      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        {nonBaseCurrencies.map((cur) => (
          <View key={cur} style={styles.rateRow}>
            <Text style={styles.rateLabel}>1 {cur} = </Text>
            <TextInput
              style={styles.rateInput}
              placeholder="1"
              placeholderTextColor={theme.foreground.gray}
              keyboardType="decimal-pad"
              value={rates[cur] ?? ""}
              onChangeText={(v) => setRate(cur, v)}
            />
            <Text style={styles.rateLabel}> {baseCurrency}</Text>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.8 }]}
        onPress={() => router.navigate("/get-started/first-transaction" as any)}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
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
    icon: {
      alignSelf: "center",
      marginTop: 16,
      marginBottom: 16,
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
    listScroll: {
      flex: 1,
    },
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
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: "#2C3139",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: theme.foreground.white,
      fontSize: 15,
      marginHorizontal: 8,
    },
    continueButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
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
