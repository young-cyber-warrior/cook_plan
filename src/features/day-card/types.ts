/** Meal slot kind. Drives which recipe category the picker opens on. */
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Nutrition facts for a single serving. */
export interface Macros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Recipe {
  id: string;
  title: string;
  category: MealCategory;
  /** Collage source. Header shows up to 3, tap opens the full slider. */
  photos: string[];
  macrosPerServing: Macros;
}

export interface Meal {
  id: string;
  title: string;
  category: MealCategory;
  /** Person count. Scales macros linearly. */
  servings: number;
  /** `null` = slot not filled yet, counts against the day ring. */
  recipe: Recipe | null;
}

export interface Day {
  id: string;
  weekday: string;
  /** Default 3 slots (breakfast/lunch/dinner), user may append more. */
  meals: Meal[];
}

/** Header ring state: `2/3` filled with a 0..1 ratio for the arc. */
export interface DayProgress {
  filled: number;
  total: number;
  ratio: number;
  isComplete: boolean;
}

/** Footer stacked bar: share of total calories per macro. */
export interface MacroSplit {
  protein: number;
  fat: number;
  carbs: number;
}
