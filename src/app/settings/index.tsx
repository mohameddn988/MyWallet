import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>["theme"];
  isDanger?: boolean;
}

function SettingsItem({ icon, label, value, onPress, theme, isDanger }: SettingsItemProps) {
  const styles = makeStyles(theme);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        isDanger && styles.settingsItemDanger,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={isDanger ? "#F44336" : theme.foreground.white}
        />
        <Text style={[styles.settingsItemLabel, isDanger && styles.settingsItemLabelDanger]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && <Text style={styles.settingsItemValue}>{value}</Text>}
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.foreground.gray}
        />
      </View>
    </Pressable>
  );
}

export default function SettingsIndexScreen() {
  const { theme, themeMode, variantId } = useTheme();
  const { baseCurrency } = useFinance();
  const { signOut } = useAuth();
  const { resetOnboarding } = useFinance();
  const router = useRouter();
  const styles = makeStyles(theme);

  const getThemeDisplayValue = () => {
    const modeLabel = themeMode === "system" ? "System" : themeMode === "light" ? "Light" : "Dark";
    const variantLabel = variantId.charAt(0).toUpperCase() + variantId.slice(1);
    return `${modeLabel} · ${variantLabel}`;
  };

  const handleRedoSetup = async () => {
    await resetOnboarding();
    router.navigate("/get-started" as any);
  };

  const handleSignOut = async () => {
    await resetOnboarding();
    await signOut();
    router.navigate("/auth" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your app experience</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>INSIGHTS</Text>
          <SettingsItem
            icon="chart-line"
            label="Analytics"
            onPress={() => router.navigate("/analytics" as any)}
            theme={theme}
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPEARANCE</Text>
          <SettingsItem
            icon="palette-outline"
            label="Theme"
            value={getThemeDisplayValue()}
            onPress={() => router.navigate("/settings/theme" as any)}
            theme={theme}
          />
        </View>

        {/* Currency & Locale Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CURRENCY & LOCALE</Text>
          <SettingsItem
            icon="currency-usd"
            label="Base Currency"
            value={baseCurrency}
            onPress={() => router.navigate("/settings/currency" as any)}
            theme={theme}
          />
          <SettingsItem
            icon="web"
            label="Locale & Format"
            value="Default"
            onPress={() => router.navigate("/settings/locale" as any)}
            theme={theme}
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATA MANAGEMENT</Text>
          <SettingsItem
            icon="database-export-outline"
            label="Export & Import"
            onPress={() => router.navigate("/settings/data" as any)}
            theme={theme}
          />
          <SettingsItem
            icon="restore"
            label="Redo Initial Setup"
            onPress={handleRedoSetup}
            theme={theme}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ABOUT</Text>
          <SettingsItem
            icon="information-outline"
            label="App Information"
            onPress={() => router.navigate("/settings/about" as any)}
            theme={theme}
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <SettingsItem
            icon="logout"
            label="Sign Out"
            onPress={handleSignOut}
            theme={theme}
            isDanger
          />
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.foreground.white,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: theme.foreground.gray,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    settingsItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    settingsItemDanger: {
      borderColor: "#3a1e1e",
      backgroundColor: `${theme.background.accent}dd`,
    },
    settingsItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    settingsItemLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    settingsItemLabelDanger: {
      color: "#F44336",
    },
    settingsItemRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    settingsItemValue: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
