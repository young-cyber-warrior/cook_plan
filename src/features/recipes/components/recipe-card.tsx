import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { MacroBadge } from '@/features/day-card/components/macro-badge';
import { CategoryToggle } from '@/features/recipes/components/category-toggle';
import { RecipeDetails } from '@/features/recipes/components/recipe-details';
import { SelectToggleButton } from '@/features/recipes/components/select-toggle-button';
import { useAccordion } from '@/features/recipes/hooks/use-accordion';
import { useRecipeEditor } from '@/features/recipes/hooks/use-recipe-editor';
import { categoryLabel } from '@/features/recipes/lib/category-label';
import type { Recipe } from '@/features/recipes/types';

/** A Unistyles style inside a Reanimated style array is rejected at runtime. */
const animatable = RNStyleSheet.create({
  collapsible: { overflow: 'hidden' },
});

interface RecipeCardProps {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  onDelete: () => void;
}

/**
 * Tapping the card body opens its own accordion; the select button toggles independently.
 * Edit mode makes the title/category in this header editable too, so the header stops
 * toggling the accordion on tap while it's active — typing shouldn't collapse the card.
 */
export function RecipeCard({ recipe, onSave, onDelete }: RecipeCardProps) {
  const { theme } = useUnistyles();
  const [selected, setSelected] = useState(false);
  const { toggle, onContentLayout, containerStyle } = useAccordion();
  const editor = useRecipeEditor(recipe, onSave);
  const { editing, draft, updateTitle, updateCategory } = editor;

  const shown = editing ? draft : recipe;
  const headerContent = editing ? (
    <View style={styles.editHeader}>
      <CategoryToggle value={shown.category} onChange={updateCategory} />

      <View style={styles.titleRow}>
        <TextInput
          style={styles.titleInput}
          value={shown.title}
          onChangeText={updateTitle}
          placeholder="Название рецепта"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
        />

        <SelectToggleButton selected={selected} onToggle={() => setSelected(value => !value)} />
      </View>

      <View style={styles.badges}>
        <MacroBadge value={String(recipe.macros.calories)} unit="ккал" />
      </View>
    </View>
  ) : (
    <View style={styles.header}>
      <View style={styles.info}>
        <Text style={styles.category}>{categoryLabel(recipe.category)}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <View style={styles.badges}>
          <MacroBadge value={String(recipe.macros.calories)} unit="ккал" />
        </View>
      </View>

      <SelectToggleButton selected={selected} onToggle={() => setSelected(value => !value)} />
    </View>
  );

  return (
    <View style={styles.shadow}>
      <View style={styles.clip(selected)}>
        {editing ? (
          headerContent
        ) : (
          <Pressable onPress={toggle} style={({ pressed }) => styles.pressable(pressed)}>
            {headerContent}
          </Pressable>
        )}

        <Animated.View style={[animatable.collapsible, containerStyle]}>
          <View style={styles.measure} onLayout={onContentLayout}>
            <RecipeDetails recipe={recipe} editor={editor} onDelete={onDelete} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  shadow: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    ...theme.shadow.card,
  },
  clip: (selected: boolean) => ({
    borderRadius: theme.radius.xl,
    borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
    borderColor: selected ? theme.colors.accent : theme.colors.cardBorder,
    backgroundColor: selected ? theme.colors.mealFilled : theme.colors.card,
    overflow: 'hidden',
  }),
  pressable: (pressed: boolean) => ({
    backgroundColor: pressed ? theme.colors.backgroundElement : 'transparent',
  }),
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
    paddingHorizontal: theme.spacing.four,
    paddingVertical: theme.spacing.three,
  },
  info: {
    flex: 1,
    gap: theme.spacing.one,
  },
  editHeader: {
    gap: theme.spacing.two,
    paddingHorizontal: theme.spacing.four,
    paddingVertical: theme.spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.three,
  },
  category: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.sans,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    paddingTop: 20,

  },
  titleInput: {
    ...theme.typography.cardTitle,
    fontFamily: theme.fonts.sans,
    color: theme.colors.text,
    flex: 1,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.accent,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    marginTop: theme.spacing.two,
    gap: theme.spacing.two,
  },
  /** Off-flow so its natural height stays measurable while collapsed. */
  measure: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
}));
