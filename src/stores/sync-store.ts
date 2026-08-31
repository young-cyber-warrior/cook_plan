import { makeAutoObservable, runInAction } from 'mobx';

import type { Scope } from '@/lib/scope';
import { powersync } from '@/sync/database';

export class SyncStore {
  connected = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  startWatching(scope: Scope) {
    runInAction(() => {
      this.connected = powersync.currentStatus.connected;
    });

    const dispose = powersync.registerListener({
      statusChanged: status =>
        runInAction(() => {
          this.connected = status.connected;
        }),
    });

    scope.add(dispose);
  }
}
