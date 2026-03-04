import React, { useEffect, useRef, useState } from "react";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CLOCK_SIZE = 264;
const CENTER = CLOCK_SIZE / 2;
const OUTER_R = 104; // hours 1-12
const INNER_R = 68; // hours 13-24 (inner ring)
const NUM_SIZE = 34; // diameter of hour number bubbles
const MIN_CELL = 22; // diameter of minute number cells (60 packed around ring)
const MINUTE_R = CENTER - MIN_CELL / 2 - 2; // keep minute numbers close to edge

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert an angle (degrees, 0 = 12 o'clock, clockwise) + radius → absolute x,y */
function polarToXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

/** Angle for an hour (1-12 outer, 13-24/0 inner, same angular layout) */
function hourAngle(h: number) {
  return ((h % 12) / 12) * 360; // 0 and 12 both → 0°
}

/** Angle for a minute (0-59) */
function minuteAngle(m: number) {
  return (m / 60) * 360;
}

/** Clock-face angle (0-360, 0=12 o'clock) from a Cartesian offset from center */
function xyToAngle(dx: number, dy: number): number {
  let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (a < 0) a += 360;
  if (a >= 360) a -= 360;
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Straight hand drawn from the clock center to a tip point */
function ClockHand({
  x2,
  y2,
  color,
}: {
  x2: number;
  y2: number;
  color: string;
}) {
  const dx = x2 - CENTER;
  const dy = y2 - CENTER;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (CENTER + x2) / 2;
  const cy = (CENTER + y2) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: cx - length / 2,
        top: cy - 1.5,
        width: length,
        height: 3,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TimePickerModalProps {
  visible: boolean;
  /** Current hour 0-23 */
  hour: number;
  /** Current minute 0-59 */
  minute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TimePickerModal({
  visible,
  hour,
  minute,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<"hour" | "minute">("hour");
  const [selHour, setSelHour] = useState(hour);
  const [selMin, setSelMin] = useState(minute);

  // Refs so gesture callbacks always see the latest state without stale closures
  const stepRef = useRef(step);
  const selHourRef = useRef(selHour);
  const selMinRef = useRef(selMin);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    selHourRef.current = selHour;
  }, [selHour]);
  useEffect(() => {
    selMinRef.current = selMin;
  }, [selMin]);

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setSelHour(hour);
      setSelMin(minute);
      setStep("hour");
    }
  }, [visible]);

  const handleConfirm = () => onConfirm(selHour, selMin);

  // ── Clock drag / tap ────────────────────────────────
  /**
   * Called on touch start, move and end.
   * x/y are coordinates relative to the clock face view.
   * isEnd=true triggers auto-advance from hour → minute step.
   */
  const handleClockTouch = (x: number, y: number, isEnd: boolean) => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Ignore the center dot area and touches outside the clock circle
    if (dist < 10 || dist > CENTER + 14) return;

    const angleDeg = xyToAngle(dx, dy);
    const currentStep = stepRef.current;

    if (currentStep === "hour") {
      const threshold = (INNER_R + OUTER_R) / 2; // ~86px — ring boundary
      const isInner = dist < threshold;
      const rawSlot = Math.round(angleDeg / 30) % 12; // 0-11

      let newHour: number;
      if (isInner) {
        const innerMap = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        newHour = innerMap[rawSlot];
      } else {
        newHour = rawSlot === 0 ? 12 : rawSlot;
      }

      setSelHour(newHour);
      selHourRef.current = newHour;

      if (isEnd) {
        setTimeout(() => setStep("minute"), 150);
      }
    } else {
      const rawMin = Math.round(angleDeg / 6) % 60;
      setSelMin(rawMin);
      selMinRef.current = rawMin;
    }
  };

  // minDistance(0) → activates on the first touch frame (handles taps too)
  const clockGesture = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onStart((e) => handleClockTouch(e.x, e.y, false))
    .onUpdate((e) => handleClockTouch(e.x, e.y, false))
    .onEnd((e) => handleClockTouch(e.x, e.y, true));

  // ── Derived ─────────────────────────────────────────
  const handAngle = step === "hour" ? hourAngle(selHour) : minuteAngle(selMin);
  const handR =
    step === "hour"
      ? selHour === 0 || selHour > 12
        ? INNER_R
        : OUTER_R
      : MINUTE_R;
  const handTip = polarToXY(handAngle, handR);

  const styles = makeStyles();
  const primary = theme.primary.main;
  const bgDarker = theme.background.darker;
  const bgAccent = theme.background.accent;
  const white = theme.foreground.white;
  const gray = theme.foreground.gray;
  const dark = theme.background.dark;

  // ── Hour numbers ───────────────────────────────────
  const outerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const innerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

  // ── Pad display ────────────────────────────────────
  const hh = String(selHour).padStart(2, "0");
  const mm = String(selMin).padStart(2, "0");

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: bgAccent }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={[styles.headerLabel, { color: gray }]}>
                Select Time
              </Text>
              {/* Digital display */}
              <View style={styles.timeDisplay}>
                <Pressable onPress={() => setStep("hour")}>
                  <Text
                    style={[
                      styles.timeSegment,
                      { color: step === "hour" ? primary : white },
                    ]}
                  >
                    {hh}
                  </Text>
                </Pressable>
                <Text style={[styles.timeColon, { color: white }]}>:</Text>
                <Pressable onPress={() => setStep("minute")}>
                  <Text
                    style={[
                      styles.timeSegment,
                      { color: step === "minute" ? primary : white },
                    ]}
                  >
                    {mm}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.stepHint, { color: gray }]}>
                {step === "hour" ? "Hour" : "Minute"}
              </Text>
            </View>

            {/* ── Clock face (drag + tap via GestureDetector) ── */}
            <GestureDetector gesture={clockGesture}>
              <View
                style={[
                  styles.clockFace,
                  {
                    width: CLOCK_SIZE,
                    height: CLOCK_SIZE,
                    backgroundColor: bgDarker,
                  },
                ]}
              >
                {/* Clock hand */}
                <ClockHand x2={handTip.x} y2={handTip.y} color={primary} />

                {/* Center dot */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.centerDot,
                    {
                      backgroundColor: primary,
                      left: CENTER - 5,
                      top: CENTER - 5,
                    },
                  ]}
                />

                {/* ── Hour mode ── */}
                {step === "hour" && (
                  <>
                    {/* Outer ring: 12, 1-11 */}
                    {outerHours.map((h) => {
                      const angle = hourAngle(h);
                      const pos = polarToXY(angle, OUTER_R);
                      const isSelected =
                        selHour === h || (h === 12 && selHour === 12);
                      return (
                        <View
                          key={`oh-${h}`}
                          pointerEvents="none"
                          style={[
                            styles.numCell,
                            {
                              left: pos.x - NUM_SIZE / 2,
                              top: pos.y - NUM_SIZE / 2,
                              width: NUM_SIZE,
                              height: NUM_SIZE,
                              borderRadius: NUM_SIZE / 2,
                              backgroundColor: isSelected
                                ? primary
                                : "transparent",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.numText,
                              {
                                color: isSelected ? dark : white,
                                fontWeight: isSelected ? "700" : "400",
                              },
                            ]}
                          >
                            {h}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Inner ring: 0, 13-23 */}
                    {innerHours.map((h) => {
                      const angle = hourAngle(h);
                      const pos = polarToXY(angle, INNER_R);
                      const isSelected = selHour === h;
                      return (
                        <View
                          key={`ih-${h}`}
                          pointerEvents="none"
                          style={[
                            styles.numCell,
                            {
                              left: pos.x - NUM_SIZE / 2,
                              top: pos.y - NUM_SIZE / 2,
                              width: NUM_SIZE,
                              height: NUM_SIZE,
                              borderRadius: NUM_SIZE / 2,
                              backgroundColor: isSelected
                                ? primary
                                : "transparent",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.numTextSmall,
                              {
                                color: isSelected ? dark : gray,
                                fontWeight: isSelected ? "700" : "400",
                              },
                            ]}
                          >
                            {h === 0 ? "00" : h}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                )}

                {/* ── Minute mode: all 60 numbers ── */}
                {step === "minute" &&
                  Array.from({ length: 60 }, (_, m) => {
                    const pos = polarToXY(minuteAngle(m), MINUTE_R);
                    const isSelected = selMin === m;
                    const isMajor = m % 5 === 0;
                    return (
                      <View
                        key={`m-${m}`}
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          left: pos.x - MIN_CELL / 2,
                          top: pos.y - MIN_CELL / 2,
                          width: MIN_CELL,
                          height: MIN_CELL,
                          borderRadius: MIN_CELL / 2,
                          backgroundColor: isSelected ? primary : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isMajor ? (
                          <Text
                            style={{
                              fontSize: 11,
                              color: isSelected ? dark : white,
                              fontWeight: "600",
                            }}
                          >
                            {String(m).padStart(2, "0")}
                          </Text>
                        ) : (
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: isSelected ? dark : gray,
                            }}
                          />
                        )}
                      </View>
                    );
                  })}

                {/* Selection tip glow — sized to match the active mode's cell */}
                {(() => {
                  const tipSize = step === "minute" ? MIN_CELL : NUM_SIZE;
                  return (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        width: tipSize,
                        height: tipSize,
                        borderRadius: tipSize / 2,
                        backgroundColor: primary + "44",
                        left: handTip.x - tipSize / 2,
                        top: handTip.y - tipSize / 2,
                      }}
                    />
                  );
                })()}
              </View>
            </GestureDetector>

            {/* ── Actions ── */}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: bgDarker },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: gray }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  { backgroundColor: primary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleConfirm}
              >
                <Text style={[styles.confirmText, { color: dark }]}>
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
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
      backgroundColor: "rgba(0,0,0,0.6)",
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
      alignItems: "center",
      gap: 20,
    },
    header: {
      width: "100%",
      alignItems: "center",
      gap: 4,
    },
    headerLabel: {
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    timeDisplay: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    timeSegment: {
      fontSize: 48,
      fontWeight: "700",
      letterSpacing: 2,
      paddingHorizontal: 6,
      minWidth: 70,
      textAlign: "center",
    },
    timeColon: {
      fontSize: 40,
      fontWeight: "300",
      marginBottom: 4,
    },
    stepHint: {
      fontSize: 12,
      fontWeight: "500",
      letterSpacing: 0.5,
    },
    clockFace: {
      borderRadius: CLOCK_SIZE / 2,
      position: "relative",
      overflow: "hidden",
    },
    centerDot: {
      position: "absolute",
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    numCell: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    numText: {
      fontSize: 14,
    },
    numTextSmall: {
      fontSize: 11,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
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
