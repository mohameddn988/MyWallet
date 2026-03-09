import Constants from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useLocale } from "../../contexts/LocaleContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCurrencySymbol } from "../../utils/currency";
import { AppModal } from "../../components/ui/AppModal";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppTheme = ReturnType<typeof useTheme>["theme"];

// ─── SettingRow ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isDanger?: boolean;
  isLast?: boolean;
  theme: AppTheme;
  right?: React.ReactNode;
}

function SettingRow({
  icon,
  iconColor,
  label,
  description,
  badge,
  badgeColor,
  onPress,
  showChevron = true,
  isDanger,
  isLast,
  theme,
  right,
}: SettingRowProps) {
  const s = makeStyles(theme);
  const accentColor = isDanger ? "#F44336" : (iconColor ?? theme.primary.main);

  return (
    <>
      <Pressable
        style={({ pressed }) => [s.row, pressed && onPress && s.rowPressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[s.iconBadge, { backgroundColor: `${accentColor}18` }]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={accentColor}
          />
        </View>

        <View style={s.rowText}>
          <Text style={[s.rowLabel, isDanger && s.rowLabelDanger]}>
            {label}
          </Text>
          {description ? <Text style={s.rowDesc}>{description}</Text> : null}
        </View>

        <View style={s.rowRight}>
          {right ?? null}
          {badge && !right ? (
            <View
              style={[
                s.badge,
                badgeColor
                  ? { backgroundColor: `${badgeColor}22` }
                  : s.badgeDefault,
              ]}
            >
              <Text
                style={[
                  s.badgeText,
                  badgeColor ? { color: badgeColor } : s.badgeTextDefault,
                ]}
              >
                {badge}
              </Text>
            </View>
          ) : null}
          {showChevron && onPress && !right ? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={isDanger ? "#F44336" : theme.foreground.gray}
            />
          ) : null}
        </View>
      </Pressable>
      {!isLast && <View style={s.divider} />}
    </>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  label: string;
  children: React.ReactNode;
  theme: AppTheme;
}

function SectionCard({ label, children, theme }: SectionCardProps) {
  const s = makeStyles(theme);
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

// ─── ThemePills removed — theme row now uses a plain badge+chevron ─────────────

// ─── DataActionTile ───────────────────────────────────────────────────────────

interface DataTileProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  theme: AppTheme;
}

function DataActionTile({ icon, label, color, onPress, theme }: DataTileProps) {
  const s = makeStyles(theme);
  return (
    <Pressable
      style={({ pressed }) => [s.dataTile, pressed && s.rowPressed]}
      onPress={onPress}
    >
      <View style={[s.dataTileIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[s.dataTileLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SettingsIndexScreen() {
  const { theme, themeMode, variantId } = useTheme();
  const {
    baseCurrency,
    availableCurrencies,
    allTransactions,
    allAccounts,
    exchangeRates,
    completeOnboarding,
    resetOnboarding,
  } = useFinance();
  const { signOut, authMode, user, signInWithGoogle } = useAuth();
  const { dateFormat, numberFormat, firstDayOfWeek, setDateFormat, setNumberFormat, setFirstDayOfWeek } = useLocale();
  const router = useRouter();
  const s = makeStyles(theme);

  // ── Data management modal state ───────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [importSuccessData, setImportSuccessData] = useState<{
    transactions: number;
    accounts: number;
  } | null>(null);

  const handleExportJSON = useCallback(async () => {
    try {
      setIsExporting(true);
      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        baseCurrency,
        accounts: allAccounts,
        transactions: allTransactions,
        exchangeRates,
        settings: { dateFormat, firstDayOfWeek, numberFormat },
      };
      const json = JSON.stringify(exportData, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `mywallet-backup-${date}.json`;
      const file = new File(Paths.cache, fileName);
      file.write(json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Save MyWallet Backup",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Exported", `Backup saved to: ${file.uri}`);
      }
    } catch {
      Alert.alert("Export Failed", "Could not export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [baseCurrency, allAccounts, allTransactions, exchangeRates, dateFormat, firstDayOfWeek, numberFormat]);

  const handleImportJSON = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const content = await new File(asset.uri).text();
      const parsed = JSON.parse(content);
      if (!parsed.accounts || !parsed.transactions || !parsed.baseCurrency) {
        Alert.alert(
          "Invalid File",
          "This file doesn't look like a valid MyWallet backup.",
        );
        return;
      }
      await completeOnboarding({
        baseCurrency: parsed.baseCurrency,
        accounts: parsed.accounts ?? [],
        exchangeRates: parsed.exchangeRates ?? [],
        transactions: parsed.transactions ?? [],
        useSampleData: false,
      });
      if (parsed.settings) {
        const s = parsed.settings;
        if (s.dateFormat) await setDateFormat(s.dateFormat);
        if (s.firstDayOfWeek) await setFirstDayOfWeek(s.firstDayOfWeek);
        if (s.numberFormat) await setNumberFormat(s.numberFormat);
      }
      setImportOpen(false);
      setImportSuccessData({
        transactions: parsed.transactions.length,
        accounts: parsed.accounts.length,
      });
    } catch (e) {
      Alert.alert(
        "Import Failed",
        "Could not read the backup file. Make sure it's a valid MyWallet JSON export.",
      );
    }
  }, [completeOnboarding, setDateFormat, setFirstDayOfWeek, setNumberFormat]);

  const handleReset = useCallback(async () => {
    try {
      setIsResetting(true);
      await resetOnboarding();
      setResetOpen(false);
      router.navigate("/get-started/welcome" as any);
    } catch {
      Alert.alert("Error", "Could not reset data. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }, [resetOnboarding, router]);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? "1";

  const nonBaseCurrencies = availableCurrencies.filter(
    (c) => c !== baseCurrency,
  );

  const getThemeDisplayValue = () => {
    const modeLabel =
      themeMode === "system"
        ? "System"
        : themeMode === "light"
          ? "Light"
          : "Dark";
    const variantLabel = variantId.charAt(0).toUpperCase() + variantId.slice(1);
    return `${modeLabel} · ${variantLabel}`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.navigate("/auth" as any);
  };

  return (
    <View style={s.container}>
      {/* Page header */}
      <View style={s.header}>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── GOOGLE ACCOUNT BANNER ── */}
        {authMode === "offline" ? (
          <Pressable
            style={({ pressed }) => [
              s.googleBanner,
              pressed && s.googleBannerPressed,
            ]}
            onPress={signInWithGoogle}
          >
            <View style={s.googleBannerLeft}>
              <View style={s.googleIconWrap}>
                <MaterialCommunityIcons
                  name="google"
                  size={22}
                  color={theme.primary.main}
                />
              </View>
              <View style={s.googleBannerText}>
                <Text style={s.googleBannerTitle}>Sign in with Google</Text>
                <Text style={s.googleBannerSub}>You're using local mode</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={theme.primary.main}
            />
          </Pressable>
        ) : authMode === "online" && user ? (
          <View style={s.accountBanner}>
            <View style={s.googleBannerLeft}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={s.accountAvatar} />
              ) : (
                <View style={s.accountAvatarFallback}>
                  <Text style={s.accountAvatarInitial}>
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={s.googleBannerText}>
                <Text style={s.accountBannerName} numberOfLines={1}>
                  {user.name ?? "Google Account"}
                </Text>
                <Text style={s.accountBannerEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>
            <View style={s.accountBannerBadge}>
              <Text style={s.accountBannerBadgeText}>Synced</Text>
            </View>
          </View>
        ) : null}

        {/* ── INSIGHTS ─────────────────────────────── */}
        <SectionCard label="INSIGHTS" theme={theme}>
          <SettingRow
            icon="chart-bar"
            label="Analytics"
            onPress={() => router.navigate("/analytics" as any)}
            theme={theme}
            isLast
          />
        </SectionCard>

        {/* ── APPEARANCE ───────────────────────────── */}
        <SectionCard label="APPEARANCE" theme={theme}>
          <SettingRow
            icon="weather-sunny"
            label="Theme"
            badge={getThemeDisplayValue()}
            onPress={() => router.navigate("/settings/theme" as any)}
            theme={theme}
            isLast
          />
        </SectionCard>

        {/* ── CURRENCY & LOCALE ────────────────────── */}
        <SectionCard label="CURRENCY & LOCALE" theme={theme}>
          <SettingRow
            icon="currency-usd"
            label="Manage Currencies"
            badge={`${baseCurrency} ${getCurrencySymbol(baseCurrency)}`}
            onPress={() => router.navigate("/settings/currency" as any)}
            theme={theme}
          />
          <SettingRow
            icon="numeric"
            label="Number & Date Format"
            onPress={() => router.navigate("/settings/locale" as any)}
            theme={theme}
            isLast
          />
        </SectionCard>

        {/* ── DATA MANAGEMENT ──────────────────────── */}
        <SectionCard label="DATA MANAGEMENT" theme={theme}>
          <View style={s.dataRow}>
            <DataActionTile
              icon="database-export-outline"
              label="Export"
              color={theme.primary.main}
              onPress={() => setExportOpen(true)}
              theme={theme}
            />
            <View style={s.dataRowDividerV} />
            <DataActionTile
              icon="database-import-outline"
              label="Import"
              color={theme.foreground.gray}
              onPress={() => setImportOpen(true)}
              theme={theme}
            />
            <View style={s.dataRowDividerV} />
            <DataActionTile
              icon="delete-sweep-outline"
              label="Reset"
              color="#F44336"
              onPress={() => setResetOpen(true)}
              theme={theme}
            />
          </View>
        </SectionCard>

        {/* ── ABOUT ────────────────────────────────── */}
        <SectionCard label="ABOUT" theme={theme}>
          <Pressable
            style={({ pressed }) => [s.aboutRow, pressed && s.rowPressed]}
            onPress={() => router.navigate("/settings/about" as any)}
          >
            <View style={s.aboutIcon}>
              <MaterialCommunityIcons
                name="wallet"
                size={28}
                color={theme.primary.main}
              />
            </View>
            <View style={s.aboutText}>
              <Text style={s.aboutName}>MyWallet</Text>
              <Text style={s.aboutMeta}>
                Version {appVersion} · Build {buildNumber}
              </Text>
            </View>
            <View style={[s.badge, s.badgeGreen]}>
              <Text style={[s.badgeText, s.badgeTextGreen]}>Latest</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={theme.foreground.gray}
            />
          </Pressable>
        </SectionCard>

        {/* ── ACCOUNT ──────────────────────────────── */}
        <SectionCard label="ACCOUNT" theme={theme}>
          <SettingRow
            icon="logout"
            label="Sign Out"
            onPress={handleSignOut}
            isDanger
            theme={theme}
            isLast
          />
        </SectionCard>
      </ScrollView>

      {/* ── EXPORT MODAL ─────────────────────────── */}
      <AppModal
        visible={exportOpen}
        title="Export Data"
        icon="database-export-outline"
        variant="info"
        onClose={() => !isExporting && setExportOpen(false)}
        busy={isExporting}
        actions={[
          {
            label: "Cancel",
            onPress: () => setExportOpen(false),
            disabled: isExporting,
          },
        ]}
      >
        {/* Stats */}
        <View style={s.modalStatsRow}>
          <View style={s.modalStat}>
            <Text style={s.modalStatValue}>{allTransactions.length}</Text>
            <Text style={s.modalStatLabel}>Transactions</Text>
          </View>
          <View style={s.modalStat}>
            <Text style={s.modalStatValue}>{allAccounts.length}</Text>
            <Text style={s.modalStatLabel}>Accounts</Text>
          </View>
          <View style={s.modalStat}>
            <Text style={s.modalStatValue}>
              {new Set(allAccounts.map((a) => a.currency)).size}
            </Text>
            <Text style={s.modalStatLabel}>Currencies</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [s.modalRow, pressed && s.rowPressed]}
          onPress={handleExportJSON}
          disabled={isExporting}
        >
          <View
            style={[
              s.modalRowIcon,
              { backgroundColor: `${theme.primary.main}18` },
            ]}
          >
            <MaterialCommunityIcons
              name="file-export"
              size={20}
              color={theme.primary.main}
            />
          </View>
          <View style={s.modalRowText}>
            <Text style={s.modalRowLabel}>Export as JSON</Text>
            <Text style={s.modalRowDesc}>Full backup with all data</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={theme.foreground.gray}
          />
        </Pressable>
      </AppModal>

      {/* ── IMPORT MODAL ─────────────────────────── */}
      <AppModal
        visible={importOpen}
        title="Import Data"
        description="Restore your wallet from a previously exported backup file."
        icon="database-import-outline"
        variant="info"
        onClose={() => setImportOpen(false)}
        actions={[
          {
            label: "Cancel",
            onPress: () => setImportOpen(false),
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [s.modalRow, pressed && s.rowPressed]}
          onPress={handleImportJSON}
        >
          <View
            style={[
              s.modalRowIcon,
              { backgroundColor: `${theme.foreground.gray}18` },
            ]}
          >
            <MaterialCommunityIcons
              name="file-import"
              size={20}
              color={theme.foreground.white}
            />
          </View>
          <View style={s.modalRowText}>
            <Text style={s.modalRowLabel}>Import from JSON</Text>
            <Text style={s.modalRowDesc}>Restore from a backup file</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={theme.foreground.gray}
          />
        </Pressable>
      </AppModal>

      {/* ── IMPORT SUCCESS MODAL ───────────────── */}
      <AppModal
        visible={importSuccessData !== null}
        title="Import Successful"
        description={
          importSuccessData
            ? `Restored ${importSuccessData.transactions} transactions and ${importSuccessData.accounts} accounts.`
            : ""
        }
        icon="check-circle-outline"
        variant="success"
        onClose={() => setImportSuccessData(null)}
        actions={[
          {
            label: "Done",
            onPress: () => setImportSuccessData(null),
            primary: true,
          },
        ]}
      />

      {/* ── RESET MODAL ──────────────────────────── */}
      <AppModal
        visible={resetOpen}
        title="Reset All Data"
        description="This will permanently delete all your accounts, transactions, and settings. This action cannot be undone."
        icon="delete-sweep-outline"
        variant="destructive"
        onClose={() => !isResetting && setResetOpen(false)}
        busy={isResetting}
        actions={[
          {
            label: "Cancel",
            onPress: () => setResetOpen(false),
            disabled: isResetting,
          },
          {
            label: "Reset All",
            busyLabel: "Resetting…",
            onPress: handleReset,
            destructive: true,
            busy: isResetting,
          },
        ]}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 14,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.foreground.white,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
      gap: 16,
    },

    // ── Section ───────────────────────────────────
    section: {
      gap: 6,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      paddingHorizontal: 4,
      opacity: 0.7,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
      overflow: "hidden",
    },

    // ── Row ───────────────────────────────────────
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 12,
    },
    rowPressed: {
      backgroundColor: theme.background.darker,
    },
    iconBadge: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    rowLabelDanger: {
      color: "#F44336",
    },
    rowDesc: {
      fontSize: 12,
      color: theme.foreground.gray,
      lineHeight: 16,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    divider: {
      height: 1,
      backgroundColor: `${theme.foreground.gray}12`,
      marginLeft: 60,
    },

    // ── Badge ─────────────────────────────────────
    badge: {
      borderRadius: 7,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeDefault: {
      backgroundColor: `${theme.primary.main}18`,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    badgeTextDefault: {
      color: theme.primary.main,
    },
    badgeGreen: {
      backgroundColor: `${theme.primary.main}20`,
    },
    badgeTextGreen: {
      color: theme.primary.main,
      fontSize: 12,
      fontWeight: "600",
    },

    // ── Data management ───────────────────────────
    dataRow: {
      flexDirection: "row",
      paddingVertical: 8,
    },
    dataTile: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 8,
    },
    dataTileIcon: {
      width: 48,
      height: 48,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    dataTileLabel: {
      fontSize: 13,
      fontWeight: "600",
    },
    dataRowDividerV: {
      width: 1,
      backgroundColor: `${theme.foreground.gray}12`,
      marginVertical: 10,
    },

    // ── Data modals ───────────────────────────────
    modalStatsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    modalStat: {
      flex: 1,
      backgroundColor: `${theme.foreground.gray}10`,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    modalStatValue: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 2,
    },
    modalStatLabel: {
      fontSize: 11,
      color: theme.foreground.gray,
    },
    modalRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      gap: 12,
      borderRadius: 10,
    },
    modalRowIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    modalRowText: {
      flex: 1,
      gap: 2,
    },
    modalRowLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    modalRowDesc: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    modalDivider: {
      height: 1,
      backgroundColor: `${theme.foreground.gray}15`,
    },

    // ── Google sign-in banner ──────────────────────
    googleBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: `${theme.primary.main}55`,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginTop: 16,
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 4,
    },
    googleBannerPressed: {
      opacity: 0.72,
      borderColor: `${theme.primary.main}99`,
    },
    googleBannerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    googleIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: `${theme.primary.main}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    googleBannerText: {
      gap: 2,
    },
    googleBannerTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.primary.main,
    },
    googleBannerSub: {
      fontSize: 12,
      color: theme.foreground.gray,
    },

    // ── Online account banner ──────────────────────
    accountBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}18`,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginTop: 16,
    },
    accountAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.background.darker,
    },
    accountAvatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.primary.main}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    accountAvatarInitial: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.primary.main,
    },
    accountBannerName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    accountBannerEmail: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 1,
    },
    accountBannerBadge: {
      backgroundColor: `${theme.primary.main}18`,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    accountBannerBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.primary.main,
    },

    // ── About row ─────────────────────────────────
    aboutRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    aboutIcon: {
      width: 50,
      height: 50,
      borderRadius: 13,
      backgroundColor: `${theme.primary.main}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    aboutText: {
      flex: 1,
      gap: 3,
    },
    aboutName: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    aboutMeta: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
  });
}
