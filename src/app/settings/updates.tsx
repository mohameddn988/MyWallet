import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

type UpdateManifest = {
  versionCode: number;
  versionName: string;
  changelog?: string;
  publishedAt?: string;
  downloadUrl?: string;
  releaseNotesUrl?: string;
};

const DEFAULT_RELEASES_URL = "https://github.com/mohameddn988/MyWallet/releases";
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
      typeof raw.releaseNotesUrl === "string" ? raw.releaseNotesUrl : undefined,
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

export default function UpdatesSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const localVersionName = Constants.expoConfig?.version ?? "1.0.0";
  const localVersionCode = toPositiveInt(
    Constants.expoConfig?.android?.versionCode,
  ) ?? 1;

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
      const message = e instanceof Error ? e.message : "Failed to check updates";
      setError(message);
    } finally {
      setIsChecking(false);
    }
  }, [setManifest]);

  const openUrl = useCallback(async (url?: string) => {
    const target = url ?? DEFAULT_RELEASES_URL;
    await Linking.openURL(target);
  }, []);

  useEffect(() => {
    handleCheckForUpdates();
  }, [handleCheckForUpdates]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Updates
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>CURRENT VERSION</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>{localVersionName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Version Code</Text>
              <Text style={styles.rowValue}>{localVersionCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>REMOTE UPDATE STATUS</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <MaterialCommunityIcons
                  name={
                    hasUpdate
                      ? "arrow-up-bold-circle-outline"
                      : "check-circle-outline"
                  }
                  size={20}
                  color={hasUpdate ? "#F59E0B" : theme.primary.main}
                />
                <Text style={styles.statusTitle}>
                  {manifest
                    ? hasUpdate
                      ? "Update available"
                      : "You are up to date"
                    : "No remote data yet"}
                </Text>
              </View>
              {isChecking ? <Text style={styles.metaText}>Checking…</Text> : null}
            </View>

            {manifest ? (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Latest Version</Text>
                  <Text style={styles.rowValue}>{manifest.versionName}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Latest Version Code</Text>
                  <Text style={styles.rowValue}>{manifest.versionCode}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Published</Text>
                  <Text style={styles.rowValue}>{formatDate(manifest.publishedAt)}</Text>
                </View>
              </>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {lastCheckedAt ? (
              <Text style={styles.metaText}>Last checked: {formatDate(lastCheckedAt)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACTIONS</Text>

          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            onPress={handleCheckForUpdates}
            disabled={isChecking}
          >
            <MaterialCommunityIcons
              name="autorenew"
              size={18}
              color={theme.primary.main}
            />
            <Text style={styles.actionText}>Check for updates now</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              !hasUpdate && styles.actionDisabled,
              pressed && hasUpdate && styles.pressed,
            ]}
            onPress={() => openUrl(manifest?.downloadUrl)}
            disabled={!hasUpdate}
          >
            <MaterialCommunityIcons
              name="download"
              size={18}
              color={hasUpdate ? theme.foreground.white : theme.foreground.gray}
            />
            <Text style={[styles.actionText, !hasUpdate && styles.actionTextDisabled]}>
              Download latest build
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
            onPress={() => openUrl(manifest?.releaseNotesUrl ?? DEFAULT_RELEASES_URL)}
          >
            <Text style={styles.linkBtnText}>Open release notes</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>REMOTE ENDPOINT</Text>
          <View style={styles.card}>
            <Text style={styles.endpointLabel}>{DEFAULT_MANIFEST_URL}</Text>
            <Text style={styles.metaText}>
              Expected JSON fields: versionCode, versionName, downloadUrl,
              releaseNotesUrl, publishedAt, changelog.
            </Text>
          </View>
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
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    section: {
      marginBottom: 20,
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
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 28,
    },
    rowLabel: {
      fontSize: 13,
      color: theme.foreground.gray,
      fontWeight: "500",
    },
    rowValue: {
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: `${theme.foreground.gray}20`,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 28,
    },
    statusLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    statusTitle: {
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
    actionDisabled: {
      backgroundColor: theme.background.accent,
      borderColor: `${theme.foreground.gray}20`,
    },
    actionText: {
      fontSize: 14,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    actionTextDisabled: {
      color: theme.foreground.gray,
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
    endpointLabel: {
      fontSize: 12,
      color: theme.foreground.white,
      fontWeight: "600",
    },
    pressed: {
      opacity: 0.75,
    },
  });
}