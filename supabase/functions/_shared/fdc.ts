const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const DATA_TYPES = 'Foundation,SR Legacy';
const CANDIDATES_PER_QUERY = 5;

const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
} as const;

export interface Macros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface FoodCandidate {
  fdcId: number;
  description: string;
  per100g: Macros;
}

interface FdcNutrient {
  nutrientId?: number;
  value?: number;
}

interface FdcFood {
  fdcId: number;
  description?: string;
  foodNutrients?: FdcNutrient[];
}

const nutrientValue = (nutrients: FdcNutrient[], id: number): number =>
  nutrients.find(nutrient => nutrient.nutrientId === id)?.value ?? 0;

const toCandidate = (food: FdcFood): FoodCandidate => {
  const nutrients = food.foodNutrients ?? [];

  return {
    fdcId: food.fdcId,
    description: food.description ?? '',
    per100g: {
      calories: nutrientValue(nutrients, NUTRIENT_IDS.calories),
      protein: nutrientValue(nutrients, NUTRIENT_IDS.protein),
      fat: nutrientValue(nutrients, NUTRIENT_IDS.fat),
      carbs: nutrientValue(nutrients, NUTRIENT_IDS.carbs),
    },
  };
};

export async function searchFoods(query: string, apiKey: string): Promise<FoodCandidate[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', query);
  url.searchParams.set('dataType', DATA_TYPES);
  url.searchParams.set('pageSize', String(CANDIDATES_PER_QUERY));

  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`fdc_search_failed:${response.status}`);

  const body = (await response.json()) as { foods?: FdcFood[] };
  return (body.foods ?? []).map(toCandidate).filter(candidate => candidate.per100g.calories > 0);
}

export function scaleMacros(per100g: Macros, grams: number): Macros {
  const factor = grams / 100;

  return {
    calories: Math.round(per100g.calories * factor),
    protein: Math.round(per100g.protein * factor),
    fat: Math.round(per100g.fat * factor),
    carbs: Math.round(per100g.carbs * factor),
  };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (total, macros) => ({
      calories: total.calories + macros.calories,
      protein: total.protein + macros.protein,
      fat: total.fat + macros.fat,
      carbs: total.carbs + macros.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}
