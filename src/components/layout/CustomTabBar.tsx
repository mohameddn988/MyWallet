import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const ICON_MAP: Record<
  string,
  { default: IconName; focused: IconName; label: string }
> = {
  home: { default: "home-outline", focused: "home", label: "Home" },
  transactions: {
    default: "swap-horizontal",
    focused: "swap-horizontal",
    label: "Transactions",
  },
  analytics: {
    default: "chart-box-outline",
    focused: "chart-box",
    label: "Analytics",
  },
  accounts: { default: "wallet-outline", focused: "wallet", label: "Accounts" },
  settings: { default: "cog-outline", focused: "cog", label: "Settings" },
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: 5,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const iconConfig = ICON_MAP[route.name];

        // Skip routes that have no icon mapping (e.g. filtered-transactions)
        if (!iconConfig) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabButton
            key={route.key}
            isFocused={isFocused}
            iconName={isFocused ? iconConfig.focused : iconConfig.default}
            label={iconConfig.label}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

interface TabButtonProps {
  isFocused: boolean;
  iconName: IconName;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  isFocused,
  iconName,
  label,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          color={isFocused ? theme.primary.main : theme.foreground.gray}
        />
      </View>
      <Text
        style={[
          styles.label,
          { color: isFocused ? theme.primary.main : theme.foreground.gray },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.background.darker,
      borderTopWidth: 1,
      borderTopColor: "#2C3139",
      paddingTop: 8,
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
    },
    iconContainer: {
      marginBottom: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: "500",
    },
  });
}
