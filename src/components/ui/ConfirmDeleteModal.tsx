import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfirmDeleteModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when the user confirms the delete action */
  onConfirm: () => void;
  /** Called when the user cancels (taps Cancel or backdrop via hardware back) */
  onCancel: () => void;
  /** Whether a delete operation is in progress — disables buttons and shows busy label */
  busy?: boolean;
  /** Modal title. Defaults to "Delete" */
  title?: string;
  /** Body description text. Defaults to "This action cannot be undone." */
  description?: string;
  /** Confirm button label when idle. Defaults to "Delete" */
  confirmLabel?: string;
  /** Confirm button label when busy. Defaults to "Deleting…" */
  busyLabel?: string;
  /** MaterialCommunityIcons icon name. Defaults to "trash-can-outline" */
  icon?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ConfirmDeleteModal({
  visible,
  onConfirm,
  onCancel,
  busy = false,
  title = "Delete",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  busyLabel = "Deleting…",
  icon = "trash-can-outline",
}: ConfirmDeleteModalProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => !busy && onCancel()}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={icon as any}
              size={36}
              color="#F14A6E"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onCancel}
              disabled={busy}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.btnDelete,
                pressed && { opacity: 0.7 },
                busy && { opacity: 0.5 },
              ]}
              onPress={onConfirm}
              disabled={busy}
            >
              <Text style={styles.btnDeleteText}>
                {busy ? busyLabel : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    card: {
      backgroundColor: theme.background.accent,
      borderRadius: 20,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: "center",
      gap: 16,
      width: "100%",
      maxWidth: 320,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: `${theme.foreground.white}10`,
      alignItems: "center",
      justifyContent: "center",
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
      marginBottom: 8,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
      width: "100%",
    },
    btn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    btnCancel: {
      backgroundColor: theme.background.dark,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
    },
    btnCancelText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    btnDelete: {
      backgroundColor: "#F14A6E",
    },
    btnDeleteText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },
  });
}
