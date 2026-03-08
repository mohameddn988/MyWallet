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
import AppBottomSheet from "../../components/ui/AppBottomSheet";
import { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { COMMON_CURRENCIES } from "../../constants/getStarted";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCurrencySymbol } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Currency picker modal (bottom sheet style like add account)
// ─────────────────────────────────────────────────────────────────────────────

function CurrencyPickerSheet({
  visible,
  selected,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const [search, setSearch] = useState("");
  const filtered = COMMON_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppBottomSheet
      snapPoints={["70%"]}
      isOpen={visible}
      onClose={onClose}
      noWrapper
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: theme.foreground.white,
            marginBottom: 14,
          }}
        >
          Select Base Currency
        </Text>
        <BottomSheetTextInput
          style={{
            backgroundColor: theme.background.accent,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#2C3139",
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: theme.foreground.white,
            fontSize: 14,
            marginBottom: 12,
          }}
          placeholder="Search currencies…"
          placeholderTextColor={theme.foreground.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <BottomSheetScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {filtered.map((c) => {
          const active = selected === c.code;
          const symbol = getCurrencySymbol(c.code);
          return (
            <Pressable
              key={c.code}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 13,
                paddingHorizontal: 12,
                borderRadius: 10,
                marginBottom: 4,
                backgroundColor: active
                  ? `${theme.primary.main}22`
                  : pressed
                    ? theme.background.accent
                    : "transparent",
                borderWidth: active ? 1 : 0,
                borderColor: theme.primary.main,
              })}
              onPress={() => {
                onSelect(c.code);
                onClose();
              }}
            >
              <Text
                style={{
                  width: 38,
                  fontSize: 16,
                  fontWeight: "700",
                  color: active ? theme.primary.main : theme.foreground.gray,
                }}
              >
                {symbol}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: active ? "700" : "500",
                    color: active
                      ? theme.primary.main
                      : theme.foreground.white,
                  }}
                >
                  {c.code}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.foreground.gray,
                    marginTop: 1,
                  }}
                >
                  {c.name}
                </Text>
              </View>
              {active && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={theme.primary.main}
                />
              )}
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}

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
            styles.headerBtn,
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
        <Text style={styles.headerTitle} numberOfLines={1}>Currency Settings</Text>
        <View style={styles.headerBtn} />
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
      <CurrencyPickerSheet
        visible={isBaseCurrencyModalVisible}
        selected={baseCurrency}
        onSelect={handleUpdateBaseCurrency}
        onClose={() => setBaseCurrencyModalVisible(false)}
        theme={theme}
      />

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
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      marginBottom: 12,
      paddingHorizontal: 4,
      opacity: 0.7,
      textTransform: "uppercase",
    },
    currencyItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
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
    // Modal Styles (Edit Rate Modal only)
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
