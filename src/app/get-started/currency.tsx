import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COMMON_CURRENCIES } from "../../constants/getStarted";
import { Theme } from "../../constants/themes";
import { useGetStarted } from "../../contexts/GetStartedContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCurrencySymbol } from "../../utils/currency";

export default function CurrencyScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { baseCurrency, setBaseCurrency, totalSteps } = useGetStarted();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.stepRow}>
        <Text style={[styles.stepText, { color: theme.primary.main }]}>
          STEP 1 OF {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary.main, width: `${(1 / totalSteps) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      <Text style={styles.title}>Base Currency</Text>
      <Text style={styles.subtitle}>
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
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.8 }]}
        onPress={() => router.navigate("/get-started/accounts" as any)}
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
