export type RecipeCategory = string;

export interface Category {
  id: string;
  label: string;
}

export type IngredientUnit = 'g' | 'ml';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: IngredientUnit;
  recognized: boolean;
  macroNote: string;
}

export type MacrosStatus = 'idle' | 'pending' | 'ready' | 'partial' | 'failed';

export interface Macros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Recipe {
  id: string;
  category: RecipeCategory;
  title: string;
  description: string;
  /** How many servings the ingredient amounts add up to. Macros below are the total for all of them. */
  servings: number;
  macros: Macros;
  macrosStatus: MacrosStatus;
  macrosError: string;
  ingredients: Ingredient[];
}
