import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Theme } from "../../constants/themes";
import { useCategories } from "../../contexts/CategoriesContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Category } from "../../contexts/CategoriesContext";

// ─────────────────────────────────────────────────────────────────────────────
// Category Card Component
// ─────────────────────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  theme,
  onArchive,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  reorderMode,
}: {
  category: Category;
  theme: Theme;
  onArchive: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  reorderMode: boolean;
}) {
  const s = makeStyles(theme);
  const [showActions, setShowActions] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [s.categoryCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/category/edit?id=${category.id}` as any)}
      onLongPress={() => setShowActions(!showActions)}
    >
      {/* Colored accent strip */}
      <View style={[s.categoryAccent, { backgroundColor: category.color }]} />

      {/* Icon with colored background */}
      <View style={[s.categoryIcon, { backgroundColor: `${category.color}18` }]}>
        <MaterialCommunityIcons
          name={(category.icon || "shape-outline") as any}
          size={22}
          color={category.color}
        />
      </View>

      {/* Info */}
      <View style={s.categoryInfo}>
        <Text style={s.categoryName} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={s.categoryType}>
          {category.type === "expense" ? "Expense" : "Income"}
        </Text>
      </View>

      {/* Reorder Controls */}
      {reorderMode && (
        <View style={s.reorderControls}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            style={({ pressed }) => [
              s.reorderButton,
              isFirst && s.reorderButtonDisabled,
              pressed && !isFirst && { opacity: 0.6 },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-up"
              size={20}
              color={isFirst ? theme.foreground.gray : theme.primary.main}
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            style={({ pressed }) => [
              s.reorderButton,
              isLast && s.reorderButtonDisabled,
              pressed && !isLast && { opacity: 0.6 },
            ]}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={isLast ? theme.foreground.gray : theme.primary.main}
            />
          </Pressable>
        </View>
      )}

      {/* Actions - only show on long press when not in reorder mode */}
      {!reorderMode && showActions && (
        <View style={s.categoryActions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            style={({ pressed }) => [s.actionButton, pressed && { opacity: 0.6 }]}
          >
            <MaterialCommunityIcons
              name="archive-outline"
              size={18}
              color={theme.foreground.gray}
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={({ pressed }) => [s.actionButton, pressed && { opacity: 0.6 }]}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color="#F14A6E" />
          </Pressable>
        </View>
      )}

      {/* Chevron */}
      {!showActions && !reorderMode && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.foreground.gray}
        />
      )}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Categories Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const {
    expenseCategories,
    incomeCategories,
    archiveCategory,
    deleteCategory,
    reorderCategories,
    isLoading,
  } = useCategories();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [refreshing, setRefreshing] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const s = makeStyles(theme);

  const currentCategories =
    activeTab === "expense" ? expenseCategories : incomeCategories;

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh (already loaded from context)
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleArchive = (category: Category) => {
    Alert.alert(
      "Archive Category",
      `Archive "${category.name}"? It will be hidden but can be restored later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: () => archiveCategory(category.id),
        },
      ]
    );
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Delete "${category.name}" permanently? This cannot be undone.\n\nNote: Transactions using this category will keep their category name.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCategory(category.id),
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Categories</Text>
        <View style={s.headerButtons}>
          <Pressable
            onPress={() => router.push(`/category/analytics?type=${activeTab}` as any)}
            style={({ pressed }) => [
              s.analyticsButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={20}
              color={theme.primary.main}
            />
          </Pressable>
          <Pressable
            onPress={() => setReorderMode(!reorderMode)}
            style={({ pressed }) => [
              s.reorderToggle,
              reorderMode && s.reorderToggleActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="swap-vertical"
              size={20}
              color={reorderMode ? theme.background.dark : theme.primary.main}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push(`/category/add?type=${activeTab}` as any)}
            style={({ pressed }) => [s.addButton, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="plus" size={24} color={theme.background.dark} />
          </Pressable>
        </View>
      </View>

      {/* Type Filter Chips */}
      <View style={s.filterRow}>
        {(["expense", "income"] as const).map((type) => {
          const active = activeTab === type;
          const color = type === "income" ? "#26A17B" : "#F14A6E";
          const icon = type === "income" ? "trending-up" : "trending-down";
          const count = type === "expense" ? expenseCategories.length : incomeCategories.length;
          
          return (
            <Pressable
              key={type}
              style={[
                s.filterChip,
                active && {
                  backgroundColor: `${color}22`,
                  borderColor: color,
                },
              ]}
              onPress={() => setActiveTab(type)}
            >
              <MaterialCommunityIcons
                name={icon}
                size={16}
                color={active ? color : theme.foreground.gray}
              />
              <Text
                style={[
                  s.filterChipText,
                  active && { color, fontWeight: "700" },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <View style={[s.filterBadge, active && { backgroundColor: `${color}33` }]}>
                <Text
                  style={[
                    s.filterBadgeText,
                    active && { color },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Categories List */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Loading...</Text>
          </View>
        ) : currentCategories.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons
              name="shape-outline"
              size={64}
              color={theme.foreground.gray}
            />
            <Text style={s.emptyStateText}>
              No {activeTab} categories yet
            </Text>
            <Text style={s.emptyStateSubtext}>
              Tap the + button to create your first category
            </Text>
          </View>
        ) : (
          <>
            {currentCategories.length > 0 && (
              <View style={s.hintContainer}>
                <MaterialCommunityIcons
                  name="gesture-tap-hold"
                  size={14}
                  color={theme.foreground.gray}
                />
                <Text style={s.hintText}>
                  Long press on a category to archive or delete
                </Text>
              </View>
            )}
            {currentCategories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                theme={theme}
                onArchive={() => handleArchive(category)}
                onDelete={() => handleDelete(category)}
                onMoveUp={() => {
                  if (index > 0) {
                    const newOrder = currentCategories.map((c) => c.id);
                    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                    reorderCategories(activeTab, newOrder);
                  }
                }}
                onMoveDown={() => {
                  if (index < currentCategories.length - 1) {
                    const newOrder = currentCategories.map((c) => c.id);
                    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                    reorderCategories(activeTab, newOrder);
                  }
                }}
                isFirst={index === 0}
                isLast={index === currentCategories.length - 1}
                reorderMode={reorderMode}
              />
            ))}
          </>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
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
      paddingTop: 20,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: "800",
      color: theme.foreground.white,
      letterSpacing: -0.5,
    },
    headerButtons: {
      flexDirection: "row",
      gap: 12,
    },
    analyticsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    reorderToggle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.primary.main,
    },
    reorderToggleActive: {
      backgroundColor: theme.primary.main,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 20,
    },
    filterChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
      borderWidth: 2,
      borderColor: "transparent",
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    filterBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme.background.dark,
    },
    filterBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 4,
    },
    hintContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      marginBottom: 10,
      backgroundColor: `${theme.background.accent}60`,
      borderRadius: 10,
    },
    hintText: {
      fontSize: 12,
      color: theme.foreground.gray,
      fontStyle: "italic",
      opacity: 0.9,
    },
    categoryCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      padding: 16,
      paddingLeft: 12,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: `${theme.background.darker}80`,
      position: "relative",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    categoryAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    categoryIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
      marginRight: 14,
    },
    categoryInfo: {
      flex: 1,
      justifyContent: "center",
      minHeight: 46,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    categoryType: {
      fontSize: 12,
      color: theme.foreground.gray,
      textTransform: "capitalize",
      opacity: 0.8,
    },
    categoryActions: {
      flexDirection: "row",
      gap: 8,
      marginLeft: 10,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: `${theme.background.dark}40`,
    },
    reorderControls: {
      flexDirection: "row",
      gap: 6,
      marginLeft: 10,
    },
    reorderButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.primary.main,
    },
    reorderButtonDisabled: {
      opacity: 0.3,
      borderColor: theme.foreground.gray,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 100,
      paddingHorizontal: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.foreground.white,
      marginTop: 20,
      textAlign: "center",
    },
    emptyStateSubtext: {
      fontSize: 15,
      color: theme.foreground.gray,
      marginTop: 10,
      textAlign: "center",
      lineHeight: 22,
    },
    bottomSpacer: {
      height: 40,
    },
  });
}
