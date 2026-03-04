import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { parseDate, toDateStr } from "../../utils/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Always pad to exactly 42 cells (6 rows × 7 cols)
  while (cells.length < 42) cells.push(null);
  return cells;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DatePickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Currently selected date as YYYY-MM-DD */
  value: string;
  /** Called with the confirmed date string YYYY-MM-DD */
  onConfirm: (date: string) => void;
  /** Called when the user dismisses without confirming */
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const { theme } = useTheme();

  const parsed = parseDate(value);
  const [calYear, setCalYear] = useState(parsed.getFullYear());
  const [calMonth, setCalMonth] = useState(parsed.getMonth());
  const [selectedDay, setSelectedDay] = useState(parsed.getDate());
  const [mode, setMode] = useState<"calendar" | "year">("calendar");
  const [yearRangeStart, setYearRangeStart] = useState(
    Math.floor(parsed.getFullYear() / 16) * 16,
  );
  const [calendarContentHeight, setCalendarContentHeight] = useState(0);

  // Sync state when value or visibility changes
  useEffect(() => {
    const d = parseDate(value);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setMode("calendar");
  }, [value, visible]);

  const grid = useMemo(
    () => buildCalendarGrid(calYear, calMonth),
    [calYear, calMonth],
  );

  const todayStr = toDateStr(new Date());

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    const mm = String(calMonth + 1).padStart(2, "0");
    const dd = String(selectedDay).padStart(2, "0");
    onConfirm(`${calYear}-${mm}-${dd}`);
  };

  const styles = makeStyles();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.card, { backgroundColor: theme.background.accent }]}
        >
          {/* Month/Year header */}
          <View style={styles.calHeader}>
            <Pressable
              style={[
                styles.calNavBtn,
                { backgroundColor: theme.background.darker },
              ]}
              onPress={
                mode === "calendar"
                  ? prevMonth
                  : () => setYearRangeStart((y) => y - 16)
              }
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={theme.foreground.white}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                setMode((m) => {
                  if (m === "year") return "calendar";
                  setYearRangeStart(Math.floor(calYear / 16) * 16);
                  return "year";
                })
              }
              style={styles.calTitleBtn}
            >
              <Text
                style={[styles.calTitle, { color: theme.foreground.white }]}
              >
                {mode === "calendar"
                  ? `${MONTH_NAMES[calMonth]} ${calYear}`
                  : `${yearRangeStart} – ${yearRangeStart + 15}`}
              </Text>
              <MaterialCommunityIcons
                name={mode === "year" ? "chevron-up" : "chevron-down"}
                size={16}
                color={theme.primary.main}
              />
            </Pressable>
            <Pressable
              style={[
                styles.calNavBtn,
                { backgroundColor: theme.background.darker },
              ]}
              onPress={
                mode === "calendar"
                  ? nextMonth
                  : () => setYearRangeStart((y) => y + 16)
              }
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={theme.foreground.white}
              />
            </Pressable>
          </View>

          {mode === "year" ? (
            /* ── Year picker grid ── */
            <View style={[styles.yearGrid, calendarContentHeight > 0 && { minHeight: calendarContentHeight }]}>
              {Array.from({ length: 4 }, (_, rowIdx) => (
                <View key={`yr-row-${rowIdx}`} style={styles.yearRow}>
                  {Array.from({ length: 4 }, (_, colIdx) => {
                    const yr = yearRangeStart + rowIdx * 4 + colIdx;
                    const isSelected = yr === calYear;
                    return (
                      <Pressable
                        key={yr}
                        style={[
                          styles.yearCell,
                          isSelected && {
                            backgroundColor: theme.primary.main,
                            borderRadius: 10,
                          },
                        ]}
                        onPress={() => {
                          setCalYear(yr);
                          setMode("calendar");
                        }}
                      >
                        <Text
                          style={[
                            styles.yearText,
                            { color: theme.foreground.white },
                            isSelected && {
                              color: theme.background.dark,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {yr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : (
            <View
              onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                if (h > 0) setCalendarContentHeight(h);
              }}
            >
              {/* Weekday labels */}
              <View style={styles.weekRow}>
                {WEEK_DAYS.map((d) => (
                  <Text
                    key={d}
                    style={[styles.weekDay, { color: theme.foreground.gray }]}
                  >
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day grid */}
              <View style={styles.grid}>
                {Array.from({ length: 6 }, (_, rowIdx) => {
                  const row = grid.slice(rowIdx * 7, rowIdx * 7 + 7);
                  return (
                    <View key={`row-${rowIdx}`} style={styles.gridRow}>
                      {row.map((day, colIdx) => {
                        if (!day)
                          return (
                            <View
                              key={`empty-${rowIdx}-${colIdx}`}
                              style={styles.dayCell}
                            />
                          );
                        const mm = String(calMonth + 1).padStart(2, "0");
                        const dd = String(day).padStart(2, "0");
                        const dateStr = `${calYear}-${mm}-${dd}`;
                        const isSelected = day === selectedDay;
                        const isToday = dateStr === todayStr;

                        return (
                          <Pressable
                            key={dateStr}
                            style={[
                              styles.dayCell,
                              isSelected && {
                                backgroundColor: theme.primary.main,
                                borderRadius: 10,
                              },
                              !isSelected &&
                                isToday && {
                                  borderWidth: 1,
                                  borderColor: theme.primary.main,
                                  borderRadius: 10,
                                },
                            ]}
                            onPress={() => setSelectedDay(day)}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                { color: theme.foreground.white },
                                isSelected && {
                                  color: theme.background.dark,
                                  fontWeight: "700",
                                },
                                !isSelected &&
                                  isToday && {
                                    color: theme.primary.main,
                                    fontWeight: "700",
                                  },
                              ]}
                            >
                              {day}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: theme.background.darker },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.cancelText, { color: theme.foreground.gray }]}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: theme.primary.main },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleConfirm}
            >
              <Text
                style={[styles.confirmText, { color: theme.background.dark }]}
              >
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles() {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    card: {
      borderRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 20,
      width: "100%",
      maxWidth: 360,
    },
    calHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    calNavBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    calTitle: {
      fontSize: 17,
      fontWeight: "700",
    },
    calTitleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    yearGrid: {
      flexDirection: "column",
      marginBottom: 4,
    },
    yearRow: {
      flex: 1,
      flexDirection: "row",
    },
    yearCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    yearText: {
      fontSize: 15,
      fontWeight: "500",
    },
    weekRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      textAlign: "center",
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    grid: {
      flexDirection: "column",
    },
    gridRow: {
      flexDirection: "row",
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    dayText: {
      fontSize: 14,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    cancelText: {
      fontSize: 15,
      fontWeight: "600",
    },
    confirmBtn: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    confirmText: {
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
