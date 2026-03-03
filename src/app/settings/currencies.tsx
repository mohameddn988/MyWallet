import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ExchangeRate } from "../../types/finance";
import { getCurrencySymbol } from "../../utils/currency";

export default function CurrenciesScreen() {
  const { theme } = useTheme();
  const { baseCurrency, exchangeRates, updateExchangeRate, updateBaseCurrency } = useFinance();
  const styles = makeStyles(theme);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [newRate, setNewRate] = useState("");

  // Get unique currencies from exchange rates
  const currencies = [baseCurrency, ...exchangeRates.map((r) => r.from)];
  const uniqueCurrencies = [...new Set(currencies)];

  const handleEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setNewRate(rate.rate.toString());
  };

  const handleSaveRate = async () => {
    if (!editingRate || !newRate) return;
    const value = parseFloat(newRate);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Invalid Rate", "Please enter a valid positive number");
      return;
    }

    await updateExchangeRate({
      ...editingRate,
      rate: value,
      lastUpdated: new Date().toISOString(),
    });
    setEditingRate(null);
    setNewRate("");
  };

  const handleChangeBaseCurrency = (currency: string) => {
    Alert.alert(
      "Change Base Currency",
      `Are you sure you want to change the base currency to ${currency}? All exchange rates will be recalculated.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: async () => {
            await updateBaseCurrency(currency);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.foreground.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Currencies</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Base Currency Section */}
        <Text style={styles.sectionHeader}>Base Currency</Text>
        <Text style={styles.sectionDescription}>
          Your base currency is used for calculating totals and net worth. Changing it will
          recalculate all exchange rates.
        </Text>
        <View style={styles.baseCurrencyCard}>
          <MaterialCommunityIcons name="cash" size={24} color={theme.primary.main} />
          <View style={styles.baseCurrencyInfo}>
            <Text style={styles.baseCurrencyCode}>{baseCurrency}</Text>
            <Text style={styles.baseCurrencyLabel}>Base Currency</Text>
          </View>
          <Text style={styles.baseCurrencySymbol}>{getCurrencySymbol(baseCurrency)}</Text>
        </View>

        {/* Exchange Rates Section */}
        <Text style={styles.sectionHeader}>Exchange Rates</Text>
        <Text style={styles.sectionDescription}>
          Set how much 1 unit of each currency is worth in {baseCurrency}. These rates are used to
          calculate totals across different currencies.
        </Text>

        {exchangeRates.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="currency-usd-off"
              size={48}
              color={theme.foreground.gray}
            />
            <Text style={styles.emptyStateText}>No exchange rates needed</Text>
            <Text style={styles.emptyStateSubtext}>
              All your accounts use the base currency
            </Text>
          </View>
        ) : (
          <View style={styles.ratesList}>
            {exchangeRates.map((rate) => (
              <View key={rate.from} style={styles.rateCard}>
                <View style={styles.rateHeader}>
                  <View style={styles.rateInfo}>
                    <Text style={styles.rateCurrency}>
                      1 {rate.from} = {rate.rate} {baseCurrency}
                    </Text>
                    <Text style={styles.rateDate}>
                      Updated: {new Date(rate.lastUpdated).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleEditRate(rate)}
                    style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color={theme.primary.main} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Other Currencies Section */}
        <Text style={styles.sectionHeader}>All Currencies</Text>
        <View style={styles.currenciesList}>
          {uniqueCurrencies.map((currency) => (
            <Pressable
              key={currency}
              onPress={() => currency !== baseCurrency && handleChangeBaseCurrency(currency)}
              disabled={currency === baseCurrency}
              style={({ pressed }) => [
                styles.currencyChip,
                currency === baseCurrency && styles.currencyChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  currency === baseCurrency && styles.currencyChipTextActive,
                ]}
              >
                {currency}
              </Text>
              {currency === baseCurrency && (
                <MaterialCommunityIcons name="check" size={16} color={theme.primary.main} />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Edit Rate Modal */}
      <Modal
        visible={editingRate !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingRate(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditingRate(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Edit Exchange Rate</Text>
            {editingRate && (
              <Text style={styles.modalDescription}>
                1 {editingRate.from} = ? {baseCurrency}
              </Text>
            )}
            <TextInput
              style={styles.input}
              value={newRate}
              onChangeText={setNewRate}
              placeholder="Enter rate"
              placeholderTextColor={theme.foreground.gray}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setEditingRate(null)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveRate}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "600",
      marginTop: 24,
      marginBottom: 8,
    },
    sectionDescription: {
      color: theme.foreground.gray,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 16,
    },
    baseCurrencyCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    baseCurrencyInfo: {
      flex: 1,
    },
    baseCurrencyCode: {
      color: theme.foreground.white,
      fontSize: 18,
      fontWeight: "600",
    },
    baseCurrencyLabel: {
      color: theme.foreground.gray,
      fontSize: 12,
      marginTop: 2,
    },
    baseCurrencySymbol: {
      color: theme.primary.main,
      fontSize: 24,
      fontWeight: "700",
    },
    ratesList: {
      gap: 10,
    },
    rateCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    rateHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rateInfo: {
      flex: 1,
    },
    rateCurrency: {
      color: theme.foreground.white,
      fontSize: 15,
      fontWeight: "500",
    },
    rateDate: {
      color: theme.foreground.gray,
      fontSize: 12,
      marginTop: 4,
    },
    editButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.darker,
      borderRadius: 8,
    },
    currenciesList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    currencyChip: {
      backgroundColor: theme.background.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: "transparent",
    },
    currencyChipActive: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.darker,
    },
    currencyChipText: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "500",
    },
    currencyChipTextActive: {
      color: theme.primary.main,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyStateText: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "500",
      marginTop: 12,
    },
    emptyStateSubtext: {
      color: theme.foreground.gray,
      fontSize: 13,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      color: theme.foreground.white,
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 8,
    },
    modalDescription: {
      color: theme.foreground.gray,
      fontSize: 14,
      marginBottom: 20,
    },
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 10,
      padding: 14,
      color: theme.foreground.white,
      fontSize: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: theme.background.darker,
    },
    modalButtonPrimary: {
      backgroundColor: theme.primary.main,
    },
    modalButtonTextSecondary: {
      color: theme.foreground.white,
      fontSize: 15,
      fontWeight: "600",
    },
    modalButtonTextPrimary: {
      color: theme.background.dark,
      fontSize: 15,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.7,
    },
    bottomSpacer: {
      height: 40,
    },
  });
}
