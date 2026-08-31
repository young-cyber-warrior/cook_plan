import type { Ingredient } from '@/features/recipes/types';

export const ingredientsSignature = (ingredients: Ingredient[]): string =>
  ingredients
    .map(ingredient => `${ingredient.name.trim().toLowerCase()}|${ingredient.amount}|${ingredient.unit}`)
    .join(';');
