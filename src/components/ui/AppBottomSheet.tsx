import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AppBottomSheetRef {
  close: () => void;
  expand: () => void;
  snapToIndex: (index: number) => void;
}

export interface AppBottomSheetProps {
  /**
   * Snap points that control the sheet height.
   * Can be numbers (pixels) or strings (percentages), sorted from shortest to tallest.
   *
   * @example snapPoints={["50%", "85%"]}
   * @example snapPoints={[300, 600]}
   */
  snapPoints: (string | number)[];
  /**
   * Initial snap point index. Defaults to the last (tallest) snap point.
   * Ignored when `isOpen` is provided.
   */
  initialSnapIndex?: number;
  /**
   * Controlled open/close state. When provided, the sheet opens/closes
   * reactively. Use `onClose` to sync state when the user pans down.
   */
  isOpen?: boolean;
  /**
   * Called when the sheet is fully closed (dismissed by pan or backdrop tap).
   */
  onClose?: () => void;
  /**
   * Render children inside a scrollable container.
   * Useful when the content might overflow the sheet height.
   * Defaults to false (uses BottomSheetView).
   */
  scrollable?: boolean;
  /**
   * Skip any wrapper (BottomSheetView or BottomSheetScrollView) and render
   * children directly inside BottomSheet.
   * Use this when you need a mixed layout (e.g. fixed header + BottomSheetScrollView)
   * since BottomSheetScrollView must be a direct child of BottomSheet to work correctly.
   */
  noWrapper?: boolean;
  children?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(
  (
    {
      snapPoints,
      initialSnapIndex,
      isOpen,
      onClose,
      scrollable = false,
      noWrapper = false,
      children,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const sheetRef = useRef<BottomSheet>(null);

    // When isOpen is controlled, react to its changes
    useEffect(() => {
      if (isOpen === undefined) return;
      if (isOpen) {
        sheetRef.current?.snapToIndex(snapPoints.length - 1);
      } else {
        sheetRef.current?.close();
      }
    }, [isOpen, snapPoints.length]);

    // Expose imperative API via ref
    useImperativeHandle(ref, () => ({
      close: () => sheetRef.current?.close(),
      expand: () => sheetRef.current?.expand(),
      snapToIndex: (index: number) => sheetRef.current?.snapToIndex(index),
    }));

    const handleChange = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose?.();
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

    const resolvedInitialIndex =
      isOpen !== undefined
        ? -1 // start hidden; useEffect will open it
        : initialSnapIndex !== undefined
          ? initialSnapIndex
          : snapPoints.length - 1;

    const Content = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheet
        ref={sheetRef}
        index={resolvedInitialIndex}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleChange}
        backdropComponent={renderBackdrop}
        backgroundStyle={[
          styles.background,
          { backgroundColor: theme.background.darker },
        ]}
        handleIndicatorStyle={[
          styles.handle,
          { backgroundColor: theme.foreground.gray },
        ]}
      >
        {noWrapper ? (
          children
        ) : (
          <Content
            style={!scrollable ? styles.flex : undefined}
            contentContainerStyle={
              scrollable ? styles.scrollContent : undefined
            }
          >
            {children}
          </Content>
        )}
      </BottomSheet>
    );
  },
);

AppBottomSheet.displayName = "AppBottomSheet";

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

export default AppBottomSheet;
