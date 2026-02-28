import { Ionicons } from "@expo/vector-icons";
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
import { Theme, ThemeMode, themeVariants, getThemeByVariantAndMode } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeSelectionScreen() {
  const { theme, themeMode, variantId, setThemeMode, setVariantId } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const handleNext = () => {
    router.navigate("/get-started/welcome" as any);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: "system", label: "System", icon: "phone-portrait-outline" },
    { mode: "light", label: "Light", icon: "sunny-outline" },
    { mode: "dark", label: "Dark", icon: "moon-outline" },
  ];

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
      <View style={styles.selectorSection}>
        <View style={styles.segmentedControl}>
          {themeOptions.map((option) => (
            <Pressable
              key={option.mode}
              style={({ pressed }) => [
                styles.segmentButton,
                themeMode === option.mode && styles.segmentButtonActive,
                pressed && styles.segmentButtonPressed,
              ]}
              onPress={() => setThemeMode(option.mode)}
            >
              <Ionicons
                name={option.icon as any}
                size={18}
                color={
                  themeMode === option.mode
                    ? theme.background.dark
                    : theme.foreground.gray
                }
              />
              <Text
                style={[
                  styles.segmentText,
                  themeMode === option.mode && styles.segmentTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
                <Pressable
                  key={variant.id}
                  onPress={() => setVariantId(variant.id)}
                  style={styles.previewItem}
                >
                  {/* Phone Mockup */}
                  <View
                    style={[
                      styles.phoneMockup,
                      { backgroundColor: variantTheme.background.darker },
                      isSelected && styles.phoneMockupSelected,
                    ]}
                  >
                    {/* Status Bar */}
                    <View style={styles.phoneStatusBar}>
                      <View style={styles.phoneStatusBarLeft}>
                        <Text
                          style={[
                            styles.phoneStatusBarTime,
                            { color: variantTheme.foreground.white },
                          ]}
                        >
                          9:41
                        </Text>
                      </View>
                      <View style={styles.phoneStatusBarRight}>
                        <View
                          style={[
                            styles.phoneStatusBarIcon,
                            { backgroundColor: variantTheme.foreground.gray },
                          ]}
                        />
                        <View
                          style={[
                            styles.phoneStatusBarIcon,
                            { backgroundColor: variantTheme.foreground.gray },
                          ]}
                        />
                        <View
                          style={[
                            styles.phoneStatusBarIcon,
                            { backgroundColor: variantTheme.foreground.gray },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Content Area */}
                    <View style={styles.phoneContent}>
                      {/* Header Card */}
                      <View
                        style={[
                          styles.phoneCard,
                          { backgroundColor: variantTheme.background.accent },
                        ]}
                      >
                        <View
                          style={[
                            styles.phoneCardLine,
                            { backgroundColor: variantTheme.foreground.gray, width: "40%" },
                          ]}
                        />
                        <View
                          style={[
                            styles.phoneCardLine,
                            {
                              backgroundColor: variantTheme.primary.main,
                              width: "60%",
                              height: 20,
                              marginTop: 8,
                            },
                          ]}
                        />
                      </View>

                      {/* List Items */}
                      <View style={styles.phoneList}>
                        <View style={styles.phoneListItem}>
                          <View
                            style={[
                              styles.phoneListIcon,
                              { backgroundColor: variantTheme.primary.main },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <View
                              style={[
                                styles.phoneCardLine,
                                { backgroundColor: variantTheme.foreground.gray, width: "70%" },
                              ]}
                            />
                            <View
                              style={[
                                styles.phoneCardLine,
                                {
                                  backgroundColor: variantTheme.foreground.gray,
                                  width: "40%",
                                  marginTop: 4,
                                  opacity: 0.5,
                                },
                              ]}
                            />
                          </View>
                        </View>

                        <View style={styles.phoneListItem}>
                          <View
                            style={[
                              styles.phoneListIcon,
                              { backgroundColor: variantTheme.primary.main, opacity: 0.7 },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <View
                              style={[
                                styles.phoneCardLine,
                                { backgroundColor: variantTheme.foreground.gray, width: "60%" },
                              ]}
                            />
                            <View
                              style={[
                                styles.phoneCardLine,
                                {
                                  backgroundColor: variantTheme.foreground.gray,
                                  width: "35%",
                                  marginTop: 4,
                                  opacity: 0.5,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Bar Indicator */}
                    <View style={styles.phoneBottomBar}>
                      <View
                        style={[
                          styles.phoneBottomBarIndicator,
                          { backgroundColor: variantTheme.foreground.gray },
                        ]}
                      />
                    </View>

                    {/* Selection Checkmark */}
                    {isSelected && (
                      <View
                        style={[
                          styles.checkmarkContainer,
                          { backgroundColor: variantTheme.primary.main },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={variantTheme.background.dark}
                        />
                      </View>
                    )}
                  </View>

                  {/* Theme Name */}
                  <Text style={styles.themeName}>{variant.name}</Text>
                </Pressable>
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

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
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

    // Segmented Control
    selectorSection: {
      marginBottom: 24,
      paddingHorizontal: 24,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segmentButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 10,
      gap: 6,
    },
    segmentButtonActive: {
      backgroundColor: theme.primary.main,
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    segmentButtonPressed: {
      opacity: 0.7,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    segmentTextActive: {
      color: theme.background.dark,
      fontWeight: "700",
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
    previewItem: {
      alignItems: "center",
      flex: 1,
    },

    // Phone Mockup
    phoneMockup: {
      width: 130,
      aspectRatio: 0.5,
      borderRadius: 20,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
      position: "relative",
    },
    phoneMockupSelected: {
      shadowColor: theme.primary.main,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    phoneStatusBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    phoneStatusBarLeft: {},
    phoneStatusBarTime: {
      fontSize: 8,
      fontWeight: "600",
    },
    phoneStatusBarRight: {
      flexDirection: "row",
      gap: 3,
    },
    phoneStatusBarIcon: {
      width: 8,
      height: 5,
      borderRadius: 2,
      opacity: 0.6,
    },
    phoneContent: {
      flex: 1,
      gap: 8,
    },
    phoneCard: {
      borderRadius: 10,
      padding: 10,
    },
    phoneCardLine: {
      height: 5,
      borderRadius: 3,
      opacity: 0.4,
    },
    phoneList: {
      gap: 8,
    },
    phoneListItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    phoneListIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
    },
    phoneBottomBar: {
      alignItems: "center",
      paddingTop: 6,
    },
    phoneBottomBarIndicator: {
      width: 32,
      height: 3,
      borderRadius: 2,
      opacity: 0.5,
    },
    checkmarkContainer: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    themeName: {
      marginTop: 10,
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.white,
      textAlign: "center",
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
