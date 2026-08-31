import type {
  Day,
  DayExtra,
  DayProgress,
  Macros,
  MacroSplit,
  Meal,
  MealAdjustment,
  PersonalLayer,
} from '@/features/day-card/types';

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

export const EMPTY_LAYER: PersonalLayer = { adjustmentByMealId: new Map(), extras: [] };

/** Personal servings win over the family plan; `null` falls back to it. */
export function effectiveServings(meal: Meal, adjustment?: MealAdjustment): number {
  return adjustment?.servings ?? meal.servings;
}

/** Empty slot and personally skipped meal both contribute nothing. */
export function mealMacros(meal: Meal, adjustment?: MealAdjustment): Macros {
  if (!meal.recipe || adjustment?.skipped) return EMPTY_MACROS;

  return scaleMacros(meal.recipe.macrosPerServing, effectiveServings(meal, adjustment));
}

export function extrasMacros(extras: DayExtra[]): Macros {
  return extras.reduce<Macros>((acc, extra) => addMacros(acc, extra.macros), EMPTY_MACROS);
}

export function dayMacros(day: Day, personal: PersonalLayer = EMPTY_LAYER): Macros {
  const planned = day.meals.reduce<Macros>(
    (acc, meal) => addMacros(acc, mealMacros(meal, personal.adjustmentByMealId.get(meal.id))),
    EMPTY_MACROS,
  );

  return addMacros(planned, extrasMacros(personal.extras));
}

/** Calorie gap between the personal day and the untouched family plan. */
export function personalDelta(day: Day, personal: PersonalLayer): number {
  return dayMacros(day, personal).calories - dayMacros(day).calories;
}

export function hasPersonalEdits(day: Day, personal: PersonalLayer): boolean {
  if (personal.extras.length > 0) return true;

  return day.meals.some(meal => personal.adjustmentByMealId.has(meal.id));
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
 * Macro shares by weight, normalised to sum 1: a segment is as wide as its grams
 * next to the other two, so the bar matches the numbers printed under it.
 * Falls back to zeros so the bar renders empty instead of NaN-wide.
 */
export function macroSplit(macros: Macros): MacroSplit {
  const total = macros.protein + macros.fat + macros.carbs;

  if (total === 0) return { protein: 0, fat: 0, carbs: 0 };

  return {
    protein: macros.protein / total,
    fat: macros.fat / total,
    carbs: macros.carbs / total,
  };
}
