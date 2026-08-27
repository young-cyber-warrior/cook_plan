import { randomUUID } from 'expo-crypto';
import { reaction } from 'mobx';

import { DEFAULT_CATEGORIES } from '@/features/recipes/lib/categories';
import { addDays, startOfWeek, todayId } from '@/features/weeks/lib/dates';
import { log } from '@/lib/log';
import { Scope } from '@/lib/scope';
import { SupabaseConnector } from '@/sync/connector';
import { powersync } from '@/sync/database';
import { nowIso } from '@/sync/write';

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

  write(source: string, run: () => Promise<unknown>, meta?: unknown) {
    const started = Date.now();
    log.start(source, meta);
    run().then(
      () => log.done(source, Date.now() - started, meta),
      cause => {
        log.fail(source, Date.now() - started, cause, meta);
        this.errors.notify(source, cause);
      },
    );
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
          void this.onAuthChange(scope, userId);
        },
        { fireImmediately: true },
      ),
    );
  }

  dispose() {
    this.scope?.close();
    this.scope = null;
  }

  private async onAuthChange(scope: Scope, userId: string | null) {
    try {
      if (userId) {
        if (this.connectedUserId === userId) return;
        this.connectedUserId = userId;
        await scope.wait(powersync.connect(new SupabaseConnector()));
        await this.seedDefaults(scope, userId);
      } else if (this.connectedUserId) {
        this.connectedUserId = null;
        await scope.wait(powersync.disconnectAndClear());
      }
    } catch (cause) {
      this.errors.notify('sync.connect', cause);
    }
  }

  private async seedDefaults(scope: Scope, userId: string) {
    await scope.wait(powersync.waitForFirstSync(scope.signal));
    if (this.connectedUserId !== userId) return;

    const now = nowIso();

    const categories = await scope.wait(
      powersync.getAll<{ id: string }>(
        'select id from categories where owner_id = ? and deleted = 0 limit 1',
        [userId],
      ),
    );
    if (categories.length === 0) {
      await scope.wait(
        powersync.writeTransaction(async tx => {
          for (const [index, category] of DEFAULT_CATEGORIES.entries()) {
            await tx.execute(
              'insert into categories (id, owner_id, slug, label, position, deleted, created_at) values (?, ?, ?, ?, ?, 0, ?)',
              [randomUUID(), userId, category.id, category.label, index, now],
            );
          }
        }),
      );
    }

    const weeks = await scope.wait(
      powersync.getAll<{ id: string }>('select id from weeks where deleted = 0 limit 1'),
    );
    if (weeks.length === 0) {
      const start = startOfWeek(todayId());
      this.weeks.insertWeek({ start, end: addDays(start, 6) });
    }
  }
}
