import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useCategories } from "../../contexts/CategoriesContext";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Toast Component
// ─────────────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string, ok = true) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ text, ok });
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 200,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => setMsg(null));
      }, 2200);
    },
    [anim]
  );

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return { msg, show, translateY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon Picker
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ICONS = [
  "cart-outline",
  "silverware-fork-knife",
  "bus",
  "file-document-outline",
  "medical-bag",
  "shopping-outline",
  "emoticon-outline",
  "gamepad-variant-outline",
  "school-outline",
  "home-outline",
  "airplane",
  "refresh-circle",
  "hand-heart-outline",
  "briefcase-outline",
  "laptop",
  "trending-up",
  "store-outline",
  "gift-outline",
  "cash-refund",
  "heart-outline",
  "car",
  "phone",
  "wifi",
  "lightbulb-outline",
  "paw",
  "coffee",
  "wrench",
  "tooth",
  "tshirt-crew",
  "book-open-variant",
  "music",
  "film",
  "dumbbell",
  "run",
  "bike",
  "train",
  "gas-station",
  "basket",
  "pizza",
  "glass-wine",
  "account-group",
  "baby-carriage",
  "flower",
  "palette",
  "camera",
  "watch",
  "cellphone",
  "newspaper",
  "bank",
];

function IconPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  selected: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: theme.background.darker,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: Platform.OS === "ios" ? 36 : 20,
          maxHeight: "70%",
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: theme.foreground.white,
            marginBottom: 16,
          }}
        >
          Select Icon
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {CATEGORY_ICONS.map((icon) => {
              const active = selected === icon;
              return (
                <Pressable
                  key={icon}
                  onPress={() => {
                    onSelect(icon);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: active
                      ? theme.primary.main
                      : theme.background.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={28}
                    color={active ? theme.background.dark : theme.primary.main}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Color Picker
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "#FF9500",
  "#F14A6E",
  "#4A9FF1",
  "#A44AF1",
  "#FF6B6B",
  "#F1C44A",
  "#26A17B",
  "#C8F14A",
  "#88C0D0",
  "#5E81AC",
  "#81A1C1",
  "#BF616A",
  "#D08770",
  "#EBCB8B",
  "#A3BE8C",
  "#B48EAD",
  "#56C6E8",
  "#FDB813",
  "#7AA2F7",
  "#FF6B9D",
];

function ColorPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  selected: string;
  onSelect: (color: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: theme.background.darker,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: Platform.OS === "ios" ? 36 : 20,
        }}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: theme.foreground.white,
            marginBottom: 16,
          }}
        >
          Select Color
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {CATEGORY_COLORS.map((color) => {
            const active = selected === color;
            return (
              <Pressable
                key={color}
                onPress={() => {
                  onSelect(color);
                  onClose();
                }}
                style={({ pressed }) => ({
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: color,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                  borderWidth: active ? 3 : 0,
                  borderColor: theme.foreground.white,
                })}
              >
                {active && (
                  <MaterialCommunityIcons
                    name="check"
                    size={28}
                    color={theme.foreground.white}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Category Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function AddCategoryScreen() {
  const { theme } = useTheme();
  const { addCategory } = useCategories();
  const params = useLocalSearchParams();
  const categoryType = (params.type as "expense" | "income") || "expense";

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("shape-outline");
  const [color, setColor] = useState("#4A9FF1");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const toast = useToast();
  const s = makeStyles(theme);

  const isValid = name.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) return;

    try {
      await addCategory({
        name: name.trim(),
        icon,
        color,
        type: categoryType,
      });

      toast.show("Category created!", true);
      setTimeout(() => router.back(), 500);
    } catch (error) {
      toast.show("Failed to create category", false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backButton, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.foreground.white} />
        </Pressable>
        <Text style={s.headerTitle}>New Category</Text>
        <Pressable
          onPress={handleSave}
          disabled={!isValid}
          style={({ pressed }) => [
            s.saveButton,
            !isValid && s.saveButtonDisabled,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[s.saveButtonText, !isValid && s.saveButtonTextDisabled]}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView style={s.content} keyboardShouldPersistTaps="handled">
        {/* Type Badge */}
        <View style={s.typeBadge}>
          <MaterialCommunityIcons
            name={categoryType === "expense" ? "trending-down" : "trending-up"}
            size={16}
            color={categoryType === "expense" ? "#F14A6E" : "#26A17B"}
          />
          <Text
            style={[
              s.typeBadgeText,
              { color: categoryType === "expense" ? "#F14A6E" : "#26A17B" },
            ]}
          >
            {categoryType === "expense" ? "Expense" : "Income"}
          </Text>
        </View>

        {/* Preview */}
        <View style={s.preview}>
          <View style={[s.previewIcon, { backgroundColor: `${color}18` }]}>
            <MaterialCommunityIcons name={icon as any} size={40} color={color} />
          </View>
          <Text style={s.previewName}>{name || "Category Name"}</Text>
        </View>

        {/* Name Input */}
        <Text style={s.label}>Category Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Groceries, Salary..."
          placeholderTextColor={theme.foreground.gray}
          maxLength={30}
        />

        {/* Icon Selector */}
        <Text style={s.label}>Icon</Text>
        <Pressable
          onPress={() => setShowIconPicker(true)}
          style={({ pressed }) => [s.selector, pressed && { opacity: 0.7 }]}
        >
          <View style={s.selectorLeft}>
            <View style={[s.selectorIcon, { backgroundColor: `${color}18` }]}>
              <MaterialCommunityIcons name={icon as any} size={24} color={color} />
            </View>
            <Text style={s.selectorText}>Choose Icon</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.foreground.gray}
          />
        </Pressable>

        {/* Color Selector */}
        <Text style={s.label}>Color</Text>
        <Pressable
          onPress={() => setShowColorPicker(true)}
          style={({ pressed }) => [s.selector, pressed && { opacity: 0.7 }]}
        >
          <View style={s.selectorLeft}>
            <View style={[s.selectorIcon, { backgroundColor: color }]} />
            <Text style={s.selectorText}>{color}</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.foreground.gray}
          />
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <IconPickerModal
        visible={showIconPicker}
        selected={icon}
        onSelect={setIcon}
        onClose={() => setShowIconPicker(false)}
        theme={theme}
      />
      <ColorPickerModal
        visible={showColorPicker}
        selected={color}
        onSelect={setColor}
        onClose={() => setShowColorPicker(false)}
        theme={theme}
      />

      {/* Toast */}
      {toast.msg && (
        <Animated.View
          style={[
            s.toast,
            {
              backgroundColor: toast.msg.ok ? theme.primary.main : "#F14A6E",
              transform: [{ translateY: toast.translateY }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={toast.msg.ok ? "check-circle" : "alert-circle"}
            size={20}
            color={theme.background.dark}
          />
          <Text style={s.toastText}>{toast.msg.text}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.primary.main,
    },
    saveButtonDisabled: {
      backgroundColor: theme.background.accent,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.background.dark,
    },
    saveButtonTextDisabled: {
      color: theme.foreground.gray,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.background.accent,
      marginTop: 20,
    },
    typeBadgeText: {
      fontSize: 13,
      fontWeight: "600",
    },
    preview: {
      alignItems: "center",
      paddingVertical: 32,
    },
    previewIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    previewName: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.foreground.white,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.foreground.gray,
      marginTop: 20,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: theme.foreground.white,
      fontSize: 16,
    },
    selector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#2C3139",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    selectorLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    selectorIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    selectorText: {
      fontSize: 16,
      color: theme.foreground.white,
    },
    toast: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
    },
    toastText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.background.dark,
    },
  });
}
