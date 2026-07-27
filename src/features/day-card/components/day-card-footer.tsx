import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { dayMacros, macroSplit } from '@/features/day-card/lib/nutrition';
import type { Day } from '@/features/day-card/types';

/** Bar segments and number columns share one order, so colours stay readable. */
const SEGMENTS = [
  { key: 'protein', label: 'Белки', color: '#5FBF8D' },
  { key: 'fat', label: 'Жиры', color: '#F0B357' },
  { key: 'carbs', label: 'Углеводы', color: '#6E86FF' },
] as const;

interface DayCardFooterProps {
  day: Day;
}

/** Day totals: everything here recomputes from the meals above. */
export function DayCardFooter({ day }: DayCardFooterProps) {
  const macros = useMemo(() => dayMacros(day), [day]);
  const split = useMemo(() => macroSplit(macros), [macros]);

  return (
    <View style={styles.root}>
      <View style={styles.headline}>
        <Text style={styles.title}>Итого за день</Text>
        <Text style={styles.calories}>
          {macros.calories}
          <Text style={styles.unit}> ккал</Text>
        </Text>
      </View>

      <View style={styles.bar}>
        {SEGMENTS.map(segment => (
          <View key={segment.key} style={styles.segment(split[segment.key], segment.color)} />
        ))}
      </View>

      <View style={styles.columns}>
        {SEGMENTS.map(segment => (
          <View key={segment.key} style={styles.column}>
            <View style={styles.legend}>
              <View style={styles.dot(segment.color)} />
              <Text style={styles.label}>{segment.label}</Text>
            </View>
            <Text style={styles.value}>{macros[segment.key]} г</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    paddingVertical: theme.spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.backgroundElement,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  calories: {
    ...theme.typography.macroValue,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  unit: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.progressTrack,
    overflow: 'hidden',
  },
  /** Zero-share segments collapse to nothing instead of leaving a stub. */
  segment: (share: number, color: string) => ({
    flexGrow: share,
    flexBasis: 0,
    backgroundColor: color,
  }),
  columns: {
    flexDirection: 'row',
    gap: theme.spacing.three,
  },
  column: {
    flex: 1,
    gap: theme.spacing.one,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.one + theme.spacing.half,
  },
  dot: (color: string) => ({
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: color,
  }),
  label: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
  },
  value: {
    ...theme.typography.macroValue,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
}));
