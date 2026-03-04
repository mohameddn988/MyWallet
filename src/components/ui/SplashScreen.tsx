import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function SplashScreen({
  onAnimationComplete,
}: SplashScreenProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animation sequence: fade in + scale up, hold, then complete
    Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Hold for a moment
      Animated.delay(1000),
    ]).start(() => {
      // Animation complete, trigger callback
      onAnimationComplete();
    });
  }, [fadeAnim, scaleAnim, onAnimationComplete]);

  return (
    <LinearGradient
      colors={[theme.background.dark, theme.background.accent, theme.background.dark]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../../../assets/images/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
});
