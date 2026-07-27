import { memo, useCallback, useState } from 'react';
import { TextInput, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { MealActions } from '@/features/day-card/components/meal-actions';
import { RecipeCollage } from '@/features/day-card/components/recipe-collage';
import { ServingsStepper } from '@/features/day-card/components/servings-stepper';
import { isMealFilled } from '@/features/day-card/lib/nutrition';
import type { Meal } from '@/features/day-card/types';

interface MealRowProps {
  meal: Meal;
  onServingsChange: (mealId: string, servings: number) => void;
  onPickRecipe: (meal: Meal) => void;
  onRenameMeal: (mealId: string, title: string) => void;
  onRemoveMeal: (mealId: string) => void;
}

export const MealRow = memo(function MealRow({
  meal,
  onServingsChange,
  onPickRecipe,
  onRenameMeal,
  onRemoveMeal,
}: MealRowProps) {
  const { theme } = useUnistyles();
  const filled = isMealFilled(meal);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meal.title);

  const onEditToggle = useCallback(() => {
    if (editing) {
      const next = draft.trim();
      onRenameMeal(meal.id, next.length > 0 ? next : meal.title);
      setEditing(false);
      return;
    }

    setDraft(meal.title);
    setEditing(true);
  }, [editing, draft, meal.id, meal.title, onRenameMeal]);

  return (
    <View style={styles.root(filled)}>
      <View style={styles.titleRow}>
        <View style={styles.info}>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={onEditToggle}
              placeholder={meal.title}
              placeholderTextColor={theme.colors.textMuted}
              selectionColor={theme.colors.accent}
              autoFocus
              returnKeyType="done"
            />
          ) : (
            <Text style={styles.title} numberOfLines={1}>
              {meal.title}
            </Text>
          )}
          <Text style={styles.subtitle(filled)} numberOfLines={1}>
            {meal.recipe ? meal.recipe.title : 'Рецепт не выбран'}
          </Text>
        </View>

        {meal.recipe ? <RecipeCollage photos={meal.recipe.photos} /> : null}
      </View>

      <View style={styles.controlRow}>
        <MealActions
          editing={editing}
          onDelete={() => onRemoveMeal(meal.id)}
          onEditToggle={onEditToggle}
          onPickMenu={() => onPickRecipe(meal)}
        />

        <ServingsStepper
          value={meal.servings}
          onChange={servings => onServingsChange(meal.id, servings)}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create(theme => ({
  root: (filled: boolean) => ({
    gap: theme.spacing.three,
    paddingLeft: theme.spacing.four - 3,
    paddingRight: theme.spacing.four,
    paddingVertical: theme.spacing.three + theme.spacing.one,
    borderLeftWidth: 3,
    borderLeftColor: filled ? theme.colors.accent : 'transparent',
    backgroundColor: filled ? theme.colors.mealFilled : 'transparent',
  }),
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  info: {
    flex: 1,
    gap: theme.spacing.half,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  input: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    padding: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  subtitle: (filled: boolean) => ({
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: filled ? theme.colors.textSecondary : theme.colors.textMuted,
  }),
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
}));
