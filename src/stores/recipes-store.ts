import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { makeAutoObservable, runInAction } from 'mobx';
import { Share } from 'react-native';

import type { Recipe as DayCardRecipe } from '@/features/day-card/types';
import {
  MAX_RECIPE_PHOTOS,
  preparePhoto,
  type PhotoSource,
} from '@/features/recipes/lib/photo-pipeline';
import {
  createShareToken,
  recipeShareLink,
  sharedRecipeMessage,
  toImportSharedRecipeResult,
  toSharedRecipePreview,
  type ImportSharedRecipeResult,
  type SharedRecipePayload,
  type SharedRecipePreview,
} from '@/features/recipes/lib/share';
import { ingredientsSignature } from '@/features/recipes/lib/ingredients-signature';
import type { Category, Ingredient, Recipe } from '@/features/recipes/types';
import { haptics } from '@/lib/haptics';
import type { Scope } from '@/lib/scope';
import { supabase } from '@/lib/supabase';
import { PHOTO_EXTENSION, PHOTO_MEDIA_TYPE, photoStoragePath } from '@/sync/attachments';
import { powersync } from '@/sync/database';
import type { CategoryRow, RecipeIngredientRow, RecipeRow } from '@/sync/schema';
import { buildUpdate, diffById, nowIso } from '@/sync/write';

import {
  groupIngredientsByRecipe,
  isFilledIngredient,
  recipeServings,
  toCategories,
  toDayCardRecipe,
  toRecipe,
} from './mappers';
import type { RootStore } from './root-store';

export interface PhotoRow {
  id: string;
  recipe_id: string | null;
  local_uri: string | null;
}

const PENDING_SHARE_KEY = 'recipes.pendingShare';

export class RecipesStore {
  recipeRows: RecipeRow[] = [];
  ingredientRows: RecipeIngredientRow[] = [];
  categoryRows: CategoryRow[] = [];
  photoRows: PhotoRow[] = [];

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  startWatching(scope: Scope) {
    powersync.watch(
      'select * from recipes where deleted = 0 order by created_at',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.recipeRows = results.array as RecipeRow[];
          }),
        onError: cause => this.root.errors.notify('recipes.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from recipe_ingredients where deleted = 0 order by position, created_at',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.ingredientRows = results.array as RecipeIngredientRow[];
          }),
        onError: cause => this.root.errors.notify('recipes.ingredients.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from categories where deleted = 0 order by position, created_at',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.categoryRows = results.array as CategoryRow[];
          }),
        onError: cause => this.root.errors.notify('recipes.categories.watch', cause),
      },
      { signal: scope.signal },
    );
