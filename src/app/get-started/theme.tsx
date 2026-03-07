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
import { ThemeModeSelector } from "../../components/ui/ThemeModeSelector";
import { ThemeVariantPreview } from "../../components/ui/ThemeVariantPreview";
import { Theme, themeVariants, getThemeByVariantAndMode } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeSelectionScreen() {
  const { theme, themeMode, variantId, setThemeMode, setVariantId } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const handleNext = () => {
    router.navigate("/get-started/welcome" as any);
  };

  // Get the effective mode for previews (resolve "system" to actual light/dark)
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
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Theme</Text>
        <Text style={styles.subtitle}>
          Select how you want the app to look. You can change this later in
          settings.
        </Text>
      </View>

      {/* Theme Mode Selector */}
      <ThemeModeSelector
        theme={theme}
        selectedMode={themeMode}
        onModeChange={setThemeMode}
      />

      {/* Theme Preview Section */}
      <View style={styles.previewSection}>
        <Text style={styles.previewLabel}>Preview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previewScrollContent}
        >
          {themeVariants.map((variant) => {
            const variantTheme = getThemeByVariantAndMode(variant.id, effectiveMode);
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

      {/* Bottom Button */}
      <View style={styles.buttonSection}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.nextButtonPressed,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingTop: 24,
      paddingBottom: 24,
    },
    // Header
    header: {
      marginBottom: 24,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: theme.foreground.gray,
      lineHeight: 20,
      marginTop: 4,
    },
    // Preview Section
    previewSection: {
      flex: 1,
      marginBottom: 16,
    },
    previewLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 12,
      paddingHorizontal: 24,
    },
    previewScrollContent: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      gap: 16,
      alignItems: "center",
    },
    // Button
    buttonSection: {
      paddingHorizontal: 24,
    },
    nextButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    nextButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.background.dark,
      letterSpacing: 0.3,
    },
  });
}
