import {
  UpdateType,
  type CommonPowerSyncDatabase,
  type CrudEntry,
  type PowerSyncBackendConnector,
} from '@powersync/react-native';

import { supabase } from '@/lib/supabase';

const FATAL_CODES = [/^22\d{3}$/, /^23\d{3}$/, /^42501$/];

const BOOLEAN_COLUMNS: Record<string, string[]> = {
  categories: ['deleted'],
  recipes: ['deleted'],
  recipe_ingredients: ['deleted'],
  weeks: ['deleted'],
  meals: ['deleted'],
  grocery_lists: ['deleted'],
  grocery_items: ['deleted', 'checked', 'edited'],
  shares: ['deleted'],
};

const JSON_COLUMNS: Record<string, string[]> = {
  recipes: ['photos'],
  grocery_lists: ['week_ids'],
};

function isFatal(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  if (!code) return false;
  return FATAL_CODES.some(pattern => pattern.test(code));
}

function toPayload(table: string, data: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data };
  delete payload.updated_at;

  for (const name of BOOLEAN_COLUMNS[table] ?? []) {
    if (name in payload) payload[name] = !!payload[name];
  }
  for (const name of JSON_COLUMNS[table] ?? []) {
    const value = payload[name];
    if (typeof value === 'string') payload[name] = JSON.parse(value);
  }

  return payload;
}

async function applyOperation(op: CrudEntry): Promise<void> {
  const table = supabase.from(op.table);

  switch (op.op) {
    case UpdateType.PUT: {
      const { error } = await table.upsert(toPayload(op.table, { ...op.opData, id: op.id }));
      if (error) throw error;
      break;
    }
    case UpdateType.PATCH: {
      const { error } = await table.update(toPayload(op.table, op.opData ?? {})).eq('id', op.id);
      if (error) throw error;
      break;
    }
    case UpdateType.DELETE: {
      const { error } = await table.update({ deleted: true }).eq('id', op.id);
      if (error) throw error;
      break;
    }
  }
}

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;

    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: data.session.access_token,
    };
  }

  async uploadData(database: CommonPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        await applyOperation(op);
      }
    } catch (error) {
      if (!isFatal(error)) throw error;
      console.error('powersync upload discarded', error);
    }

    await transaction.complete();
  }
}
