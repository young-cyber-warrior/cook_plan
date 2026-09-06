import type { IngredientUnit, Unit } from '@/features/recipes/types';

const UNIT_LABELS: Record<Unit, string> = { g: 'г', ml: 'мл', pcs: 'шт' };

export const DEFAULT_UNIT: IngredientUnit = 'g';

export const INGREDIENT_UNITS: IngredientUnit[] = ['g', 'ml'];

export const GROCERY_UNITS: Unit[] = [...INGREDIENT_UNITS, 'pcs'];

export const unitLabel = (unit: Unit) => UNIT_LABELS[unit];

export const toIngredientUnit = (value: string | null): IngredientUnit =>
  INGREDIENT_UNITS.includes(value as IngredientUnit) ? (value as IngredientUnit) : DEFAULT_UNIT;

export const toGroceryUnit = (value: string | null): Unit =>
  GROCERY_UNITS.includes(value as Unit) ? (value as Unit) : DEFAULT_UNIT;
