import { makeAutoObservable } from 'mobx';

import { toMessage } from '@/lib/errors';

export class ErrorsStore {
  message: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  notify(source: string, cause: unknown) {
    console.error(source, cause);
    this.message = toMessage(cause);
  }

  dismiss() {
    this.message = null;
  }
}
