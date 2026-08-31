import { shareLink } from '@/lib/link';
import { createToken } from '@/lib/token';

export const createShareToken = createToken;

export type SharedRecipeReason =
  | 'unauthenticated'
  | 'not_found'
  | 'revoked'
  | 'expired'
  | 'network';

export interface SharedRecipePayload {
  recipe: {
    title: string;
    description: string;
    servings: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  category: { slug: string; label: string };
  ingredients: { name: string; amount: number; unit: string }[];
  photos: {
    storage_path: string;
    content_hash: string;
    width: number;
    height: number;
    bytes: number;
  }[];
}

export type SharedRecipePreview =
  | { ok: true; payload: SharedRecipePayload }
  | { ok: false; reason: SharedRecipeReason };

export type ImportSharedRecipeResult =
  | { ok: true; recipeId: string }
  | { ok: false; reason: SharedRecipeReason };

const SHARED_RECIPE_MESSAGES: Record<SharedRecipeReason, string> = {
  unauthenticated: 'Сначала войди в аккаунт',
  not_found: 'Рецепт по ссылке не найден',
  revoked: 'Ссылку отозвали',
  expired: 'Срок ссылки истёк',
  network: 'Нет связи с сервером',
};

const SHARED_RECIPE_REASONS = new Set<string>(Object.keys(SHARED_RECIPE_MESSAGES));

export function recipeShareLink(token: string): string {
  return shareLink('recipe', token);
}

export function sharedRecipeMessage(reason: SharedRecipeReason): string {
  return SHARED_RECIPE_MESSAGES[reason];
}

function toReason(value: unknown): SharedRecipeReason {
  const reason = typeof value === 'string' ? value : '';
  return SHARED_RECIPE_REASONS.has(reason) ? (reason as SharedRecipeReason) : 'not_found';
}

export function toSharedRecipePreview(value: unknown): SharedRecipePreview {
  const data = value as { ok?: unknown; payload?: unknown; reason?: unknown } | null;

  if (data?.ok === true && data.payload) {
    return { ok: true, payload: data.payload as SharedRecipePayload };
  }

  return { ok: false, reason: toReason(data?.reason) };
}

export function toImportSharedRecipeResult(value: unknown): ImportSharedRecipeResult {
  const data = value as { ok?: unknown; recipe_id?: unknown; reason?: unknown } | null;

  if (data?.ok === true && typeof data.recipe_id === 'string') {
    return { ok: true, recipeId: data.recipe_id };
  }

  return { ok: false, reason: toReason(data?.reason) };
}
