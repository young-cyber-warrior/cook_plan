import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const TIMING = { duration: 260, easing: Easing.out(Easing.cubic) } as const;

/** Recipe card's own expand/collapse — kept independent of the day-card feature. */
export function useAccordion() {
  const [expanded, setExpanded] = useState(false);

  const contentHeight = useSharedValue(0);
  const progress = useDerivedValue(() => withTiming(expanded ? 1 : 0, TIMING), [expanded]);

  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      contentHeight.value = event.nativeEvent.layout.height;
    },
    [contentHeight],
  );

  const containerStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * progress.value,
    opacity: progress.value,
  }));

  const toggle = useCallback(() => setExpanded(value => !value), []);

  return { expanded, toggle, onContentLayout, containerStyle };
}
