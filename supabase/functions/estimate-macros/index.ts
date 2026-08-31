import { createClient } from 'npm:@supabase/supabase-js';

import { scaleMacros, searchFoods, sumMacros, type Macros } from '../_shared/fdc.ts';
import { normalizeIngredients, selectCandidates } from '../_shared/gemini.ts';

const JOBS_PER_RUN = 5;
const MAX_ATTEMPTS = 5;
const BACKOFF_MINUTES = [1, 5, 15, 60, 180];

interface JobRow {
  recipe_id: string;
  hash: string;
  attempts: number;
}

interface IngredientRow {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

interface Resolved {
  description: string;
  per100g: Macros;
  density: number;
}

const cacheKey = (name: string) => name.trim().toLowerCase();

const backoffAt = (attempts: number) => {
  const minutes = BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length - 1)];
  return new Date(Date.now() + minutes * 60_000).toISOString();
};

const gramsOf = (ingredient: IngredientRow, density: number) =>
  ingredient.unit === 'ml' ? ingredient.amount * density : ingredient.amount;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

async function readCache(keys: string[]): Promise<Map<string, Resolved>> {
  if (keys.length === 0) return new Map();

  const { data, error } = await supabase
    .from('food_lookup_cache')
    .select('query_key, description, calories, protein, fat, carbs, density')
    .in('query_key', keys);

  if (error) throw error;

  return new Map(
    (data ?? []).map(row => [
      row.query_key as string,
      {
        description: row.description as string,
        density: Number(row.density),
        per100g: {
          calories: Number(row.calories),
          protein: Number(row.protein),
          fat: Number(row.fat),
          carbs: Number(row.carbs),
        },
      },
    ]),
  );
}

