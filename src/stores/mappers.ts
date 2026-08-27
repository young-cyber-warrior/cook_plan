import { toMealCategory } from '@/features/day-card/lib/meal-category';
import { DEFAULT_SERVINGS } from '@/features/day-card/lib/servings';
import type { Recipe as DayCardRecipe, Meal, MealCategory } from '@/features/day-card/types';
import type { GroceryItem } from '@/features/grocery/types';
import { toIngredientUnit } from '@/features/recipes/lib/units';
import type { Category, Ingredient, Recipe } from '@/features/recipes/types';
import type {
  CategoryRow,
  GroceryItemRow,
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

export const toRecipe = (row: RecipeRow, ingredients: Ingredient[]): Recipe => ({
  id: row.id,
  category: row.category_id ?? '',
  title: row.title ?? '',
  description: row.description ?? '',
  macros: {
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    fat: row.fat ?? 0,
    carbs: row.carbs ?? 0,
  },
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

export const toDayCardRecipe = (row: RecipeRow, slugById: Map<string, string>): DayCardRecipe => ({
  id: row.id,
  title: row.title ?? '',
  category: mealCategoryOf(row, slugById),
  photos: parseStringArray(row.photos),
  macrosPerServing: {
    calories: row.calories ?? 0,
    protein: row.protein ?? 0,
    fat: row.fat ?? 0,
    carbs: row.carbs ?? 0,
  },
});
