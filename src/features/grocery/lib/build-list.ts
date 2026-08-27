import type { Recipe } from '@/features/recipes/types';
import type { Week } from '@/features/weeks/types';

import type { GroceryItem, GroceryList } from '../types';

const normalizeName = (name: string) => name.trim().toLocaleLowerCase('ru');

export const itemKey = (name: string, unit: string) => `${normalizeName(name)}|${unit}`;

interface MealSource {
  recipeId: string;
  servings: number;
}

function collectMealSources(weeks: Week[], weekIds: string[]): MealSource[] {
  const pickedIds = new Set(weekIds);
  const sources: MealSource[] = [];

  for (const week of weeks) {
    if (!pickedIds.has(week.id)) continue;
    for (const day of week.days) {
      for (const meal of day.meals) {
        if (meal.recipe) sources.push({ recipeId: meal.recipe.id, servings: meal.servings });
      }
    }
  }

  return sources;
}
export function buildSourceHash(weeks: Week[], weekIds: string[], recipes: Recipe[]): string {
  const usedIds = new Set<string>();
  const sourceParts: string[] = [];

  for (const source of collectMealSources(weeks, weekIds)) {
    usedIds.add(source.recipeId);
    sourceParts.push(`${source.recipeId}:${source.servings}`);
  }
  sourceParts.sort();

  const recipeParts: string[] = [];
  for (const recipe of recipes) {
    if (!usedIds.has(recipe.id)) continue;

    const ingredientParts: string[] = [];
    for (const ingredient of recipe.ingredients) {
      ingredientParts.push(
        `${recipe.id}/${normalizeName(ingredient.name)}:${ingredient.amount}${ingredient.unit}`,
      );
    }
    ingredientParts.sort();
    recipeParts.push(ingredientParts.join(','));
  }
  recipeParts.sort();

  const parts = sourceParts.concat(recipeParts).join(';');

  let hash = 5381;
  for (let index = 0; index < parts.length; index += 1) {
    hash = ((hash << 5) + hash + parts.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

export function buildGroceryList(
  weeks: Week[],
  weekIds: string[],
  recipes: Recipe[],
  previous: GroceryList | null,
): GroceryList {
  const recipeById = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const checkedKeys = new Set(
    previous?.items.filter(item => item.checked).map(item => item.key) ?? [],
  );

  const merged = new Map<string, GroceryItem>();
  const usedRecipeIds = new Set<string>();

  for (const source of collectMealSources(weeks, weekIds)) {
    const recipe = recipeById.get(source.recipeId);
    if (!recipe) continue;
    usedRecipeIds.add(recipe.id);

    for (const ingredient of recipe.ingredients) {
      const key = itemKey(ingredient.name, ingredient.unit);
      const existing = merged.get(key);
      const amount = ingredient.amount * source.servings;

      if (existing) {
        existing.amount += amount;
      } else {
        merged.set(key, {
          key,
          name: ingredient.name,
          amount,
          unit: ingredient.unit,
          checked: checkedKeys.has(key),
          edited: false,
        });
      }
    }
  }

  return {
    weekIds,
    sourceHash: buildSourceHash(weeks, weekIds, recipes),
    recipeCount: usedRecipeIds.size,
    items: [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
  };
}
