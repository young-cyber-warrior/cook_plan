export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;
export const DEFAULT_SERVINGS = 2;

export const clampServings = (value: number) =>
  Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));
