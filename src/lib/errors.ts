import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

const NETWORK_MESSAGE = 'Нет связи с сервером';
const UNKNOWN_MESSAGE = 'Не удалось выполнить запрос';

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Неверная почта или пароль',
  email_not_confirmed: 'Подтверди почту по ссылке из письма',
  email_address_invalid: 'Проверь адрес почты',
  email_exists: 'Такой аккаунт уже есть, войди',
  user_already_exists: 'Такой аккаунт уже есть, войди',
  weak_password: 'Пароль слишком простой',
  over_request_rate_limit: 'Слишком много попыток, подожди немного',
  over_email_send_rate_limit: 'Слишком много писем, подожди немного',
  signup_disabled: 'Регистрация сейчас отключена',
  validation_failed: 'Проверь введённые данные',
};

export function toMessage(cause: unknown): string {
  if (isAuthRetryableFetchError(cause)) return NETWORK_MESSAGE;
  if (isAuthError(cause)) return AUTH_MESSAGES[cause.code ?? ''] ?? UNKNOWN_MESSAGE;
  if (cause instanceof Error) return cause.message;
  return UNKNOWN_MESSAGE;
}
