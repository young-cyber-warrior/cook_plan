import { useCallback, useState } from 'react';

import type { Ingredient, Macros, Recipe, RecipeCategory } from '@/features/recipes/types';

const emptyMacros: Macros = { calories: 0, protein: 0, fat: 0, carbs: 0 };

const emptyDraft = (category: RecipeCategory): Recipe => ({
  id: `recipe-${Date.now()}`,
  category,
  title: '',
  description: '',
  macros: emptyMacros,
  ingredients: [],
});

/** An ingredient left with no name or amount was never really filled in — drop it on save. */
const isFilledIngredient = (ingredient: Ingredient) =>
  ingredient.name.trim().length > 0 && ingredient.amount > 0;

/** Owns a fresh recipe draft for the add-recipe sheet — same field shape as useRecipeEditor, no accordion state. */
export function useRecipeDraft(defaultCategory: RecipeCategory) {
  const [draft, setDraft] = useState(() => emptyDraft(defaultCategory));

  const reset = useCallback(() => {
    setDraft(emptyDraft(defaultCategory));
  }, [defaultCategory]);

  const updateTitle = useCallback((title: string) => {
    setDraft(current => ({ ...current, title }));
  }, []);

  const updateCategory = useCallback((category: RecipeCategory) => {
    setDraft(current => ({ ...current, category }));
  }, []);

  const updateDescription = useCallback((description: string) => {
    setDraft(current => ({ ...current, description }));
  }, []);

  const updateIngredient = useCallback((id: string, patch: Partial<Ingredient>) => {
    setDraft(current => ({
      ...current,
      ingredients: current.ingredients.map(ingredient =>
        ingredient.id === id ? { ...ingredient, ...patch } : ingredient,
      ),
    }));
  }, []);

  const addIngredient = useCallback(() => {
    setDraft(current => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        { id: `ing-${Date.now()}`, name: '', amount: 0, unit: 'g' },
      ],
    }));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setDraft(current => ({
      ...current,
      ingredients: current.ingredients.filter(ingredient => ingredient.id !== id),
    }));
  }, []);

  const isValid = draft.title.trim().length > 0 && draft.ingredients.some(isFilledIngredient);

  const commit = useCallback((): Recipe | null => {
    if (!isValid) return null;

    return {
      ...draft,
      id: `recipe-${Date.now()}`,
      ingredients: draft.ingredients.filter(isFilledIngredient),
    };
  }, [draft, isValid]);

  return {
    draft,
    isValid,
    reset,
    commit,
    updateTitle,
    updateCategory,
    updateDescription,
    updateIngredient,
    addIngredient,
    removeIngredient,
  };
}
