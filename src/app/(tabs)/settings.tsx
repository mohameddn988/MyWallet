import Constants from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useLocale, FIRST_DAY_OPTIONS } from "../../contexts/LocaleContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getCurrencySymbol } from "../../utils/currency";

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
  const { baseCurrency, availableCurrencies } = useFinance();
  const { signOut, authMode, user, signInWithGoogle } = useAuth();
  const { dateFormat, numberFormat, firstDayOfWeek } = useLocale();
  const router = useRouter();
  const s = makeStyles(theme);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? "1";

  const nonBaseCurrencies = availableCurrencies.filter(
    (c) => c !== baseCurrency,
  );

  const firstDayLabel =
    FIRST_DAY_OPTIONS.find((o) => o.id === firstDayOfWeek)?.label.slice(0, 3) ??
    "Sun";

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
          />
          <SettingRow
            icon="calendar-week"
            label="First Day of Week"
            badge={firstDayLabel}
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
              onPress={() => router.navigate("/settings/data" as any)}
              theme={theme}
            />
            <View style={s.dataRowDividerV} />
            <DataActionTile
              icon="database-import-outline"
              label="Import"
              color={theme.foreground.gray}
              onPress={() => router.navigate("/settings/data" as any)}
              theme={theme}
            />
            <View style={s.dataRowDividerV} />
            <DataActionTile
              icon="delete-sweep-outline"
              label="Reset"
              color="#F44336"
              onPress={() => router.navigate("/settings/data" as any)}
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
