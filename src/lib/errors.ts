import { isAuthRetryableFetchError } from '@supabase/supabase-js';

const NETWORK_MESSAGE = 'Нет связи с сервером';
const UNKNOWN_MESSAGE = 'Не удалось выполнить запрос';

export function toMessage(cause: unknown): string {
  if (isAuthRetryableFetchError(cause)) return NETWORK_MESSAGE;
  if (cause instanceof Error) return cause.message;
  return UNKNOWN_MESSAGE;
}
