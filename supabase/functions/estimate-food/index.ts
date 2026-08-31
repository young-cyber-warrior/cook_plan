import { createClient } from 'npm:@supabase/supabase-js';

import { scaleMacros, searchFoods, type Macros } from '../_shared/fdc.ts';
import { normalizeIngredients, selectCandidates } from '../_shared/gemini.ts';

const ITEM_ID = 'food';
const EMPTY_MACROS: Macros = { calories: 0, protein: 0, fat: 0, carbs: 0 };

interface FoodRequest {
  name?: unknown;
  amount?: unknown;
  unit?: unknown;
}

interface Resolved {
  description: string;
  per100g: Macros;
  density: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const cacheKey = (name: string) => name.trim().toLowerCase();

const gramsOf = (amount: number, unit: string, density: number) =>
  unit === 'ml' ? amount * density : amount;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function readCache(key: string): Promise<Resolved | null> {
  const { data, error } = await supabase
    .from('food_lookup_cache')
    .select('description, calories, protein, fat, carbs, density')
    .eq('query_key', key)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    description: data.description as string,
    density: Number(data.density),
    per100g: {
      calories: Number(data.calories),
      protein: Number(data.protein),
      fat: Number(data.fat),
      carbs: Number(data.carbs),
    },
  };
}

async function resolveFood(
  name: string,
  amount: number,
  unit: string,
  geminiKey: string,
  fdcKey: string,
): Promise<Resolved | null> {
  const [normalized] = await normalizeIngredients(geminiKey, [
    { id: ITEM_ID, name, amount, unit },
  ]);

  if (!normalized?.recognized || normalized.query.trim() === '') return null;

  const candidates = await searchFoods(normalized.query, fdcKey);
  if (candidates.length === 0) return null;

  const [choice] = await selectCandidates(geminiKey, [
    { id: ITEM_ID, name, candidates: candidates.map(candidate => candidate.description) },
  ]);

  const candidate = choice && choice.index >= 0 ? candidates[choice.index] : undefined;
  if (!candidate) return null;

  const resolved: Resolved = {
    description: candidate.description,
    per100g: candidate.per100g,
    density: normalized.density > 0 ? normalized.density : 1,
  };

  const { error } = await supabase.from('food_lookup_cache').upsert({
    query_key: cacheKey(name),
    description: resolved.description,
    calories: resolved.per100g.calories,
    protein: resolved.per100g.protein,
    fat: resolved.per100g.fat,
    carbs: resolved.per100g.carbs,
    density: resolved.density,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  return resolved;
}

Deno.serve(async request => {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const fdcKey = Deno.env.get('USDA_FDC_API_KEY');

  if (!geminiKey || !fdcKey) return json({ error: 'credentials_missing' }, 500);

  let body: FoodRequest;
  try {
    body = (await request.json()) as FoodRequest;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const amount = Number(body.amount);
  const unit = body.unit === 'ml' ? 'ml' : 'g';

  if (name === '' || !Number.isFinite(amount) || amount <= 0) {
    return json({ error: 'bad_request' }, 400);
  }

  try {
    const cached = await readCache(cacheKey(name));
    const resolved = cached ?? (await resolveFood(name, amount, unit, geminiKey, fdcKey));

    if (!resolved) {
      return json({ recognized: false, description: '', macros: EMPTY_MACROS });
    }

    return json({
      recognized: true,
      description: resolved.description,
      macros: scaleMacros(resolved.per100g, gramsOf(amount, unit, resolved.density)),
    });
  } catch (cause) {
    console.error('estimate-food', cause);
    return json({ error: 'estimate_failed' }, 502);
  }
});
