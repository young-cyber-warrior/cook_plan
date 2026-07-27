import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AddMealRow } from '@/features/day-card/components/add-meal-row';
import { MealRow } from '@/features/day-card/components/meal-row';
import type { Meal } from '@/features/day-card/types';

interface MealListProps {
  meals: Meal[];
  onServingsChange: (mealId: string, servings: number) => void;
  onPickRecipe: (meal: Meal) => void;
  onRenameMeal: (mealId: string, title: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onAddMeal: () => void;
}

/** Accordion body. Slots are separated by a hairline, as sketched. */
export function MealList({
  meals,
  onServingsChange,
  onPickRecipe,
  onRenameMeal,
  onRemoveMeal,
  onAddMeal,
}: MealListProps) {
  return (
    <View>
      {meals.map((meal, index) => (
        <Fragment key={meal.id}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <MealRow
            meal={meal}
            onServingsChange={onServingsChange}
            onPickRecipe={onPickRecipe}
            onRenameMeal={onRenameMeal}
            onRemoveMeal={onRemoveMeal}
          />
        </Fragment>
      ))}
      <View style={styles.divider} />
      <AddMealRow onPress={onAddMeal} />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: theme.spacing.four,
    backgroundColor: theme.colors.divider,
  },
}));
