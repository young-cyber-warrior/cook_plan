import { router, useFocusEffect } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AddRecipeSheet } from '@/features/recipes/components/add-recipe-sheet';
import { PickRecipeBar } from '@/features/recipes/components/pick-recipe-bar';
import { RecipeCard } from '@/features/recipes/components/recipe-card';
import { useAddRecipeContext } from '@/features/recipes/context/add-recipe-context';
import { useMealPickStore, useRecipesStore } from '@/stores/store-context';

export default observer(function RecipesScreen() {
  const { recipes, categories, saveRecipe, removeRecipe, addRecipe, addCategory } =
    useRecipesStore();
  const { visible, close } = useAddRecipeContext();
  const pick = useMealPickStore();

  const onConfirm = useCallback(() => {
    pick.confirm();
    router.navigate('/');
  }, [pick]);

  const onBack = useCallback(() => {
    pick.cancel();
    router.navigate('/');
  }, [pick]);

  useFocusEffect(useCallback(() => () => pick.cancel(), [pick]));

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
{/* просто && */}
      {pick.target ? (
        <PickRecipeBar
          mealTitle={pick.target.mealTitle}
          canConfirm={pick.canConfirm}
          onConfirm={onConfirm}
          onBack={onBack}
        />
      ) : null}

      <AddRecipeSheet
        visible={visible}
        categories={categories}
        onClose={close}
        onCreateCategory={addCategory}
        onSave={addRecipe}
      />
    </>
  );
});

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
