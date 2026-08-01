import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AddRecipeSheet } from '@/features/recipes/components/add-recipe-sheet';
import { RecipeCard } from '@/features/recipes/components/recipe-card';
import { useAddRecipeContext } from '@/features/recipes/context/add-recipe-context';
import { useCategories } from '@/features/recipes/hooks/use-categories';
import { useRecipes } from '@/features/recipes/hooks/use-recipes';
import { MOCK_RECIPES } from '@/features/recipes/mock';

export default function RecipesScreen() {
  const { recipes, saveRecipe, removeRecipe, addRecipe } = useRecipes(MOCK_RECIPES);
  const { categories, addCategory } = useCategories();
  const { visible, close } = useAddRecipeContext();

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={recipes}
        keyExtractor={recipe => recipe.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            categories={categories}
            onSave={saveRecipe}
            onDelete={() => removeRecipe(item.id)}
            onCreateCategory={addCategory}
          />
        )}
      />

      <AddRecipeSheet
        visible={visible}
        categories={categories}
        onClose={close}
        onCreateCategory={addCategory}
        onSave={addRecipe}
      />
    </>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.three,
    gap: theme.spacing.three,
  },
}));
