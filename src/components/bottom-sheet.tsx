import { useEffect } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet as RNStyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';

/** A Unistyles style inside a Reanimated style array is rejected at runtime. */
const animatable = RNStyleSheet.create({
  grabber: { height: 4, borderRadius: 999 },
});

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  /** Rendered above the scroll view, inside the draggable zone — grows how much of the sheet is swipeable. */
  header?: ReactNode;
}

const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_VELOCITY = 800;

/**
 * No @gorhom/bottom-sheet in the project — drag-to-dismiss is hand-rolled on Gesture Handler +
 * Reanimated. The drag is scoped to the handle bar, not the whole sheet: making it work across
 * the scrollable content too means arbitrating the pan gesture against the ScrollView's own
 * native gesture, which gets fragile fast without a dedicated library. Handle-only is the
 * reliable trade-off.
 */
export function BottomSheet({ visible, onClose, header, children }: BottomSheetProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const translateY = useSharedValue(windowHeight);
  const grabbed = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : windowHeight, { duration: 260 });
  }, [visible, windowHeight, translateY]);

  const dismiss = () => {
    translateY.value = withTiming(windowHeight, { duration: 220 });
    onClose();
  };

  const dragHandle = Gesture.Pan()
    .onBegin(() => {
      grabbed.value = withTiming(1, { duration: 120 });
    })
    .onUpdate(event => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onFinalize(() => {
      grabbed.value = withTiming(0, { duration: 150 });
    })
    .onEnd(event => {
      const shouldDismiss =
        event.translationY > windowHeight * DISMISS_DISTANCE_RATIO || event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        translateY.value = withTiming(windowHeight, { duration: 200 });
        scheduleOnRN(onClose);
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const grabberStyle = useAnimatedStyle(() => ({
    width: interpolate(grabbed.value, [0, 1], [36, 56]),
    backgroundColor: interpolateColor(grabbed.value, [0, 1], [theme.colors.cardBorder, theme.colors.accent]),
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.select({ ios: 'padding', default: undefined })}>
          <Pressable style={styles.backdrop} onPress={dismiss} />

          <Animated.View style={sheetStyle}>
            <View
              style={[
                styles.sheet,
                {
                  maxHeight: windowHeight - insets.top - theme.spacing.three,
                  paddingBottom: insets.bottom + theme.spacing.three,
                },
              ]}>
              <GestureDetector gesture={dragHandle}>
                <View style={styles.handleArea}>
                  <View style={styles.grabberRow}>
                    <Animated.View style={[animatable.grabber, grabberStyle]} />
                  </View>
                  {header}
                </View>
              </GestureDetector>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {children}
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.5)',
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.four,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  handleArea: {
    paddingBottom: theme.spacing.two,
  },
  grabberRow: {
    alignItems: 'center',
    paddingVertical: theme.spacing.two,
  },
}));
