import type { Ingredient } from '@/features/recipes/types';

export const emptyIngredient = (id: string): Ingredient => ({
  id,
  name: '',
  amount: 0,
  unit: 'g',
  recognized: true,
  macroNote: '',
});
