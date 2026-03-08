import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useFinance } from "../../contexts/FinanceContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function DataManagementScreen() {
  const { theme } = useTheme();
  const {
    allTransactions,
    allAccounts,
    exchangeRates,
    baseCurrency,
  } = useFinance();
  const router = useRouter();
  const styles = makeStyles(theme);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);

      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        baseCurrency,
        accounts: allAccounts,
        transactions: allTransactions,
        exchangeRates,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      // For now, just show the data is ready
      Alert.alert(
        "Export Ready",
        `Data is ready to export. ${allTransactions.length} transactions, ${allAccounts.length} accounts.\n\nExport functionality will be fully implemented soon.`,
        [
          { text: "OK", style: "default" },
        ]
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", "Could not export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      // Create CSV header
      let csv = "Date,Type,Amount,Currency,Category,Account,Note\n";

      // Add transaction rows
      allTransactions.forEach((tx) => {
        const date = new Date(tx.date).toLocaleDateString();
        const type = tx.type;
        const amount = tx.amount / 100;
        const account = allAccounts.find((a) => a.id === tx.accountId)?.name || "";
        const note = tx.note?.replace(/,/g, ";") || "";

        csv += `${date},${type},${amount},${tx.currency},${tx.categoryId || ""},${account},"${note}"\n`;
      });

      // For now, just show the CSV is ready
      Alert.alert(
        "CSV Export Ready",
        `${allTransactions.length} transactions ready to export.\n\nFull CSV export functionality will be implemented soon.`,
        [
          { text: "OK", style: "default" },
        ]
      );
    } catch (error) {
      console.error("CSV export error:", error);
      Alert.alert("Export Failed", "Could not export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    Alert.alert(
      "Coming Soon",
      "Import functionality will be available in a future update"
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all your data. This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Coming Soon",
              "Data reset functionality will be available in a future update"
            );
          },
        },
      ]
    );
  };

  const dataStats = {
    transactions: allTransactions.length,
    accounts: allAccounts.length,
    currencies: new Set(allAccounts.map((a) => a.currency)).size,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={theme.foreground.white}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Data Management</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Data Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATA OVERVIEW</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="swap-horizontal"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.statValue}>{dataStats.transactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="wallet"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.statValue}>{dataStats.accounts}</Text>
              <Text style={styles.statLabel}>Accounts</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={24}
                color={theme.primary.main}
              />
              <Text style={styles.statValue}>{dataStats.currencies}</Text>
              <Text style={styles.statLabel}>Currencies</Text>
            </View>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>EXPORT</Text>
          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.pressed,
            ]}
            onPress={handleExportJSON}
            disabled={isExporting}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="file-export"
                size={22}
                color={theme.primary.main}
              />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Export as JSON</Text>
                <Text style={styles.actionDescription}>
                  Full backup with all data
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.foreground.gray}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.pressed,
            ]}
            onPress={handleExportCSV}
            disabled={isExporting}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="table-arrow-right"
                size={22}
                color={theme.primary.main}
              />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Export Transactions as CSV</Text>
                <Text style={styles.actionDescription}>
                  Spreadsheet compatible format
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.foreground.gray}
            />
          </Pressable>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>IMPORT</Text>
          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.pressed,
            ]}
            onPress={handleImport}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="file-import"
                size={22}
                color={theme.foreground.white}
              />
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Import from JSON</Text>
                <Text style={styles.actionDescription}>
                  Restore from backup file
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.foreground.gray}
            />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DANGER ZONE</Text>
          <Pressable
            style={({ pressed }) => [
              styles.actionItem,
              styles.dangerItem,
              pressed && styles.pressed,
            ]}
            onPress={handleReset}
          >
            <View style={styles.actionLeft}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={22}
                color="#F44336"
              />
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionLabel, styles.dangerLabel]}>
                  Reset All Data
                </Text>
                <Text style={styles.actionDescription}>
                  Permanently delete everything
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#F44336"
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    subtitle: {
      fontSize: 15,
      color: theme.foreground.gray,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      marginBottom: 12,
      paddingHorizontal: 4,
      opacity: 0.7,
      textTransform: "uppercase",
    },
    statsContainer: {
      flexDirection: "row",
      gap: 12,
    },
    statItem: {
      flex: 1,
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
      padding: 16,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.foreground.white,
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    actionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}12`,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    dangerItem: {
      borderColor: "#3a1e1e",
    },
    actionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    actionTextContainer: {
      flex: 1,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
      marginBottom: 2,
    },
    dangerLabel: {
      color: "#F44336",
    },
    actionDescription: {
      fontSize: 12,
      color: theme.foreground.gray,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
