import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { ServingsStepper } from '@/features/day-card/components/servings-stepper';
import { IngredientList } from '@/features/recipes/components/ingredient-list';
import { MacrosBlock } from '@/features/recipes/components/macros-block';
import { RecipeActions } from '@/features/recipes/components/recipe-actions';
import { RecipePhotoEditor } from '@/features/recipes/components/recipe-photo-editor';
import type { useRecipeEditor } from '@/features/recipes/hooks/use-recipe-editor';
import type { Recipe } from '@/features/recipes/types';
import { useRecipesStore } from '@/stores/store-context';

interface RecipeDetailsProps {
  /** Committed recipe — macros always come from here, never the draft. */
  recipe: Recipe;
  /** Owned by RecipeCard, which also drives the editable title/category in the header. */
  editor: ReturnType<typeof useRecipeEditor>;
  onDelete: () => void;
}

/** Accordion body of a recipe card: description, ingredients, macros (read-only), edit/delete. */
export function RecipeDetails({ recipe, editor, onDelete }: RecipeDetailsProps) {
  const { theme } = useUnistyles();
  const store = useRecipesStore();
  const {
    editing,
    draft,
    toggleEdit,
    updateDescription,
    updateServings,
    updateIngredient,
    addIngredient,
    removeIngredient,
  } = editor;

  const shown = editing ? draft : recipe;

  return (
    <View style={styles.root}>
      <RecipePhotoEditor recipeId={recipe.id} editing={editing} />

      {editing ? (
        <TextInput
          style={styles.descriptionInput}
          value={shown.description}
          onChangeText={updateDescription}
          placeholder="Описание"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          multiline
        />
      ) : (
        <Text style={styles.description}>{shown.description}</Text>
      )}

      <View style={styles.servingsRow}>
        <Text style={styles.servingsLabel}>Порций</Text>
        {editing ? (
          <ServingsStepper value={shown.servings} onChange={updateServings} />
        ) : (
          <Text style={styles.servingsValue}>{shown.servings}</Text>
        )}
      </View>

      <View style={styles.ingredientsBlock}>
        <IngredientList
          ingredients={shown.ingredients}
          editing={editing}
          onChange={updateIngredient}
          onRemove={removeIngredient}
          onAdd={addIngredient}
        />
      </View>

      <MacrosBlock recipe={recipe} />

      <View style={styles.actionsRow}>
        <RecipeActions editing={editing} onDelete={onDelete} onEditToggle={toggleEdit} />
        {/* да сделай через &&  */}
        {editing ? null : (
          <Pressable onPress={() => store.shareRecipe(recipe.id)}>
            <Text style={styles.shareLabel}>Поделиться</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  root: {
    gap: theme.spacing.three,
    paddingTop: theme.spacing.three,
    paddingHorizontal: theme.spacing.three,
    paddingBottom: theme.spacing.four,
  },
  description: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textSecondary,
  },
  descriptionInput: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    padding: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.three,
  },
  servingsLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  servingsValue: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
  },
  ingredientsBlock: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: `${theme.colors.accent}12`,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  shareLabel: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.accent,
  },
}));
