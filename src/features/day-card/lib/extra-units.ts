import { scaleMacros } from '@/features/day-card/lib/nutrition';
import { servingsWord } from '@/features/day-card/lib/servings';
import type { DayExtra, Macros } from '@/features/day-card/types';
import { toIngredientUnit, unitLabel } from '@/features/recipes/lib/units';

/** A recipe eaten on top of the plan is counted in servings, not grams. */
export const SERVING_UNIT = 'serving';

export const isServingExtra = (extra: DayExtra) => extra.unit === SERVING_UNIT;

/**
 * Macros of the same food at another serving count. The row stores the total,
 * so one serving is derived back out of it before scaling.
 */
export function servingMacros(extra: DayExtra, servings: number): Macros {
  if (extra.amount <= 0) return extra.macros;

  return scaleMacros(extra.macros, servings / extra.amount);
}

export function extraAmountLabel(extra: DayExtra): string {
  if (extra.unit === SERVING_UNIT) return `${extra.amount} ${servingsWord(extra.amount)}`;

  return `${extra.amount} ${unitLabel(toIngredientUnit(extra.unit))}`;
}
