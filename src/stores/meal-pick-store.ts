import type { Href } from 'expo-router';
import { makeAutoObservable } from 'mobx';

import { SERVING_UNIT } from '@/features/day-card/lib/extra-units';
import type { Meal, MealCategory } from '@/features/day-card/types';
import type { DateId } from '@/features/weeks/lib/dates';

import type { RootStore } from './root-store';

interface MealTarget {
  kind: 'meal';
  origin: Href;
  mealId: string;
  mealTitle: string;
  category: MealCategory;
}

interface DayTarget {
  kind: 'day';
  origin: Href;
  weekId: string;
  dayId: DateId;
}

type PickTarget = MealTarget | DayTarget;

export class MealPickStore {
  target: PickTarget | null = null;
  selectedRecipeId: string | null = null;

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get picking(): boolean {
    return this.target !== null;
  }

  get canConfirm(): boolean {
    return this.target !== null && this.selectedRecipeId !== null;
  }

  /** Where the picker was opened from — the screen to return to once it is done. */
  get origin(): Href {
    return this.target?.origin ?? '/';
  }

  get confirmLabel(): string {
    if (!this.target) return '';

    return this.target.kind === 'meal'
      ? `Добавить в «${this.target.mealTitle}»`
      : 'Добавить сверх плана';
  }

  isSelected(recipeId: string): boolean {
    return this.selectedRecipeId === recipeId;
  }

  /** Fills a family meal slot. */
  startForMeal(meal: Meal, origin: Href) {
    this.target = {
      kind: 'meal',
      origin,
      mealId: meal.id,
      mealTitle: meal.title,
      category: meal.category,
    };
    this.selectedRecipeId = meal.recipe?.id ?? null;
  }

  /** Adds the recipe as personal food on top of the plan, without touching the meal slots. */
  startForDay(weekId: string, dayId: DateId, origin: Href) {
    this.target = { kind: 'day', origin, weekId, dayId };
    this.selectedRecipeId = null;
  }

  toggle(recipeId: string) {
    this.selectedRecipeId = this.selectedRecipeId === recipeId ? null : recipeId;
  }

  cancel() {
    this.target = null;
    this.selectedRecipeId = null;
  }

  confirm() {
    const target = this.target;
    const recipeId = this.selectedRecipeId;
    if (!target || !recipeId) return;

    if (target.kind === 'meal') this.root.weeks.attachRecipe(target.mealId, recipeId);
    else this.addAsExtra(target, recipeId);

    this.cancel();
  }

  private addAsExtra(target: DayTarget, recipeId: string) {
    const recipe = this.root.recipes.dayCardRecipeById.get(recipeId);
    if (!recipe) return;

    this.root.personal.addExtra(target.weekId, target.dayId, {
      name: recipe.title,
      amount: 1,
      unit: SERVING_UNIT,
      macros: recipe.macrosPerServing,
    });
  }
}
