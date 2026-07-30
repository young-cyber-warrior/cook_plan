import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { RecipeCard } from '@/features/recipes/components/recipe-card';
import { useRecipes } from '@/features/recipes/hooks/use-recipes';
import { MOCK_RECIPES } from '@/features/recipes/mock';

export default function RecipesScreen() {
  const { recipes, saveRecipe, removeRecipe } = useRecipes(MOCK_RECIPES);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={recipes}
      keyExtractor={recipe => recipe.id}
      renderItem={({ item }) => (
        <RecipeCard recipe={item} onSave={saveRecipe} onDelete={() => removeRecipe(item.id)} />
      )}
    />
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
