import type { ReactNode } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { DayCardHeader } from '@/features/day-card/components/day-card-header';
import { useCollapsible } from '@/features/day-card/hooks/use-collapsible';
import type { Day, PersonalLayer } from '@/features/day-card/types';

/**
 * Static styles for animated views live in the plain RN StyleSheet:
 * a Unistyles style inside a Reanimated style array is rejected at runtime.
 */
const animatable = RNStyleSheet.create({
  collapsible: { overflow: 'hidden' },
});

interface DayCardProps {
  day: Day;
  personal: PersonalLayer;
  /** Meal list and footer, revealed by the accordion. */
  children?: ReactNode;
}

/** Tapping anywhere on the card toggles the accordion; cards always start collapsed. */
export function DayCard({ day, personal, children }: DayCardProps) {
  const { toggle, onContentLayout, containerStyle } = useCollapsible(false);

  return (
    /* Shadow lives on the outer view: clipping it together with `overflow` drops it on iOS. */
    <View style={styles.shadow}>
      <View style={styles.clip}>
        <Pressable onPress={toggle} style={({ pressed }) => styles.pressable(pressed)}>
          <DayCardHeader day={day} personal={personal} />
        </Pressable>

        <Animated.View style={[animatable.collapsible, containerStyle]}>
          <View style={styles.measure} onLayout={onContentLayout}>
            {children}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  shadow: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  clip: {
    borderRadius: theme.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
  },
  pressable: (pressed: boolean) => ({
    backgroundColor: pressed ? theme.colors.backgroundElement : 'transparent',
  }),
  /** Off-flow so its natural height stays measurable while collapsed. */
  measure: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
}));
