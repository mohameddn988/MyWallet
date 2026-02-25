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
}

export default function AccountsList({
  accounts,
  netWorth,
  baseCurrency,
  exchangeRates,
  onAccountPress,
}: AccountsListProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const liquidAccounts = accounts.filter(
    (aw) => aw.account.type !== "loan" && aw.account.type !== "charity",
  );
  const specialAccounts = accounts.filter(
    (aw) => aw.account.type === "loan" || aw.account.type === "charity",
  );
  const hasForeign = exchangeRates.length > 0;

  const renderRow = (aw: AccountWithBalance, isLast: boolean) => {
    const { account, balance, balanceInBase } = aw;
    const isBase = account.currency === baseCurrency;
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

        <View style={styles.nameCol}>
          <Text style={styles.accountName} numberOfLines={1}>
            {account.name}
          </Text>
          {account.note ? (
            <Text style={styles.accountNote} numberOfLines={1}>
              {account.note}
            </Text>
          ) : null}
        </View>

        <View style={styles.balanceCol}>
          <Text style={[styles.balance, { color: balColor }]}>
            {formatAmount(balance, account.currency)}
          </Text>
          {!isBase && (
            <Text style={styles.balanceConverted}>
              {String.fromCharCode(8776)}{" "}
              {formatAmount(balanceInBase, baseCurrency)}
            </Text>
          )}
        </View>

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
        <Text style={[styles.netWorthTotal, { color: theme.primary.main }]}>
          {formatAmount(netWorth, baseCurrency)}
        </Text>
      </View>

      <View style={styles.card}>
        {liquidAccounts.map((aw, i) => {
          const isLastLiquid =
            i === liquidAccounts.length - 1 && specialAccounts.length === 0;
          return (
            <React.Fragment key={aw.account.id}>
              {renderRow(aw, isLastLiquid)}
              {aw.account.subAccounts && aw.account.subAccounts.length > 0 && (
                <View style={styles.subAccountBlock}>
                  {aw.account.subAccounts.map((sub, si) => (
                    <View
                      key={sub.name}
                      style={[
                        styles.subRow,
                        si < (aw.account.subAccounts?.length ?? 0) - 1 &&
                          styles.subRowBorder,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="subdirectory-arrow-right"
                        size={14}
                        color={theme.foreground.gray}
                        style={styles.subArrow}
                      />
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subAmount}>
                        {formatAmount(sub.balance, aw.account.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </React.Fragment>
          );
        })}

        {specialAccounts.length > 0 && (
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>Loans &amp; Charity</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {specialAccounts.map((aw, i) => {
          const isLast = i === specialAccounts.length - 1;
          return (
            <React.Fragment key={aw.account.id}>
              {renderRow(aw, isLast)}
              {aw.account.subAccounts && aw.account.subAccounts.length > 0 && (
                <View style={styles.subAccountBlock}>
                  {aw.account.subAccounts.map((sub, si) => (
                    <View
                      key={sub.name}
                      style={[
                        styles.subRow,
                        si < (aw.account.subAccounts?.length ?? 0) - 1 &&
                          styles.subRowBorder,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="subdirectory-arrow-right"
                        size={14}
                        color={theme.foreground.gray}
                        style={styles.subArrow}
                      />
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subAmount}>
                        {formatAmount(sub.balance, aw.account.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {hasForeign &&
        exchangeRates.map((r) => (
          <Text key={r.from} style={styles.rateNote}>
            {r.from}: 1 {r.from} = {r.rate} {r.to}
            {r.isUserDefined ? " � Manual" : " � Auto"}
          </Text>
        ))}
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
    netWorthTotal: {
      fontSize: 13,
      fontWeight: "700",
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
    nameCol: {
      flex: 1,
      gap: 2,
    },
    accountName: {
      color: theme.foreground.white,
      fontSize: 14,
      fontWeight: "600",
    },
    accountNote: {
      color: theme.foreground.gray,
      fontSize: 11,
    },
    balanceCol: {
      alignItems: "flex-end",
      gap: 2,
    },
    balance: {
      fontSize: 15,
      fontWeight: "700",
    },
    balanceConverted: {
      color: theme.foreground.gray,
      fontSize: 11,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 8,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: "#2C3139",
    },
    dividerLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.foreground.gray,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    subAccountBlock: {
      marginLeft: 60,
      marginRight: 14,
      marginBottom: 10,
      backgroundColor: theme.background.darker,
      borderRadius: 10,
      overflow: "hidden",
    },
    subRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 6,
    },
    subRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#2C3139",
    },
    subArrow: {
      opacity: 0.5,
    },
    subName: {
      flex: 1,
      color: theme.foreground.gray,
      fontSize: 12,
    },
    subAmount: {
      color: theme.foreground.white,
      fontSize: 12,
      fontWeight: "600",
    },
    rateNote: {
      color: theme.foreground.gray,
      fontSize: 11,
      marginTop: 8,
      marginHorizontal: 20,
    },
  });
}
