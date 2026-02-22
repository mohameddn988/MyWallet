import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export default function HomeIndex() {
  const { theme } = useTheme();
  const { authMode, user, signOut } = useAuth();

  return (
    <View style={[styles.root, { backgroundColor: theme.background.dark }]}>
      <Text style={[styles.title, { color: theme.foreground.white }]}>
        Dashboard
      </Text>


      {/* Temporary sign out for testing */}
      <Pressable
        style={[styles.signOutBtn, { borderColor: theme.primary.main }]}
        onPress={signOut}
      >
        <Text style={{ color: theme.primary.main, fontWeight: "600" }}>
          Sign Out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    marginBottom: 40,
  },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
});