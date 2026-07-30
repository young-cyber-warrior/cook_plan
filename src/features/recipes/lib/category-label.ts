import type { RecipeCategory } from '@/features/recipes/types';

const LABELS: Record<RecipeCategory, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

export function categoryLabel(category: RecipeCategory): string {
  return LABELS[category];
}