async function resolveMissing(
  ingredients: IngredientRow[],
  geminiKey: string,
  fdcKey: string,
): Promise<Map<string, Resolved>> {
  const resolved = new Map<string, Resolved>();
  if (ingredients.length === 0) return resolved;

  const normalized = await normalizeIngredients(geminiKey, ingredients);
  const byId = new Map(normalized.map(item => [item.id, item]));

  const searched: { id: string; name: string; candidates: string[]; density: number }[] = [];
  const foundByIngredient = new Map<string, Awaited<ReturnType<typeof searchFoods>>>();

  for (const ingredient of ingredients) {
    const item = byId.get(ingredient.id);
    if (!item || !item.recognized || item.query.trim() === '') continue;

    const candidates = await searchFoods(item.query, fdcKey);
    if (candidates.length === 0) continue;

    foundByIngredient.set(ingredient.id, candidates);
    searched.push({
      id: ingredient.id,
      name: ingredient.name,
      candidates: candidates.map(candidate => candidate.description),
      density: item.density > 0 ? item.density : 1,
    });
  }

  if (searched.length === 0) return resolved;

  const choices = await selectCandidates(
    geminiKey,
    searched.map(({ id, name, candidates }) => ({ id, name, candidates })),
  );
  const choiceById = new Map(choices.map(choice => [choice.id, choice.index]));

  const rows: Record<string, unknown>[] = [];

  for (const entry of searched) {
    const index = choiceById.get(entry.id) ?? -1;
    const candidate = foundByIngredient.get(entry.id)?.[index];
    if (index < 0 || !candidate) continue;

    const key = cacheKey(entry.name);
    resolved.set(key, {
      description: candidate.description,
      per100g: candidate.per100g,
      density: entry.density,
    });

    rows.push({
      query_key: key,
      description: candidate.description,
      calories: candidate.per100g.calories,
      protein: candidate.per100g.protein,
      fat: candidate.per100g.fat,
      carbs: candidate.per100g.carbs,
      density: entry.density,
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('food_lookup_cache').upsert(rows);
    if (error) throw error;
  }

  return resolved;
}

async function runJob(job: JobRow, geminiKey: string, fdcKey: string) {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, deleted')
    .eq('id', job.recipe_id)
    .maybeSingle();

  if (recipeError) throw recipeError;

  if (!recipe || recipe.deleted) {
    await supabase.from('recipe_macro_jobs').delete().eq('recipe_id', job.recipe_id);
    return;
  }

  const { data: ingredientRows, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('id, name, amount, unit')
    .eq('recipe_id', job.recipe_id)
    .eq('deleted', false)
    .gt('amount', 0)
    .order('position');

  if (ingredientsError) throw ingredientsError;

  const ingredients = (ingredientRows ?? []).filter(
    row => (row.name as string).trim() !== '',
  ) as IngredientRow[];

  const { data: hash, error: hashError } = await supabase.rpc('recipe_ingredients_hash', {
    p_recipe_id: job.recipe_id,
  });

  if (hashError) throw hashError;

  const cached = await readCache([...new Set(ingredients.map(item => cacheKey(item.name)))]);
  const missing = ingredients.filter(item => !cached.has(cacheKey(item.name)));
  const fresh = await resolveMissing(missing, geminiKey, fdcKey);

  const perIngredient = ingredients.map(ingredient => {
    const key = cacheKey(ingredient.name);
    const source = cached.get(key) ?? fresh.get(key) ?? null;

    return {
      id: ingredient.id,
      recognized: source !== null,
      note: source?.description ?? null,
      macros: source
        ? scaleMacros(source.per100g, gramsOf(ingredient, source.density))
        : { calories: 0, protein: 0, fat: 0, carbs: 0 },
    };
  });

  const macros = sumMacros(perIngredient.map(item => item.macros));
  const unrecognized = perIngredient.filter(item => !item.recognized).length;
  const status = unrecognized === 0 ? 'ready' : unrecognized === perIngredient.length ? 'failed' : 'partial';

  for (const item of perIngredient) {
    const { error } = await supabase
      .from('recipe_ingredients')
      .update({ recognized: item.recognized, macro_note: item.note })
      .eq('id', item.id);

    if (error) throw error;
  }

  const { error: updateError } = await supabase
    .from('recipes')
    .update({
      calories: macros.calories,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      macros_status: status,
      macros_hash: hash,
      macros_error: status === 'failed' ? 'Ни один продукт не распознан' : null,
      macros_updated_at: new Date().toISOString(),
    })
    .eq('id', job.recipe_id);

  if (updateError) throw updateError;

  await supabase
    .from('recipe_macro_jobs')
    .delete()
    .eq('recipe_id', job.recipe_id)
    .eq('hash', job.hash);
}

const errorMessage = (cause: unknown): string => {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === 'object') return JSON.stringify(cause).slice(0, 500);
  return String(cause);
};

async function failJob(job: JobRow, cause: unknown) {
  const attempts = job.attempts + 1;
  const message = errorMessage(cause);

  if (attempts >= MAX_ATTEMPTS) {
    await supabase
      .from('recipes')
      .update({ macros_status: 'failed', macros_error: message })
      .eq('id', job.recipe_id);

    await supabase.from('recipe_macro_jobs').delete().eq('recipe_id', job.recipe_id);
    return;
  }

  await supabase
    .from('recipe_macro_jobs')
    .update({
      attempts,
      run_after: backoffAt(attempts),
      last_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq('recipe_id', job.recipe_id);
}

Deno.serve(async () => {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const fdcKey = Deno.env.get('USDA_FDC_API_KEY');

  if (!geminiKey || !fdcKey) {
    return new Response(JSON.stringify({ error: 'credentials_missing' }), { status: 500 });
  }

  const { data: jobs, error } = await supabase
    .from('recipe_macro_jobs')
    .select('recipe_id, hash, attempts')
    .lte('run_after', new Date().toISOString())
    .order('run_after')
    .limit(JOBS_PER_RUN);

  if (error) {
    console.error('estimate-macros.jobs', error);
    return new Response(JSON.stringify({ error: 'jobs_unavailable' }), { status: 500 });
  }

  let processed = 0;
  let failed = 0;

  for (const job of (jobs ?? []) as JobRow[]) {
    try {
      await runJob(job, geminiKey, fdcKey);
      processed += 1;
    } catch (cause) {
      console.error('estimate-macros.job', job.recipe_id, cause);
      await failJob(job, cause);
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ processed, failed }), {
    headers: { 'content-type': 'application/json' },
  });
});
