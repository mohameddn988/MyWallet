import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { AccountWithBalance, ExchangeRate } from "../../types/finance";
import { formatAmount } from "../../utils/currency";

interface AccountsListProps {
  accounts: AccountWithBalance[];
  netWorth: number;
  baseCurrency: string;
  exchangeRates: ExchangeRate[];
  onAccountPress?: (accountId: string) => void;
  onViewAllPress?: () => void;
}

export default function AccountsList({
  accounts,
  netWorth,
  baseCurrency,
  exchangeRates,
  onAccountPress,
  onViewAllPress,
}: AccountsListProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const liquidAccounts = accounts.filter(
    (aw) => aw.account.type !== "loan" && aw.account.type !== "charity",
  );
  const specialAccounts = accounts.filter(
    (aw) => aw.account.type === "loan" || aw.account.type === "charity",
  );

  const renderRow = (aw: AccountWithBalance, isLast: boolean) => {
    const { account, balance } = aw;
    const isLiability = account.isLiability || account.type === "loan";
    const balColor = isLiability ? "#F14A6E" : theme.foreground.white;

    return (
      <Pressable
        key={account.id}
        style={({ pressed }) => [
          styles.row,
          !isLast && styles.rowBorder,
          pressed && styles.rowPressed,
        ]}
        onPress={() => onAccountPress?.(account.id)}
      >
        <View
          style={[styles.iconWrap, { backgroundColor: `${account.color}22` }]}
        >
          <MaterialCommunityIcons
            name={account.icon as any}
            size={18}
            color={account.color}
          />
        </View>

        <Text style={styles.accountName} numberOfLines={1}>
          {account.name}
        </Text>

        <Text style={[styles.balance, { color: balColor }]}>
          {formatAmount(balance, account.currency)}
        </Text>

        <MaterialCommunityIcons
          name="chevron-right"
          size={16}
          color={theme.foreground.gray}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Accounts</Text>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          onPress={onViewAllPress}
        >
          <Text style={[styles.viewAll, { color: theme.primary.main }]}>
            View all
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {liquidAccounts.map((aw, i) => {
          const isLastLiquid =
            i === liquidAccounts.length - 1 && specialAccounts.length === 0;
          return renderRow(aw, isLastLiquid);
        })}

        {specialAccounts.map((aw, i) => {
          const isLast = i === specialAccounts.length - 1;
          return renderRow(aw, isLast);
        })}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    container: {
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginBottom: 10,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.9,
      textTransform: "uppercase",
    },
    viewAll: {
      fontSize: 13,
      fontWeight: "600",
    },
    card: {
      marginHorizontal: 16,
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#2C3139",
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 12,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#2C3139",
    },
    rowPressed: {
      backgroundColor: theme.background.darker,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    accountName: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
    },
    balance: {
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
