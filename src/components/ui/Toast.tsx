import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────

export interface ToastProps {
  /** Whether the toast is visible */
  visible: boolean;
  /** Main message text */
  message: string;
  /** Icon name from MaterialCommunityIcons */
  icon?: string;
  /** Icon colour */
  iconColor?: string;
  /** Action button colour (falls back to iconColor) */
  actionColor?: string;
  /** Label for the optional action button */
  actionLabel?: string;
  /** Called when the action button is pressed */
  onAction?: () => void;
  /** Called when the toast finishes dismissing naturally */
  onDismiss?: () => void;
  /** Auto-dismiss duration in ms (default 4000) */
  duration?: number;
  /** Bottom offset in absolute positioning (default 100) */
  bottom?: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export function Toast({
  visible,
  message,
  icon,
  iconColor,
  actionColor,
  actionLabel,
  onAction,
  onDismiss,
  duration = 4000,
  bottom = 100,
}: ToastProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme, bottom);

  // Slide + fade animation
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Progress bar (1 → 0 over `duration`)
  const progressAnim = useRef(new Animated.Value(1)).current;

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    progressAnim.setValue(1);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();

    dismissTimer.current = setTimeout(() => {
      hide(() => onDismiss?.());
    }, duration);
  };

  const hide = (cb?: () => void) => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => cb?.());
  };

  useEffect(() => {
    if (visible) {
      show();
    } else {
      hide();
    }
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleAction = () => {
    hide();
    onAction?.();
  };

  const accentColor = iconColor ?? "#F14A6E";
  const btnColor = actionColor ?? accentColor;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={visible ? "box-none" : "none"}
    >
      <View style={styles.inner}>
        <View style={styles.body}>
          {icon && (
            <View
              style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={18}
                color={accentColor}
              />
            </View>
          )}
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {actionLabel && (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleAction}
          >
            <Text style={[styles.actionText, { color: btnColor }]}>
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: progressWidth, backgroundColor: accentColor },
          ]}
        />
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme, bottom: number) {
  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom,
      left: 16,
      right: 16,
      zIndex: 20,
      borderRadius: 16,
      backgroundColor: theme.background.accent,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}15`,
    },
    inner: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    body: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    message: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: theme.foreground.white,
      lineHeight: 20,
    },
    actionBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: `${theme.foreground.gray}15`,
    },
    actionText: {
      fontSize: 13,
      fontWeight: "700",
    },
    progressTrack: {
      height: 3,
      backgroundColor: `${theme.foreground.gray}15`,
    },
    progressBar: {
      height: 3,
    },
  });
}
