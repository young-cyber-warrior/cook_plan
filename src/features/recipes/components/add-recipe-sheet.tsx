import { useEffect } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { BottomSheet } from '@/components/bottom-sheet';
import { CategoryToggle } from '@/features/recipes/components/category-toggle';
import { IngredientList } from '@/features/recipes/components/ingredient-list';
import { useRecipeDraft } from '@/features/recipes/hooks/use-recipe-draft';
import type { Category, Recipe } from '@/features/recipes/types';

interface AddRecipeSheetProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onCreateCategory: (label: string) => Category;
  onSave: (recipe: Recipe) => void;
}

export function AddRecipeSheet({
  visible,
  categories,
  onClose,
  onCreateCategory,
  onSave,
}: AddRecipeSheetProps) {
  const { theme } = useUnistyles();
  const {
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
  } = useRecipeDraft(categories[0]?.id ?? '');

  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

  const save = () => {
    const recipe = commit();
    if (!recipe) return;

    onSave(recipe);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      header={<Text style={styles.heading}>Новый рецепт</Text>}>
      <TextInput
        style={styles.titleInput}
        value={draft.title}
        onChangeText={updateTitle}
        placeholder="Название рецепта"
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
      />

      <View style={styles.block}>
        <Text style={styles.blockHeading}>Категория</Text>
        <CategoryToggle
          categories={categories}
          value={draft.category}
          onChange={updateCategory}
          onCreateCategory={onCreateCategory}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockHeading}>Описание</Text>
        <TextInput
          style={styles.descriptionInput}
          value={draft.description}
          onChangeText={updateDescription}
          placeholder="Пара слов о блюде"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          multiline
        />
      </View>

      <View style={styles.block}>
        <IngredientList
          ingredients={draft.ingredients}
          editing
          onChange={updateIngredient}
          onRemove={removeIngredient}
          onAdd={addIngredient}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => styles.cancelButton(pressed)} onPress={onClose}>
          <Text style={styles.cancelLabel}>Отмена</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => styles.saveButton(pressed, isValid)}
          disabled={!isValid}
          onPress={save}>
          <Text style={styles.saveLabel}>Сохранить рецепт</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create(theme => ({
  heading: {
    ...theme.typography.sectionTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    marginBottom: theme.spacing.three,
  },
  titleInput: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    paddingBottom: theme.spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  block: {
    gap: theme.spacing.two,
    marginTop: theme.spacing.four,
  },
  blockHeading: {
    ...theme.typography.label,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  descriptionInput: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    minHeight: 44,
    padding: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.two,
    marginTop: theme.spacing.five,
    marginBottom: theme.spacing.two,
  },
  cancelButton: (pressed: boolean) => ({
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.badgeBackground,
    opacity: pressed ? 0.8 : 1,
  }),
  cancelLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveButton: (pressed: boolean, valid: boolean) => ({
    flex: 2,
    alignItems: 'center',
    paddingVertical: theme.spacing.three,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    opacity: !valid ? 0.5 : pressed ? 0.85 : 1,
  }),
  saveLabel: {
    ...theme.typography.body,
    fontFamily: theme.fonts.sans,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}));
