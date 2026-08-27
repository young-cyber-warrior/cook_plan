export function nowIso(): string {
  return new Date().toISOString();
}

export type FieldDiff = [column: string, before: unknown, after: unknown];

export interface UpdateStatement {
  sql: string;
  args: unknown[];
}

export function buildUpdate(
  table: string,
  id: string,
  fields: FieldDiff[],
): UpdateStatement | null {
  const set: string[] = [];
  const args: unknown[] = [];

  for (const [column, before, after] of fields) {
    if (before === after) continue;
    set.push(`${column} = ?`);
    args.push(after);
  }

  if (set.length === 0) return null;

  return { sql: `update ${table} set ${set.join(', ')} where id = ?`, args: [...args, id] };
}

export interface IdDiff<T> {
  removed: T[];
  kept: { index: number; item: T; existing: T | null }[];
}

export function diffById<T extends { id: string }>(current: T[], next: T[]): IdDiff<T> {
  const currentById = new Map(current.map(item => [item.id, item]));
  const nextIds = new Set(next.map(item => item.id));

  return {
    removed: current.filter(item => !nextIds.has(item.id)),
    kept: next.map((item, index) => ({ index, item, existing: currentById.get(item.id) ?? null })),
  };
}
