import { Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { MacroBreakdown } from '@/components/macro-breakdown';
import { IngredientList } from '@/features/recipes/components/ingredient-list';
import { RecipeActions } from '@/features/recipes/components/recipe-actions';
import type { useRecipeEditor } from '@/features/recipes/hooks/use-recipe-editor';
import type { Recipe } from '@/features/recipes/types';

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
  const { editing, draft, toggleEdit, updateDescription, updateIngredient, addIngredient, removeIngredient } =
    editor;

  const shown = editing ? draft : recipe;

  return (
    <View style={styles.root}>
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

      <View style={styles.ingredientsBlock}>
        <IngredientList
          ingredients={shown.ingredients}
          editing={editing}
          onChange={updateIngredient}
          onRemove={removeIngredient}
          onAdd={addIngredient}
        />
      </View>

      <View style={styles.macrosBlock}>
        <Text style={styles.blockHeading}>Пищевая ценность</Text>
        <MacroBreakdown macros={recipe.macros} />
      </View>

      <View style={styles.actionsRow}>
        <RecipeActions editing={editing} onDelete={onDelete} onEditToggle={toggleEdit} />
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
  ingredientsBlock: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: `${theme.colors.accent}12`,
  },
  macrosBlock: {
    gap: theme.spacing.two,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.three,
    backgroundColor: `${theme.colors.success}14`,
  },
  blockHeading: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}));
