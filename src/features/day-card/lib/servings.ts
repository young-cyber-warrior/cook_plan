export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;
export const DEFAULT_SERVINGS = 2;

export const clampServings = (value: number) =>
  Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));

const SERVING_FORMS = ['порция', 'порции', 'порций'] as const;

/** Russian plural of «порция» for a serving count. */
export function servingsWord(count: number): string {
  const tens = count % 100;
  if (tens >= 11 && tens <= 14) return SERVING_FORMS[2];

  const ones = count % 10;
  if (ones === 1) return SERVING_FORMS[0];
  if (ones >= 2 && ones <= 4) return SERVING_FORMS[1];

  return SERVING_FORMS[2];
}
