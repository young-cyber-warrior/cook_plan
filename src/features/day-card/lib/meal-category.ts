import type { MealCategory } from '@/features/day-card/types';

const MEAL_CATEGORIES: readonly MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const toMealCategory = (value: string | null | undefined): MealCategory | null =>
  MEAL_CATEGORIES.find(category => category === value) ?? null;
