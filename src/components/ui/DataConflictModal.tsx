import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Theme } from "../../constants/themes";

interface DataConflictModalProps {
  visible: boolean;
  localAccountCount: number;
  localTransactionCount: number;
  cloudAccountCount: number;
  cloudTransactionCount: number;
  onChoose: (choice: "local" | "cloud") => Promise<void>;
  onCancel?: () => Promise<void> | void;
}

export function DataConflictModal({
  visible,
  localAccountCount,
  localTransactionCount,
  cloudAccountCount,
  cloudTransactionCount,
  onChoose,
  onCancel,
}: DataConflictModalProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<"local" | "cloud" | null>(null);

  const handleChoose = async (choice: "local" | "cloud") => {
    setBusy(true);
    try {
      await onChoose(choice);
    } finally {
      setBusy(false);
      setSelected(null);
    }
  };

  const handleCancel = async () => {
    if (busy) return;

    setBusy(true);
    try {
      setSelected(null);
      await onCancel?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close button */}
          <Pressable
            style={styles.closeBtn}
            onPress={handleCancel}
            disabled={busy}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={theme.foreground.gray}
            />
          </Pressable>

          {/* Title */}
          <Text style={styles.title}>Data Conflict</Text>
          <Text style={styles.description}>
            Both your local device and cloud account have existing data. Choose
            which one to keep — the other will be replaced.
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {/* Local card */}
            <Pressable
              style={[
                styles.optionCard,
                selected === "local" && styles.optionSelected,
              ]}
              onPress={() => !busy && setSelected("local")}
              disabled={busy}
            >
              <View style={styles.optionIconWrap}>
                <MaterialCommunityIcons
                  name="cellphone"
                  size={24}
                  color={
                    selected === "local"
                      ? theme.primary.main
                      : theme.foreground.gray
                  }
                />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Local Device</Text>
                <Text style={styles.optionStat}>
                  {localAccountCount} account
                  {localAccountCount !== 1 ? "s" : ""}
                  {" · "}
                  {localTransactionCount} transaction
                  {localTransactionCount !== 1 ? "s" : ""}
                </Text>
              </View>
            </Pressable>

            {/* Cloud card */}
            <Pressable
              style={[
                styles.optionCard,
                selected === "cloud" && styles.optionSelected,
              ]}
              onPress={() => !busy && setSelected("cloud")}
              disabled={busy}
            >
              <View style={styles.optionIconWrap}>
                <MaterialCommunityIcons
                  name="cloud"
                  size={24}
                  color={
                    selected === "cloud"
                      ? theme.primary.main
                      : theme.foreground.gray
                  }
                />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Cloud Account</Text>
                <Text style={styles.optionStat}>
                  {cloudAccountCount} account
                  {cloudAccountCount !== 1 ? "s" : ""}
                  {" · "}
                  {cloudTransactionCount} transaction
                  {cloudTransactionCount !== 1 ? "s" : ""}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Confirm */}
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              !selected && styles.confirmDisabled,
              pressed && selected && !busy && { opacity: 0.75 },
            ]}
            onPress={() => selected && handleChoose(selected)}
            disabled={!selected || busy}
          >
            <Text style={styles.confirmText}>
              {busy
                ? "Syncing…"
                : selected
                  ? `Keep ${selected === "local" ? "Local" : "Cloud"} Data`
                  : "Select an option"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    card: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
    },
    closeBtn: {
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 8,
    },
    description: {
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 20,
    },
    options: {
      flexDirection: "column",
      gap: 10,
      width: "100%",
      marginBottom: 20,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 14,
      borderWidth: 2,
      borderColor: "transparent",
    },
    optionSelected: {
      borderColor: theme.primary.main,
    },
    optionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 3,
    },
    optionStat: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    confirmBtn: {
      width: "100%",
      backgroundColor: theme.primary.main,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    confirmDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.background.dark,
    },
  });
}
