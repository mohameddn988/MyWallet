import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppBottomSheet, {
  AppBottomSheetRef,
} from "../../components/ui/AppBottomSheet";
import { Theme } from "../../constants/themes";
import {
  DATE_FORMAT_OPTIONS,
  DateFormatId,
  MONTH_LENGTH_OPTIONS,
  MonthLengthId,
  NUMBER_FORMAT_OPTIONS,
  NumberFormatId,
  useLocale,
} from "../../contexts/LocaleContext";
import { useTheme } from "../../contexts/ThemeContext";

// 
// Picker Bottom Sheet
// 

interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface PickerSheetProps {
  sheetRef: React.RefObject<AppBottomSheetRef | null>;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  theme: Theme;
}

function PickerSheet({
  sheetRef,
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
  onClose,
  theme,
}: PickerSheetProps) {
  const styles = makeStyles(theme);
  return (
    <AppBottomSheet
      ref={sheetRef}
      snapPoints={["70%"]}
      isOpen={false}
      onClose={onClose}
      noWrapper
    >
      <View style={styles.sheetHeader}>
        <View style={styles.sheetTitleBlock}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sheetSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.sheetCloseBtn,
            pressed && { opacity: 0.6 },
          ]}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name="close"
            size={20}
            color={theme.foreground.gray}
          />
        </Pressable>
      </View>

      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sheetContent}
      >
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;
          return (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [
                styles.optionRow,
                isSelected && styles.optionRowSelected,
                pressed && !isSelected && { opacity: 0.7 },
              ]}
              onPress={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.sublabel ? (
                  <Text style={styles.optionSublabel}>{opt.sublabel}</Text>
                ) : null}
              </View>
              {isSelected ? (
                <View style={styles.checkCircle}>
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={theme.background.dark}
                  />
                </View>
              ) : (
                <View style={styles.emptyCircle} />
              )}
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}

// 
// Setting Row
// 

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value: string;
  onPress: () => void;
  theme: Theme;
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onPress,
  theme,
}: SettingRowProps) {
  const styles = makeStyles(theme);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={theme.primary.main}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>{label}</Text>
          {description ? (
            <Text style={styles.settingDescription}>{description}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.settingRight}>
        <Text style={styles.settingValue}>{value}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={theme.foreground.gray}
        />
      </View>
    </Pressable>
  );
}

// 
// Screen
// 

type ActivePicker = "date" | "number" | "monthLength" | "monthStartDay" | null;

