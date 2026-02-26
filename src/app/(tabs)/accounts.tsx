import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export default function AccountsTabScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Accounts</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>["theme"]) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    title: {
      color: theme.foreground.white,
      fontSize: 22,
      fontWeight: "700",
    },
    subtitle: {
      color: theme.foreground.gray,
      fontSize: 14,
      marginTop: 8,
    },
  });
}
