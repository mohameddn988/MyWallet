import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function AuthScreen() {
  const { theme } = useTheme();
  const { signInWithGoogle, continueOffline } = useAuth();
  const { hasCompleted } = useFinance();
  const router = useRouter();
  const styles = makeStyles(theme);

  const handleGoogle = () => {
    signInWithGoogle();
    if (hasCompleted) {
      router.replace("/(tabs)/home" as any);
    } else {
      router.replace("/get-started/theme" as any);
    }
  };

  const handleOffline = async () => {
    await continueOffline();
    if (hasCompleted) {
      router.replace("/(tabs)/home" as any);
    } else {
      router.replace("/get-started/theme" as any);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Brand ── */}
      <View style={styles.brandSection}>
        <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>MyWallet</Text>
        <Text style={styles.tagline}>Your finances, under control</Text>
      </View>

      {/* ── Buttons ── */}
      <View style={styles.buttonsSection}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={handleGoogle}
        >
          <AntDesign name="google" size={18} color={theme.background.dark} style={styles.icon} />
          <Text style={styles.primaryButtonText}>Continue with Google</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          onPress={handleOffline}
        >
          <Feather name="smartphone" size={18} color={theme.foreground.white} style={styles.icon} />
          <Text style={styles.secondaryButtonText}>Continue Local</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },

    // Brand
    brandSection: {
      alignItems: "center",
      marginBottom: 190,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 20,
    },
    appName: {
      fontSize: 30,
      fontWeight: "700",
      color: theme.foreground.white,
      letterSpacing: 0.5,
    },
    tagline: {
      marginTop: 8,
      fontSize: 14,
      color: theme.foreground.gray,
    },

    // Buttons
    buttonsSection: {
      width: "100%",
      gap: 12,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary.main,
      borderRadius: 12,
      paddingVertical: 15,
    },
    primaryButtonText: {
      color: theme.background.dark,
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background.accent,
      borderWidth: 1,
      borderColor: "#2C3139",
      borderRadius: 12,
      paddingVertical: 15,
    },
    secondaryButtonText: {
      color: theme.foreground.white,
      fontSize: 15,
      fontWeight: "600",
    },
    icon: {
      marginRight: 10,
    },

    // Interaction
    pressed: {
      opacity: 0.7,
    },
  });
}
