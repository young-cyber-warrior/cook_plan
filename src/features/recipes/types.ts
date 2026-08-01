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
}

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
  macros: Macros;
  ingredients: Ingredient[];
}
