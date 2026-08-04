import type { IngredientUnit } from '@/features/recipes/types';

export interface GroceryItem {
  key: string;
  name: string;
  amount: number;
  unit: IngredientUnit;
  checked: boolean;
  edited: boolean;
}

export interface GroceryList {
  weekIds: string[];
  sourceHash: string;
  recipeCount: number;
  items: GroceryItem[];
}
