import { makeAutoObservable } from 'mobx';

import { toMessage } from '@/lib/errors';
import { ScopeClosed } from '@/lib/scope';

export class ErrorsStore {
  message: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  notify(source: string, cause: unknown) {
    if (cause instanceof ScopeClosed) return;
    console.error(source, cause);
    this.message = toMessage(cause);
  }

  dismiss() {
    this.message = null;
  }
}
