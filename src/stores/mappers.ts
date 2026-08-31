import { toMealCategory } from '@/features/day-card/lib/meal-category';
import { scaleMacros } from '@/features/day-card/lib/nutrition';
import { DEFAULT_SERVINGS } from '@/features/day-card/lib/servings';
import type {
  DayExtra,
  Recipe as DayCardRecipe,
  Meal,
  MealAdjustment,
  MealCategory,
} from '@/features/day-card/types';
import type { GroceryItem } from '@/features/grocery/types';
import { toMacrosStatus } from '@/features/recipes/lib/macros-status';
import { toIngredientUnit } from '@/features/recipes/lib/units';
import type { Category, Ingredient, Recipe } from '@/features/recipes/types';
import type {
  CategoryRow,
  DayExtraRow,
  GroceryItemRow,
  MealAdjustmentRow,
  MealRow,
  RecipeIngredientRow,
  RecipeRow,
} from '@/sync/schema';

export const isFilledIngredient = (ingredient: Ingredient) =>
  ingredient.name.trim().length > 0 && ingredient.amount > 0;

export function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const toIngredient = (row: RecipeIngredientRow): Ingredient => ({
  id: row.id,
  name: row.name ?? '',
  amount: row.amount ?? 0,
  unit: toIngredientUnit(row.unit),
  recognized: row.recognized !== 0,
  macroNote: row.macro_note ?? '',
});

export function groupIngredientsByRecipe(rows: RecipeIngredientRow[]): Map<string, Ingredient[]> {
  const byRecipe = new Map<string, Ingredient[]>();

  for (const row of rows) {
    if (!row.recipe_id) continue;
    const group = byRecipe.get(row.recipe_id);
    if (group) group.push(toIngredient(row));
    else byRecipe.set(row.recipe_id, [toIngredient(row)]);
  }

  return byRecipe;
}

export const recipeServings = (row: RecipeRow) => Math.max(1, row.servings ?? 1);

export const toRecipe = (row: RecipeRow, ingredients: Ingredient[]): Recipe => ({
  id: row.id,
  category: row.category_id ?? '',
  title: row.title ?? '',
  description: row.description ?? '',
  servings: recipeServings(row),
  macros: {
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    fat: row.fat ?? 0,
    carbs: row.carbs ?? 0,
  },
  macrosStatus: toMacrosStatus(row.macros_status),
  macrosError: row.macros_error ?? '',
  ingredients,
});

export function toCategories(rows: CategoryRow[], ownerId: string | null): Category[] {
  const categories: Category[] = [];

  for (const row of rows) {
    if (row.owner_id !== ownerId) continue;
    categories.push({ id: row.id, label: row.label ?? '' });
  }

  return categories;
}

export const toGroceryItem = (row: GroceryItemRow): GroceryItem => ({
  key: row.id,
  name: row.name ?? '',
  amount: row.amount ?? 0,
  unit: toIngredientUnit(row.unit),
  checked: !!row.checked,
  edited: !!row.edited,
});

export function groupGroceryItemsByList(rows: GroceryItemRow[]): Map<string, GroceryItemRow[]> {
  const byList = new Map<string, GroceryItemRow[]>();

  for (const row of rows) {
    if (!row.list_id) continue;
    const group = byList.get(row.list_id);
    if (group) group.push(row);
    else byList.set(row.list_id, [row]);
  }

  return byList;
}

export const mealCategoryOf = (
  row: RecipeRow,
  slugById: Map<string, string>,
): MealCategory | null => toMealCategory(slugById.get(row.category_id ?? ''));

export const mealDayKey = (weekId: string, day: string) => `${weekId}|${day}`;

export const toMeal = (row: MealRow, recipeById: Map<string, DayCardRecipe>): Meal => ({
  id: row.id,
  title: row.title ?? '',
  category: toMealCategory(row.category) ?? 'snack',
  servings: row.servings ?? DEFAULT_SERVINGS,
  recipe: row.recipe_id ? (recipeById.get(row.recipe_id) ?? null) : null,
});

export function groupMealsByWeekDay(rows: MealRow[]): Map<string, MealRow[]> {
  const byWeekDay = new Map<string, MealRow[]>();

  for (const row of rows) {
    if (!row.week_id || !row.day) continue;
    const key = mealDayKey(row.week_id, row.day);
    const group = byWeekDay.get(key);
    if (group) group.push(row);
    else byWeekDay.set(key, [row]);
  }

  return byWeekDay;
}

export const toMealAdjustment = (row: MealAdjustmentRow): MealAdjustment => ({
  id: row.id,
  mealId: row.meal_id ?? '',
  servings: row.servings ?? null,
  skipped: !!row.skipped,
});

export const toDayExtra = (row: DayExtraRow): DayExtra => ({
  id: row.id,
  name: row.name ?? '',
  amount: row.amount ?? 0,
  unit: row.unit ?? '',
  macros: {
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    fat: row.fat ?? 0,
    carbs: row.carbs ?? 0,
  },
});

export function groupDayExtrasByWeekDay(rows: DayExtraRow[]): Map<string, DayExtra[]> {
  const byWeekDay = new Map<string, DayExtra[]>();

  for (const row of rows) {
    if (!row.week_id || !row.day) continue;
    const key = mealDayKey(row.week_id, row.day);
    const group = byWeekDay.get(key);
    if (group) group.push(toDayExtra(row));
    else byWeekDay.set(key, [toDayExtra(row)]);
  }

  return byWeekDay;
}

export const toDayCardRecipe = (
  row: RecipeRow,
  slugById: Map<string, string>,
  photos: string[],
): DayCardRecipe => ({
  id: row.id,
  title: row.title ?? '',
  category: mealCategoryOf(row, slugById),
  photos,
  /** Recipe macros are the total for all its servings; a meal counts them per serving. */
  macrosPerServing: scaleMacros(
    {
      calories: row.calories ?? 0,
      protein: row.protein ?? 0,
      fat: row.fat ?? 0,
      carbs: row.carbs ?? 0,
    },
    1 / recipeServings(row),
  ),
});
