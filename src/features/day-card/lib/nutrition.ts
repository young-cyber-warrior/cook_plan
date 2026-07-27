import type { Day, DayProgress, Macros, MacroSplit, Meal } from '@/features/day-card/types';

/** Calories per gram, used to weight the footer stacked bar. */
const KCAL_PER_GRAM = { protein: 4, fat: 9, carbs: 4 } as const;

export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, fat: 0, carbs: 0 };

const round = (value: number) => Math.round(value * 10) / 10;

export function scaleMacros(macros: Macros, factor: number): Macros {
  return {
    calories: Math.round(macros.calories * factor),
    protein: round(macros.protein * factor),
    fat: round(macros.fat * factor),
    carbs: round(macros.carbs * factor),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: round(a.protein + b.protein),
    fat: round(a.fat + b.fat),
    carbs: round(a.carbs + b.carbs),
  };
}

/** Empty slot contributes nothing. */
export function mealMacros(meal: Meal): Macros {
  if (!meal.recipe) return EMPTY_MACROS;

  return scaleMacros(meal.recipe.macrosPerServing, meal.servings);
}

export function dayMacros(day: Day): Macros {
  return day.meals.reduce<Macros>((acc, meal) => addMacros(acc, mealMacros(meal)), EMPTY_MACROS);
}

export function isMealFilled(meal: Meal): boolean {
  return meal.recipe !== null;
}

export function dayProgress(day: Day): DayProgress {
  const total = day.meals.length;
  const filled = day.meals.filter(isMealFilled).length;

  return {
    filled,
    total,
    ratio: total === 0 ? 0 : filled / total,
    isComplete: total > 0 && filled === total,
  };
}

/**
 * Macro shares of total energy, normalised to sum 1.
 * Falls back to zeros so the bar renders empty instead of NaN-wide.
 */
export function macroSplit(macros: Macros): MacroSplit {
  const protein = macros.protein * KCAL_PER_GRAM.protein;
  const fat = macros.fat * KCAL_PER_GRAM.fat;
  const carbs = macros.carbs * KCAL_PER_GRAM.carbs;
  const total = protein + fat + carbs;

  if (total === 0) return { protein: 0, fat: 0, carbs: 0 };

  return { protein: protein / total, fat: fat / total, carbs: carbs / total };
}
