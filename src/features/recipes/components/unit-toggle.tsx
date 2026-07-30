import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { IngredientUnit } from '@/features/recipes/types';

const OPTIONS: { unit: IngredientUnit; label: string }[] = [
  { unit: 'g', label: 'г' },
  { unit: 'ml', label: 'мл' },
];

export function unitLabel(unit: IngredientUnit): string {
  return OPTIONS.find(option => option.unit === unit)?.label ?? unit;
}

interface UnitToggleProps {
  value: IngredientUnit;
  onChange: (unit: IngredientUnit) => void;
}

/** г/мл segmented picker for an ingredient's amount. */
export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <View style={styles.root}>
      {OPTIONS.map(option => (
        <Pressable
          key={option.unit}
          style={styles.option(option.unit === value)}
          hitSlop={4}
          onPress={() => onChange(option.unit)}>
          <Text style={styles.label(option.unit === value)}>{option.label}</Text>
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
