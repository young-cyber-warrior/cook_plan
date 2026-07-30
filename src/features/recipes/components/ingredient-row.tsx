import { memo } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { TrashIcon } from '@/features/day-card/components/icons';
import { UnitToggle, unitLabel } from '@/features/recipes/components/unit-toggle';
import type { Ingredient } from '@/features/recipes/types';

const DANGER = '#E5484D';

interface IngredientRowProps {
  ingredient: Ingredient;
  editing: boolean;
  onChange: (ingredient: Ingredient) => void;
  onRemove: () => void;
}

export const IngredientRow = memo(function IngredientRow({
  ingredient,
  editing,
  onChange,
  onRemove,
}: IngredientRowProps) {
  const { theme } = useUnistyles();

  if (!editing) {
    return (
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {ingredient.name}
        </Text>
        <Text style={styles.amount}>
          {ingredient.amount} {unitLabel(ingredient.unit)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.nameInput}
        value={ingredient.name}
        onChangeText={name => onChange({ ...ingredient, name })}
        placeholder="Название"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
      />

      <TextInput
        style={styles.amountInput}
        value={String(ingredient.amount)}
        onChangeText={text => onChange({ ...ingredient, amount: Number(text.replace(/\D/g, '')) || 0 })}
        keyboardType="number-pad"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
      />

      <UnitToggle value={ingredient.unit} onChange={unit => onChange({ ...ingredient, unit })} />

      <Pressable style={({ pressed }) => styles.remove(pressed)} hitSlop={8} onPress={onRemove}>
        <TrashIcon color={DANGER} size={16} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.two,
    paddingVertical: theme.spacing.two,
  },
  name: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  amount: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  nameInput: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    flex: 1,
    padding: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  amountInput: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    width: 40,
    padding: 0,
    textAlign: 'right',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  remove: (pressed: boolean) => ({
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: `${DANGER}${pressed ? '33' : '22'}`,
  }),
}));
