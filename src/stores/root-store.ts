import { randomUUID } from 'expo-crypto';
import { reaction } from 'mobx';

import { DEFAULT_CATEGORIES } from '@/features/recipes/lib/categories';
import { addDays, startOfWeek, todayId } from '@/features/weeks/lib/dates';
import { Scope } from '@/lib/scope';
import { SupabaseConnector } from '@/sync/connector';
import { powersync } from '@/sync/database';

import { AuthStore } from './auth-store';
import { ErrorsStore } from './errors-store';
import { GroceryStore } from './grocery-store';
import { RecipesStore } from './recipes-store';
import { WeeksStore } from './weeks-store';

export class RootStore {
  errors = new ErrorsStore();
  auth = new AuthStore(this.errors);
  recipes = new RecipesStore(this);
  weeks = new WeeksStore(this);
  grocery = new GroceryStore(this);

  private connectedUserId: string | null = null;
  private scope: Scope | null = null;

  write(source: string, promise: Promise<unknown>) {
    promise.catch(cause => this.errors.notify(source, cause));
  }

  init() {
    if (this.scope) return;

    const scope = new Scope();
    this.scope = scope;

    this.recipes.startWatching(scope);
    this.weeks.startWatching(scope);
    this.grocery.startWatching(scope);
    void this.auth.init(scope);

    scope.add(
      reaction(
        () => this.auth.userId,
        userId => {
          void this.onAuthChange(userId);
        },
        { fireImmediately: true },
      ),
    );
  }

  dispose() {
    this.scope?.close();
    this.scope = null;
  }

  private async onAuthChange(userId: string | null) {
    try {
      // так что за кейс когда и userId и connectedUserId не опредееный ? этот кейс валиден 
      if (userId) {
        if (this.connectedUserId === userId) return;
        this.connectedUserId = userId;
        await powersync.connect(new SupabaseConnector());
        await this.seedDefaults(userId);
      } else if (this.connectedUserId) {
        this.connectedUserId = null;
        await powersync.disconnectAndClear();
      }
    } catch (cause) {
      this.errors.notify('sync.connect', cause);
    }
  }

  private async seedDefaults(userId: string) {
    await powersync.waitForFirstSync();
    if (this.connectedUserId !== userId) return;
    if (!this.scope || this.scope.closed) return;

    const now = new Date().toISOString();

    const categories = await powersync.getAll<{ id: string }>(
      'select id from categories where owner_id = ? and deleted = 0 limit 1',
      [userId],
    );
    if (categories.length === 0) {
      await powersync.writeTransaction(async tx => {
        for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
          await tx.execute(
            'insert into categories (id, owner_id, slug, label, position, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
            [randomUUID(), userId, category.id, category.label, index, now],
          );
        }
      });
    }

    const weeks = await powersync.getAll<{ id: string }>(
      'select id from weeks where deleted = 0 limit 1',
    );
    if (weeks.length === 0) {
      const start = startOfWeek(todayId());
      this.weeks.insertWeek({ start, end: addDays(start, 6) });
    }
  }
}
