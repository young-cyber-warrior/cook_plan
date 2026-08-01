import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_CATEGORIES } from '@/features/recipes/lib/categories';
import type { Category } from '@/features/recipes/types';

const slugify = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');

/** Local category list — starts from the defaults, grows as recipes need new ones. */
export function useCategories(initial: Category[] = DEFAULT_CATEGORIES) {
  const [categories, setCategories] = useState(initial);

  const addCategory = useCallback((label: string): Category => {
    const trimmed = label.trim();
    const created: Category = { id: `${slugify(trimmed)}-${Date.now()}`, label: trimmed };
    setCategories(current => [...current, created]);
    return created;
  }, []);

  return useMemo(() => ({ categories, addCategory }), [categories, addCategory]);
}