// адаптировать код 
    powersync.watch(
      `select p.id, p.recipe_id, a.local_uri
       from recipe_photos p
       left join attachments a on a.id = p.id
       where p.deleted = 0
       order by p.position, p.created_at`,
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.photoRows = results.array as unknown as PhotoRow[];
          }),
        onError: cause => this.root.errors.notify('recipes.photos.watch', cause),
      },
      { signal: scope.signal },
    );
  }

  get photosByRecipeId(): Map<string, string[]> {
    const byRecipe = new Map<string, string[]>();

    for (const row of this.photoRows) {
      if (!row.recipe_id || !row.local_uri) continue;
      const group = byRecipe.get(row.recipe_id);
      if (group) group.push(row.local_uri);
      else byRecipe.set(row.recipe_id, [row.local_uri]);
    }

    return byRecipe;
  }

  photosOf(recipeId: string): PhotoRow[] {
    return this.photoRows.filter(row => row.recipe_id === recipeId);
  }

  photoCountOf(recipeId: string): number {
    return this.photosOf(recipeId).length;
  }

  get categories(): Category[] {
    return toCategories(this.categoryRows, this.root.auth.userId);
  }

  get categorySlugById(): Map<string, string> {
    return new Map(this.categoryRows.map(row => [row.id, row.slug ?? '']));
  }

  get recipeRowById(): Map<string, RecipeRow> {
    return new Map(this.recipeRows.map(row => [row.id, row]));
  }

  get ingredientsByRecipeId(): Map<string, Ingredient[]> {
    return groupIngredientsByRecipe(this.ingredientRows);
  }

  get recipes(): Recipe[] {
    const ingredientsByRecipe = this.ingredientsByRecipeId;
    return this.recipeRows.map(row => toRecipe(row, ingredientsByRecipe.get(row.id) ?? []));
  }

  get dayCardRecipeById(): Map<string, DayCardRecipe> {
    const slugById = this.categorySlugById;
    const photosByRecipe = this.photosByRecipeId;
    return new Map(
      this.recipeRows.map(row => [
        row.id,
        toDayCardRecipe(row, slugById, photosByRecipe.get(row.id) ?? []),
      ]),
    );
  }

  addCategory(label: string): Category {
    const trimmed = label.trim();
    const id = randomUUID();
    const position = this.categoryRows.reduce(
      (max, row) => Math.max(max, (row.position ?? 0) + 1),
      0,
    );

    this.root.write(
      'recipes.addCategory',
      () =>
        powersync.execute(
          'insert into categories (id, owner_id, slug, label, position, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
          [id, this.root.auth.userId, id, trimmed, position, nowIso()],
        ),
      { id },
    );

    return { id, label: trimmed };
  }

  addRecipe(draft: Recipe) {
    haptics.created();
    const ownerId = this.root.auth.userId;
    const recipeId = randomUUID();
    const now = nowIso();
    const ingredients = draft.ingredients.filter(isFilledIngredient);

    this.root.write(
      'recipes.addRecipe',
      () =>
        powersync.writeTransaction(async tx => {
          await tx.execute(
            'insert into recipes (id, owner_id, category_id, title, description, servings, calories, protein, fat, carbs, macros_status, deleted, created_at) values (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, 0, ?)',
            [
              recipeId,
              ownerId,
              draft.category,
              draft.title.trim(),
              draft.description,
              draft.servings,
              ingredients.length > 0 ? 'pending' : 'idle',
              now,
            ],
          );
          for (const [index, ingredient] of ingredients.entries()) {
            await tx.execute(
              'insert into recipe_ingredients (id, owner_id, recipe_id, name, amount, unit, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, 0, ?)',
              [randomUUID(), ownerId, recipeId, ingredient.name.trim(), ingredient.amount, ingredient.unit, index, now],
            );
          }
        }),
      { recipeId, ingredients: ingredients.length },
    );
  }

  saveRecipe(next: Recipe) {
    const row = this.recipeRowById.get(next.id);
    if (!row) return;
    const current = toRecipe(row, this.ingredientsByRecipeId.get(next.id) ?? []);
    const ownerId = this.root.auth.userId;
    const now = nowIso();
    const nextIngredients = next.ingredients.filter(isFilledIngredient);
    const ingredients = diffById(current.ingredients, nextIngredients);
    const ingredientsChanged =
      ingredientsSignature(current.ingredients) !== ingredientsSignature(nextIngredients);
    const recipeUpdate = buildUpdate('recipes', next.id, [
      ['category_id', current.category, next.category],
      ['title', current.title, next.title.trim()],
      ['description', current.description, next.description],
      ['servings', current.servings, next.servings],
      ...(ingredientsChanged
        ? [
            [
              'macros_status',
              current.macrosStatus,
              nextIngredients.length > 0 ? 'pending' : 'idle',
            ] as [string, unknown, unknown],
            ['macros_error', current.macrosError, ''] as [string, unknown, unknown],
          ]
        : []),
    ]);

    this.root.write(
      'recipes.saveRecipe',
      () =>
        powersync.writeTransaction(async tx => {
          if (recipeUpdate) {
            await tx.execute(recipeUpdate.sql, recipeUpdate.args);
          }

          for (const ingredient of ingredients.removed) {
            await tx.execute('update recipe_ingredients set deleted = 1 where id = ?', [
              ingredient.id,
            ]);
          }

          for (const { index, item, existing } of ingredients.kept) {
            if (!existing) {
              await tx.execute(
                'insert into recipe_ingredients (id, owner_id, recipe_id, name, amount, unit, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, 0, ?)',
                [randomUUID(), ownerId, next.id, item.name.trim(), item.amount, item.unit, index, now],
              );
              continue;
            }

            const update = buildUpdate('recipe_ingredients', item.id, [
              ['name', existing.name, item.name.trim()],
              ['amount', existing.amount, item.amount],
              ['unit', existing.unit, item.unit],
            ]);
            if (update) {
              await tx.execute(update.sql, update.args);
            }
          }
        }),
      { recipeId: next.id, removed: ingredients.removed.length, kept: ingredients.kept.length },
    );
  }

  addPhoto(recipeId: string, source: PhotoSource) {
    const queue = this.root.attachments;
    if (!queue) return;
    if (this.photoCountOf(recipeId) >= MAX_RECIPE_PHOTOS) return;

    const ownerId = this.root.auth.userId;
    const id = randomUUID();
    const position = this.photoCountOf(recipeId);
    const now = nowIso();

    this.root.write(
      'recipes.addPhoto',
      async () => {
        const photo = await preparePhoto(source);
        await queue.saveFile({
          id,
          data: photo.data,
          fileExtension: PHOTO_EXTENSION,
          mediaType: PHOTO_MEDIA_TYPE,
          metaData: photo.hash,
          updateHook: async tx => {
            await tx.execute(
              'insert into recipe_photos (id, owner_id, recipe_id, storage_path, content_hash, width, height, bytes, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
              [
                id,
                ownerId,
                recipeId,
                photoStoragePath(photo.hash),
                photo.hash,
                photo.width,
                photo.height,
                photo.bytes,
                position,
                now,
              ],
            );
          },
        });
      },
      { id, recipeId },
    );
  }

  removePhoto(id: string) {
    const queue = this.root.attachments;
    if (!queue) return;

    this.root.write(
      'recipes.removePhoto',
      () =>
        queue.deleteFile({
          id,
          updateHook: async tx => {
            await tx.execute('update recipe_photos set deleted = 1 where id = ?', [id]);
          },
        }),
      { id },
    );
  }

  shareRecipe(recipeId: string) {
    const row = this.recipeRowById.get(recipeId);
    if (!row) return;

    const category = this.categoryRows.find(item => item.id === row.category_id);
    const ingredients = this.ingredientsByRecipeId.get(recipeId) ?? [];

    this.root.write(
      'recipes.shareRecipe',
      async () => {
        const photos = await powersync.getAll<SharedRecipePayload['photos'][number]>(
          'select storage_path, content_hash, width, height, bytes from recipe_photos where recipe_id = ? and deleted = 0 order by position, created_at',
          [recipeId],
        );

        const payload: SharedRecipePayload = {
          recipe: {
            title: row.title ?? '',
            description: row.description ?? '',
            servings: recipeServings(row),
            calories: row.calories ?? 0,
            protein: row.protein ?? 0,
            fat: row.fat ?? 0,
            carbs: row.carbs ?? 0,
          },
          category: { slug: category?.slug ?? 'shared', label: category?.label ?? 'Из ссылки' },
          ingredients: ingredients.map(item => ({
            name: item.name,
            amount: item.amount,
            unit: item.unit,
          })),
          photos,
        };

        const token = createShareToken();
        const { error } = await supabase.from('recipe_snapshots').insert({ token, payload });
        if (error) throw error;

        await Share.share({ message: recipeShareLink(token) });
      },
      { recipeId },
    );
  }

  async previewSharedRecipe(token: string): Promise<SharedRecipePreview> {
    try {
      const { data, error } = await supabase.rpc('preview_shared_recipe', { p_token: token });
      if (error) throw error;
      return toSharedRecipePreview(data);
    } catch (cause) {
      console.error('recipes.previewSharedRecipe', cause);
      return { ok: false, reason: 'network' };
    }
  }

  async importSharedRecipe(token: string): Promise<ImportSharedRecipeResult> {
    try {
      const { data, error } = await supabase.rpc('import_shared_recipe', { p_token: token });
      if (error) throw error;
      return toImportSharedRecipeResult(data);
    } catch (cause) {
      console.error('recipes.importSharedRecipe', cause);
      return { ok: false, reason: 'network' };
    }
  }

  savePendingShare(token: string): Promise<void> {
    return AsyncStorage.setItem(PENDING_SHARE_KEY, token);
  }

  async consumePendingShare(scope: Scope) {
    const token = await scope.wait(AsyncStorage.getItem(PENDING_SHARE_KEY));
    if (!token) return;

    const result = await scope.wait(this.importSharedRecipe(token));
    if (!result.ok && result.reason === 'network') return;

    await scope.wait(AsyncStorage.removeItem(PENDING_SHARE_KEY));
    if (!result.ok) {
      this.root.errors.notify(
        'recipes.importSharedRecipe',
        new Error(sharedRecipeMessage(result.reason)),
      );
    }
  }

  removeRecipe(id: string) {
    for (const row of this.photoRows) {
      if (row.recipe_id === id) this.removePhoto(row.id);
    }

    this.root.write(
      'recipes.removeRecipe',
      () =>
        powersync.writeTransaction(async tx => {
          await tx.execute('update recipes set deleted = 1 where id = ?', [id]);
          await tx.execute('update recipe_ingredients set deleted = 1 where recipe_id = ?', [id]);
        }),
      { id },
    );
  }
}
