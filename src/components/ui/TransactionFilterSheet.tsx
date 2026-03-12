import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../data/categories";
import { ACCOUNT_TYPE_META } from "../../data/accounts";
import { AccountType } from "../../types/finance";
import { formatDateLabel, toDateStr } from "../../utils/currency";
import { DatePickerModal } from "./DatePickerModal";
import { useTheme } from "../../contexts/ThemeContext";
import { Theme } from "../../constants/themes";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  dateFrom: string | null; // YYYY-MM-DD
  dateTo: string | null; // YYYY-MM-DD
  categoryIds: string[]; // empty = all
  accountTypes: AccountType[]; // empty = all
  sortBy: "date" | "amount";
  sortDir: "asc" | "desc";
}

export const DEFAULT_TX_FILTERS: TransactionFilters = {
  dateFrom: null,
  dateTo: null,
  categoryIds: [],
  accountTypes: [],
  sortBy: "date",
  sortDir: "desc",
};

export function countActiveFilters(f: TransactionFilters): number {
  let n = 0;
  if (f.dateFrom || f.dateTo) n++;
  if (f.categoryIds.length > 0) n++;
  if (f.accountTypes.length > 0) n++;
  if (f.sortBy !== "date" || f.sortDir !== "desc") n++;
  return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort options
// ─────────────────────────────────────────────────────────────────────────────

const SORT_OPTIONS: {
  sortBy: "date" | "amount";
  sortDir: "asc" | "desc";
  label: string;
  icon: string;
}[] = [
  {
    sortBy: "date",
    sortDir: "desc",
    label: "Newest first",
    icon: "sort-calendar-descending",
  },
  {
    sortBy: "date",
    sortDir: "asc",
    label: "Oldest first",
    icon: "sort-calendar-ascending",
  },
  {
    sortBy: "amount",
    sortDir: "desc",
    label: "Highest amount",
    icon: "sort-numeric-descending",
  },
  {
    sortBy: "amount",
    sortDir: "asc",
    label: "Lowest amount",
    icon: "sort-numeric-ascending",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
}

export default function TransactionFilterSheet({
  isOpen,
  onClose,
  filters,
  onApply,
}: TransactionFilterSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompactLayout = width <= 360;
  const styles = useMemo(
    () => makeStyles(theme, insets.bottom, isCompactLayout),
    [theme, insets.bottom, isCompactLayout],
  );

  const sheetRef = useRef<BottomSheet>(null);

  // Local draft state — only committed on Apply
  const [draft, setDraft] = useState<TransactionFilters>(filters);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSortSelect = (
    sortBy: "date" | "amount",
    sortDir: "asc" | "desc",
  ) => {
    setDraft((d) => ({ ...d, sortBy, sortDir }));
  };

  const today = toDateStr(new Date());

  const handleFromConfirm = (date: string) => {
    setShowFromPicker(false);
    setDraft((d) => ({ ...d, dateFrom: date }));
  };

  const handleToConfirm = (date: string) => {
    setShowToPicker(false);
    setDraft((d) => ({ ...d, dateTo: date }));
  };

  const clearDateRange = () =>
    setDraft((d) => ({ ...d, dateFrom: null, dateTo: null }));

  const toggleCategory = (id: string) => {
    setDraft((d) => {
      const has = d.categoryIds.includes(id);
      return {
        ...d,
        categoryIds: has
          ? d.categoryIds.filter((c) => c !== id)
          : [...d.categoryIds, id],
      };
    });
  };

  const toggleAccountType = (type: AccountType) => {
    setDraft((d) => {
      const has = d.accountTypes.includes(type);
      return {
        ...d,
        accountTypes: has
          ? d.accountTypes.filter((t) => t !== type)
          : [...d.accountTypes, type],
      };
    });
  };

  const handleReset = () => setDraft(DEFAULT_TX_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={["100%"]}
        enablePanDownToClose
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.background.darker }}
        handleIndicatorStyle={{
          backgroundColor: theme.foreground.gray,
          opacity: 0.5,
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
      >
        {/* Fixed header */}
        <View style={styles.header}>
            <Pressable
              onPress={handleReset}
              hitSlop={8}
              style={styles.headerBtn}
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Filter & Sort</Text>
            <Pressable
              onPress={handleApply}
              hitSlop={8}
              style={styles.headerBtn}
            >
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>

        {/* Scrollable content */}
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
            {/* Sort */}
            <Section title="Sort by" theme={theme} styles={styles}>
              <View style={styles.sortGrid}>
                {SORT_OPTIONS.map((opt) => {
                  const active =
                    draft.sortBy === opt.sortBy &&
                    draft.sortDir === opt.sortDir;
                  return (
                    <Pressable
                      key={`${opt.sortBy}-${opt.sortDir}`}
                      style={[
                        styles.sortChip,
                        active && {
                          backgroundColor: `${theme.primary.main}22`,
                          borderColor: theme.primary.main,
                        },
                      ]}
                      onPress={() => handleSortSelect(opt.sortBy, opt.sortDir)}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={15}
                        style={styles.sortChipIcon}
                        color={
                          active ? theme.primary.main : theme.foreground.gray
                        }
                      />
                      <Text
                        style={[
                          styles.sortChipText,
                          active && {
                            color: theme.primary.main,
                            fontWeight: "700",
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            {/* Date range */}
            <Section title="Date range" theme={theme} styles={styles}>
              <View style={styles.dateRow}>
                <Pressable
                  style={[
                    styles.dateBtnFrom,
                    draft.dateFrom && {
                      borderColor: theme.primary.main,
                      backgroundColor: `${theme.primary.main}14`,
                    },
                  ]}
                  onPress={() => setShowFromPicker(true)}
                >
                  <MaterialCommunityIcons
                    name="calendar-start"
                    size={15}
                    style={styles.dateBtnIcon}
                    color={
                      draft.dateFrom
                        ? theme.primary.main
                        : theme.foreground.gray
                    }
                  />
                  <Text
                    style={[
                      styles.dateBtnText,
                      draft.dateFrom && { color: theme.primary.main },
                    ]}
                    numberOfLines={1}
                  >
                    {draft.dateFrom
                      ? formatDateLabel(draft.dateFrom)
                      : "From date"}
                  </Text>
                </Pressable>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={14}
                  style={styles.dateArrowIcon}
                  color={theme.foreground.gray}
                />

                <Pressable
                  style={[
                    styles.dateBtnTo,
                    draft.dateTo && {
                      borderColor: theme.primary.main,
                      backgroundColor: `${theme.primary.main}14`,
                    },
                  ]}
                  onPress={() => setShowToPicker(true)}
                >
                  <MaterialCommunityIcons
                    name="calendar-end"
                    size={15}
                    style={styles.dateBtnIcon}
                    color={
                      draft.dateTo ? theme.primary.main : theme.foreground.gray
                    }
                  />
                  <Text
                    style={[
                      styles.dateBtnText,
                      draft.dateTo && { color: theme.primary.main },
                    ]}
                    numberOfLines={1}
                  >
                    {draft.dateTo ? formatDateLabel(draft.dateTo) : "To date"}
                  </Text>
                </Pressable>

                {(draft.dateFrom || draft.dateTo) && (
                  <Pressable
                    onPress={clearDateRange}
                    hitSlop={8}
                    style={styles.clearDateBtn}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color={theme.foreground.gray}
                    />
                  </Pressable>
                )}
              </View>
            </Section>

            {/* Category */}
            <Section
              title="Category"
              theme={theme}
              styles={styles}
              count={draft.categoryIds.length}
              onClear={
                draft.categoryIds.length > 0
                  ? () => setDraft((d) => ({ ...d, categoryIds: [] }))
                  : undefined
              }
            >
              <View style={{ marginBottom: 18 }}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { marginBottom: 10, color: theme.foreground.gray },
                  ]}
                >
                  Expenses
                </Text>
                <View style={styles.categoryChipWrap}>
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const active = draft.categoryIds.includes(cat.id);
                    return (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          active && {
                            backgroundColor: `${cat.color}22`,
                            borderColor: cat.color,
                          },
                        ]}
                        onPress={() => toggleCategory(cat.id)}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon as any}
                          size={14}
                          style={styles.categoryChipIcon}
                          color={active ? cat.color : theme.foreground.gray}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && { color: cat.color, fontWeight: "700" },
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text
                  style={[
                    styles.sectionLabel,
                    { marginBottom: 10, color: theme.foreground.gray },
                  ]}
                >
                  Income
                </Text>
                <View style={styles.categoryChipWrap}>
                  {INCOME_CATEGORIES.map((cat) => {
                    const active = draft.categoryIds.includes(cat.id);
                    return (
                      <Pressable
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          active && {
                            backgroundColor: `${cat.color}22`,
                            borderColor: cat.color,
                          },
                        ]}
                        onPress={() => toggleCategory(cat.id)}
                      >
                        <MaterialCommunityIcons
                          name={cat.icon as any}
                          size={14}
                          style={styles.categoryChipIcon}
                          color={active ? cat.color : theme.foreground.gray}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            active && { color: cat.color, fontWeight: "700" },
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Section>

            {/* Account Type */}
            <Section
              title="Account Type"
              theme={theme}
              styles={styles}
              count={draft.accountTypes.length}
              onClear={
                draft.accountTypes.length > 0
                  ? () => setDraft((d) => ({ ...d, accountTypes: [] }))
                  : undefined
              }
            >
              <View style={styles.accountChipWrap}>
                {ACCOUNT_TYPE_META.map((typeMeta) => {
                  const active = draft.accountTypes.includes(typeMeta.value);
                  return (
                    <Pressable
                      key={typeMeta.value}
                      style={[
                        styles.accountChip,
                        active && {
                          backgroundColor: `${typeMeta.defaultColor}22`,
                          borderColor: typeMeta.defaultColor,
                        },
                      ]}
                      onPress={() => toggleAccountType(typeMeta.value)}
                    >
                      <View style={styles.accountChipContent}>
                        <MaterialCommunityIcons
                          name={typeMeta.icon as any}
                          size={16}
                          style={styles.accountChipIcon}
                          color={
                            active
                              ? typeMeta.defaultColor
                              : theme.foreground.gray
                          }
                        />
                        <Text
                          style={[
                            styles.accountChipText,
                            active && {
                              color: typeMeta.defaultColor,
                              fontWeight: "700",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {typeMeta.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Section>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Date pickers rendered outside the sheet to avoid z-index issues */}
      <DatePickerModal
        visible={showFromPicker}
        value={draft.dateFrom ?? today}
        onConfirm={handleFromConfirm}
        onClose={() => setShowFromPicker(false)}
      />
      <DatePickerModal
        visible={showToPicker}
        value={draft.dateTo ?? today}
        onConfirm={handleToConfirm}
        onClose={() => setShowToPicker(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section helper
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  count,
  onClear,
  children,
  theme,
  styles,
}: {
  title: string;
  count?: number;
  onClear?: () => void;
  children: React.ReactNode;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{count}</Text>
          </View>
        )}
        {onClear && (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme: Theme, bottomInset: number = 0, compact = false) {
  return StyleSheet.create({
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}20`,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.foreground.white,
    },
    headerBtn: {
      minWidth: 52,
      alignItems: "center",
    },
    resetText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    applyText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.primary.main,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 32 + bottomInset,
    },
    section: {
      marginTop: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      minHeight: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    sectionBadge: {
      backgroundColor: theme.primary.main,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      marginLeft: 8,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    sectionBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.background.dark,
    },
    clearBtn: {
      marginLeft: "auto",
    },
    clearBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.foreground.gray,
    },
    // Sort
    sortGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: -8,
    },
    sortChip: {
      width: compact ? "100%" : "48.5%",
      maxWidth: compact ? "100%" : "48.5%",
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.darker,
    },
    sortChipIcon: {
      marginRight: 10,
    },
    sortChipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.foreground.gray,
      flexShrink: 1,
    },
    // Date range
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateBtnFrom: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.darker,
    },
    dateBtnTo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.darker,
    },
    dateBtnText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    dateBtnIcon: {
      marginRight: 6,
    },
    dateArrowIcon: {
      marginHorizontal: 8,
    },
    clearDateBtn: {
      marginLeft: 8,
      padding: 2,
    },
    // Category & account chips
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
      marginTop: -8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      marginHorizontal: 4,
      paddingVertical: 7,
      paddingHorizontal: 11,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.darker,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.foreground.gray,
    },
    // Category chips — grid layout (4 per row)
    categoryChipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: -8,
    },
    categoryChip: {
      width: compact ? "32%" : "24%",
      maxWidth: compact ? "32%" : "24%",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.darker,
    },
    categoryChipIcon: {
      marginBottom: 4,
    },
    // Account chips — grid layout (4 per row)
    accountChipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: -8,
    },
    accountChip: {
      width: compact ? "32%" : "24%",
      maxWidth: compact ? "32%" : "24%",
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${theme.foreground.gray}22`,
      backgroundColor: theme.background.darker,
    },
    accountChipContent: {
      alignItems: "center",
    },
    accountChipIcon: {
      marginBottom: 4,
    },
    accountChipText: {
      fontSize: 11,
      fontWeight: "500",
      color: theme.foreground.gray,
      maxWidth: "100%",
    },
  });
}
