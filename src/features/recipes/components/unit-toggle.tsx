import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { INGREDIENT_UNITS, unitLabel } from '@/features/recipes/lib/units';
import type { Unit } from '@/features/recipes/types';

interface UnitToggleProps<T extends Unit> {
  value: T;
  /** Which units this screen offers; «шт» is only for the grocery list. */
  units?: readonly T[];
  onChange: (unit: T) => void;
}

/** Segmented picker for an amount's unit. */
export function UnitToggle<T extends Unit>({ value, units, onChange }: UnitToggleProps<T>) {
  const options = units ?? (INGREDIENT_UNITS as readonly Unit[] as readonly T[]);

  return (
    <View style={styles.root}>
      {options.map(unit => (
        <Pressable
          key={unit}
          style={styles.option(unit === value)}
          hitSlop={4}
          onPress={() => onChange(unit)}>
          <Text style={styles.label(unit === value)}>{unitLabel(unit)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    flexDirection: 'row',
    padding: theme.spacing.half,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.badgeBackground,
  },
  option: (active: boolean) => ({
    paddingHorizontal: theme.spacing.two,
    paddingVertical: theme.spacing.half,
    borderRadius: theme.radius.full,
    backgroundColor: active ? theme.colors.accent : 'transparent',
  }),
  label: (active: boolean) => ({
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: active ? '#FFFFFF' : theme.colors.textSecondary,
  }),
}));
