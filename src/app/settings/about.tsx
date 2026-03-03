import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function AboutScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || 
                      Constants.expoConfig?.android?.versionCode || "1";

  const handleOpenGitHub = () => {
    Linking.openURL("https://github.com/yourusername/mywallet");
  };

  const handleReportIssue = () => {
    Linking.openURL("https://github.com/yourusername/mywallet/issues");
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Name */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="wallet" size={48} color={theme.primary.main} />
          </View>
          <Text style={styles.appName}>MyWallet</Text>
          <Text style={styles.tagline}>Personal Finance Manager</Text>
        </View>

        {/* Version Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>{buildNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>
              {Constants.platform?.ios ? "iOS" : Constants.platform?.android ? "Android" : "Web"}
            </Text>
          </View>
        </View>

        {/* Features */}
        <Text style={styles.sectionHeader}>Features</Text>
        <View style={styles.featuresCard}>
          <FeatureItem
            icon="cash-multiple"
            title="Multi-Currency Support"
            description="Manage accounts in different currencies with custom exchange rates"
            theme={theme}
          />
          <FeatureItem
            icon="chart-line"
            title="Transaction Tracking"
            description="Track expenses, income, and transfers with detailed categorization"
            theme={theme}
          />
          <FeatureItem
            icon="bank"
            title="Multiple Accounts"
            description="Support for cash, bank, savings, charity, and loan accounts"
            theme={theme}
          />
          <FeatureItem
            icon="theme-light-dark"
            title="Beautiful Themes"
            description="Choose from 6 stunning color themes and dark/light mode"
            theme={theme}
          />
          <FeatureItem
            icon="cloud-off-outline"
            title="Offline First"
            description="All your data stays on your device, no internet required"
            theme={theme}
          />
        </View>

        {/* Links */}
        <Text style={styles.sectionHeader}>Links</Text>
        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          onPress={handleOpenGitHub}
        >
          <MaterialCommunityIcons name="github" size={20} color={theme.foreground.white} />
          <Text style={styles.linkText}>View on GitHub</Text>
          <MaterialCommunityIcons name="open-in-new" size={18} color={theme.foreground.gray} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          onPress={handleReportIssue}
        >
          <MaterialCommunityIcons name="bug" size={20} color={theme.foreground.white} />
          <Text style={styles.linkText}>Report an Issue</Text>
          <MaterialCommunityIcons name="open-in-new" size={18} color={theme.foreground.gray} />
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ using Expo</Text>
          <Text style={styles.footerSubtext}>© 2026 MyWallet. All rights reserved.</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  theme,
}: {
  icon: string;
  title: string;
  description: string;
  theme: any;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={theme.primary.main} />
        <Text style={{ color: theme.foreground.white, fontSize: 15, fontWeight: "600" }}>
          {title}
        </Text>
      </View>
      <Text
        style={{
          color: theme.foreground.gray,
          fontSize: 13,
          lineHeight: 18,
          paddingLeft: 32,
        }}
      >
        {description}
      </Text>
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
    logoSection: {
      alignItems: "center",
      paddingVertical: 40,
    },
    logoCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 3,
      borderColor: theme.primary.main,
    },
    appName: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 4,
    },
    tagline: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    infoCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },
    infoLabel: {
      color: theme.foreground.gray,
      fontSize: 14,
    },
    infoValue: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: "#2C3139",
    },
    sectionHeader: {
      color: theme.foreground.white,
      fontSize: 16,
      fontWeight: "600",
      marginTop: 32,
      marginBottom: 16,
    },
    featuresCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: "#2C3139",
    },
    linkButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: "#2C3139",
      marginBottom: 10,
      gap: 12,
    },
    linkText: {
      flex: 1,
      color: theme.foreground.white,
      fontSize: 15,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    footerText: {
      color: theme.foreground.gray,
      fontSize: 13,
      marginBottom: 4,
    },
    footerSubtext: {
      color: theme.foreground.gray,
      fontSize: 11,
    },
    pressed: {
      opacity: 0.7,
    },
    bottomSpacer: {
      height: 20,
    },
  });
}
