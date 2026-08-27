type Teardown = () => void;

export class ScopeClosed extends Error {
  constructor() {
    super('scope closed');
    this.name = 'ScopeClosed';
  }
}

export class Scope {
  private controller = new AbortController();
  private teardowns = new Set<Teardown>();
  private children = new Set<Scope>();

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get closed(): boolean {
    return this.controller.signal.aborted;
  }

  add(teardown: Teardown) {
    if (this.closed) {
      teardown();
      return;
    }
    this.teardowns.add(teardown);
  }

  async wait<T>(promise: Promise<T>): Promise<T> {
    if (this.closed) throw new ScopeClosed();
    const value = await promise;
    if (this.closed) throw new ScopeClosed();
    return value;
  }

  child(): Scope {
    const scope = new Scope();
    if (this.closed) {
      scope.close();
      return scope;
    }
    this.children.add(scope);
    scope.add(() => this.children.delete(scope));
    return scope;
  }

  close() {
    if (this.closed) return;
    this.controller.abort();

    for (const child of [...this.children]) child.close();
    this.children.clear();

    for (const teardown of this.teardowns) {
      try {
        teardown();
      } catch (error) {
        console.error('scope teardown failed', error);
      }
    }
    this.teardowns.clear();
  }
}
