import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import type { DayProgress } from '@/features/day-card/types';

/** All geometry is authored in this box, then scaled by the SVG viewBox. */
export const BOX = 44;
export const CENTER = BOX / 2;

/** Checkmark stroke length, measured for the draw-in animation. */
export const CHECK_PATH = 'M14 22.5 L19.5 28 L30 16.5';
export const CHECK_LENGTH = 24;

const ARC_SPRING = { damping: 18, stiffness: 120, mass: 0.7 } as const;
const MORPH_TIMING = { duration: 260 } as const;

export function useProgressRing(progress: DayProgress) {
  const { theme } = useUnistyles();
  const { size, strokeWidth } = theme.ring;

  /** Stroke is given in screen px, convert it into box units. */
  const stroke = (strokeWidth * BOX) / size;
  const radius = (BOX - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ratio = useDerivedValue(() => withSpring(progress.ratio, ARC_SPRING), [progress.ratio]);
  const complete = useDerivedValue(
    () => withTiming(progress.isComplete ? 1 : 0, MORPH_TIMING),
    [progress.isComplete],
  );

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ratio.value),
    stroke: interpolateColor(
      ratio.value,
      [0, 1],
      [theme.colors.progressStart, theme.colors.progressEnd],
    ),
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - complete.value),
  }));

  /* Fire once on the false -> true edge, not on every mount or re-render. */
  const wasComplete = useRef(progress.isComplete);

  useEffect(() => {
    if (progress.isComplete && !wasComplete.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    wasComplete.current = progress.isComplete;
  }, [progress.isComplete]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - complete.value,
    transform: [{ scale: interpolate(complete.value, [0, 1], [1, 0.6]) }],
  }));

  return { size, stroke, radius, circumference, arcProps, checkProps, labelStyle };
}
