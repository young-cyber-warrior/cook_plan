export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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
