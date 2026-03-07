import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Appearance,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Theme,
  themeVariants,
  getThemeByVariantAndMode,
} from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeModeSelector } from "../../components/ui/ThemeModeSelector";
import { ThemeVariantPreview } from "../../components/ui/ThemeVariantPreview";

export default function ThemeSettingsScreen() {
  const { theme, themeMode, variantId, setThemeMode, setVariantId } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const getEffectiveMode = (): "light" | "dark" => {
    if (themeMode === "system") {
      const systemScheme = Appearance.getColorScheme();
      return systemScheme === "light" ? "light" : "dark";
    }
    return themeMode;
  };

  const effectiveMode = getEffectiveMode();

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
          <Text style={styles.title}>Theme</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPEARANCE MODE</Text>
          <ThemeModeSelector
            theme={theme}
            selectedMode={themeMode}
            onModeChange={setThemeMode}
          />
        </View>

        {/* Theme Variant Previews */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COLOR SCHEME</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewScrollContent}
          >
            {themeVariants.map((variant) => {
              const variantTheme = getThemeByVariantAndMode(
                variant.id,
                effectiveMode
              );
              const isSelected = variantId === variant.id;

              return (
                <ThemeVariantPreview
                  key={variant.id}
                  variantTheme={variantTheme}
                  variantName={variant.name}
                  isSelected={isSelected}
                  onPress={() => setVariantId(variant.id)}
                />
              );
            })}
          </ScrollView>
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
    previewScrollContent: {
      paddingVertical: 8,
      paddingLeft: 4,
      paddingRight: 24,
      gap: 16,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
