import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = makeStyles(theme);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleGetStarted = () => {
    router.navigate("/get-started/currency" as any);
  };

  const handleSkip = () => {
    router.navigate("/(tabs)/home" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Top Section - Logo */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Image source={theme.logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {/* Middle Section - Text */}
        <Animated.View
          style={[
            styles.textSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.headline}>Welcome to My wallet</Text>
          <Text style={styles.description}>
            Your financial data will be stored securely on your device. You have
            complete control and privacy.
          </Text>
        </Animated.View>

        {/* Bottom Section - Buttons */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={handleSkip}
          >
            <Text style={styles.secondaryButtonText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
      paddingTop: 60,
      paddingBottom: 40,
      justifyContent: "space-between",
    },
    logoSection: {
      alignItems: "center",
      paddingTop: 20,
    },
    logo: {
      width: 120,
      height: 120,
    },
    textSection: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
    },
    headline: {
      fontSize: 32,
      fontWeight: "700",
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    description: {
      fontSize: 16,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 24,
      maxWidth: 340,
    },
    buttonSection: {
      gap: 12,
    },
    primaryButton: {
      backgroundColor: theme.primary.main,
      paddingVertical: 16,
      borderRadius: 28,
      alignItems: "center",
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.background.dark,
      letterSpacing: 0.2,
    },
    secondaryButton: {
      paddingVertical: 16,
      alignItems: "center",
    },
    secondaryButtonPressed: {
      opacity: 0.6,
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
  });
}
