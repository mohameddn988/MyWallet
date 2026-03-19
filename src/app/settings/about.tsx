import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Update manifest ────────────────────────────────────────────────────────

type UpdateManifest = {
  versionCode: number;
  versionName: string;
  changelog?: string;
  publishedAt?: string;
  downloadUrl?: string;
  releaseNotesUrl?: string;
};

const DEFAULT_RELEASES_URL =
  "https://github.com/mohameddn988/MyWallet/releases";
const DEFAULT_MANIFEST_URL =
  process.env.EXPO_PUBLIC_APP_UPDATE_MANIFEST_URL ??
  "https://raw.githubusercontent.com/mohameddn988/MyWallet/main/update-manifest.json";

function toPositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function normalizeManifest(input: unknown): UpdateManifest {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid update response format");
  }

  const raw = input as Record<string, unknown>;
  const versionCode = toPositiveInt(raw.versionCode);
  if (!versionCode) {
    throw new Error("Missing or invalid versionCode in update manifest");
  }

  const versionName =
    typeof raw.versionName === "string" && raw.versionName.trim().length > 0
      ? raw.versionName.trim()
      : `build-${versionCode}`;

  return {
    versionCode,
    versionName,
    changelog:
      typeof raw.changelog === "string" ? raw.changelog.trim() : undefined,
    publishedAt:
      typeof raw.publishedAt === "string" ? raw.publishedAt : undefined,
    downloadUrl:
      typeof raw.downloadUrl === "string" ? raw.downloadUrl : undefined,
    releaseNotesUrl:
      typeof raw.releaseNotesUrl === "string"
        ? raw.releaseNotesUrl
        : undefined,
  };
}

function formatDate(dateIso?: string): string {
  if (!dateIso) return "Unknown";
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Screen ─────────────────────────────────────────────────────────────────

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

  const localVersionCode =
    toPositiveInt(Constants.expoConfig?.android?.versionCode) ?? 1;

  // ── Update state ──────────────────────────────
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<UpdateManifest | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const hasUpdate = useMemo(() => {
    if (!manifest) return false;
    return manifest.versionCode > localVersionCode;
  }, [manifest, localVersionCode]);

  const handleCheckForUpdates = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(DEFAULT_MANIFEST_URL, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Update server returned ${response.status}`);
      }

      const data = await response.json();
      setManifest(normalizeManifest(data));
      setLastCheckedAt(new Date().toISOString());
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to check updates";
      setError(message);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const openUrl = useCallback(async (url?: string) => {
    const target = url ?? DEFAULT_RELEASES_URL;
    await Linking.openURL(target);
  }, []);

  useEffect(() => {
    handleCheckForUpdates();
  }, [handleCheckForUpdates]);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          MyWallet
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* App Icon & Info */}
        <View style={styles.appInfoContainer}>

          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.appVersion}>
            Version {appInfo.version} (Build {appInfo.buildNumber})
          </Text>
          <Text style={styles.appDescription}>{appInfo.description}</Text>
        </View>

        {/* ── UPDATES ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>UPDATES</Text>
          <View style={styles.updateCard}>
            <View style={styles.updateStatusRow}>
              <View style={styles.updateStatusLeft}>
                <MaterialCommunityIcons
                  name={
                    hasUpdate
                      ? "arrow-up-bold-circle-outline"
                      : "check-circle-outline"
                  }
                  size={20}
                  color={hasUpdate ? "#F59E0B" : theme.primary.main}
                />
                <Text style={styles.updateStatusTitle}>
                  {manifest
                    ? hasUpdate
                      ? "Update available"
                      : "You are up to date"
                    : "No remote data yet"}
                </Text>
              </View>
              {isChecking ? (
                <ActivityIndicator size="small" color={theme.foreground.gray} />
              ) : null}
            </View>

            {manifest ? (
              <>
                <View style={styles.updateDivider} />
                <View style={styles.updateRow}>
                  <Text style={styles.updateRowLabel}>Latest Version</Text>
                  <Text style={styles.updateRowValue}>
                    {manifest.versionName}
                  </Text>
                </View>
                <View style={styles.updateDivider} />
                <View style={styles.updateRow}>
                  <Text style={styles.updateRowLabel}>Published</Text>
                  <Text style={styles.updateRowValue}>
                    {formatDate(manifest.publishedAt)}
                  </Text>
                </View>
              </>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {lastCheckedAt ? (
              <Text style={styles.metaText}>
                Last checked: {formatDate(lastCheckedAt)}
              </Text>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleCheckForUpdates}
            disabled={isChecking}
          >
            <MaterialCommunityIcons
              name="autorenew"
              size={18}
              color={theme.primary.main}
            />
            <Text style={styles.actionText}>Check for updates</Text>
          </Pressable>

          {hasUpdate ? (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => openUrl(manifest?.downloadUrl)}
            >
              <MaterialCommunityIcons
                name="download"
                size={18}
                color={theme.foreground.white}
              />
              <Text style={styles.actionText}>Download latest build</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
            onPress={() =>
              openUrl(manifest?.releaseNotesUrl ?? DEFAULT_RELEASES_URL)
            }
          >
            <Text style={styles.linkBtnText}>Open release notes</Text>
          </Pressable>
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
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
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
      fontSize: 10,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      marginBottom: 12,
      paddingHorizontal: 4,
      opacity: 0.7,
      textTransform: "uppercase",
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
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

    // ── Updates ─────────────────────────────────────
    updateCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      marginBottom: 12,
    },
    updateStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 28,
    },
    updateStatusLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    updateStatusTitle: {
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    updateDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: `${theme.foreground.gray}20`,
    },
    updateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 28,
    },
    updateRowLabel: {
      fontSize: 13,
      color: theme.foreground.gray,
      fontWeight: "500",
    },
    updateRowValue: {
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    metaText: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 2,
    },
    errorText: {
      fontSize: 12,
      color: "#F87171",
      marginTop: 2,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: `${theme.primary.main}20`,
      borderWidth: 1,
      borderColor: `${theme.primary.main}60`,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 10,
    },
    actionText: {
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    linkBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
    },
    linkBtnText: {
      fontSize: 13,
      color: theme.primary.main,
      fontWeight: "600",
    },

    // ── Tech / Links ────────────────────────────────
    techStack: {
      gap: 8,
    },
    techItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
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
