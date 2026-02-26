import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function SettingsTabScreen() {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const { resetOnboarding } = useFinance();
  const router = useRouter();
  const styles = makeStyles(theme);

  const handleRedoSetup = async () => {
    await resetOnboarding();
    router.replace("/get-started" as any);
  };

  const handleSignOut = async () => {
    await resetOnboarding();
    await signOut();
    router.replace("/auth");
  };

  return (
    <View style={styles.root}>
      <Text style={styles.sectionHeader}>Data</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={handleRedoSetup}
      >
        <MaterialCommunityIcons name="restore" size={20} color={theme.foreground.white} />
        <Text style={styles.rowText}>Redo initial setup</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.foreground.gray} />
      </Pressable>

      <Text style={styles.sectionHeader}>Account</Text>

      <Pressable
        style={({ pressed }) => [styles.row, styles.rowDanger, pressed && styles.pressed]}
        onPress={handleSignOut}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#F44336" />
        <Text style={[styles.rowText, styles.rowTextDanger]}>Sign out</Text>
      </Pressable>
    </View>
  );
}

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
    },
    rowDanger: {
      borderColor: "#3a1e1e",
    },
    rowText: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 15,
    },
    rowTextDanger: {
      color: "#F44336",
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
