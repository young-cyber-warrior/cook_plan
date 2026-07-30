import { Pressable, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PlusIcon } from '@/features/day-card/components/icons';
import { IngredientRow } from '@/features/recipes/components/ingredient-row';
import type { Ingredient } from '@/features/recipes/types';

interface IngredientListProps {
  ingredients: Ingredient[];
  editing: boolean;
  onChange: (id: string, patch: Partial<Ingredient>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function IngredientList({
  ingredients,
  editing,
  onChange,
  onRemove,
  onAdd,
}: IngredientListProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Ингредиенты</Text>

      {ingredients.map(ingredient => (
        <IngredientRow
          key={ingredient.id}
          ingredient={ingredient}
          editing={editing}
          onChange={patch => onChange(ingredient.id, patch)}
          onRemove={() => onRemove(ingredient.id)}
        />
      ))}

      {editing ? (
        <Pressable style={({ pressed }) => styles.add(pressed)} onPress={onAdd}>
          <PlusIcon color={theme.colors.accent} size={16} />
          <Text style={styles.addLabel}>Добавить ингредиент</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.one,
  },
  heading: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  add: (pressed: boolean) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.one,
    marginTop: theme.spacing.one,
    paddingVertical: theme.spacing.two,
    opacity: pressed ? 0.7 : 1,
  }),
  addLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
}));
