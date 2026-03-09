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
}

export function DataConflictModal({
  visible,
  localAccountCount,
  localTransactionCount,
  cloudAccountCount,
  cloudTransactionCount,
  onChoose,
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

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="swap-horizontal-circle"
              size={40}
              color="#F59E0B"
            />
          </View>

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
              <MaterialCommunityIcons
                name="cellphone"
                size={28}
                color={
                  selected === "local"
                    ? theme.primary.main
                    : theme.foreground.gray
                }
              />
              <Text style={styles.optionTitle}>Local Device</Text>
              <Text style={styles.optionStat}>
                {localAccountCount} account{localAccountCount !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.optionStat}>
                {localTransactionCount} transaction
                {localTransactionCount !== 1 ? "s" : ""}
              </Text>
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
              <MaterialCommunityIcons
                name="cloud"
                size={28}
                color={
                  selected === "cloud"
                    ? theme.primary.main
                    : theme.foreground.gray
                }
              />
              <Text style={styles.optionTitle}>Cloud Account</Text>
              <Text style={styles.optionStat}>
                {cloudAccountCount} account{cloudAccountCount !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.optionStat}>
                {cloudTransactionCount} transaction
                {cloudTransactionCount !== 1 ? "s" : ""}
              </Text>
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
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(245,158,11,0.12)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
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
      flexDirection: "row",
      gap: 12,
      width: "100%",
      marginBottom: 20,
    },
    optionCard: {
      flex: 1,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      gap: 6,
      borderWidth: 2,
      borderColor: "transparent",
    },
    optionSelected: {
      borderColor: theme.primary.main,
    },
    optionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
      marginTop: 4,
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
