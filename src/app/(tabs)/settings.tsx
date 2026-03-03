import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useCategories } from "../../contexts/CategoriesContext";
import { useFinance } from "../../contexts/FinanceContext";
import {
  DateFormat,
  FirstDayOfWeek,
  NumberFormat,
  useSettings,
} from "../../contexts/SettingsContext";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeMode, themeVariants } from "../../constants/themes";

export default function SettingsTabScreen() {
  const { theme, themeMode, variantId, setThemeMode, setVariantId } = useTheme();
  const {
    firstDayOfWeek,
    dateFormat,
    numberFormat,
    setFirstDayOfWeek,
    setDateFormat,
    setNumberFormat,
  } = useSettings();
  const { signOut } = useAuth();
  const { resetOnboarding, baseCurrency } = useFinance();
  const { resetCategories } = useCategories();
  const router = useRouter();
  const styles = makeStyles(theme);

  const [showFirstDayModal, setShowFirstDayModal] = useState(false);
  const [showDateFormatModal, setShowDateFormatModal] = useState(false);
  const [showNumberFormatModal, setShowNumberFormatModal] = useState(false);

  const handleRedoSetup = async () => {
    await resetOnboarding();
    router.navigate("/get-started" as any);
  };

  const handleResetCategories = () => {
    Alert.alert(
      "Reset Categories",
      "This will reset all categories to default. Your custom categories will be removed. Existing transactions will keep their category names.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetCategories();
              Alert.alert("Success", "Categories have been reset to defaults");
            } catch (error) {
              Alert.alert("Error", "Failed to reset categories");
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await resetOnboarding();
    await signOut();
    router.navigate("/auth" as any);
  };

  const handleThemeModeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleThemeVariantSelect = (id: string) => {
    setVariantId(id);
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Export all your data as JSON. You can save this backup to restore your data later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const items = await AsyncStorage.multiGet(keys);
              const data = Object.fromEntries(items);
              const json = JSON.stringify(data, null, 2);
              
              // For MVP, just show a preview
              Alert.alert(
                "Export Ready",
                `${keys.length} items ready to export. Data size: ${(json.length / 1024).toFixed(1)}KB\n\nNote: Full export/share functionality requires additional packages.`,
                [{ text: "OK" }]
              );
            } catch (error) {
              Alert.alert("Error", "Failed to export data");
            }
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset All Data",
      "This will delete ALL your data including accounts, transactions, and settings. This action cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "All data has been reset", [
                {
                  text: "OK",
                  onPress: () => router.navigate("/auth" as any),
                },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to reset data");
            }
          },
        },
      ]
    );
  };

  const themeModes: { id: ThemeMode; label: string; icon: string }[] = [
    { id: "system", label: "System", icon: "cellphone-cog" },
    { id: "light", label: "Light", icon: "white-balance-sunny" },
    { id: "dark", label: "Dark", icon: "weather-night" },
  ];

  const firstDayOptions: { value: FirstDayOfWeek; label: string }[] = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const dateFormatOptions: DateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
  const numberFormatOptions: NumberFormat[] = ["1,234.56", "1.234,56", "1 234,56"];

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Appearance Section */}
      <Text style={styles.sectionHeader}>Appearance</Text>

      {/* Theme Mode Selector */}
      <View style={styles.themeModesContainer}>
        {themeModes.map((mode) => (
          <Pressable
            key={mode.id}
            style={({ pressed }) => [
              styles.themeModeCard,
              themeMode === mode.id && styles.themeModeCardActive,
              pressed && styles.pressed,
            ]}
            onPress={() => handleThemeModeSelect(mode.id)}
          >
            <MaterialCommunityIcons
              name={mode.icon as any}
              size={24}
              color={themeMode === mode.id ? theme.primary.main : theme.foreground.gray}
            />
            <Text
              style={[
                styles.themeModeLabel,
                themeMode === mode.id && styles.themeModeLabelActive,
              ]}
            >
              {mode.label}
            </Text>
            {themeMode === mode.id && (
              <View style={styles.checkmark}>
                <MaterialCommunityIcons name="check-circle" size={18} color={theme.primary.main} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Theme Variant Selector */}
      <Text style={styles.subSectionLabel}>Theme</Text>
      <View style={styles.themeVariantsContainer}>
        {themeVariants.map((variant) => {
          const isActive = variantId === variant.id;
          const variantTheme = themeMode === "light" ? variant.light : variant.dark;

          return (
            <Pressable
              key={variant.id}
              style={({ pressed }) => [
                styles.themeVariantCard,
                isActive && styles.themeVariantCardActive,
                pressed && styles.pressed,
              ]}
              onPress={() => handleThemeVariantSelect(variant.id)}
            >
              <View style={styles.themeVariantHeader}>
                <View style={styles.colorPreview}>
                  <View
                    style={[styles.colorDot, { backgroundColor: variantTheme.primary.main }]}
                  />
                  <View
                    style={[styles.colorDot, { backgroundColor: variantTheme.background.darker }]}
                  />
                  <View
                    style={[styles.colorDot, { backgroundColor: variantTheme.background.accent }]}
                  />
                </View>
                {isActive && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={theme.primary.main} />
                )}
              </View>
              <Text
                style={[
                  styles.themeVariantLabel,
                  isActive && styles.themeVariantLabelActive,
                ]}
              >
                {variant.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Currency Section */}
      <Text style={styles.sectionHeader}>Currency & Rates</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => router.push("/settings/currencies" as any)}
      >
        <MaterialCommunityIcons name="cash-multiple" size={20} color={theme.foreground.white} />
        <View style={styles.rowContent}>
          <Text style={styles.rowText}>Currencies & Exchange Rates</Text>
          <Text style={styles.rowSubtext}>Base: {baseCurrency}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      {/* Locale & Formatting Section */}
      <Text style={styles.sectionHeader}>Locale & Formatting</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => setShowDateFormatModal(true)}
      >
        <MaterialCommunityIcons name="calendar" size={20} color={theme.foreground.white} />
        <View style={styles.rowContent}>
          <Text style={styles.rowText}>Date Format</Text>
          <Text style={styles.rowSubtext}>{dateFormat}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => setShowNumberFormatModal(true)}
      >
        <MaterialCommunityIcons name="numeric" size={20} color={theme.foreground.white} />
        <View style={styles.rowContent}>
          <Text style={styles.rowText}>Number Format</Text>
          <Text style={styles.rowSubtext}>{numberFormat}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => setShowFirstDayModal(true)}
      >
        <MaterialCommunityIcons name="calendar-start" size={20} color={theme.foreground.white} />
        <View style={styles.rowContent}>
          <Text style={styles.rowText}>First Day of Week</Text>
          <Text style={styles.rowSubtext}>
            {firstDayOptions.find((opt) => opt.value === firstDayOfWeek)?.label}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      {/* Management Section */}
      <Text style={styles.sectionHeader}>Management</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => router.push("/(tabs)/accounts" as any)}
      >
        <MaterialCommunityIcons name="wallet" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>Manage Accounts</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => router.push("/categories" as any)}
      >
        <MaterialCommunityIcons name="shape" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>Manage Categories</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      {/* Data Section */}
      <Text style={styles.sectionHeader}>Data</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={handleExportData}
      >
        <MaterialCommunityIcons name="download" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>Export Data</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={handleRedoSetup}
      >
        <MaterialCommunityIcons name="restore" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>Redo Initial Setup</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={handleResetCategories}
      >
        <MaterialCommunityIcons name="shape-outline" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>Reset Categories</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, styles.rowDanger, pressed && styles.pressed]}
        onPress={handleResetData}
      >
        <MaterialCommunityIcons name="delete-forever" size={20} color="#F44336" />
        <Text style={[styles.rowText, styles.rowTextDanger]}>Reset All Data</Text>
      </Pressable>

      {/* About Section */}
      <Text style={styles.sectionHeader}>About</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={() => router.push("/settings/about" as any)}
      >
        <MaterialCommunityIcons name="information" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>About MyWallet</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      {/* Account Section */}
      <Text style={styles.sectionHeader}>Account</Text>

      <Pressable
        style={({ pressed }) => [styles.row, styles.rowDanger, pressed && styles.pressed]}
        onPress={handleSignOut}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#F44336" />
        <Text style={[styles.rowText, styles.rowTextDanger]}>Sign Out</Text>
      </Pressable>

      <View style={styles.bottomSpacer} />

      {/* Modals */}
      <SelectionModal
        visible={showFirstDayModal}
        title="First Day of Week"
        options={firstDayOptions.map((opt) => ({ label: opt.label, value: opt.value }))}
        selectedValue={firstDayOfWeek}
        onSelect={(value) => {
          setFirstDayOfWeek(value as FirstDayOfWeek);
          setShowFirstDayModal(false);
        }}
        onClose={() => setShowFirstDayModal(false)}
        theme={theme}
      />

      <SelectionModal
        visible={showDateFormatModal}
        title="Date Format"
        options={dateFormatOptions.map((fmt) => ({ label: fmt, value: fmt }))}
        selectedValue={dateFormat}
        onSelect={(value) => {
          setDateFormat(value as DateFormat);
          setShowDateFormatModal(false);
        }}
        onClose={() => setShowDateFormatModal(false)}
        theme={theme}
      />

      <SelectionModal
        visible={showNumberFormatModal}
        title="Number Format"
        options={numberFormatOptions.map((fmt) => ({ label: fmt, value: fmt }))}
        selectedValue={numberFormat}
        onSelect={(value) => {
          setNumberFormat(value as NumberFormat);
          setShowNumberFormatModal(false);
        }}
        onClose={() => setShowNumberFormatModal(false)}
        theme={theme}
      />
    </ScrollView>
  );
}

function SelectionModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: any }[];
  selectedValue: any;
  onSelect: (value: any) => void;
  onClose: () => void;
  theme: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: theme.background.accent }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.modalTitle, { color: theme.foreground.white }]}>{title}</Text>
          <View style={styles.optionsList}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.optionItem,
                  {
                    backgroundColor:
                      selectedValue === option.value
                        ? theme.background.darker
                        : "transparent",
                    borderColor:
                      selectedValue === option.value ? theme.primary.main : "transparent",
                  },
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelect(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        selectedValue === option.value
                          ? theme.primary.main
                          : theme.foreground.white,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <MaterialCommunityIcons name="check" size={20} color={theme.primary.main} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    sectionHeader: {
      color: theme.foreground.gray,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    subSectionLabel: {
      color: theme.foreground.gray,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 16,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    // Theme Mode Cards
    themeModesContainer: {
      flexDirection: "row",
      gap: 10,
    },
    themeModeCard: {
      flex: 1,
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: "center",
      gap: 8,
      borderWidth: 2,
      borderColor: "transparent",
    },
    themeModeCardActive: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.darker,
    },
    themeModeLabel: {
      color: theme.foreground.gray,
      fontSize: 13,
      fontWeight: "500",
    },
    themeModeLabelActive: {
      color: theme.primary.main,
      fontWeight: "600",
    },
    checkmark: {
      position: "absolute",
      top: 8,
      right: 8,
    },
    // Theme Variant Cards
    themeVariantsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    themeVariantCard: {
      width: "48%",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 14,
      borderWidth: 2,
      borderColor: "transparent",
    },
    themeVariantCardActive: {
      borderColor: theme.primary.main,
      backgroundColor: theme.background.darker,
    },
    themeVariantHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    colorPreview: {
      flexDirection: "row",
      gap: 6,
    },
    colorDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
    themeVariantLabel: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "500",
    },
    themeVariantLabelActive: {
      color: theme.primary.main,
      fontWeight: "600",
    },
    // Action Rows
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "#2C3139",
      gap: 12,
      marginBottom: 10,
    },
    rowContent: {
      flex: 1,
    },
    rowDanger: {
      borderColor: "#3a1e1e",
    },
    rowText: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 15,
    },
    rowSubtext: {
      color: theme.foreground.gray,
      fontSize: 13,
      marginTop: 2,
    },
    rowTextDanger: {
      color: "#F44336",
    },
    pressed: {
      opacity: 0.7,
    },
    bottomSpacer: {
      height: 40,
    },
  });
}

