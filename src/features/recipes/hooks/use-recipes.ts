import { useMemo, useState } from 'react';

import type { Recipe } from '@/features/recipes/types';

/** Local list state for the recipes screen. Swap for the API once it lands. */
export function useRecipes(initial: Recipe[]) {
  const [recipes, setRecipes] = useState(initial);

  const actions = useMemo(
    () => ({
      saveRecipe: (recipe: Recipe) =>
        setRecipes(current => current.map(item => (item.id === recipe.id ? recipe : item))),

      removeRecipe: (id: string) =>
        setRecipes(current => current.filter(item => item.id !== id)),
    }),
    [],
  );

  return { recipes, ...actions };
}
