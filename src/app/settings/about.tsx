import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

export default function AboutScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const appInfo = {
    name: "MyWallet",
    version: Constants.expoConfig?.version || "1.0.0",
    buildNumber: Constants.expoConfig?.ios?.buildNumber || "1",
    description: "A personal finance manager for tracking your money",
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

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
          <Text style={styles.title}>About</Text>
          <Text style={styles.subtitle}>App information and credits</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* App Icon & Info */}
        <View style={styles.appInfoContainer}>
          <View style={styles.appIcon}>
            <MaterialCommunityIcons
              name="wallet"
              size={48}
              color={theme.primary.main}
            />
          </View>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.appVersion}>
            Version {appInfo.version} (Build {appInfo.buildNumber})
          </Text>
          <Text style={styles.appDescription}>{appInfo.description}</Text>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPLICATION</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appInfo.version}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build Number</Text>
            <Text style={styles.infoValue}>{appInfo.buildNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>
              {Constants.platform?.ios ? "iOS" : "Android"}
            </Text>
          </View>
        </View>

        {/* Technology Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BUILT WITH</Text>
          <View style={styles.techStack}>
            <View style={styles.techItem}>
              <Text style={styles.techName}>React Native</Text>
              <Text style={styles.techVersion}>Expo SDK 54</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techName}>Expo Router</Text>
              <Text style={styles.techVersion}>v6</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techName}>TypeScript</Text>
              <Text style={styles.techVersion}>Latest</Text>
            </View>
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>LINKS</Text>
          <Pressable
            style={({ pressed }) => [
              styles.linkItem,
              pressed && styles.pressed,
            ]}
            onPress={() => handleOpenLink("https://github.com")}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons
                name="github"
                size={22}
                color={theme.foreground.white}
              />
              <Text style={styles.linkLabel}>Source Code</Text>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={18}
              color={theme.foreground.gray}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.linkItem,
              pressed && styles.pressed,
            ]}
            onPress={() => handleOpenLink("https://github.com")}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons
                name="bug"
                size={22}
                color={theme.foreground.white}
              />
              <Text style={styles.linkLabel}>Report an Issue</Text>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={18}
              color={theme.foreground.gray}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.linkItem,
              pressed && styles.pressed,
            ]}
            onPress={() => handleOpenLink("https://github.com")}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons
                name="license"
                size={22}
                color={theme.foreground.white}
              />
              <Text style={styles.linkLabel}>License</Text>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={18}
              color={theme.foreground.gray}
            />
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for personal finance management
          </Text>
          <Text style={styles.footerCopyright}>
            © 2026 MyWallet. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
    appInfoContainer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    appIcon: {
      width: 96,
      height: 96,
      borderRadius: 24,
      backgroundColor: `${theme.primary.main}20`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    appName: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.foreground.white,
      marginBottom: 4,
    },
    appVersion: {
      fontSize: 14,
      color: theme.foreground.gray,
      marginBottom: 12,
    },
    appDescription: {
      fontSize: 15,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 32,
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
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    infoValue: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    techStack: {
      gap: 8,
    },
    techItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    techName: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    techVersion: {
      fontSize: 13,
      color: theme.primary.main,
      fontWeight: "600",
    },
    linkItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    linkLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    linkLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    footer: {
      alignItems: "center",
      paddingVertical: 32,
      gap: 8,
    },
    footerText: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    footerCopyright: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
