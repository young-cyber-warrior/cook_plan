import { useCallback, useState } from 'react';

import type { Ingredient, Recipe, RecipeCategory } from '@/features/recipes/types';

/** An ingredient left with no name or amount was never really filled in — drop it on save. */
const isFilledIngredient = (ingredient: Ingredient) =>
  ingredient.name.trim().length > 0 && ingredient.amount > 0;

/** Owns the draft while a recipe card is in edit mode; commits on save. */
export function useRecipeEditor(recipe: Recipe, onSave: (recipe: Recipe) => void) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(recipe);

  const startEdit = useCallback(() => {
    setDraft(recipe);
    setEditing(true);
  }, [recipe]);

  const save = useCallback(() => {
    onSave({ ...draft, ingredients: draft.ingredients.filter(isFilledIngredient) });
    setEditing(false);
  }, [draft, onSave]);

  const toggleEdit = useCallback(() => {
    if (editing) {
      save();
      return;
    }

    startEdit();
  }, [editing, save, startEdit]);

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

  return {
    editing,
    draft,
    toggleEdit,
    updateTitle,
    updateCategory,
    updateDescription,
    updateIngredient,
    addIngredient,
    removeIngredient,
  };
}
