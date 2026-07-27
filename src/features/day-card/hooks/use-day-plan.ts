import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';

import type { Day, MealCategory, Recipe } from '@/features/day-card/types';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;
export const DEFAULT_SERVINGS = 2;

const clampServings = (value: number) =>
  Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));

/** Single source of truth for one day card. Swap for a store once the API lands. */
export function useDayPlan(initial: Day) {
  const [day, setDay] = useState(initial);

  const actions = useMemo(
    () => ({
      setServings: (mealId: string, servings: number) =>
        setDay(current => ({
          ...current,
          meals: current.meals.map(meal =>
            meal.id === mealId ? { ...meal, servings: clampServings(servings) } : meal,
          ),
        })),

      attachRecipe: (mealId: string, recipe: Recipe) => {
        /* Medium on attach, light on detach: adding is the heavier action. */
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setDay(current => ({
          ...current,
          meals: current.meals.map(meal => (meal.id === mealId ? { ...meal, recipe } : meal)),
        }));
      },

      detachRecipe: (mealId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setDay(current => ({
          ...current,
          meals: current.meals.map(meal =>
            meal.id === mealId ? { ...meal, recipe: null } : meal,
          ),
        }));
      },

      renameMeal: (mealId: string, title: string) =>
        setDay(current => ({
          ...current,
          meals: current.meals.map(meal => (meal.id === mealId ? { ...meal, title } : meal)),
        })),

      addMeal: (title: string, category: MealCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setDay(current => ({
          ...current,
          meals: [
            ...current.meals,
            {
              id: `m-${Date.now()}`,
              title,
              category,
              servings: DEFAULT_SERVINGS,
              recipe: null,
            },
          ],
        }));
      },

      removeMeal: (mealId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setDay(current => ({
          ...current,
          meals: current.meals.filter(meal => meal.id !== mealId),
        }));
      },
    }),
    [],
  );

  return { day, ...actions };
}
