import { memo } from 'react';
import { StyleSheet as RNStyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import {
  BOX,
  CENTER,
  CHECK_LENGTH,
  CHECK_PATH,
  useProgressRing,
} from '@/features/day-card/hooks/use-progress-ring';
import type { DayProgress } from '@/features/day-card/types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Static styles for animated views live in the plain RN StyleSheet:
 * a Unistyles style inside a Reanimated style array is rejected at runtime.
 */
const animatable = RNStyleSheet.create({
  labelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

interface ProgressRingProps {
  progress: DayProgress;
}

/**
 * Header ring: arc fills as meals get a recipe, then the `2/3` label
 * swaps for a drawn-in checkmark once the day is complete.
 */
export const ProgressRing = memo(function ProgressRing({ progress }: ProgressRingProps) {
  const { theme } = useUnistyles();
  const { size, stroke, radius, circumference, arcProps, checkProps, labelStyle } =
    useProgressRing(progress);

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          stroke={theme.colors.progressTrack}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="none"
          /* Start the arc at 12 o'clock instead of 3 o'clock. */
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          animatedProps={arcProps}
        />
        <AnimatedPath
          d={CHECK_PATH}
          stroke={theme.colors.success}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={checkProps}
        />
      </Svg>

      <Animated.View style={[animatable.labelWrap, labelStyle]} pointerEvents="none">
        <Text style={styles.label} allowFontScaling={false}>
          {progress.filled}/{progress.total}
        </Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...theme.typography.ringValue,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
}));
