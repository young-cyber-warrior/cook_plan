import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { macroSplit } from '@/features/day-card/lib/nutrition';
import type { Macros } from '@/features/day-card/types';

/** Bar segments and number columns share one order, so colours stay readable. */
const SEGMENTS = [
  { key: 'protein', label: 'Белки', color: '#5FBF8D' },
  { key: 'fat', label: 'Жиры', color: '#F0B357' },
  { key: 'carbs', label: 'Углеводы', color: '#6E86FF' },
] as const;

interface MacroBreakdownProps {
  macros: Macros;
}

/** Read-only protein/fat/carbs bar. Shared by the day card footer and the recipe card. */
export function MacroBreakdown({ macros }: MacroBreakdownProps) {
  const split = macroSplit(macros);

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        {SEGMENTS.map(segment => (
          <View
            key={segment.key}
            style={{
              height: '100%',
              backgroundColor: segment.color,
              width: `${split[segment.key] * 100}%`,
            }}
          />
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
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.progressTrack,
    overflow: 'hidden',
  },
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
