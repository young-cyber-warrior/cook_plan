import { randomUUID } from 'expo-crypto';
import { makeAutoObservable, runInAction } from 'mobx';

import { buildGroceryList, buildSourceHash, itemKey } from '@/features/grocery/lib/build-list';
import type { GroceryList } from '@/features/grocery/types';
import { haptics } from '@/lib/haptics';
import type { Scope } from '@/lib/scope';
import { powersync } from '@/sync/database';
import type { GroceryItemRow, GroceryListRow } from '@/sync/schema';
import { nowIso } from '@/sync/write';

import { groupGroceryItemsByList, parseStringArray, toGroceryItem } from './mappers';
import type { RootStore } from './root-store';

export class GroceryStore {
  listRows: GroceryListRow[] = [];
  itemRows: GroceryItemRow[] = [];
  sheetVisible = false;

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }
  startWatching(scope: Scope) {
    powersync.watch(
      'select * from grocery_lists where deleted = 0 order by created_at desc',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.listRows = results.array as GroceryListRow[];
          }),
        onError: cause => this.root.errors.notify('grocery.lists.watch', cause),
      },
      { signal: scope.signal },
    );

    powersync.watch(
      'select * from grocery_items where deleted = 0',
      [],
      {
        onResult: results =>
          runInAction(() => {
            this.itemRows = results.array as GroceryItemRow[];
          }),
        onError: cause => this.root.errors.notify('grocery.items.watch', cause),
      },
      { signal: scope.signal },
    );
  }

  private get activeRow(): GroceryListRow | null {
    return this.listRows[0] ?? null;
  }

  private get itemRowsByListId(): Map<string, GroceryItemRow[]> {
    return groupGroceryItemsByList(this.itemRows);
  }

  get list(): GroceryList | null {
    const row = this.activeRow;
    if (!row) return null;

    return {
      weekIds: parseStringArray(row.week_ids),
      sourceHash: row.source_hash ?? '',
      recipeCount: row.recipe_count ?? 0,
      items: (this.itemRowsByListId.get(row.id) ?? [])
        .map(toGroceryItem)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    };
  }

  get isStale(): boolean {
    const row = this.activeRow;
    if (!row) return false;

    const current = buildSourceHash(
      this.root.weeks.weeks,
      parseStringArray(row.week_ids),
      this.root.recipes.recipes,
    );
    return current !== (row.source_hash ?? '');
  }

  get hasEdits(): boolean {
    const row = this.activeRow;
    if (!row) return false;
    return (this.itemRowsByListId.get(row.id) ?? []).some(item => !!item.edited);
  }

  openSheet() {
    this.sheetVisible = true;
  }

  closeSheet() {
    this.sheetVisible = false;
  }
  generate(weekIds: string[]) {
    haptics.created();

    const previousRow = this.activeRow;
    const previousForBuild: GroceryList | null = previousRow
      ? {
          weekIds: parseStringArray(previousRow.week_ids),
          sourceHash: previousRow.source_hash ?? '',
          recipeCount: previousRow.recipe_count ?? 0,
          items: (this.itemRowsByListId.get(previousRow.id) ?? []).map(row => {
            const item = toGroceryItem(row);
            return { ...item, key: itemKey(item.name, item.unit) };
          }),
        }
      : null;

    const built = buildGroceryList(
      this.root.weeks.weeks,
      weekIds,
      this.root.recipes.recipes,
      previousForBuild,
    );

    const ownerId = this.root.auth.userId;
    const listId = randomUUID();
    const now = nowIso();

    this.root.write(
      'grocery.generate',
      () =>
        powersync.writeTransaction(async tx => {
          if (previousRow) {
            await tx.execute('update grocery_lists set deleted = 1 where id = ?', [previousRow.id]);
            await tx.execute('update grocery_items set deleted = 1 where list_id = ?', [
              previousRow.id,
            ]);
          }

          await tx.execute(
            'insert into grocery_lists (id, owner_id, week_ids, source_hash, recipe_count, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
            [
              listId,
              ownerId,
              JSON.stringify(built.weekIds),
              built.sourceHash,
              built.recipeCount,
              now,
            ],
          );

          for (const item of built.items) {
            await tx.execute(
              'insert into grocery_items (id, owner_id, list_id, name, amount, unit, checked, edited, deleted, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
              [
                randomUUID(),
                ownerId,
                listId,
                item.name,
                item.amount,
                item.unit,
                item.checked ? 1 : 0,
                0,
                now,
              ],
            );
          }
        }),
      { listId, items: built.items.length, weeks: built.weekIds.length },
    );

    this.sheetVisible = false;
  }

  refresh() {
    const row = this.activeRow;
    if (row) this.generate(parseStringArray(row.week_ids));
  }

  clear() {
    const row = this.activeRow;
    if (!row) return;

    this.root.write(
      'grocery.clear',
      () =>
        powersync.writeTransaction(async tx => {
          await tx.execute('update grocery_lists set deleted = 1 where id = ?', [row.id]);
          await tx.execute('update grocery_items set deleted = 1 where list_id = ?', [row.id]);
        }),
      { listId: row.id },
    );
  }

  toggleItem(id: string) {
    haptics.toggled();
    this.root.write(
      'grocery.toggleItem',
      () => powersync.execute('update grocery_items set checked = 1 - checked where id = ?', [id]),
      { id },
    );
  }

  setItemAmount(id: string, amount: number) {
    this.root.write(
      'grocery.setItemAmount',
      () =>
        powersync.execute('update grocery_items set amount = ?, edited = 1 where id = ?', [
          amount,
          id,
        ]),
      { id, amount },
    );
  }

  removeItem(id: string) {
    this.root.write(
      'grocery.removeItem',
      () => powersync.execute('update grocery_items set deleted = 1 where id = ?', [id]),
      { id },
    );
  }
}
