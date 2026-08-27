import { randomUUID } from 'expo-crypto';
import { makeAutoObservable, runInAction } from 'mobx';

import { clampServings, DEFAULT_SERVINGS } from '@/features/day-card/lib/servings';
import type { Day, MealCategory } from '@/features/day-card/types';
import { eachDay, weekdayName, type DateId } from '@/features/weeks/lib/dates';
import type { Week, WeekRange } from '@/features/weeks/types';
import { haptics } from '@/lib/haptics';
import type { Scope } from '@/lib/scope';
import { powersync } from '@/sync/database';
import type { MealRow, WeekRow } from '@/sync/schema';
import { buildUpdate, nowIso } from '@/sync/write';

import { groupMealsByWeekDay, mealDayKey, toMeal } from './mappers';
import type { RootStore } from './root-store';

const DEFAULT_SLOTS: { title: string; category: MealCategory }[] = [
  { title: 'Завтрак', category: 'breakfast' },
  { title: 'Обед', category: 'lunch' },
  { title: 'Ужин', category: 'dinner' },
];

interface EditingState {
  weekId: string | null;
}

type SqlExecutor = { execute: (sql: string, args?: unknown[]) => Promise<unknown> };

export class WeeksStore {
  weekRows: WeekRow[] = [];
  mealRows: MealRow[] = [];
  activeIndex = 0;
  sheetVisible = false;
  editing: EditingState | null = null;

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  startWatching(scope: Scope) {
    powersync.watch(
      'select * from weeks where deleted = 0 order by start_date',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.weekRows = results.array as WeekRow[];
            this.activeIndex = Math.min(this.activeIndex, Math.max(0, this.weekRows.length - 1));
          }),
        onError: cause => this.root.errors.notify('weeks.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from meals where deleted = 0 order by position, created_at',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.mealRows = results.array as MealRow[];
          }),
        onError: cause => this.root.errors.notify('weeks.meals.watch', cause),
      },
      { signal: scope.signal },
    );
  }

  get weekRowById(): Map<string, WeekRow> {
    return new Map(this.weekRows.map(row => [row.id, row]));
  }

  private get mealRowsByWeekDay(): Map<string, MealRow[]> {
    return groupMealsByWeekDay(this.mealRows);
  }

  get weeks(): Week[] {
    const recipeById = this.root.recipes.dayCardRecipeById;
    const mealRowsByWeekDay = this.mealRowsByWeekDay;

    return this.weekRows.map(row => {
      const start = (row.start_date ?? '') as DateId;
      const end = (row.end_date ?? start) as DateId;
      const days: Day[] = eachDay(start, end).map(dateId => ({
        id: dateId,
        weekId: row.id,
        weekday: weekdayName(dateId),
        meals: (mealRowsByWeekDay.get(mealDayKey(row.id, dateId)) ?? []).map(mealRow =>
          toMeal(mealRow, recipeById),
        ),
      }));
      return { id: row.id, start, end, days };
    });
  }

  get canRemove(): boolean {
    return this.weekRows.length > 1;
  }

  setActiveIndex(index: number) {
    this.activeIndex = index;
  }

  openSheet() {
    this.sheetVisible = true;
  }

  closeSheet() {
    this.sheetVisible = false;
    this.editing = null;
  }

  startAdd() {
    this.editing = { weekId: null };
  }

  startEdit(weekId: string) {
    this.editing = { weekId };
  }

  cancelEdit() {
    this.editing = null;
  }

  saveWeek(range: WeekRange) {
    const editingId = this.editing?.weekId ?? null;

    if (editingId) {
      this.resizeWeek(editingId, range);
    } else {
      haptics.created();
      this.insertWeek(range);
      this.activeIndex = this.weekRows.reduce(
        (before, row) => ((row.start_date ?? '') <= range.start ? before + 1 : before),
        0,
      );
    }

    this.closeSheet();
  }

  insertWeek(range: WeekRange): string {
    const id = randomUUID();
    const ownerId = this.root.auth.userId;
    const now = nowIso();

    this.root.write(
      'weeks.insertWeek',
      () =>
        powersync.writeTransaction(async tx => {
          await tx.execute(
            'insert into weeks (id, owner_id, start_date, end_date, deleted, created_at) values (?, ?, ?, ?, 0, ?)',
            [id, ownerId, range.start, range.end, now],
          );
          for (const dateId of eachDay(range.start, range.end)) {
            await this.insertDefaultSlots(tx, id, dateId, now);
          }
        }),
      { id, range },
    );

    return id;
  }

  private async insertDefaultSlots(tx: SqlExecutor, weekId: string, dateId: DateId, now: string) {
    const ownerId = this.root.auth.userId;
    for (const [index, slot] of DEFAULT_SLOTS.entries()) {
      await tx.execute(
        'insert into meals (id, owner_id, week_id, day, title, category, servings, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [randomUUID(), ownerId, weekId, dateId, slot.title, slot.category, DEFAULT_SERVINGS, index, now],
      );
    }
  }

  private resizeWeek(weekId: string, range: WeekRange) {
    const row = this.weekRowById.get(weekId);
    if (!row) return;

    const now = nowIso();
    const previousDays = new Set(eachDay((row.start_date ?? '') as DateId, (row.end_date ?? '') as DateId));
    const nextDays = eachDay(range.start, range.end);
    const nextDaySet = new Set(nextDays);

    const weekUpdate = buildUpdate('weeks', weekId, [
      ['start_date', row.start_date, range.start],
      ['end_date', row.end_date, range.end],
    ]);

    this.root.write(
      'weeks.resizeWeek',
      () =>
        powersync.writeTransaction(async tx => {
          if (weekUpdate) {
            await tx.execute(weekUpdate.sql, weekUpdate.args);
          }

          for (const day of previousDays) {
            if (!nextDaySet.has(day)) {
              await tx.execute('update meals set deleted = 1 where week_id = ? and day = ?', [
                weekId,
                day,
              ]);
            }
          }

          for (const day of nextDays) {
            if (!previousDays.has(day)) {
              await this.insertDefaultSlots(tx, weekId, day, now);
            }
          }
        }),
      { weekId, range },
    );
  }

  removeWeek(weekId: string) {
    if (!this.canRemove) return;

    this.activeIndex = Math.min(this.activeIndex, Math.max(0, this.weekRows.length - 2));

    this.root.write(
      'weeks.removeWeek',
      () =>
        powersync.writeTransaction(async tx => {
          await tx.execute('update weeks set deleted = 1 where id = ?', [weekId]);
          await tx.execute('update meals set deleted = 1 where week_id = ?', [weekId]);
        }),
      { weekId },
    );
  }

  setServings(mealId: string, servings: number) {
    this.root.write(
      'weeks.setServings',
      () =>
        powersync.execute('update meals set servings = ? where id = ?', [
          clampServings(servings),
          mealId,
        ]),
      { mealId, servings },
    );
  }
  attachRecipe(mealId: string, recipeId: string) {
    haptics.created();
    this.root.write(
      'weeks.attachRecipe',
      () => powersync.execute('update meals set recipe_id = ? where id = ?', [recipeId, mealId]),
      { mealId, recipeId },
    );
  }

  detachRecipe(mealId: string) {
    haptics.removed();
    this.root.write(
      'weeks.detachRecipe',
      () => powersync.execute('update meals set recipe_id = null where id = ?', [mealId]),
      { mealId },
    );
  }

  renameMeal(mealId: string, title: string) {
    this.root.write(
      'weeks.renameMeal',
      () => powersync.execute('update meals set title = ? where id = ?', [title, mealId]),
      { mealId },
    );
  }

  addMeal(weekId: string, dayId: DateId, title: string, category: MealCategory) {
    haptics.created();
    const position = (this.mealRowsByWeekDay.get(mealDayKey(weekId, dayId)) ?? []).reduce(
      (max, row) => Math.max(max, (row.position ?? 0) + 1),
      0,
    );

    this.root.write(
      'weeks.addMeal',
      () =>
        powersync.execute(
          'insert into meals (id, owner_id, week_id, day, title, category, servings, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
          [
            randomUUID(),
            this.root.auth.userId,
            weekId,
            dayId,
            title,
            category,
            DEFAULT_SERVINGS,
            position,
            nowIso(),
          ],
        ),
      { weekId, dayId, category },
    );
  }

  removeMeal(mealId: string) {
    haptics.removed();
    this.root.write(
      'weeks.removeMeal',
      () => powersync.execute('update meals set deleted = 1 where id = ?', [mealId]),
      { mealId },
    );
  }
}
