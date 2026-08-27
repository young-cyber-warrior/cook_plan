const enabled = __DEV__;

export const log = {
  start(source: string, meta?: unknown) {
    if (enabled) console.log(`→ ${source}`, meta ?? '');
  },
  done(source: string, ms: number, meta?: unknown) {
    if (enabled) console.log(`✓ ${source} ${ms}ms`, meta ?? '');
  },
  fail(source: string, ms: number, cause: unknown, meta?: unknown) {
    console.error(`✗ ${source} ${ms}ms`, cause, meta ?? '');
  },
};
