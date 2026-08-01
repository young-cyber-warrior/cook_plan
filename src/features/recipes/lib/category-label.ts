import type { Category, RecipeCategory } from '@/features/recipes/types';

export function categoryLabel(categories: Category[], categoryId: RecipeCategory): string {
  return categories.find(category => category.id === categoryId)?.label ?? categoryId;
}
