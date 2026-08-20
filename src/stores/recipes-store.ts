import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { makeAutoObservable, runInAction } from 'mobx';

import type { Recipe as DayCardRecipe, MealCategory } from '@/features/day-card/types';
import type { Category, Ingredient, Recipe } from '@/features/recipes/types';
import type { Scope } from '@/lib/scope';
import { powersync } from '@/sync/database';
import type { CategoryRow, RecipeIngredientRow, RecipeRow } from '@/sync/schema';
import { buildUpdate, diffById } from '@/sync/write';

import {
  groupIngredientsByRecipe,
  isFilledIngredient,
  mealCategoryOf,
  slugify,
  toCategories,
  toDayCardRecipe,
  toRecipe,
} from './mappers';
import type { RootStore } from './root-store';

export class RecipesStore {
  recipeRows: RecipeRow[] = [];
  ingredientRows: RecipeIngredientRow[] = [];
  categoryRows: CategoryRow[] = [];

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
    return new Map(this.recipeRows.map(row => [row.id, toDayCardRecipe(row, slugById)]));
  }

  findBySlotCategory(category: MealCategory): DayCardRecipe | null {
    const slugById = this.categorySlugById;
    const row = this.recipeRows.find(item => mealCategoryOf(item, slugById) === category);
    return row ? toDayCardRecipe(row, slugById) : null;
  }

  addCategory(label: string): Category {
    const trimmed = label.trim();
    const id = randomUUID();
    const slug = slugify(trimmed) || id;
    const position = this.categoryRows.reduce(
      (max, row) => Math.max(max, (row.position ?? 0) + 1),
      0,
    );

    this.root.write(
      'recipes.addCategory',
      powersync.execute(
        'insert into categories (id, owner_id, slug, label, position, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
        [id, this.root.auth.userId, slug, trimmed, position, new Date().toISOString()],
      ),
    );

    return { id, label: trimmed };
  }

  addRecipe(draft: Recipe) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ownerId = this.root.auth.userId;
    const recipeId = randomUUID();
    // почему toISOString
    const now = new Date().toISOString();
    const ingredients = draft.ingredients.filter(isFilledIngredient);

    this.root.write(
      'recipes.addRecipe',
      powersync.writeTransaction(async tx => {
        await tx.execute(
          'insert into recipes (id, owner_id, category_id, title, description, photos, calories, protein, fat, carbs, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
          [
            recipeId,
            ownerId,
            draft.category,
            draft.title.trim(),
            draft.description,
            '[]',
            draft.macros.calories,
            draft.macros.protein,
            draft.macros.fat,
            draft.macros.carbs,
            now,
          ],
        );
        // зачем лишнне ingredients.entries() ведь это уже есть массив блять!!!!!!!!!!!!!!
        for (const [index, ingredient] of ingredients.entries()) {
          await tx.execute(
            'insert into recipe_ingredients (id, owner_id, recipe_id, name, amount, unit, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, 0, ?)',
            [randomUUID(), ownerId, recipeId, ingredient.name.trim(), ingredient.amount, ingredient.unit, index, now],
          );
        }
      }),
    );
  }

  saveRecipe(next: Recipe) {
    const row = this.recipeRowById.get(next.id);
    if (!row) return;
    const current = toRecipe(row, this.ingredientsByRecipeId.get(next.id) ?? []);
    const ownerId = this.root.auth.userId;
    const now = new Date().toISOString();
    const nextIngredients = next.ingredients.filter(isFilledIngredient);
    const ingredients = diffById(current.ingredients, nextIngredients);
    const recipeUpdate = buildUpdate('recipes', next.id, [
      ['category_id', current.category, next.category],
      ['title', current.title, next.title.trim()],
      ['description', current.description, next.description],
      ['calories', current.macros.calories, next.macros.calories],
      ['protein', current.macros.protein, next.macros.protein],
      ['fat', current.macros.fat, next.macros.fat],
      ['carbs', current.macros.carbs, next.macros.carbs],
    ]);

    this.root.write(
      'recipes.saveRecipe',
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
    );
  }

  removeRecipe(id: string) {
    this.root.write(
      'recipes.removeRecipe',
      powersync.writeTransaction(async tx => {
        await tx.execute('update recipes set deleted = 1 where id = ?', [id]);
        await tx.execute('update recipe_ingredients set deleted = 1 where recipe_id = ?', [id]);
      }),
    );
  }
}
