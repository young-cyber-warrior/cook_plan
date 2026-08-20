import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { makeAutoObservable, runInAction } from 'mobx';

import { buildGroceryList, itemKey } from '@/features/grocery/lib/build-list';
import type { GroceryList } from '@/features/grocery/types';
import type { Scope } from '@/lib/scope';
import { powersync } from '@/sync/database';
import type { GroceryItemRow, GroceryListRow } from '@/sync/schema';

import { groupGroceryItemsByList, parseStringArray, toGroceryItem } from './mappers';
import type { RootStore } from './root-store';

//  общий вопрсо к await для всех сторов  почему нет аборта или закрытеи запроса когда скажем долгое время запроса или закрывается пррилодженеи ? это очень важно !!!!
export class GroceryStore {
  listRows: GroceryListRow[] = [];
  itemRows: GroceryItemRow[] = [];
  sheetVisible = false;

  constructor(private root: RootStore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }
// для чего нужен startWatching что он делает?
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
// как получать логи при выполнени действяи ? я смотрю что очень много есть write и нужно проучить логи чтоб понимать как все идет и где еаличто сломалосьч что-то !
  generate(weekIds: string[]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    // что за toISOString и почему иенно так ? а не андроид ?
    const now = new Date().toISOString();

    this.root.write(
      'grocery.generate',
      powersync.writeTransaction(async tx => {
        if (previousRow) {
          await tx.execute('update grocery_lists set deleted = 1 where id = ?', [previousRow.id]);
          await tx.execute('update grocery_items set deleted = 1 where list_id = ?', [
            previousRow.id,
          ]);
        }

        await tx.execute(
          'insert into grocery_lists (id, owner_id, week_ids, source_hash, recipe_count, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
          [listId, ownerId, JSON.stringify(built.weekIds), built.sourceHash, built.recipeCount, now],
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
      powersync.writeTransaction(async tx => {
        await tx.execute('update grocery_lists set deleted = 1 where id = ?', [row.id]);
        await tx.execute('update grocery_items set deleted = 1 where list_id = ?', [row.id]);
      }),
    );
  }

  toggleItem(id: string) {
    Haptics.selectionAsync();
    // а не лишне здесь делать поиск а потом все равно запускать powersync.execute?
    const item = this.itemRows.find(row => row.id === id);
    if (!item) return;
    this.root.write(
      'grocery.toggleItem',
      powersync.execute('update grocery_items set checked = ? where id = ?', [
        item.checked ? 0 : 1,
        id,
      ]),
    );
  }

  setItemAmount(id: string, amount: number) {
    this.root.write(
      'grocery.setItemAmount',
      // зачем писать здесь текст ? это типа команда ?
      powersync.execute('update grocery_items set amount = ?, edited = 1 where id = ?', [
        amount,
        id,
      ]),
    );
  }

  removeItem(id: string) {
    this.root.write(
      'grocery.removeItem',
      powersync.execute('update grocery_items set deleted = 1 where id = ?', [id]),
    );
  }
}
