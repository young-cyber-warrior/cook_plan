import type { IngredientUnit } from '@/features/recipes/types';

const UNIT_LABELS: Record<IngredientUnit, string> = { g: 'г', ml: 'мл' };

export const DEFAULT_UNIT: IngredientUnit = 'g';

export const INGREDIENT_UNITS = Object.keys(UNIT_LABELS) as IngredientUnit[];

export const unitLabel = (unit: IngredientUnit) => UNIT_LABELS[unit];

export const toIngredientUnit = (value: string | null): IngredientUnit =>
  value !== null && value in UNIT_LABELS ? (value as IngredientUnit) : DEFAULT_UNIT;
