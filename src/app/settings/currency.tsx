import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { COMMON_CURRENCIES } from "../../constants/getStarted";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCurrencySymbol } from "../../utils/currency";

export default function CurrencySettingsScreen() {
  const { theme } = useTheme();
  const {
    baseCurrency,
    updateBaseCurrency,
    exchangeRates,
    updateExchangeRate,
    availableCurrencies,
  } = useFinance();
  const router = useRouter();
  const styles = makeStyles(theme);

  const [isBaseCurrencyModalVisible, setBaseCurrencyModalVisible] = useState(false);
  const [isEditRateModalVisible, setEditRateModalVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [rateInput, setRateInput] = useState<string>("");

  const handleUpdateBaseCurrency = async (newCurrency: string) => {
    try {
      await updateBaseCurrency(newCurrency);
      setBaseCurrencyModalVisible(false);
      Alert.alert("Success", "Base currency updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update base currency");
    }
  };

  const handleEditRate = (currency: string) => {
    const rate = exchangeRates.find((r) => r.from === currency);
    setSelectedCurrency(currency);
    setRateInput(rate ? rate.rate.toString() : "1");
    setEditRateModalVisible(true);
  };

  const handleSaveRate = async () => {
    const rate = parseFloat(rateInput);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert("Invalid Rate", "Please enter a valid positive number");
      return;
    }

    try {
      await updateExchangeRate({
        from: selectedCurrency,
        to: baseCurrency,
        rate,
        lastUpdated: new Date().toISOString(),
        isUserDefined: true,
      });
      setEditRateModalVisible(false);
      Alert.alert("Success", "Exchange rate updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update exchange rate");
    }
  };

  const usedCurrencies = Array.from(
    new Set([baseCurrency, ...availableCurrencies])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Currency Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Base Currency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BASE CURRENCY</Text>
          <Pressable
            style={({ pressed }) => [
              styles.currencyItem,
              pressed && styles.pressed,
            ]}
            onPress={() => setBaseCurrencyModalVisible(true)}
          >
            <View style={styles.currencyLeft}>
              <Text style={styles.currencyCode}>{baseCurrency}</Text>
              <Text style={styles.currencyName}>
                {
                  COMMON_CURRENCIES.find((c) => c.code === baseCurrency)
                    ?.name
                }
              </Text>
            </View>
            <View style={styles.currencyRight}>
              <Text style={styles.currencySymbol}>
                {getCurrencySymbol(baseCurrency)}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.foreground.gray}
              />
            </View>
          </Pressable>
          <Text style={styles.helperText}>
            All amounts will be converted to this currency for totals
          </Text>
        </View>

        {/* Exchange Rates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>EXCHANGE RATES</Text>
          {usedCurrencies
            .filter((cur) => cur !== baseCurrency)
            .map((currency) => {
              const rate = exchangeRates.find((r) => r.from === currency);
              const rateValue = rate?.rate || 1;
              const lastUpdated = rate?.lastUpdated
                ? new Date(rate.lastUpdated).toLocaleDateString()
                : "Not set";

              return (
                <Pressable
                  key={currency}
                  style={({ pressed }) => [
                    styles.rateItem,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleEditRate(currency)}
                >
                  <View style={styles.rateLeft}>
                    <Text style={styles.rateCurrency}>
                      {currency} → {baseCurrency}
                    </Text>
                    <Text style={styles.rateUpdated}>
                      Updated: {lastUpdated}
                    </Text>
                  </View>
                  <View style={styles.rateRight}>
                    <Text style={styles.rateValue}>{rateValue.toFixed(4)}</Text>
                    <MaterialCommunityIcons
                      name="pencil"
                      size={18}
                      color={theme.primary.main}
                    />
                  </View>
                </Pressable>
              );
            })}
          {usedCurrencies.filter((cur) => cur !== baseCurrency).length ===
            0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="currency-usd-off"
                size={48}
                color={theme.foreground.gray}
              />
              <Text style={styles.emptyText}>
                No other currencies in use
              </Text>
              <Text style={styles.emptySubtext}>
                Add accounts with different currencies to manage rates
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Base Currency Selection Modal */}
      <Modal
        visible={isBaseCurrencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBaseCurrencyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Base Currency</Text>
            <Pressable
              onPress={() => setBaseCurrencyModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.foreground.white}
              />
            </Pressable>
          </View>
          <ScrollView style={styles.modalScroll}>
            {COMMON_CURRENCIES.map((cur) => (
              <Pressable
                key={cur.code}
                style={({ pressed }) => [
                  styles.modalCurrencyItem,
                  baseCurrency === cur.code && styles.modalCurrencyItemSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleUpdateBaseCurrency(cur.code)}
              >
                <View style={styles.currencyLeft}>
                  <Text
                    style={[
                      styles.currencyCode,
                      baseCurrency === cur.code &&
                        styles.currencyCodeSelected,
                    ]}
                  >
                    {cur.code}
                  </Text>
                  <Text style={styles.currencyName}>{cur.name}</Text>
                </View>
                <Text style={styles.currencySymbol}>
                  {getCurrencySymbol(cur.code)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Rate Modal */}
      <Modal
        visible={isEditRateModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setEditRateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editRateModal}>
            <Text style={styles.editRateTitle}>
              Edit Exchange Rate
            </Text>
            <Text style={styles.editRateSubtitle}>
              {selectedCurrency} → {baseCurrency}
            </Text>
            <TextInput
              style={styles.rateInput}
              value={rateInput}
              onChangeText={setRateInput}
              keyboardType="decimal-pad"
              placeholder="Enter rate"
              placeholderTextColor={theme.foreground.gray}
              autoFocus
            />
            <View style={styles.editRateButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.editRateButton,
                  styles.editRateButtonCancel,
                  pressed && styles.pressed,
                ]}
                onPress={() => setEditRateModalVisible(false)}
              >
                <Text style={styles.editRateButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.editRateButton,
                  styles.editRateButtonSave,
                  pressed && styles.pressed,
                ]}
                onPress={handleSaveRate}
              >
                <Text style={styles.editRateButtonTextSave}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 20,
      gap: 14,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.foreground.white,
      marginBottom: 3,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    currencyItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    currencyLeft: {
      flex: 1,
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    currencyCodeSelected: {
      color: theme.primary.main,
    },
    currencyName: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    currencyRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    helperText: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 8,
      paddingHorizontal: 4,
      lineHeight: 18,
    },
    rateItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    rateLeft: {
      flex: 1,
    },
    rateCurrency: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    rateUpdated: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    rateRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rateValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.primary.main,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginTop: 8,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    pressed: {
      opacity: 0.7,
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.foreground.white,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalScroll: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    modalCurrencyItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    modalCurrencyItemSelected: {
      borderColor: theme.primary.main,
      backgroundColor: `${theme.primary.main}14`,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    editRateModal: {
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    editRateTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.foreground.white,
      marginBottom: 4,
    },
    editRateSubtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 20,
    },
    rateInput: {
      backgroundColor: theme.background.dark,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.foreground.white,
      borderWidth: 1,
      borderColor: theme.background.darker,
      marginBottom: 20,
    },
    editRateButtons: {
      flexDirection: "row",
      gap: 12,
    },
    editRateButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    editRateButtonCancel: {
      backgroundColor: theme.background.darker,
    },
    editRateButtonSave: {
      backgroundColor: theme.primary.main,
    },
    editRateButtonTextCancel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    editRateButtonTextSave: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.background.dark,
    },
  });
}
