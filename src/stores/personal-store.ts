import { randomUUID } from 'expo-crypto';
import { makeAutoObservable, runInAction } from 'mobx';

import { clampServings } from '@/features/day-card/lib/servings';
import type { DayExtra, MealAdjustment, Macros } from '@/features/day-card/types';
import type { DateId } from '@/features/weeks/lib/dates';
import { haptics } from '@/lib/haptics';
import type { Scope } from '@/lib/scope';
import { powersync } from '@/sync/database';
import type { DayExtraRow, MealAdjustmentRow } from '@/sync/schema';
import { nowIso } from '@/sync/write';

import { groupDayExtrasByWeekDay, mealDayKey, toMealAdjustment } from './mappers';
import type { RootStore } from './root-store';

export interface DayExtraInput {
  name: string;
  amount: number;
  unit: string;
  macros: Macros;
}

export class PersonalStore {
  adjustmentRows: MealAdjustmentRow[] = [];
  extraRows: DayExtraRow[] = [];

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  startWatching(scope: Scope) {
    powersync.watch(
      'select * from meal_adjustments where deleted = 0',
      [],
      {
        onResult: results =>
          runInAction(() => {
            console.log('watch.adjustments', results.array.length);
            this.adjustmentRows = results.array as MealAdjustmentRow[];
          }),
        onError: cause => this.root.errors.notify('personal.adjustments.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from day_extras where deleted = 0 order by position, created_at',
      [],
      {
        onResult: results =>
          runInAction(() => {
            console.log('watch.extras', results.array.length);
            this.extraRows = results.array as DayExtraRow[];
          }),
        onError: cause => this.root.errors.notify('personal.extras.watch', cause),
      },
      { signal: scope.signal },
    );
  }

  get adjustmentByMealId(): Map<string, MealAdjustment> {
    return new Map(this.adjustmentRows.map(row => [row.meal_id ?? '', toMealAdjustment(row)]));
  }

  get extrasByWeekDay(): Map<string, DayExtra[]> {
    return groupDayExtrasByWeekDay(this.extraRows);
  }

  setMealServings(mealId: string, servings: number) {
    this.upsertAdjustment('personal.setMealServings', mealId, {
      servings: clampServings(servings),
    });
  }

  setMealSkipped(mealId: string, skipped: boolean) {
    haptics.removed();
    this.upsertAdjustment('personal.setMealSkipped', mealId, { skipped: skipped ? 1 : 0 });
  }

  resetMeal(mealId: string) {
    this.root.write(
      'personal.resetMeal',
      () => powersync.execute('update meal_adjustments set deleted = 1 where meal_id = ?', [mealId]),
      { mealId },
    );
  }

  addExtra(weekId: string, dayId: DateId, input: DayExtraInput) {
    haptics.created();
    const position = (this.extrasByWeekDay.get(mealDayKey(weekId, dayId)) ?? []).length;

    this.root.write(
      'personal.addExtra',
      () =>
        powersync.execute(
          'insert into day_extras (id, owner_id, week_id, day, name, amount, unit, calories, protein, fat, carbs, position, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
          [
            randomUUID(),
            this.root.auth.userId,
            weekId,
            dayId,
            input.name,
            input.amount,
            input.unit,
            input.macros.calories,
            input.macros.protein,
            input.macros.fat,
            input.macros.carbs,
            position,
            nowIso(),
          ],
        ),
      { weekId, dayId },
    );
  }

  updateExtra(extraId: string, input: DayExtraInput) {
    this.root.write(
      'personal.updateExtra',
      () =>
        powersync.execute(
          'update day_extras set name = ?, amount = ?, unit = ?, calories = ?, protein = ?, fat = ?, carbs = ? where id = ?',
          [
            input.name,
            input.amount,
            input.unit,
            input.macros.calories,
            input.macros.protein,
            input.macros.fat,
            input.macros.carbs,
            extraId,
          ],
        ),
      { extraId },
    );
  }

  removeExtra(extraId: string) {
    haptics.removed();
    this.root.write(
      'personal.removeExtra',
      () => powersync.execute('update day_extras set deleted = 1 where id = ?', [extraId]),
      { extraId },
    );
  }

  resetDay(weekId: string, dayId: DateId, mealIds: string[]) {
    haptics.removed();
    this.root.write(
      'personal.resetDay',
      () =>
        powersync.writeTransaction(async tx => {
          for (const mealId of mealIds) {
            await tx.execute('update meal_adjustments set deleted = 1 where meal_id = ?', [mealId]);
          }
          await tx.execute('update day_extras set deleted = 1 where week_id = ? and day = ?', [
            weekId,
            dayId,
          ]);
        }),
      { weekId, dayId },
    );
  }

  /**
   * The unique index spans non-deleted rows only, so a reset row is revived
   * instead of inserted twice.
   */
  private upsertAdjustment(source: string, mealId: string, patch: Record<string, unknown>) {
    this.root.write(
      source,
      () =>
        powersync.writeTransaction(async tx => {
          const existing = await tx.getOptional<{ id: string }>(
            'select id from meal_adjustments where meal_id = ? order by deleted limit 1',
            [mealId],
          );

          if (existing) {
            const columns = Object.keys(patch);
            const set = ['deleted = 0', ...columns.map(column => `${column} = ?`)].join(', ');

            await tx.execute(`update meal_adjustments set ${set} where id = ?`, [
              ...columns.map(column => patch[column]),
              existing.id,
            ]);
            await tx.execute('update meal_adjustments set deleted = 1 where meal_id = ? and id != ?', [
              mealId,
              existing.id,
            ]);
            return;
          }

          await tx.execute(
            'insert into meal_adjustments (id, owner_id, meal_id, servings, skipped, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
            [
              randomUUID(),
              this.root.auth.userId,
              mealId,
              patch.servings ?? null,
              patch.skipped ?? 0,
              nowIso(),
            ],
          );
        }),
      { mealId, patch },
    );
  }
}
