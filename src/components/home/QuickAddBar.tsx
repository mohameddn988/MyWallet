import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface QuickAddBarProps {
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onAddTransfer?: () => void;
}

const ACTIONS = [
  {
    label: "Expense",
    icon: "minus-circle-outline" as const,
    color: "#F14A6E",
    bg: "rgba(241,74,110,0.18)",
  },
  {
    label: "Income",
    icon: "plus-circle-outline" as const,
    color: "#C8F14A",
    bg: "rgba(200,241,74,0.18)",
  },
  {
    label: "Transfer",
    icon: "swap-horizontal" as const,
    color: "#4A9FF1",
    bg: "rgba(74,159,241,0.18)",
  },
];

export default function QuickAddBar({
  onAddExpense,
  onAddIncome,
  onAddTransfer,
}: QuickAddBarProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [open, setOpen] = useState(false);

  // One animation value drives everything
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = open ? 0 : 1;
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
    setOpen(!open);
  };

  const dismiss = () => {
    Animated.spring(anim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
    setOpen(false);
  };

  const handleAction = (cb?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismiss();
    cb?.();
  };

  const callbacks = [onAddExpense, onAddIncome, onAddTransfer];

  // Each action button slides up by a different offset
  const offsets = [70, 140, 210];

  // FAB rotation: 0° → 45°
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  // Overlay opacity
  const overlayOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      {/* Dim overlay — catches taps to close */}
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>

      {/* Action buttons that rise above the FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {ACTIONS.map((action, i) => {
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -offsets[i]],
          });
          const opacity = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0, 1],
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.actionItem,
                { transform: [{ translateY }], opacity },
              ]}
            >
              {/* Label */}
              <View
                style={[styles.actionLabel, { backgroundColor: action.bg }]}
              >
                <Text style={[styles.actionLabelText, { color: action.color }]}>
                  {action.label}
                </Text>
              </View>

              {/* Icon button */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: action.bg,
                    borderColor: action.color + "44",
                  },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleAction(callbacks[i])}
              >
                <MaterialCommunityIcons
                  name={action.icon}
                  size={22}
                  color={action.color}
                />
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Main FAB */}
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
          onPress={toggle}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <MaterialCommunityIcons
              name="plus"
              size={28}
              color={theme.background.dark}
            />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 10,
    },
    fabContainer: {
      position: "absolute",
      bottom: 40,
      right: 24,
      alignItems: "center",
      zIndex: 20,
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    actionItem: {
      position: "absolute",
      bottom: 0,
      left: -130,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    actionLabel: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    actionLabelText: {
      fontSize: 13,
      fontWeight: "600",
    },
    actionButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