export default function LocaleSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    dateFormat,
    numberFormat,
    monthLength,
    monthStartDay,
    setDateFormat,
    setNumberFormat,
    setMonthLength,
    setMonthStartDay,
    formatDate,
    formatNumber,
  } = useLocale();
  const styles = makeStyles(theme);

  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const sheetRef = useRef<AppBottomSheetRef>(null);

  const openPicker = (picker: ActivePicker) => {
    setActivePicker(picker);
    sheetRef.current?.expand();
  };

  const closePicker = () => {
    sheetRef.current?.close();
  };

  const selectedDateOption = DATE_FORMAT_OPTIONS.find(
    (o) => o.id === dateFormat
  )!;
  const selectedNumberOption = NUMBER_FORMAT_OPTIONS.find(
    (o) => o.id === numberFormat
  )!;
  const selectedMonthLengthOption = MONTH_LENGTH_OPTIONS.find(
    (o) => o.id === monthLength
  )!;

  const previewDate = formatDate("2026-03-05");
  const previewNumber = formatNumber(1234567.89);

  const pickerProps = (() => {
    switch (activePicker) {
      case "date":
        return {
          title: "Date Format",
          subtitle: "Choose how dates are displayed",
          options: DATE_FORMAT_OPTIONS.map((o) => ({
            id: o.id,
            label: o.label,
            sublabel: `Example: ${o.example}`,
          })),
          selectedId: dateFormat,
          onSelect: (id: string) => setDateFormat(id as DateFormatId),
        };
      case "number":
        return {
          title: "Number Format",
          subtitle: "Choose how numbers and decimals are displayed",
          options: NUMBER_FORMAT_OPTIONS.map((o) => ({
            id: o.id,
            label: o.label,
            sublabel: o.example,
          })),
          selectedId: numberFormat,
          onSelect: (id: string) => setNumberFormat(id as NumberFormatId),
        };
      case "monthLength":
        return {
          title: "Month Length",
          subtitle: "How long is a budget month?",
          options: MONTH_LENGTH_OPTIONS.map((o) => ({
            id: o.id,
            label: o.label,
            sublabel: o.desc,
          })),
          selectedId: monthLength,
          onSelect: (id: string) => setMonthLength(id as MonthLengthId),
        };
      case "monthStartDay":
        return {
          title: "Month Start Day",
          subtitle: "Which day does your budget month begin?",
          options: Array.from({ length: 31 }, (_, i) => ({
            id: String(i + 1),
            label: `${i + 1}${i + 1 === 1 ? "st" : i + 1 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"}`,
            sublabel: i === 0 ? "Default" : undefined,
          })),
          selectedId: String(monthStartDay),
          onSelect: (id: string) => setMonthStartDay(parseInt(id, 10)),
        };
      default:
        return {
          title: "",
          options: [] as PickerOption[],
          selectedId: "",
          onSelect: (_id: string) => {},
        };
    }
  })();

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
        <Text style={styles.headerTitle} numberOfLines={1}>Locale & Format</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Live Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <MaterialCommunityIcons
              name="eye-outline"
              size={16}
              color={theme.primary.main}
            />
            <Text style={styles.previewHeaderText}>LIVE PREVIEW</Text>
          </View>
          <View style={styles.previewRow}>
            <View style={styles.previewLabelRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color={theme.foreground.gray}
              />
              <Text style={styles.previewLabel}>Date</Text>
            </View>
            <Text style={styles.previewValue}>{previewDate}</Text>
          </View>
          <View style={styles.previewRow}>
            <View style={styles.previewLabelRow}>
              <MaterialCommunityIcons
                name="numeric"
                size={14}
                color={theme.foreground.gray}
              />
              <Text style={styles.previewLabel}>Number</Text>
            </View>
            <Text style={styles.previewValue}>{previewNumber}</Text>
          </View>
          <View style={[styles.previewRow, styles.previewRowLast]}>
            <View style={styles.previewLabelRow}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={14}
                color={theme.foreground.gray}
              />
              <Text style={styles.previewLabel}>Budget month</Text>
            </View>
            <Text style={styles.previewValue}>
              {selectedMonthLengthOption.label}, starts {monthStartDay}{monthStartDay === 1 ? "st" : monthStartDay === 2 ? "nd" : monthStartDay === 3 ? "rd" : "th"}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATE & TIME</Text>
          <SettingRow
            icon="calendar"
            label="Date Format"
            value={selectedDateOption.label}
            onPress={() => openPicker("date")}
            theme={theme}
          />
          <SettingRow
            icon="calendar-range"
            label="Month Length"
            description={selectedMonthLengthOption.desc}
            value={selectedMonthLengthOption.label}
            onPress={() => openPicker("monthLength")}
            theme={theme}
          />
          <SettingRow
            icon="calendar-start"
            label="Month Starts On"
            description="Day your budget cycle begins"
            value={`${monthStartDay}${monthStartDay === 1 ? "st" : monthStartDay === 2 ? "nd" : monthStartDay === 3 ? "rd" : "th"}`}
            onPress={() => openPicker("monthStartDay")}
            theme={theme}
          />
        </View>

        {/* Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>NUMBERS</Text>
          <SettingRow
            icon="numeric"
            label="Number Format"
            value={selectedNumberOption.label}
            onPress={() => openPicker("number")}
            theme={theme}
          />
        </View>
      </ScrollView>

      {/* Shared Picker Bottom Sheet */}
      <PickerSheet
        sheetRef={sheetRef}
        title={pickerProps.title}
        subtitle={(pickerProps as any).subtitle}
        options={pickerProps.options}
        selectedId={pickerProps.selectedId}
        onSelect={pickerProps.onSelect}
        onClose={closePicker}
        theme={theme}
      />
    </View>
  );
}

// 
// Styles
// 

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },

    //  Header 
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

    //  Scroll 
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    scrollContent: {
      paddingBottom: 32,
    },

    //  Preview Card 
    previewCard: {
      backgroundColor: theme.background.accent,
      borderRadius: 16,
      padding: 16,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: `${theme.primary.main}28`,
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 14,
    },
    previewHeaderText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.primary.main,
      letterSpacing: 1.2,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}30`,
    },
    previewRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 2,
    },
    previewLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    previewLabel: {
      fontSize: 14,
      color: theme.foreground.gray,
    },
    previewValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.foreground.white,
    },

    //  Sections 
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.foreground.gray,
      letterSpacing: 1.2,
      marginBottom: 10,
      paddingHorizontal: 4,
      opacity: 0.7,
      textTransform: "uppercase",
    },

    //  Setting Item 
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.background.accent,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: `${theme.primary.main}18`,
      alignItems: "center",
      justifyContent: "center",
    },
    settingTextContainer: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.foreground.white,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.foreground.gray,
      lineHeight: 16,
    },
    settingRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginLeft: 8,
    },
    settingValue: {
      fontSize: 13,
      color: theme.primary.main,
      fontWeight: "600",
    },

    //  Picker Bottom Sheet 
    sheetHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: `${theme.foreground.gray}25`,
    },
    sheetTitleBlock: {
      flex: 1,
      marginRight: 12,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.foreground.white,
      marginBottom: 2,
    },
    sheetSubtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      lineHeight: 18,
    },
    sheetCloseBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.background.darker,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    sheetContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
      gap: 8,
    },

    //  Options 
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.background.darker,
    },
    optionRowSelected: {
      backgroundColor: `${theme.primary.main}15`,
      borderWidth: 1,
      borderColor: `${theme.primary.main}50`,
    },
    optionLabel: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.foreground.white,
    },
    optionLabelSelected: {
      color: theme.primary.main,
      fontWeight: "600",
    },
    optionSublabel: {
      fontSize: 12,
      color: theme.foreground.gray,
      marginTop: 3,
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.primary.main,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: `${theme.foreground.gray}50`,
    },
  });
}
