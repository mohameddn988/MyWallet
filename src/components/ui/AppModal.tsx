import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AppModalVariant =
  | "default"
  | "destructive"
  | "warning"
  | "success"
  | "info";

export interface AppModalAction {
  /** Button label */
  label: string;
  /** Label shown while busy */
  busyLabel?: string;
  /** Called when the button is pressed */
  onPress: () => void;
  /** Marks the button as the destructive / danger style */
  destructive?: boolean;
  /** Marks the button as the primary/filled style. Only one per modal. */
  primary?: boolean;
  /** Disables the button. Also true while busy. */
  disabled?: boolean;
  /** Shows a spinner and disables the button */
  busy?: boolean;
}

export interface AppModalProps {
  /** Controls visibility */
  visible: boolean;
  /** Modal title */
  title: string;
  /** Optional subtitle / description below the title */
  description?: string;
  /** MaterialCommunityIcons icon name shown at the top */
  icon?: string;
  /** Override the icon colour. Defaults based on `variant`. */
  iconColor?: string;
  /**
   * Colour theme for the icon background circle and default primary button.
   * @default "default"
   */
  variant?: AppModalVariant;
  /**
   * Action buttons rendered at the bottom of the modal.
   * Typically 1-2 buttons (cancel + confirm).
   */
  actions?: AppModalAction[];
  /**
   * Custom content rendered between the description and the action buttons.
   * Useful for lists, pickers, stat rows, etc.
   */
  children?: React.ReactNode;
  /**
   * Called when the user taps the backdrop or the hardware back button.
   * If omitted the modal cannot be dismissed by user gesture.
   */
  onClose?: () => void;
  /** Whether any action is currently in progress (disables all actions). */
  busy?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant colours
// ─────────────────────────────────────────────────────────────────────────────

const VARIANT_COLORS: Record<AppModalVariant, string> = {
  default: "#6C7AE0",
  destructive: "#F14A6E",
  warning: "#F59E0B",
  success: "#22C55E",
  info: "#38BDF8",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AppModal({
  visible,
  title,
  description,
  icon,
  iconColor,
  variant = "default",
  actions,
  children,
  onClose,
  busy = false,
}: AppModalProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const accentColor = iconColor ?? VARIANT_COLORS[variant];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => !busy && onClose?.()}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => !busy && onClose?.()}
      >
        {/* Stop propagation so taps inside the card don't close the modal */}
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>

          {/* ── Icon ───────────────────────────── */}
          {icon ? (
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${accentColor}18` },
              ]}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={36}
                color={accentColor}
              />
            </View>
          ) : null}

          {/* ── Title ──────────────────────────── */}
          <Text style={styles.title}>{title}</Text>

          {/* ── Description ────────────────────── */}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {/* ── Custom content ─────────────────── */}
          {children ? (
            <View style={styles.content}>{children}</View>
          ) : null}

          {/* ── Actions ────────────────────────── */}
          {actions && actions.length > 0 ? (
            <View style={styles.actions}>
              {actions.map((action, i) => {
                const isDisabled = busy || action.disabled || action.busy;
                const bgColor = action.destructive
                  ? "#F14A6E"
                  : action.primary
                    ? accentColor
                    : undefined;
                const labelColor = action.destructive || action.primary
                  ? "#fff"
                  : theme.foreground.white;

                return (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      styles.btn,
                      action.primary || action.destructive
                        ? [styles.btnFilled, { backgroundColor: bgColor }]
                        : styles.btnOutline,
                      pressed && !isDisabled && { opacity: 0.75 },
                      isDisabled && { opacity: 0.45 },
                    ]}
                    onPress={action.onPress}
                    disabled={isDisabled}
                  >
                    {action.busy ? (
                      <ActivityIndicator
                        size="small"
                        color={labelColor}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.btnText,
                          {
                            color:
                              action.destructive || action.primary
                                ? "#fff"
                                : theme.foreground.white,
                          },
                        ]}
                      >
                        {action.busy && action.busyLabel
                          ? action.busyLabel
                          : action.label}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 22,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: "center",
      width: "100%",
      maxWidth: 340,
      gap: 12,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      textAlign: "center",
    },
    description: {
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 20,
    },
    content: {
      width: "100%",
      marginTop: 4,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
      width: "100%",
    },
    btn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    btnFilled: {
      // backgroundColor set inline
    },
    btnOutline: {
      backgroundColor: theme.background.dark,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}25`,
    },
    btnText: {
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
