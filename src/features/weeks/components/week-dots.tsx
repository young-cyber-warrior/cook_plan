import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

/** A Unistyles style inside a Reanimated style array is rejected at runtime. */
const animatable = RNStyleSheet.create({
  dot: { height: 6, borderRadius: 4 },
});

interface WeekDotsProps {
  count: number;
  /** Horizontal pager offset in px — dots follow it on the UI thread, immune to JS stalls. */
  scrollX: SharedValue<number>;
  pageWidth: number;
  onSelect: (index: number) => void;
}

function Dot({
  index,
  scrollX,
  pageWidth,
  onSelect,
}: { index: number } & Omit<WeekDotsProps, 'count'>) {
  const { theme } = useUnistyles();

  const style = useAnimatedStyle(() => {
    const distance = Math.min(Math.abs(scrollX.value / pageWidth - index), 1);
    const activation = 1 - distance;
    return {
      width: 6 + 10 * activation,
      backgroundColor: interpolateColor(
        activation,
        [0, 1],
        [theme.colors.backgroundSelected, theme.colors.accent],
      ),
    };
  });

  return (
    <Pressable hitSlop={8} accessibilityLabel={`Неделя ${index + 1}`} onPress={() => onSelect(index)}>
      <Animated.View style={[animatable.dot, style]} />
    </Pressable>
  );
}

/** Pager indicator; the switching affordance only exists once there is something to switch to. */
export function WeekDots({ count, scrollX, pageWidth, onSelect }: WeekDotsProps) {
  if (count <= 1) return null;

  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        <Dot key={index} index={index} scrollX={scrollX} pageWidth={pageWidth} onSelect={onSelect} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.two,
    paddingTop: theme.spacing.three,
  },
}));
