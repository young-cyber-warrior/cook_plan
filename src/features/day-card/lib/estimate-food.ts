import type { Macros } from '@/features/day-card/types';
import type { IngredientUnit } from '@/features/recipes/types';
import { supabase } from '@/lib/supabase';

export type FoodEstimate =
  | { ok: true; recognized: true; description: string; macros: Macros }
  | { ok: true; recognized: false }
  | { ok: false };

interface FoodEstimateResponse {
  recognized?: boolean;
  description?: string;
  macros?: Macros;
}

/** Single-product lookup: same USDA cache as recipes, answered in one request. */
export async function estimateFood(
  name: string,
  amount: number,
  unit: IngredientUnit,
): Promise<FoodEstimate> {
  const { data, error } = await supabase.functions.invoke<FoodEstimateResponse>('estimate-food', {
    body: { name, amount, unit },
  });

  if (error || !data) return { ok: false };
  if (!data.recognized || !data.macros) return { ok: true, recognized: false };

  return {
    ok: true,
    recognized: true,
    description: data.description ?? '',
    macros: data.macros,
  };
}
